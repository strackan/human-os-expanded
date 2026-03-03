"""USMR Gold IRA — Regional Newspaper Buy Path.

Focus: Retiree-heavy markets + gold-relevant demographics.
Only regional newspapers from Rick's 2,500+ NewsUSA network.
"""

import csv
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

CSV_PATH = "NewsUSA_AI_Influence_Analysis - AI Influence Analysis.csv"

with open(CSV_PATH, "r", encoding="utf-8-sig") as f:
    rows = list(csv.DictReader(f))

for r in rows:
    try:
        r["ai"] = float(r.get("AI_Score", "0") or "0")
    except ValueError:
        r["ai"] = 0.0
    try:
        r["price"] = float(r.get("Price", "0").replace(",", "").replace("$", "") or "0")
    except ValueError:
        r["price"] = 0.0
    r["pub"] = r.get("Publication", "")
    r["region"] = r.get("Region1", "").strip()
    r["cc"] = r.get("CommonCrawl", "").strip().lower()
    r["df"] = r.get("DoFollow", "").strip().lower() == "yes"
    r["tat"] = r.get("TAT", "")
    r["da"] = r.get("DA", "")
    r["tier"] = r.get("AI_Tier", "")

# Keywords that indicate wire services, tech media, lifestyle — NOT regional newspapers
EXCLUDE_KEYWORDS = [
    "investing.com", "bizjournal", "entrepreneur", "apple news",
    "yahoo", "msn", "reuters", "business insider", "wired", "mashable",
    "techcrunch", "fortune", "cnet", "zdnet", "pc mag", "ign",
    "rolling stone", "variety", "coindesk", "bitcoin", "profile post",
    "impression", "do-follow", "syndication", "benzinga", "thestreet",
    "street insider", "global banking", "market realist", "fxstreet",
    "ap news", "financial post", "ibtimes", "international business",
    "hackernoon", "digital trends", "readwrite", "venture beat",
    "techopedia", "geekwire", "tech times", "tech crunch",
    "bustle", "elite daily", "mic ", "inverse", "paper mag",
    "village voice", "distractify", "providr", "self ", "glamour",
    "conde nast", "architectural digest", "wwd", "maxim", "robb report",
    "real deal", "wall street journal", "time.com", "hollywood",
    "paste magazine", "sporting news", "perez hilton", "spin.com",
    "jezebel", "medical daily", "arabian", "mid-day", "patch.com",
    "medium", "daily scanner", "self growth", "cali post", "mark meets",
    "futuristic", "vents magazine", "metapress", "cooking",
    "restaurant", "curious mind", "the influential", "news today",
    "pinnacle list", "gisuser", "tech bullion", "dubai", "huff mag",
    "fox interviewer", "elite luxury", "resto", "platter share",
    "elite property", "la examiner", "sustainable post", "haute",
    "la mag", "la weekly", "sf weekly", "sf examiner",
    "new times", "observer", "dallas observer", "west word",
    "metro times", "pix11", "digital journal",
]

# Target markets for Gold IRA article:
# 1. RETIREE HAVENS: Florida, Arizona, SoCal, Nevada, South Carolina
# 2. WEALTH CENTERS: New York, Chicago, New England, Bay Area
# 3. PENSION/INDUSTRIAL: Michigan, Ohio, Pennsylvania, Wisconsin
# 4. GROWTH MARKETS: Texas (Austin), NC (Raleigh-Durham), Colorado, Tennessee
# 5. GENERAL GOLD INTEREST: anywhere with aging population + disposable income

RETIREE_REGIONS = {
    # Florida — #1 retirement state
    "Florida": "Retiree Haven",
    # Arizona — #2 retirement destination
    "Arizona": "Retiree Haven",
    # California — SoCal wealth, Bay Area tech wealth
    "California": "Wealth Center",
    # Nevada — retirees + no state income tax
    "Nevada": "Retiree Haven",
}

