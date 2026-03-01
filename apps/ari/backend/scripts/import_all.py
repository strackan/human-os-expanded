"""Import all customer data, create industry groups, show tier breakdown."""
import asyncio
import csv
import sys
from pathlib import Path
from uuid import UUID

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.routers.publications import (
    import_csv, import_sources, import_strategy, get_tiers,
    create_group, add_group_members,
    _publications, _pub_by_domain, _groups, _group_members,
)
from app.models.publications import (
    CSVImportRequest, SourcesImportRequest, StrategyImportRequest,
    PublicationGroupCreate, GroupMemberAdd, GroupType,
)

ARI = Path(__file__).parent.parent.parent


async def main():
    # === LIST A: shared NewsUSA inventory ===
    r = await import_csv(CSVImportRequest(
        customer_slug="usmoneyreserve",
        filename="NewsUSA_AI_Influence_Analysis - AI Influence Analysis.csv",
        distributor_name="NewsUSA",
    ))
    print(f"List A (NewsUSA): {r.publications_imported} pubs")

    # === LIST B: Gumshoe sources for both customers ===
    r = await import_sources(SourcesImportRequest(customer_slug="usmoneyreserve", filename="sources-38512.csv"))
    print(f"List B (USM): +{r.domains_imported} domains, {r.citations_created} citations")

    r = await import_sources(SourcesImportRequest(customer_slug="toysfortots", filename="sources-37205.csv"))
    print(f"List B (TFT): +{r.domains_imported} domains, {r.citations_created} citations")

    # === LIST C: Strategy for both customers ===
    usm_strategy = [
        "yahoo.com", "usatoday.com", "reuters.com", "finance.yahoo.com",
        "latimes.com", "wsj.com", "apnews.com", "fortune.com",
        "chicagotribune.com", "azcentral.com", "miamiherald.com",
        "ocregister.com", "sun-sentinel.com", "orlandosentinel.com",
        "sandiegouniontribune.com", "charlotteobserver.com",
        "palmbeachpost.com", "newsobserver.com", "heraldtribune.com",
        "naplesnews.com", "northjersey.com", "news-press.com",
        "pressofatlanticcity.com", "tucson.com", "app.com",
        "eastvalleytribune.com",
        "money.com", "investopedia.com", "forbes.com", "cnbc.com",
        "bankrate.com", "coinworld.com", "nerdwallet.com",
        "numismaticnews.net", "barrons.com", "washingtonpost.com",
        "investingnews.com", "kiplinger.com", "houstonchronicle.com",
        "dallasnews.com", "expressnews.com", "thinkadvisor.com",
        "wealthmanagement.com", "dailyherald.com", "yourvalley.net",
        "nj.com", "traders.com", "nytimes.com", "suntimes.com",
        "fa-mag.com", "investors.com", "thevillagesdailysun.com",
        "resourceworld.com", "tampabay.com", "statesman.com",
        "investmentnews.com",
    ]
    r = await import_strategy(StrategyImportRequest(domains=usm_strategy))
    print(f"List C (USM): {r.domains_tagged} strategic targets")

    tft_strategy = [
        "usatoday.com", "reuters.com", "apnews.com", "msn.com", "yahoo.com",
        "finance.yahoo.com", "chicagotribune.com", "latimes.com", "nydailynews.com",
        "mercurynews.com", "freep.com", "miamiherald.com", "azcentral.com",
        "baltimoresun.com", "patch.com", "sandiegouniontribune.com", "sacbee.com",
        "charlotteobserver.com", "kansascity.com", "palmbeachpost.com",
        "courant.com", "indystar.com", "tennessean.com", "newsobserver.com",
        "star-telegram.com", "dispatch.com",
        "techcrunch.com", "wired.com", "mashable.com", "digitaltrends.com",
        "venturebeat.com", "hackernoon.com", "bustle.com", "teenvogue.com", "inverse.com",
        "oklahoman.com", "startribune.com",
        "fortune.com", "time.com", "bizjournals.com",
        "benzinga.com", "thestreet.com", "investing.com",
        "washingtonpost.com", "nytimes.com",
    ]
    r = await import_strategy(StrategyImportRequest(domains=tft_strategy))
    print(f"List C (TFT): {r.domains_tagged} strategic targets")
    print(f"Total publications: {len(_publications)}")
    print()

    # === CREATE INDUSTRY GROUPS ===
    tft_domains = set()
    usm_domains = set()
    with open(ARI / "customers/toysfortots/sources-37205.csv", encoding="utf-8-sig") as f:
        for row in csv.DictReader(f):
            tft_domains.add((row.get("domain") or "").strip())
    with open(ARI / "customers/usmoneyreserve/sources-38512.csv", encoding="utf-8-sig") as f:
        for row in csv.DictReader(f):
            usm_domains.add((row.get("domain") or "").strip())

    industries = [
        ("Nonprofit Charitable Giving", tft_domains,
            "Publications cited by AI for nonprofit/charitable topics"),
        ("Precious Metals Finance", usm_domains,
            "Publications cited by AI for precious metals/finance topics"),
    ]

    industry_slugs = []
    for name, domains, desc in industries:
        slug = name.lower().replace(" ", "-")
        industry_slugs.append(slug)
        if slug not in _groups:
            await create_group(PublicationGroupCreate(
                name=name, group_type=GroupType.INDUSTRY, description=desc,
            ))
        pub_ids = [UUID(_pub_by_domain[d]) for d in domains if d in _pub_by_domain]
        if pub_ids:
            await add_group_members(slug, GroupMemberAdd(publication_ids=pub_ids))

    # Cross-industry
    shared = tft_domains & usm_domains
    cross_slug = "cross-industry-universal"
    if cross_slug not in _groups:
        await create_group(PublicationGroupCreate(
            name="Cross Industry Universal", group_type=GroupType.INDUSTRY,
            description="Publications cited by AI across multiple industries",
        ))
    shared_ids = [UUID(_pub_by_domain[d]) for d in shared if d in _pub_by_domain]
    if shared_ids:
        await add_group_members(cross_slug, GroupMemberAdd(publication_ids=shared_ids))
    industry_slugs.append(cross_slug)

    # === RESULTS ===
    print("=== INDUSTRY PUBLICATION GROUPS ===")
    for slug in industry_slugs:
        if slug in _groups:
            members = _group_members.get(slug, set())
            print(f"\n  {_groups[slug].name}: {len(members)} publications")
            member_pubs = [_publications[pid] for pid in members if pid in _publications]
            member_pubs.sort(key=lambda p: p.citation_count, reverse=True)
            for p in member_pubs[:8]:
                tier = p.recommendation_tier or 7
                lists = "+".join(p.source_lists)
                print(f"    {p.domain:35s} cites={p.citation_count:>4} tier={tier} [{lists}]")

    print("\n=== TIER BREAKDOWN ===")
    tiers = await get_tiers(category=None, publication_type=None)
    for t in tiers["tiers"]:
        top3 = ", ".join(f"{p['name']}({p['citation_count']})" for p in t["top"][:3])
        print(f"  Tier {t['tier']}: {t['count']:>5}  {top3}")

    # Cross-industry recommendation: publications valuable for ANY new client
    print("\n=== CROSS-INDUSTRY RECOMMENDATION (Tier 1-2 in any industry) ===")
    cross = []
    for pid, pub in _publications.items():
        if pub.recommendation_tier and pub.recommendation_tier <= 2:
            cross.append(pub)
    cross.sort(key=lambda p: (p.recommendation_tier, -p.citation_count))
    for p in cross[:20]:
        lists = "+".join(p.source_lists)
        print(f"  T{p.recommendation_tier} {p.domain:30s} cites={p.citation_count:>4} score={str(p.ai_score or '-'):>5} [{lists}]")


asyncio.run(main())
