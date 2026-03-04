"""
Score USMR pilot publications using z-score composite ranking.

Usage:
    python score_pilot.py

Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars
(or a .env file in the backend directory).
"""

import csv
import os
import statistics
from pathlib import Path

from dotenv import load_dotenv
from supabase import create_client

from app.services.publication_scorer import rank_publications, DEFAULT_WEIGHTS

load_dotenv()

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
GROUP_ID = "0d573d12-79e4-4070-8504-41c9a4553337"
CSV_OUT = "../customers/usmoneyreserve/USMR_Pilot_Publications_Feb-2026.csv"


def fetch_pilot_publications():
    """Fetch pilot group publications from Supabase."""
    client = create_client(SUPABASE_URL, SUPABASE_KEY)
    sb = client.schema("fancyrobot")

    # Load pilot group members
    member_ids = set()
    offset = 0
    while True:
        result = (
            sb.table("publication_group_members")
            .select("publication_id")
            .eq("group_id", GROUP_ID)
            .range(offset, offset + 999)
            .execute()
        )
        rows = result.data or []
        member_ids.update(m["publication_id"] for m in rows)
        if len(rows) < 1000:
            break
        offset += 1000
    print(f"Pilot group members: {len(member_ids)}")

    # Load all network pubs
    all_pubs = []
    offset = 0
    while True:
        result = (
            sb.table("publications")
            .select("id, name, region, domain_authority, publication_type, source_lists, metadata")
            .contains("source_lists", ["newsusa-network"])
            .range(offset, offset + 999)
            .execute()
        )
        rows = result.data or []
        all_pubs.extend(rows)
        if len(rows) < 1000:
            break
        offset += 1000

    pilot_pubs = [p for p in all_pubs if p["id"] in member_ids]
    print(f"Matched pilot pubs: {len(pilot_pubs)}")
    return pilot_pubs