WEALTH_REGIONS = {
    "New York": "Wealth Center",
    "Illinois": "Wealth Center (Chicago)",
    "Massachusetts": "Wealth Center (New England)",
    "Connecticut": "Wealth Center (New England)",
    "New Jersey": "Wealth Center",
    "Maryland": "Wealth Center (DC Metro)",
    "Virginia": "Wealth Center (DC Metro)",
}

PENSION_REGIONS = {
    "Michigan": "Pension/Industrial",
    "Ohio": "Pension/Industrial",
    "Pennsylvania": "Pension/Industrial",
    "Wisconsin": "Pension/Industrial",
    "Indiana": "Pension/Industrial",
    "Iowa": "Pension/Midwest",
    "Minnesota": "Pension/Midwest",
    "Missouri": "Pension/Midwest",
    "Kansas": "Pension/Midwest",
}

GROWTH_REGIONS = {
    "Texas": "Growth Market",
    "North Carolina": "Growth Market (RDU)",
    "South Carolina": "Growth/Retiree",
    "Colorado": "Growth Market",
    "Tennessee": "Growth Market",
    "Georgia": "Growth Market (Atlanta)",
    "Kentucky": "Growth/Adjacent",
    "Oklahoma": "Growth/Adjacent",
    "Oregon": "Growth/Retiree",
    "Washington State": "Growth Market",
    "Alabama": "Retiree/Adjacent",
    "Louisiana": "Retiree/Adjacent",
    "Nebraska": "Midwest",
}

ALL_TARGETS = {}
ALL_TARGETS.update(RETIREE_REGIONS)
ALL_TARGETS.update(WEALTH_REGIONS)
ALL_TARGETS.update(PENSION_REGIONS)
ALL_TARGETS.update(GROWTH_REGIONS)


def is_regional_newspaper(r):
    """True if this looks like a regional newspaper, not a wire/tech/lifestyle outlet."""
    pub_lower = r["pub"].lower()
    for kw in EXCLUDE_KEYWORDS:
        if kw in pub_lower:
            return False
    # Must be in a target region
    if r["region"] not in ALL_TARGETS:
        return False
    # Must have a price
    if r["price"] <= 0:
        return False
    return True


# Build the list
regionals = [r for r in rows if is_regional_newspaper(r)]
regionals.sort(key=lambda x: (-x["ai"], x["price"]))

# Group by market category
by_category = {}
for r in regionals:
    cat = ALL_TARGETS.get(r["region"], "Other")
    by_category.setdefault(cat, []).append(r)

# Display
print("=" * 115)
print("USMR GOLD IRA — REGIONAL NEWSPAPER BUY PATH")
print("Focus: Retiree havens + wealth centers + pension markets + growth areas")
print(f"Filtered to {len(regionals)} regional outlets from Rick's 1,391-pub network")
print("=" * 115)

# Show by market category
category_order = [
    "Retiree Haven",
    "Wealth Center",
    "Wealth Center (Chicago)",
    "Wealth Center (New England)",
    "Wealth Center (DC Metro)",
    "Pension/Industrial",
    "Pension/Midwest",
    "Growth Market",
    "Growth Market (RDU)",
    "Growth Market (Atlanta)",
    "Growth/Retiree",
    "Growth/Adjacent",
    "Retiree/Adjacent",
    "Midwest",
]

grand_total = 0
grand_count = 0

for cat in category_order:
    pubs = by_category.get(cat, [])
    if not pubs:
        continue
    cat_total = sum(r["price"] for r in pubs)
    grand_total += cat_total
    grand_count += len(pubs)

    print(f"\n--- {cat} ({len(pubs)} pubs, ${cat_total:,.0f}) ---")
    print(
        f"  {'Publication':<42} {'AI':>5} {'Price':>7} {'CC':>3} {'DF':>3}"
        f" {'Region':<18} {'TAT':<12}"
    )
    print("  " + "-" * 95)
    for r in pubs:
        cc = "Y" if r["cc"] in ("likely", "yes") else "N"
        df = "Y" if r["df"] else "N"
        print(
            f"  {r['pub'][:41]:<42} {r['ai']:5.1f} {r['price']:7,.0f}"
            f"  {cc:>2}  {df:>2} {r['region'][:17]:<18} {r['tat']:<12}"
        )

