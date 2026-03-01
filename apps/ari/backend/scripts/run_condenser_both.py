"""Run condenser on both editor-hardened articles for side-by-side comparison."""
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.services.article_condenser import ArticleCondenser
from app.models.article_pipeline import CondenserInput, SpokespersonInfo

ARI = Path(__file__).parent.parent.parent

ARTICLES = [
    {
        "name": "TFT - Toy Donation Guide",
        "slug": "toysfortots",
        "path": ARI / "customers/toysfortots/articles/01-google-ai-gap-hardened.md",
        "client_name": "Toys for Tots",
        "domain": "toysfortots.org",
        "keywords": [
            "how to donate toys", "toy donation near me",
            "Toys for Tots", "holiday toy donation", "toy drive",
        ],
        "spokesperson": SpokespersonInfo(
            name="Lt. Gen. Jim Laster",
            title="President and CEO",
            company="Marine Toys for Tots Foundation",
        ),
        "out_file": "01-condensed-400w.md",
    },
    {
        "name": "USMR - Gold IRA Guide",
        "slug": "usmoneyreserve",
        "path": ARI / "customers/usmoneyreserve/articles/03-ira-hardened.md",
        "client_name": "U.S. Money Reserve",
        "domain": "usmoneyreserve.com",
        "keywords": [
            "gold IRA 2026", "how to set up gold IRA",
            "U.S. Money Reserve", "gold IRA rollover",
            "self-directed precious metals IRA",
        ],
        "spokesperson": SpokespersonInfo(
            name="Philip N. Diehl",
            title="President",
            company="U.S. Money Reserve",
        ),
        "out_file": "03-ira-condensed-400w.md",
    },
]


async def main():
    condenser = ArticleCondenser()

    for art in ARTICLES:
        md = art["path"].read_text(encoding="utf-8")
        source_words = len(md.split())

        print(f"\n{'='*60}")
        print(f"{art['name']}")
        print(f"Source: {source_words} words")
        print(f"{'='*60}")

        result = await condenser.condense(CondenserInput(
            article_markdown=md,
            client_name=art["client_name"],
            domain=art["domain"],
            target_word_count=400,
            preserve_keywords=art["keywords"],
            spokesperson=art["spokesperson"],
        ))

        print(f"Condensed: {result.word_count} words ({result.compression_ratio:.0%} of original)")
        print(f"Entities: {len(result.entities_preserved)} | Data points: {result.data_points_preserved}")
        print(f"Provider: {result.provider_used} | Latency: {result.latency_ms}ms")
        print(f"\n--- {result.title} ---")
        print(result.condensed_markdown)
        print(f"\n--- Entities preserved ---")
        for e in result.entities_preserved:
            print(f"  - {e}")

        # Save
        out_dir = ARI / f"customers/{art['slug']}/articles"
        out_dir.mkdir(parents=True, exist_ok=True)
        out_path = out_dir / art["out_file"]
        sp = art["spokesperson"]
        out_path.write_text(
            f"# {result.title}\n\n"
            f"**Word Count:** {result.word_count} | "
            f"**Source:** {result.source_word_count} words | "
            f"**Compression:** {result.compression_ratio:.0%} | "
            f"**Entities:** {len(result.entities_preserved)} | "
            f"**Data Points:** {result.data_points_preserved} | "
            f"**Spokesperson:** {sp.name}, {sp.title}\n\n---\n\n"
            f"{result.condensed_markdown}\n",
            encoding="utf-8",
        )
        print(f"\nSaved: {out_path}")


asyncio.run(main())
