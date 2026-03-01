"""4-factor audit scoring engine.

Implements the Fancy Robot spec's Phase 4 scoring formula:
- Mention Frequency (40%): % of prompts that mention the brand
- Position Quality (25%): Weighted position scoring using existing ScoringEngine
- Narrative Accuracy (20%): LLM-assessed accuracy of AI descriptions vs brand truth
- Founder Retrieval (15%): How well AI models know the founder/leadership
"""

import json
import logging

from app.config import get_settings
from app.models.audit import (
    AuditAnalysisResult,
    AuditPromptDimension,
    BrandProfile,
    DimensionScore,
    PromptAnalysisResult,
    ProviderAuditScore,
    get_severity_band,
)
from app.services.ai_providers.anthropic_provider import AnthropicProvider

logger = logging.getLogger(__name__)

# 4-factor weights
WEIGHT_MENTION_FREQ = 0.40
WEIGHT_POSITION_QUALITY = 0.25
WEIGHT_NARRATIVE_ACCURACY = 0.20
WEIGHT_FOUNDER_RETRIEVAL = 0.15

# Position scoring (reuses the existing scoring engine's logic)
POSITION_SCORES = {1: 100, 2: 80, 3: 60, 4: 40, 5: 20}
REC_TYPE_SCORES = {"explicit": 100, "ranked": 85, "listed": 60, "mentioned": 40, "not_mentioned": 0}


