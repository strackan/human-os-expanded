#!/usr/bin/env python3
"""
Score publications in a group with z-score composite ranking.

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

DA imputation for missing values:
  news    + reach >= 500K  -> 65
  news    + reach 100-500K -> 55
  news    + reach < 100K   -> 45
  academic                 -> 55 (edu domains carry inherent trust)

Usage:
  python scripts/score_group.py --group <group_id_or_slug>
  python scripts/score_group.py --group <id> --output results.csv
  python scripts/score_group.py --group <id> --segments segments.json
  python scripts/score_group.py --group <id> --weights 0.40,0.25,0.20,0.15
  python scripts/score_group.py --group <id> --top 100 --source-list newsusa-network

Segment config file format (JSON):
  {
    "segments": [
      {
        "name": "Retirement State",
        "match": { "states": ["FL", "AZ", "TX", "NC", "SC", "NV", "NM", "HI"] }
      },
      {
        "name": "Retirement Metro",
        "match": { "dmas": ["tampa", "phoenix", "miami", "palm springs"] }
      },
      {
        "name": "Bay Area",
        "match": { "dmas": ["san francisco", "san jose", "oakland"] }
      }
    ]
  }
"""
import argparse
import csv
import json
import math
import os
import statistics
import sys

# Resolve .env from backend root (one level up from scripts/)
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV_PATH = os.path.join(BACKEND_DIR, ".env")


def load_env():
    """Load .env file if it exists. Minimal parser — no dependency needed."""
    if not os.path.exists(ENV_PATH):
        return
    with open(ENV_PATH) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            key = key.strip()
            value = value.strip().strip("'\"")
            if key and key not in os.environ:
                os.environ[key] = value


def get_supabase_client():
    from supabase import create_client

    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_KEY")
    if not url or not key:
        print("Error: SUPABASE_URL and SUPABASE_KEY must be set in environment or .env file")
        sys.exit(1)
    return create_client(url, key)


def load_segments(path):
    """Load geographic segment config from JSON file."""
    if not path:
        return None
    with open(path) as f:
        config = json.load(f)
    return config.get("segments", [])


def classify(meta, segments):
    """Classify a publication by geographic segment rules."""
    if not segments:
        return None
    state = meta.get("state", "")
    dma = (meta.get("dma", "") or "").lower()
    city = (meta.get("city", "") or "").lower()

    for seg in segments:
        match = seg.get("match", {})
        # State match
        if "states" in match and state in match["states"]:
            return seg["name"]
        # DMA match
        if "dmas" in match:
            for pattern in match["dmas"]:
                if pattern.lower() in dma or pattern.lower() in city:
                    return seg["name"]
        # Region match (direct string)
        if "regions" in match:
            region = (meta.get("region", "") or "").lower()
            for pattern in match["regions"]:
                if pattern.lower() in region:
                    return seg["name"]
    return None


def impute_da(pub_type, reach):
    """Estimate domain authority when actual value is missing."""
    if pub_type == "academic":
        return 55  # .edu carries inherent trust regardless of reach
    if reach >= 500000:
        return 65
    elif reach >= 100000:
        return 55
    else:
        return 45


def z_scores(values):
    """Compute z-scores for a list of floats."""
    n = len(values)
    if n < 2:
        return [0.0] * n
    mu = statistics.mean(values)
    sd = statistics.stdev(values)
    if sd == 0:
        return [0.0] * n
    return [(v - mu) / sd for v in values]


def resolve_group_id(sb, group_ref):
    """Resolve a group ID or slug to a UUID."""
    # If it looks like a UUID, use directly
    if len(group_ref) == 36 and group_ref.count("-") == 4:
        return group_ref
    # Otherwise treat as slug
    result = (
        sb.table("publication_groups")
        .select("id, name")
        .eq("slug", group_ref)
        .limit(1)
        .execute()
    )
    if not result.data:
        print(f"Error: No publication group found with slug '{group_ref}'")
        sys.exit(1)
    print(f"Resolved group: {result.data[0]['name']} ({result.data[0]['id']})")
    return result.data[0]["id"]


