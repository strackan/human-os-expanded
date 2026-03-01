"""ARI scoring engine for calculating recommendation scores."""

from dataclasses import dataclass

from app.models.response import ParsedMention, RecommendationType, Sentiment
from app.models.score import ARIScore, EntityPromptScore, ProviderScore


@dataclass
class ScoringConfig:
    """Configuration for ARI scoring weights."""

    # Position-based scores (for ranked lists)
    position_scores: dict[int, float] = None

    # Recommendation type scores
    recommendation_scores: dict[RecommendationType, float] = None

    # Sentiment modifiers (multiplied with base score)
    sentiment_modifiers: dict[Sentiment, float] = None

    def __post_init__(self):
        if self.position_scores is None:
            self.position_scores = {
                1: 100,
                2: 80,
                3: 60,
                4: 40,
                5: 20,
            }

        if self.recommendation_scores is None:
            self.recommendation_scores = {
                RecommendationType.EXPLICIT: 100,
                RecommendationType.RANKED: 85,
                RecommendationType.LISTED: 60,
                RecommendationType.MENTIONED: 40,
                RecommendationType.NOT_MENTIONED: 0,
            }

        if self.sentiment_modifiers is None:
            self.sentiment_modifiers = {
                Sentiment.POSITIVE: 1.1,
                Sentiment.NEUTRAL: 1.0,
                Sentiment.MIXED: 0.9,
                Sentiment.CAUTIONARY: 0.7,
                Sentiment.NEGATIVE: 0.3,
            }