print(f"\n{'=' * 115}")
print(f"TOTAL: {grand_count} publications, ${grand_total:,.0f}")
print(f"{'=' * 115}")

# Now build the RECOMMENDED SHORT LIST
# Pick the top 1-2 per market, prioritizing:
# - Highest AI score in market
# - CommonCrawl = Y
# - Cheapest when scores are close
print("\n\n")
print("=" * 115)
print("RECOMMENDED SHORT LIST — Best 1-2 per market")
print("Goal: Maximum geographic + demographic coverage with fewest pubs")
print("=" * 115)

# Manual curation of the best pick(s) per market
market_picks = {
    "Florida": ["Miami Herald", "Sun Sentinel", "Palm Beach Post", "Orlando Sentinel",
                 "Sarasota Herald-Tribune", "Naples Daily News", "Florida Today",
                 "Tallahassee Democrat", "Florida Times-Union", "Treasure Coast News",
                 "Pensacola News Journal", "Bradenton Herald", "The News-Press",
                 "The Gainesville Sun", "Lakeland Ledger"],
    "Arizona": ["Arizona Central", "Arizona Daily Star", "Phoenix New Times",
                "Tucson Weekly"],
    "California": ["Mercury News", "San Diego Union Tribune", "The Sacramento Bee",
                    "OC Register", "Los Angeles Daily News", "The Fresno Bee",
                    "East Bay Times", "The Desert Sun", "San Luis Obispo Tribune",
                    "The Modesto Bee", "San Bernardino Sun", "Pasadena Star News",
                    "Press Telegram", "Daily Breeze", "VC Star", "San Diego Reader"],
    "Nevada": ["Reno Gazette-Journal", "Las Vegas Sun"],
    "New York": ["NY Daily News", "Democrat & Chronicle", "The Buffalo News",
                  "The Journal News"],
    "Illinois": ["Chicago Tribune", "The State Journal-Register", "Journal Star"],
    "Massachusetts": ["Boston Herald", "Worcester Telegram", "Wicked Local"],
    "Connecticut": ["Hartford Courant"],
    "Michigan": ["Detroit Free Press"],
    "Ohio": ["Cincinnati News", "Akron Beacon Journal", "CantonRep",
             "The Columbus Dispatch"],
    "Pennsylvania": ["The Morning Call", "York Daily Record", "GoErie"],
    "Wisconsin": ["Milwaukee Journal Sentinel", "Wisconsin State Journal",
                   "Green Bay Press Gazette", "Post Crescent", "Wausau Daily Herald"],
    "Texas": ["Fort Worth Star-Telegram", "El Paso Times", "Lubbock Avalanche-Journal",
              "Caller Times"],
    "North Carolina": ["Charlotte Observer", "The Citizen-Times", "News & Record",
                        "Winston-Salem Journal", "The Fayetteville Observer",
                        "Wilmington Star-News", "The Herald Sun"],
    "South Carolina": ["The News & Observer", "The State", "Greenville Online",
                        "The Island Packet", "Post and Courier"],
    "Tennessee": ["The Tennessean", "Knox News", "Commercial Appeal"],
    "Colorado": ["The Gazette", "The Coloradoan"],
    "Indiana": ["Indianapolis Star", "The Times of Northwest Indiana"],
    "Iowa": ["The Des Moines Register", "Waterloo-Cedar Falls Courier"],
    "Georgia": ["Ledger Enquirer"],
    "Kentucky": ["Lexington Herald-Leader", "Louisville News"],
}

# Build recommended picks: top 1 per market (cheapest among top-AI pubs)
# For major retiree markets (FL, AZ) allow 2-3 picks
reco = []

# Helper: find pub by name
pub_lookup = {}
for r in regionals:
    pub_lookup[r["pub"]] = r

# For each target state, pick best newspaper(s)
state_pubs = {}
for r in regionals:
    state_pubs.setdefault(r["region"], []).append(r)