class AuditScoringEngine:
    """4-factor scoring engine for the full audit pipeline."""

    def calculate_mention_frequency(
        self, results: list[PromptAnalysisResult]
    ) -> float:
        """40% weight: Percentage of prompts where brand was mentioned.

        Returns 0-100 score.
        """
        if not results:
            return 0.0
        mentioned = sum(1 for r in results if r.brand_mentioned)
        return (mentioned / len(results)) * 100

    def calculate_position_quality(
        self, results: list[PromptAnalysisResult]
    ) -> float:
        """25% weight: Average position quality using existing scoring logic.

        Returns 0-100 score.
        """
        mentioned_results = [r for r in results if r.brand_mentioned]
        if not mentioned_results:
            return 0.0

        scores = []
        for r in mentioned_results:
            # Position score
            pos_score = 0.0
            if r.position and r.position in POSITION_SCORES:
                pos_score = POSITION_SCORES[r.position]
            elif r.position and r.position > 5:
                pos_score = max(10, 20 - (r.position - 5) * 2)

            # Recommendation type score
            rec_score = REC_TYPE_SCORES.get(r.recommendation_type, 0)

            # Take the higher
            base = max(pos_score, rec_score)

            # Sentiment modifier
            sentiment_mods = {
                "positive": 1.1, "neutral": 1.0, "mixed": 0.9,
                "cautionary": 0.7, "negative": 0.3,
            }
            mod = sentiment_mods.get(r.sentiment, 1.0)

            scores.append(min(100.0, base * mod))

        return sum(scores) / len(scores) if scores else 0.0

    async def calculate_narrative_accuracy(
        self,
        results: list[PromptAnalysisResult],
        profile: BrandProfile,
    ) -> float:
        """20% weight: How accurately AI responses describe the brand.

        Batches mentioned responses and asks Claude to rate accuracy
        against ground truth (products, differentiators, founder story).
        Returns 0-100 score.
        """
        mentioned = [r for r in results if r.brand_mentioned and r.context]
        if not mentioned:
            return 0.0

        settings = get_settings()
        if not settings.has_anthropic():
            # Fallback: give partial credit for mentions
            return 50.0

        provider = AnthropicProvider(
            api_key=settings.anthropic_api_key,
            model="claude-sonnet-4-6",
        )

        # Build ground truth
        products_str = ", ".join(p.name for p in profile.products[:5]) if profile.products else "N/A"
        diffs_str = ", ".join(profile.differentiators[:5]) if profile.differentiators else "N/A"
        founder_str = ""
        if profile.founders:
            f = profile.founders[0]
            founder_str = f"{f.name}, {f.title}. {f.background}"

        # Batch mentions (max 10 per call)
        batch = mentioned[:10]
        contexts = "\n".join(
            f"{i+1}. [{r.provider}] {r.context[:200]}"
            for i, r in enumerate(batch)
        )

        prompt = f"""Rate the accuracy of these AI response snippets about {profile.company_name}.

## Ground Truth
- Company: {profile.company_name}
- Industry: {profile.industry}
- Products/Services: {products_str}
- Differentiators: {diffs_str}
- Founder/Leader: {founder_str or 'Unknown'}
- Description: {profile.description}

## AI Response Contexts (mentioning {profile.company_name})
{contexts}

## Instructions
For each snippet, rate accuracy from 0.0 to 1.0:
- 1.0 = Completely accurate, matches ground truth
- 0.7 = Mostly accurate, minor inaccuracies
- 0.5 = Partially accurate, some wrong info
- 0.3 = Mostly inaccurate
- 0.0 = Completely wrong or hallucinated

Return ONLY valid JSON:
{{"ratings": [0.8, 0.6, ...]}}"""

        try:
            response = await provider.query(prompt)
            if response.success:
                text = response.text.strip()
                if text.startswith("```"):
                    text = text.split("```")[1]
                    if text.startswith("json"):
                        text = text[4:]
                data = json.loads(text.strip())
                ratings = data.get("ratings", [])
                if ratings:
                    avg_accuracy = sum(ratings) / len(ratings)
                    return avg_accuracy * 100
        except Exception as e:
            logger.warning(f"Narrative accuracy scoring failed: {e}")

        # Fallback: give partial credit
        return 50.0

    def calculate_founder_retrieval(
        self,
        results: list[PromptAnalysisResult],
        profile: BrandProfile,
    ) -> float:
        """15% weight: How well AI models retrieve founder information.

        Examines founder_brand dimension prompts specifically.
        Returns 0-100 score.
        """
        founder_results = [
            r for r in results
            if r.dimension == AuditPromptDimension.FOUNDER_BRAND
        ]

        if not founder_results:
            return 0.0

        # Check if founder names appear in responses
        founder_names = [f.name.lower() for f in profile.founders if f.name]
        company_lower = profile.company_name.lower()

        scores = []
        for r in founder_results:
            response_lower = r.raw_response.lower()
            score = 0.0

            # Check if company is mentioned at all
            if company_lower in response_lower:
                score += 30

            # Check if any founder name appears
            for fname in founder_names:
                if fname in response_lower:
                    score += 50
                    # Check if background details appear
                    for f in profile.founders:
                        if f.name.lower() == fname:
                            if f.title and f.title.lower() in response_lower:
                                score += 10
                            if any(
                                pc.lower() in response_lower
                                for pc in f.prior_companies
                                if pc
                            ):
                                score += 10
                    break

            scores.append(min(100.0, score))

        return sum(scores) / len(scores) if scores else 0.0

    async def calculate_audit_score(
        self,
        results: list[PromptAnalysisResult],
        profile: BrandProfile,
    ) -> AuditAnalysisResult:
        """Calculate the complete 4-factor audit score.

        Returns AuditAnalysisResult with all breakdowns.
        """
        # 4-factor scores
        mention_freq = self.calculate_mention_frequency(results)
        position_qual = self.calculate_position_quality(results)
        narrative_acc = await self.calculate_narrative_accuracy(results, profile)
        founder_ret = self.calculate_founder_retrieval(results, profile)

        # Weighted composite
        overall = (
            mention_freq * WEIGHT_MENTION_FREQ
            + position_qual * WEIGHT_POSITION_QUALITY
            + narrative_acc * WEIGHT_NARRATIVE_ACCURACY
            + founder_ret * WEIGHT_FOUNDER_RETRIEVAL
        )
        overall = min(100.0, max(0.0, overall))

        # Build dimension breakdowns
        dim_groups: dict[AuditPromptDimension, list[PromptAnalysisResult]] = {}
        for r in results:
            dim_groups.setdefault(r.dimension, []).append(r)

        dimension_scores = []
        for dim, dim_results in dim_groups.items():
            mentioned = [r for r in dim_results if r.brand_mentioned]
            positions = [r.position for r in mentioned if r.position]
            dimension_scores.append(DimensionScore(
                dimension=dim,
                score=self.calculate_position_quality(dim_results),
                mention_rate=len(mentioned) / len(dim_results) if dim_results else 0,
                prompt_count=len(dim_results),
                avg_position=sum(positions) / len(positions) if positions else None,
            ))

        # Build provider breakdowns
        prov_groups: dict[str, list[PromptAnalysisResult]] = {}
        for r in results:
            prov_groups.setdefault(r.provider, []).append(r)

        provider_scores = []
        for prov, prov_results in prov_groups.items():
            mentioned = [r for r in prov_results if r.brand_mentioned]
            positions = [r.position for r in mentioned if r.position]
            provider_scores.append(ProviderAuditScore(
                provider=prov,
                score=self.calculate_position_quality(prov_results),
                mention_rate=len(mentioned) / len(prov_results) if prov_results else 0,
                prompt_count=len(prov_results),
                avg_position=sum(positions) / len(positions) if positions else None,
            ))

        # Persona breakdown
        persona_rates: dict[str, float] = {}
        persona_groups: dict[str, list[PromptAnalysisResult]] = {}
        for r in results:
            if r.persona:
                persona_groups.setdefault(r.persona, []).append(r)
        for persona, p_results in persona_groups.items():
            mentioned = sum(1 for r in p_results if r.brand_mentioned)
            persona_rates[persona] = mentioned / len(p_results) if p_results else 0

        # Topic breakdown
        topic_rates: dict[str, float] = {}
        topic_groups: dict[str, list[PromptAnalysisResult]] = {}
        for r in results:
            if r.topic:
                topic_groups.setdefault(r.topic, []).append(r)
        for topic, t_results in topic_groups.items():
            mentioned = sum(1 for r in t_results if r.brand_mentioned)
            topic_rates[topic] = mentioned / len(t_results) if t_results else 0

        # Competitor mention rates
        comp_rates: dict[str, float] = {}
        for comp in profile.competitors[:5]:
            comp_lower = comp.name.lower()
            mentioned = sum(
                1 for r in results
                if comp_lower in r.raw_response.lower()
            )
            comp_rates[comp.name] = mentioned / len(results) if results else 0

        # Token/cost tracking
        total_tokens = sum(r.tokens_used or 0 for r in results)
        # Rough cost estimate: ~$0.003 per 1K tokens average across models
        estimated_cost = (total_tokens / 1000) * 0.003

        mentions_count = sum(1 for r in results if r.brand_mentioned)

        return AuditAnalysisResult(
            overall_ari=round(overall, 1),
            severity_band=get_severity_band(overall),
            mention_frequency=round(mention_freq, 1),
            position_quality=round(position_qual, 1),
            narrative_accuracy=round(narrative_acc, 1),
            founder_retrieval=round(founder_ret, 1),
            dimension_scores=dimension_scores,
            provider_scores=provider_scores,
            persona_breakdown=persona_rates,
            topic_breakdown=topic_rates,
            competitor_mention_rates=comp_rates,
            total_prompts=len(set(r.prompt_id for r in results)),
            total_responses=len(results),
            mentions_count=mentions_count,
            all_results=results,
            total_tokens=total_tokens,
            estimated_cost_usd=round(estimated_cost, 4),
        )