def load_group_members(sb, group_id):
    """Load all publication IDs in a group (paginated)."""
    member_ids = set()
    offset = 0
    while True:
        result = (
            sb.table("publication_group_members")
            .select("publication_id")
            .eq("group_id", group_id)
            .range(offset, offset + 999)
            .execute()
        )
        rows = result.data or []
        member_ids.update(m["publication_id"] for m in rows)
        if len(rows) < 1000:
            break
        offset += 1000
    return member_ids


def load_publications(sb, member_ids, source_list=None):
    """Load publications, optionally filtered by source_list."""
    all_pubs = []
    offset = 0
    while True:
        query = sb.table("publications").select(
            "id, name, region, domain_authority, publication_type, source_lists, metadata"
        )
        if source_list:
            query = query.contains("source_lists", [source_list])
        result = query.range(offset, offset + 999).execute()
        rows = result.data or []
        all_pubs.extend(rows)
        if len(rows) < 1000:
            break
        offset += 1000

    if member_ids:
        return [p for p in all_pubs if p["id"] in member_ids]
    return all_pubs


def score_publications(pubs, weights, segments):
    """Run z-score composite scoring on publications."""
    w_da, w_reach, w_dma, w_aev = weights

    # Enrich
    for p in pubs:
        meta = p.get("metadata", {}) or {}
        if isinstance(meta, str):
            meta = json.loads(meta)
        p["_meta"] = meta
        p["_reach"] = meta.get("reach") or 0
        p["_aev"] = meta.get("aev") or 0.0
        p["_dma_rank"] = meta.get("dma_rank") or 210
        p["_da_actual"] = p.get("domain_authority")
        p["_da_imputed"] = False
        if p["_da_actual"] and p["_da_actual"] <= 100:
            p["_da"] = p["_da_actual"]
        else:
            p["_da"] = impute_da(p.get("publication_type", "news"), p["_reach"])
            p["_da_imputed"] = True
        p["_segment"] = classify(meta, segments)

    # Pre-transform
    da_raw = [p["_da"] for p in pubs]
    reach_log = [math.log10(p["_reach"] + 1) for p in pubs]
    dma_inv = [211 - p["_dma_rank"] for p in pubs]
    aev_log = [math.log10(p["_aev"] + 1) for p in pubs]

    # Z-score each dimension
    da_z = z_scores(da_raw)
    reach_z = z_scores(reach_log)
    dma_z = z_scores(dma_inv)
    aev_z = z_scores(aev_log)

    # Print distribution stats
    print(f"\n{'=' * 70}")
    print("DIMENSION STATISTICS (pre-transform)")
    print(f"{'=' * 70}")
    for name, raw, zs in [
        ("DA", da_raw, da_z),
        ("log(Reach)", reach_log, reach_z),
        ("inv(DMA)", dma_inv, dma_z),
        ("log(AEV)", aev_log, aev_z),
    ]:
        print(
            f"  {name:<12} mean={statistics.mean(raw):>8.2f}  sd={statistics.stdev(raw):>8.2f}  "
            f"z_range=[{min(zs):>+.2f}, {max(zs):>+.2f}]"
        )

    # Weighted composite
    raw_scores = []
    for i, p in enumerate(pubs):
        raw = w_da * da_z[i] + w_reach * reach_z[i] + w_dma * dma_z[i] + w_aev * aev_z[i]
        raw_scores.append(raw)
        p["_z_da"] = round(da_z[i], 2)
        p["_z_reach"] = round(reach_z[i], 2)
        p["_z_dma"] = round(dma_z[i], 2)
        p["_z_aev"] = round(aev_z[i], 2)
        p["_raw_score"] = raw

    # Rescale to 0-100
    min_raw = min(raw_scores)
    max_raw = max(raw_scores)
    score_range = max_raw - min_raw if max_raw != min_raw else 1.0
    for p in pubs:
        p["_score"] = round(((p["_raw_score"] - min_raw) / score_range) * 100, 1)

    pubs.sort(key=lambda p: -p["_score"])
    return pubs