class ScoringEngine:
    """
    Calculate ARI scores from parsed AI responses.

    Scoring algorithm:
    1. For each prompt response, calculate a base score based on:
       - Position in list (if ranked): 1st=100, 2nd=80, 3rd=60, etc.
       - Recommendation type: explicit=100, ranked=85, listed=60, mentioned=40
       - Take the higher of position or recommendation score
    2. Apply sentiment modifier
    3. Weight by prompt importance
    4. Aggregate across all prompts and normalize to 0-100
    """

    def __init__(self, config: ScoringConfig | None = None):
        self.config = config or ScoringConfig()

    def score_mention(self, mention: ParsedMention) -> float:
        """
        Calculate score for a single mention.

        Takes the higher of position score or recommendation type score,
        then applies sentiment modifier.
        """
        # Get position score
        position_score = 0.0
        if mention.position and mention.position in self.config.position_scores:
            position_score = self.config.position_scores[mention.position]
        elif mention.position and mention.position > 5:
            # Diminishing returns for positions > 5
            position_score = max(10, 20 - (mention.position - 5) * 2)

        # Get recommendation type score
        rec_score = self.config.recommendation_scores.get(
            mention.recommendation_type, 0
        )

        # Take the higher base score
        base_score = max(position_score, rec_score)

        # Apply sentiment modifier
        sentiment_mod = self.config.sentiment_modifiers.get(
            mention.sentiment, 1.0
        )

        # Apply confidence as a modifier
        confidence_mod = 0.5 + (mention.confidence * 0.5)  # Range: 0.5 to 1.0

        # Cap at 100 to stay within valid score range
        return min(100.0, base_score * sentiment_mod * confidence_mod)

    def score_prompt_for_entity(
        self,
        entity_name: str,
        mentions: list[ParsedMention],
        prompt_id: str,
        provider: str,
        prompt_weight: float = 1.0,
    ) -> EntityPromptScore:
        """
        Calculate score for an entity from a single prompt's response.

        Args:
            entity_name: The entity to score
            mentions: All mentions extracted from the response
            prompt_id: ID of the prompt template
            provider: AI provider that generated the response
            prompt_weight: Weight multiplier for this prompt

        Returns:
            EntityPromptScore with raw and weighted scores
        """
        # Find mention of this entity
        entity_lower = entity_name.lower()
        entity_mention = None

        for mention in mentions:
            if mention.normalized_name == entity_lower:
                entity_mention = mention
                break
            # Also check for partial matches
            if entity_lower in mention.normalized_name or mention.normalized_name in entity_lower:
                entity_mention = mention
                break

        if entity_mention:
            raw_score = self.score_mention(entity_mention)
            return EntityPromptScore(
                entity_name=entity_name,
                prompt_id=prompt_id,
                provider=provider,
                raw_score=raw_score,
                weighted_score=raw_score * prompt_weight,
                prompt_weight=prompt_weight,
                position=entity_mention.position,
                recommendation_type=entity_mention.recommendation_type,
                context=entity_mention.context,
            )

        # Entity not mentioned
        return EntityPromptScore(
            entity_name=entity_name,
            prompt_id=prompt_id,
            provider=provider,
            raw_score=0,
            weighted_score=0,
            prompt_weight=prompt_weight,
            position=None,
            recommendation_type=RecommendationType.NOT_MENTIONED,
            context="",
        )

    def aggregate_scores(
        self,
        entity_name: str,
        entity_id: str,
        prompt_scores: list[EntityPromptScore],
    ) -> ARIScore:
        """
        Aggregate prompt scores into final ARI score.

        Args:
            entity_name: Name of the entity
            entity_id: UUID of the entity
            prompt_scores: All prompt scores for this entity

        Returns:
            Complete ARIScore with breakdowns
        """
        if not prompt_scores:
            return self._empty_score(entity_name, entity_id)

        # Calculate totals
        total_weighted = sum(ps.weighted_score for ps in prompt_scores)
        total_weight = sum(ps.prompt_weight for ps in prompt_scores)

        # Max possible = 100 * total weight
        max_possible = total_weight * 100

        # Normalize to 0-100
        overall_score = (total_weighted / max_possible * 100) if max_possible > 0 else 0

        # Group by provider
        provider_scores: dict[str, list[EntityPromptScore]] = {}
        for ps in prompt_scores:
            provider = ps.provider
            if provider not in provider_scores:
                provider_scores[provider] = []
            provider_scores[provider].append(ps)

        # Calculate per-provider scores
        provider_details = []
        provider_scores_dict = {}

        for provider, scores in provider_scores.items():
            provider_weighted = sum(s.weighted_score for s in scores)
            provider_weight = sum(s.prompt_weight for s in scores)
            provider_max = provider_weight * 100

            provider_ari = (provider_weighted / provider_max * 100) if provider_max > 0 else 0

            # Count mentions
            mentions = [s for s in scores if s.recommendation_type != RecommendationType.NOT_MENTIONED]
            positions = [s.position for s in mentions if s.position]
            avg_position = sum(positions) / len(positions) if positions else None

            provider_details.append(
                ProviderScore(
                    provider=provider,
                    score=round(provider_ari, 1),
                    mentions_count=len(mentions),
                    prompts_evaluated=len(scores),
                    average_position=round(avg_position, 1) if avg_position else None,
                )
            )
            provider_scores_dict[provider] = round(provider_ari, 1)

        # Calculate mention rate
        total_prompts = len(prompt_scores)
        mentions_count = len([
            ps for ps in prompt_scores
            if ps.recommendation_type != RecommendationType.NOT_MENTIONED
        ])
        mention_rate = mentions_count / total_prompts if total_prompts > 0 else 0

        return ARIScore(
            entity_id=entity_id,
            entity_name=entity_name,
            overall_score=round(overall_score, 1),
            provider_scores=provider_scores_dict,
            provider_details=provider_details,
            prompt_scores=prompt_scores,
            mentions_count=mentions_count,
            total_prompts=total_prompts,
            mention_rate=round(mention_rate, 3),
            sample_responses=[],  # Populated separately
        )

    def _empty_score(self, entity_name: str, entity_id: str) -> ARIScore:
        """Create an empty score for when no data is available."""
        return ARIScore(
            entity_id=entity_id,
            entity_name=entity_name,
            overall_score=0,
            provider_scores={},
            provider_details=[],
            prompt_scores=[],
            mentions_count=0,
            total_prompts=0,
            mention_rate=0,
            sample_responses=[],
        )


# Singleton instance
_scoring_engine: ScoringEngine | None = None


def get_scoring_engine() -> ScoringEngine:
    """Get the scoring engine instance."""
    global _scoring_engine
    if _scoring_engine is None:
        _scoring_engine = ScoringEngine()
    return _scoring_engine