def print_report(scored):
    """Print ranking tables and distribution stats."""
    w = DEFAULT_WEIGHTS

    # Dimension stats
    print(f"\n{'=' * 70}")
    print("DIMENSION STATISTICS")
    print(f"{'=' * 70}")
    for label, getter in [
        ("DA", lambda r: r.domain_authority),
        ("Reach", lambda r: r.reach),
        ("DMA Rank", lambda r: r.dma_rank),
        ("AEV", lambda r: r.aev),
    ]:
        vals = [getter(r) for r in scored]
        print(f"  {label:<12} mean={statistics.mean(vals):>10.1f}  sd={statistics.stdev(vals):>10.1f}")

    # Top 50
    print(f"\n{'=' * 140}")
    print(f"TOP 50 BY Z-SCORE COMPOSITE  (DA={w['da']:.0%}  Reach={w['reach']:.0%}  DMA={w['dma']:.0%}  AEV={w['aev']:.0%})")
    print(f"{'=' * 140}")
    print(
        f"{'#':>4} {'Score':>5} {'Publication':<40} {'City':<17} {'ST':<4} "
        f"{'DA':>3}{'':>1} {'Reach':>10} {'DMA#':>4} {'Type':<9} {'Segment':<22}"
        f"  z_da z_rch z_dma z_aev"
    )
    print("-" * 140)
    for r in scored[:50]:
        da_flag = "*" if r.da_imputed else " "
        reach_str = f"{r.reach:,}" if r.reach else "-"
        print(
            f"{r.rank:>4} {r.composite_score:>5.1f} {r.name:<40} "
            f"{r.metadata.get('city', ''):<17} {r.metadata.get('state', ''):<4} "
            f"{r.domain_authority:>3.0f}{da_flag} {reach_str:>10} {r.dma_rank:>4} "
            f"{r.publication_type:<9} {r.segment or '':<22}"
            f"  {r.z_da:>+5.2f} {r.z_reach:>+5.2f} {r.z_dma:>+5.2f} {r.z_aev:>+5.2f}"
        )

    # Score distribution
    print(f"\n{'=' * 80}")
    print("SCORE DISTRIBUTION (0-100 rescaled)")
    print(f"{'=' * 80}")
    buckets = [(90, 101), (80, 90), (70, 80), (60, 70), (50, 60), (40, 50), (30, 40), (20, 30), (10, 20), (0, 10)]
    for lo, hi in buckets:
        count = sum(1 for r in scored if lo <= r.composite_score < hi)
        bar = "#" * (count // 3)
        print(f"  {lo:>3}-{hi-1:<3}: {count:>4}  {bar}")

    # Budget scenarios
    print(f"\n{'=' * 90}")
    print("BUDGET SCENARIOS — Top N by composite score")
    print(f"{'=' * 90}")
    print(f"{'Pubs':>6} {'Min Score':>9} {'Avg Score':>9} {'Total Reach':>14} {'Avg DA':>7} {'States':>7} {'DMAs':>6}")
    for n in [25, 50, 100, 200, 300, 500, 750, len(scored)]:
        if n > len(scored):
            continue
        subset = scored[:n]
        total_reach = sum(r.reach for r in subset)
        avg_da = sum(r.domain_authority for r in subset) / len(subset)
        avg_score = sum(r.composite_score for r in subset) / len(subset)
        states = len(set(r.metadata.get("state", "") for r in subset))
        dmas = len(set(r.metadata.get("dma", "") for r in subset))
        min_score = subset[-1].composite_score
        print(
            f"{n:>6} {min_score:>9.1f} {avg_score:>9.1f} {total_reach:>14,} "
            f"{avg_da:>7.1f} {states:>7} {dmas:>6}"
        )


def write_csv(scored, path):
    """Write ranked publications to CSV."""
    with open(path, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.writer(f)
        writer.writerow([
            "Rank", "Composite_Score", "Publication", "City", "State",
            "DMA", "DMA_Rank", "Domain_Authority", "DA_Source",
            "Monthly_Reach", "AEV_USD", "Publication_Type",
            "Retirement_Segment", "Z_DA", "Z_Reach", "Z_DMA", "Z_AEV",
            "Placement_Rationale", "Pricing", "Source_Lists", "Publication_ID",
        ])

        for r in scored:
            meta = r.metadata
            segment = r.segment or ""
            da_source = "actual" if not r.da_imputed else "estimated"

            parts = []
            if segment == "Retirement State":
                parts.append(f"{meta.get('state', '')} is a top retirement destination state")
            elif segment == "New England":
                parts.append(f"New England retiree corridor ({meta.get('state', '')})")
            elif segment == "Retirement Metro":
                parts.append(f"Major metro with high retiree concentration ({meta.get('dma', '')})")
            elif segment == "Silicon Valley / Bay Area":
                parts.append("Bay Area / Silicon Valley — high-net-worth retiree market")
            elif segment == "Southern California":
                parts.append("Southern California — premium retiree demographic")

            if r.domain_authority >= 70:
                parts.append(f"High domain authority ({r.domain_authority:.0f}) — strong SEO/AI training signal")
            elif r.domain_authority >= 50:
                parts.append(f"Mid-tier domain authority ({r.domain_authority:.0f})")

            if r.reach >= 500_000:
                parts.append(f"High-reach outlet ({r.reach:,}/mo)")
            elif r.reach >= 100_000:
                parts.append(f"Solid regional reach ({r.reach:,}/mo)")

            if r.publication_type == "academic":
                parts.append(".edu domain — high trust signal for AI models")

            writer.writerow([
                r.rank, r.composite_score, r.name,
                meta.get("city", ""), meta.get("state", ""),
                meta.get("dma", ""), meta.get("dma_rank", ""),
                r.domain_authority, da_source, r.reach,
                meta.get("aev", ""), r.publication_type, segment,
                r.z_da, r.z_reach, r.z_dma, r.z_aev,
                "; ".join(parts),
                "Included — NewsUSA Network ($5,500 umbrella)",
                ", ".join(r.source_lists), r.id,
            ])

    print(f"\nWrote {len(scored)} rows to {path}")


def main():
    pubs = fetch_pilot_publications()
    scored = rank_publications(pubs)
    print_report(scored)
    write_csv(scored, CSV_OUT)


if __name__ == "__main__":
    main()