def print_top_n(pubs, n, weights):
    """Print top N publications in a formatted table."""
    w_da, w_reach, w_dma, w_aev = weights
    print(f"\n{'=' * 140}")
    print(
        f"TOP {n} BY Z-SCORE COMPOSITE  "
        f"(DA={w_da:.0%}  Reach={w_reach:.0%}  DMA={w_dma:.0%}  AEV={w_aev:.0%})"
    )
    print(f"{'=' * 140}")
    print(
        f"{'#':>4} {'Score':>5} {'Publication':<40} {'City':<17} {'ST':<4} "
        f"{'DA':>3}{'':>1} {'Reach':>10} {'DMA#':>4} {'Type':<9} {'Segment':<22}"
        f"  z_da z_rch z_dma z_aev"
    )
    print("-" * 140)
    for i, p in enumerate(pubs[:n], 1):
        meta = p["_meta"]
        da_flag = "*" if p["_da_imputed"] else " "
        reach_str = f"{p['_reach']:,}" if p["_reach"] else "-"
        print(
            f"{i:>4} {p['_score']:>5.1f} {p['name']:<40} "
            f"{meta.get('city', ''):<17} {meta.get('state', ''):<4} "
            f"{p['_da']:>3}{da_flag} {reach_str:>10} {p['_dma_rank']:>4} "
            f"{p.get('publication_type', ''):<9} {p['_segment'] or '':<22}"
            f"  {p['_z_da']:>+5.2f} {p['_z_reach']:>+5.2f} {p['_z_dma']:>+5.2f} {p['_z_aev']:>+5.2f}"
        )


