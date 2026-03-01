"""Test the Article Condenser against TFT and USMR articles."""
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.services.article_condenser import ArticleCondenser
from app.models.article_pipeline import CondenserInput

ARI = Path(__file__).parent.parent.parent

# Articles to test
ARTICLES = {
    "toysfortots": {
        "path": ARI / "customers/toysfortots/articles/01-google-ai-gap-hardened.md",
        "client_name": "Toys for Tots",
        "domain": "toysfortots.org",
        "keywords": [
            "how to donate toys", "toy donation near me",
            "Toys for Tots", "holiday toy donation",
        ],
    },
    "usmoneyreserve": {
        "path": ARI / "customers/usmoneyreserve/deliverables/03-article-drafts.md",
        "client_name": "U.S. Money Reserve",
        "domain": "usmoneyreserve.com",
        "keywords": [
            "how to tell if gold is real", "authentic gold coins",
            "U.S. Money Reserve", "PCGS certified gold",
        ],
    },
}


async def run_one(name: str, config: dict):
    md_path = config["path"]
    if not md_path.exists():
        print(f"[{name}] SKIP - file not found: {md_path}")
        return

    md_text = md_path.read_text(encoding="utf-8")

    # For USMR, extract just Article 1 (Authenticity Guide)
    if name == "usmoneyreserve":
        marker = "## Article 2:"
        idx = md_text.find(marker)
        if idx > 0:
            md_text = md_text[:idx].strip()

    source_words = len(md_text.split())
    print(f"\n{'='*60}")
    print(f"[{name}] Source: {source_words} words")
    print(f"{'='*60}")

    condenser = ArticleCondenser()
    result = await condenser.condense(CondenserInput(
        article_markdown=md_text,
        client_name=config["client_name"],
        domain=config["domain"],
        target_word_count=400,
        preserve_keywords=config["keywords"],
    ))

    print(f"[{name}] Condensed: {result.word_count} words ({result.compression_ratio:.0%} of original)")
    print(f"[{name}] Entities preserved: {len(result.entities_preserved)}")
    print(f"[{name}] Data points preserved: {result.data_points_preserved}")
    print(f"[{name}] Provider: {result.provider_used} | Latency: {result.latency_ms}ms")
    print(f"\n--- TITLE ---")
    print(result.title)
    print(f"\n--- CONDENSED ARTICLE ({result.word_count} words) ---")
    print(result.condensed_markdown)
    print(f"\n--- ENTITIES ---")
    for e in result.entities_preserved:
        print(f"  - {e}")

    # Save condensed output
    out_dir = ARI / f"customers/{name}/articles"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_file = out_dir / "01-condensed-400w.md"
    out_file.write_text(
        f"# {result.title}\n\n"
        f"**Word Count:** {result.word_count} | "
        f"**Source:** {result.source_word_count} words | "
        f"**Compression:** {result.compression_ratio:.0%}\n\n"
        f"---\n\n"
        f"{result.condensed_markdown}\n",
        encoding="utf-8",
    )
    print(f"\n[{name}] Saved to {out_file}")


async def main():
    for name, config in ARTICLES.items():
        await run_one(name, config)


asyncio.run(main())