# Sort each state's pubs by AI score desc
for state in state_pubs:
    state_pubs[state].sort(key=lambda x: (-x["ai"], x["price"]))

# Selection rules:
# - FL: top 3 (diverse metro coverage: Miami, Central, Gulf Coast)
# - AZ: top 1
# - CA: top 2 (SoCal + NorCal)
# - NV: top 1
# - NY: top 1
# - IL: top 1
# - MA: top 1
# - CT: top 1
# - MI: top 1
# - OH: top 1
# - PA: top 1
# - WI: top 1
# - TX: top 1
# - NC: top 1
# - SC: top 1
# - TN: top 1
# - CO: top 1
# - IN: top 1
# - IA: top 1
# - GA: top 1
# - KY: top 1
# Others: top 1

pick_counts = {
    "Florida": 3,
    "California": 2,
    "Arizona": 1,
    "Nevada": 1,
    "New York": 1,
    "Illinois": 1,
    "Massachusetts": 1,
    "Connecticut": 1,
    "Michigan": 1,
    "Ohio": 1,
    "Pennsylvania": 1,
    "Wisconsin": 1,
    "Texas": 1,
    "North Carolina": 1,
    "South Carolina": 1,
    "Tennessee": 1,
    "Colorado": 1,
    "Indiana": 1,
    "Iowa": 1,
    "Georgia": 1,
    "Kentucky": 1,
    "Maryland": 1,
    "Virginia": 1,
    "Oklahoma": 1,
    "Oregon": 1,
    "Minnesota": 1,
    "Missouri": 1,
    "Kansas": 1,
    "New Jersey": 1,
    "Alabama": 1,
    "Louisiana": 1,
    "Nebraska": 1,
    "Washington State": 1,
    "New Hampshire": 1,
}

short_list = []
for state, count in pick_counts.items():
    pubs = state_pubs.get(state, [])
    for p in pubs[:count]:
        short_list.append((state, ALL_TARGETS.get(state, ""), p))

short_list.sort(key=lambda x: (-x[2]["ai"], x[2]["price"]))

total_cost = sum(s[2]["price"] for s in short_list)
print(
    f"\n{'#':>3} {'Publication':<42} {'AI':>5} {'Price':>7} {'CC':>3} {'DF':>3}"
    f" {'State':<18} {'Market Type':<22}"
)
print("-" * 115)

running = 0
for i, (state, mtype, r) in enumerate(short_list, 1):
    cc = "Y" if r["cc"] in ("likely", "yes") else "N"
    df = "Y" if r["df"] else "N"
    running += r["price"]
    print(
        f"{i:3d} {r['pub'][:41]:<42} {r['ai']:5.1f} {r['price']:7,.0f}"
        f"  {cc:>2}  {df:>2} {state[:17]:<18} {mtype[:21]:<22}"
    )

avg_ai = sum(s[2]["ai"] for s in short_list) / len(short_list) if short_list else 0
cc_pct = sum(1 for s in short_list if s[2]["cc"] in ("likely", "yes")) / len(short_list) * 100

print(f"\n{'=' * 115}")
print(f"SHORT LIST: {len(short_list)} publications across {len(pick_counts)} markets")
print(f"Total cost: ${total_cost:,.0f}")
print(f"Avg AI score: {avg_ai:.1f} | CommonCrawl: {cc_pct:.0f}%")
print(f"{'=' * 115}")

# Budget tiers from the short list
print("\nBUDGET TIERS (cumulative from highest-AI down):")
sorted_by_ai = sorted(short_list, key=lambda x: (-x[2]["ai"], x[2]["price"]))
cum = 0
checkpoints = [10, 15, 20, 25, 30, len(short_list)]
for i, (state, mtype, r) in enumerate(sorted_by_ai, 1):
    cum += r["price"]
    if i in checkpoints:
        states_covered = len(set(s[0] for s in sorted_by_ai[:i]))
        print(f"  Top {i:2d} pubs: ${cum:>8,.0f} | {states_covered} states covered")