def print_distribution(pubs):
    """Print score distribution histogram."""
    print(f"\n{'=' * 80}")
    print("SCORE DISTRIBUTION (0-100 rescaled)")
    print(f"{'=' * 80}")
    buckets = [
        (90, 101), (80, 90), (70, 80), (60, 70), (50, 60),
        (40, 50), (30, 40), (20, 30), (10, 20), (0, 10),
    ]
    for lo, hi in buckets:
        count = sum(1 for p in pubs if lo <= p["_score"] < hi)
        bar = "#" * (count // 3)
        print(f"  {lo:>3}-{hi - 1:<3}: {count:>4}  {bar}")


def print_budget_scenarios(pubs):
    """Print budget scenario analysis for various publication counts."""
    total = len(pubs)
    tiers = [n for n in [25, 50, 100, 200, 300, 500, 750, 1000, 1500] if n <= total]
    if total not in tiers:
        tiers.append(total)

    print(f"\n{'=' * 90}")
    print("BUDGET SCENARIOS — Top N by composite score")
    print(f"{'=' * 90}")
    print(
        f"{'Pubs':>6} {'Min Score':>9} {'Avg Score':>9} {'Total Reach':>14} "
        f"{'Avg DA':>7} {'States':>7} {'DMAs':>6}"
    )
    for n in tiers:
        subset = pubs[:n]
        total_reach = sum(p["_reach"] for p in subset)
        avg_da = sum(p["_da"] for p in subset) / len(subset)
        avg_score = sum(p["_score"] for p in subset) / len(subset)
        states = len(set(p["_meta"].get("state", "") for p in subset))
        dmas = len(set(p["_meta"].get("dma", "") for p in subset))
        min_score = subset[-1]["_score"]
        print(
            f"{n:>6} {min_score:>9.1f} {avg_score:>9.1f} {total_reach:>14,} "
            f"{avg_da:>7.1f} {states:>7} {dmas:>6}"
        )


def generate_rationale(p):
    """Generate placement rationale string for a publication."""
    meta = p["_meta"]
    da = p["_da"]
    reach = p["_reach"]
    segment = p["_segment"] or ""
    parts = []

    if segment:
        parts.append(f"Geographic segment: {segment}")

    if da >= 70:
        parts.append(f"High domain authority ({da}) — strong SEO/AI training signal")
    elif da >= 50:
        parts.append(f"Mid-tier domain authority ({da})")

    if reach >= 500000:
        parts.append(f"High-reach outlet ({reach:,}/mo)")
    elif reach >= 100000:
        parts.append(f"Solid regional reach ({reach:,}/mo)")

    if p.get("publication_type") == "academic":
        parts.append(".edu domain — high trust signal for AI models")

    return "; ".join(parts)


def write_csv(pubs, output_path):
    """Write scored publications to CSV."""
    with open(output_path, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.writer(f)
        writer.writerow([
            "Rank", "Composite_Score", "Publication", "City", "State",
            "DMA", "DMA_Rank", "Domain_Authority", "DA_Source",
            "Monthly_Reach", "AEV_USD", "Publication_Type", "Segment",
            "Z_DA", "Z_Reach", "Z_DMA", "Z_AEV",
            "Placement_Rationale", "Source_Lists", "Publication_ID",
        ])
        for i, p in enumerate(pubs, 1):
            meta = p["_meta"]
            writer.writerow([
                i,
                p["_score"],
                p["name"],
                meta.get("city", ""),
                meta.get("state", ""),
                meta.get("dma", ""),
                meta.get("dma_rank", ""),
                p["_da"],
                "actual" if not p["_da_imputed"] else "estimated",
                p["_reach"],
                meta.get("aev", ""),
                p.get("publication_type", ""),
                p["_segment"] or "",
                p["_z_da"],
                p["_z_reach"],
                p["_z_dma"],
                p["_z_aev"],
                generate_rationale(p),
                ", ".join(p.get("source_lists", [])),
                p["id"],
            ])
    print(f"\nWrote {len(pubs)} rows to {output_path}")


def main():
    parser = argparse.ArgumentParser(
        description="Score publications in a group with z-score composite ranking.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s --group usmr-pilot
  %(prog)s --group 0d573d12-... --output results.csv
  %(prog)s --group usmr-pilot --segments segments.json --top 100
  %(prog)s --group usmr-pilot --weights 0.50,0.20,0.20,0.10
  %(prog)s --group usmr-pilot --source-list newsusa-network
        """,
    )
    parser.add_argument(
        "--group", required=True,
        help="Publication group ID (UUID) or slug",
    )
    parser.add_argument(
        "--output", "-o",
        help="Output CSV path (default: <group_slug>_scored.csv)",
    )
    parser.add_argument(
        "--segments",
        help="Path to geographic segment config JSON file",
    )
    parser.add_argument(
        "--weights", default="0.40,0.25,0.20,0.15",
        help="Comma-separated weights: DA,Reach,DMA,AEV (default: 0.40,0.25,0.20,0.15)",
    )
    parser.add_argument(
        "--top", type=int, default=50,
        help="Number of top publications to display (default: 50)",
    )
    parser.add_argument(
        "--source-list",
        help="Filter publications to a specific source list (e.g., newsusa-network)",
    )
    parser.add_argument(
        "--csv-only", action="store_true",
        help="Skip console output, only write CSV",
    )
    args = parser.parse_args()

    # Parse weights
    try:
        weights = tuple(float(w) for w in args.weights.split(","))
        if len(weights) != 4:
            raise ValueError
        if abs(sum(weights) - 1.0) > 0.01:
            print(f"Warning: weights sum to {sum(weights):.2f}, not 1.0")
    except ValueError:
        print("Error: --weights must be 4 comma-separated floats (e.g., 0.40,0.25,0.20,0.15)")
        sys.exit(1)

    # Load env and connect
    load_env()
    client = get_supabase_client()
    sb = client.schema("fancyrobot")

    # Resolve group
    group_id = resolve_group_id(sb, args.group)

    # Load data
    member_ids = load_group_members(sb, group_id)
    print(f"Group members: {len(member_ids)}")

    pubs = load_publications(sb, member_ids, args.source_list)
    print(f"Matched publications: {len(pubs)}")

    if len(pubs) < 2:
        print("Error: Need at least 2 publications to score")
        sys.exit(1)

    # Load optional segments
    segments = load_segments(args.segments)

    # Score
    scored = score_publications(pubs, weights, segments)

    # Output
    if not args.csv_only:
        print_top_n(scored, args.top, weights)
        print_distribution(scored)
        print_budget_scenarios(scored)

    # CSV
    output_path = args.output or f"{args.group.replace('-', '_')}_scored.csv"
    write_csv(scored, output_path)


if __name__ == "__main__":
    main()
