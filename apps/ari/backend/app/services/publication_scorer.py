"""
Rank publications using z-score composite scoring.

Score = w_da * z(DA) + w_reach * z(log_Reach) + w_dma * z(inv_DMA) + w_aev * z(log_AEV)

Each dimension is z-scored: (value - mean) / std_dev
  - Measures "how many std devs above average" per dimension
  - Preserves real gaps (unlike percentile which flattens them)
  - Handles outliers gracefully (unlike min-max which crushes the middle)

Pre-transforms before z-scoring:
  DA         -> raw (already 0-100)
  Reach      -> log10(reach + 1)   (power-law -> normal-ish)
  DMA Rank   -> 211 - rank          (invert so bigger = better)
  AEV        -> log10(aev + 1)     (power-law -> normal-ish)

Final composite is rescaled to 0-100 for readability using
min-max on the weighted z-sum.
"""

from __future__ import annotations

import json
import math
import statistics
from dataclasses import dataclass, field
from typing import Any


# --- Default weights ---

DEFAULT_WEIGHTS = {
    "da": 0.40,
    "reach": 0.25,
    "dma": 0.20,
    "aev": 0.15,
}

# --- Geographic segment classification ---

RETIREMENT_STATES = {"FL", "AZ", "TX", "NC", "SC", "NV", "NM", "HI"}
NEW_ENGLAND = {"CT", "MA", "ME", "NH", "RI", "VT"}
RETIREMENT_DMAS = [
    "san diego", "palm springs", "los angeles", "miami", "tampa", "orlando",
    "jacksonville", "fort myers", "sarasota", "naples", "phoenix", "tucson",
    "new york", "chicago", "boston", "philadelphia", "san francisco",
    "providence", "hartford", "pittsburgh", "seattle", "portland",
    "savannah", "charleston", "asheville", "myrtle beach",
    "las vegas", "reno", "albuquerque", "santa fe",
    "boise", "colorado springs", "denver",
]
BAY_AREA_DMAS = ["san francisco", "san jose", "oakland", "sacramento", "stockton"]
SO_CAL_DMAS = [
    "san diego", "palm springs", "los angeles", "riverside",
    "orange county", "santa barbara",
]


@dataclass
class ScoredPublication:
    """A publication with computed scores attached."""
    id: str
    name: str
    domain_authority: float
    da_imputed: bool
    reach: int
    aev: float
    dma_rank: int
    publication_type: str
    segment: str | None
    metadata: dict[str, Any]
    source_lists: list[str]
    z_da: float = 0.0
    z_reach: float = 0.0
    z_dma: float = 0.0
    z_aev: float = 0.0
    composite_score: float = 0.0
    rank: int = 0


def z_scores(values: list[float]) -> list[float]:
    """Compute z-scores for a list of floats."""
    n = len(values)
    if n < 2:
        return [0.0] * n
    mu = statistics.mean(values)
    sd = statistics.stdev(values)
    if sd == 0:
        return [0.0] * n
    return [(v - mu) / sd for v in values]


def impute_da(pub_type: str, reach: int) -> float:
    """Estimate domain authority when actual value is missing."""
    if pub_type == "academic":
        return 55  # .edu carries inherent trust regardless of reach
    if reach >= 500_000:
        return 65
    if reach >= 100_000:
        return 55
    return 45


def classify_segment(metadata: dict[str, Any]) -> str | None:
    """Classify a publication into a geographic/demographic segment."""
    state = metadata.get("state", "")
    dma = (metadata.get("dma", "") or "").lower()
    city = (metadata.get("city", "") or "").lower()

    if state in RETIREMENT_STATES:
        return "Retirement State"
    if state in NEW_ENGLAND:
        return "New England"
    for rdma in RETIREMENT_DMAS:
        if rdma in dma or rdma in city:
            return "Retirement Metro"
    for bdma in BAY_AREA_DMAS:
        if bdma in dma or bdma in city:
            return "Silicon Valley / Bay Area"
    if state == "CA" and any(x in dma or x in city for x in SO_CAL_DMAS):
        return "Southern California"
    return None


def rank_publications(
    publications: list[dict[str, Any]],
    weights: dict[str, float] | None = None,
) -> list[ScoredPublication]:
    """
    Score and rank a list of publication dicts.

    Each dict should have at minimum:
      id, name, domain_authority, publication_type, metadata, source_lists

    metadata should contain: reach, aev, dma_rank, state, dma, city

    Returns ScoredPublication list sorted by composite_score descending.
    """
    w = weights or DEFAULT_WEIGHTS

    # --- Enrich ---
    enriched: list[dict[str, Any]] = []
    for p in publications:
        meta = p.get("metadata", {}) or {}
        if isinstance(meta, str):
            meta = json.loads(meta)

        reach = meta.get("reach") or 0
        aev = meta.get("aev") or 0.0
        dma_rank = meta.get("dma_rank") or 210
        da_actual = p.get("domain_authority")

        if da_actual and da_actual <= 100:
            da = da_actual
            da_was_imputed = False
        else:
            da = impute_da(p.get("publication_type", "news"), reach)
            da_was_imputed = True

        enriched.append({
            "id": p["id"],
            "name": p["name"],
            "publication_type": p.get("publication_type", ""),
            "source_lists": p.get("source_lists", []),
            "metadata": meta,
            "da": da,
            "da_imputed": da_was_imputed,
            "reach": reach,
            "aev": aev,
            "dma_rank": dma_rank,
            "segment": classify_segment(meta),
        })

    if not enriched:
        return []

    # --- Pre-transform ---
    da_raw = [e["da"] for e in enriched]
    reach_log = [math.log10(e["reach"] + 1) for e in enriched]
    dma_inv = [211 - e["dma_rank"] for e in enriched]
    aev_log = [math.log10(e["aev"] + 1) for e in enriched]

    # --- Z-score each dimension ---
    da_z = z_scores(da_raw)
    reach_z = z_scores(reach_log)
    dma_z = z_scores(dma_inv)
    aev_z = z_scores(aev_log)

    # --- Weighted composite ---
    raw_scores = []
    for i in range(len(enriched)):
        raw = (
            w["da"] * da_z[i]
            + w["reach"] * reach_z[i]
            + w["dma"] * dma_z[i]
            + w["aev"] * aev_z[i]
        )
        raw_scores.append(raw)

    # --- Rescale to 0-100 ---
    min_raw = min(raw_scores)
    max_raw = max(raw_scores)
    score_range = max_raw - min_raw if max_raw != min_raw else 1.0

    results: list[ScoredPublication] = []
    for i, e in enumerate(enriched):
        results.append(ScoredPublication(
            id=e["id"],
            name=e["name"],
            domain_authority=e["da"],
            da_imputed=e["da_imputed"],
            reach=e["reach"],
            aev=e["aev"],
            dma_rank=e["dma_rank"],
            publication_type=e["publication_type"],
            segment=e["segment"],
            metadata=e["metadata"],
            source_lists=e["source_lists"],
            z_da=round(da_z[i], 2),
            z_reach=round(reach_z[i], 2),
            z_dma=round(dma_z[i], 2),
            z_aev=round(aev_z[i], 2),
            composite_score=round(((raw_scores[i] - min_raw) / score_range) * 100, 1),
        ))

    results.sort(key=lambda r: -r.composite_score)
    for rank, r in enumerate(results, 1):
        r.rank = rank

    return results
