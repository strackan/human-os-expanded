"""Publication Viability Index (PVI) scoring engine.

Computes a 0-100 absolute quality score per publication that blends:
  - Empirical score: based on validated placement outcomes (success_rate + gumshoe bonus)
  - Reputation score: based on DA, DR, AI score, citation count

A confidence ramp shifts weight from reputation → empirical as placement
outcomes accumulate (0 outcomes = pure reputation, 10+ = pure empirical).
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field

from app.models.publications import ArticlePublication, PlacementStatus, Publication

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

CONFIDENCE_THRESHOLD = 10  # placements needed for full empirical weight

# Reputation sub-weights (sum to 1.0)
WEIGHT_DA = 0.30
WEIGHT_DR = 0.25
WEIGHT_AI = 0.25
WEIGHT_CIT = 0.20

# Normalization caps
MAX_DA = 100
MAX_DR = 100
MAX_AI_SCORE = 100
MAX_CITATIONS_NORM = 50  # citations above 50 all map to 100

# Gumshoe bonus
GUMSHOE_HIT_BONUS_MAX = 15  # max bonus points for gumshoe-confirmed placements

# Neutral default for missing metrics
NEUTRAL = 50.0


# ---------------------------------------------------------------------------
# Result dataclass
# ---------------------------------------------------------------------------

@dataclass
class ViabilityBreakdown:
    """Full decomposition of a PVI score."""
    viability_score: float
    confidence: float
    empirical_score: float
    reputation_score: float
    empirical_weight: float
    reputation_weight: float

    # Empirical components
    success_rate: float
    validated_hits: int
    total_attempts: int
    gumshoe_confirmed: int
    gumshoe_bonus: float

    # Reputation components
    da_normalized: float
    dr_normalized: float
    ai_normalized: float
    cit_normalized: float

    # Source info
    is_gumshoe: bool
    source_lists: list[str] = field(default_factory=list)


# ---------------------------------------------------------------------------
# Engine
# ---------------------------------------------------------------------------

class PublicationViabilityEngine:
    """Stateless scoring engine for Publication Viability Index."""

    def compute_viability(
        self,
        pub: Publication,
        placements: list[ArticlePublication],
        is_gumshoe: bool = False,
    ) -> ViabilityBreakdown:
        """Compute PVI for a single publication given its placement history."""
        # Count outcomes
        terminal = [p for p in placements if p.status in (PlacementStatus.PUBLISHED, PlacementStatus.REJECTED)]
        total_attempts = len(terminal)
        validated_hits = sum(1 for p in terminal if p.status == PlacementStatus.PUBLISHED)

        # Gumshoe-confirmed: published placements where the publication is on the gumshoe list
        gumshoe_confirmed = validated_hits if is_gumshoe else 0

        # Empirical
        empirical_score, gumshoe_bonus = self.compute_empirical_score(
            validated_hits, total_attempts, gumshoe_confirmed,
        )

        # Reputation
        reputation_score, da_n, dr_n, ai_n, cit_n = self.compute_reputation_score(pub)

        # Confidence ramp
        confidence = min(1.0, total_attempts / CONFIDENCE_THRESHOLD)

        # Blend
        pvi = confidence * empirical_score + (1.0 - confidence) * reputation_score
        pvi = round(min(115.0, max(0.0, pvi)), 2)  # cap at 115 (100 + 15 bonus)

        success_rate = (validated_hits / total_attempts) if total_attempts > 0 else 0.0

        return ViabilityBreakdown(
            viability_score=pvi,
            confidence=round(confidence, 3),
            empirical_score=round(empirical_score, 2),
            reputation_score=round(reputation_score, 2),
            empirical_weight=round(confidence, 3),
            reputation_weight=round(1.0 - confidence, 3),
            success_rate=round(success_rate, 4),
            validated_hits=validated_hits,
            total_attempts=total_attempts,
            gumshoe_confirmed=gumshoe_confirmed,
            gumshoe_bonus=round(gumshoe_bonus, 2),
            da_normalized=round(da_n, 2),
            dr_normalized=round(dr_n, 2),
            ai_normalized=round(ai_n, 2),
            cit_normalized=round(cit_n, 2),
            is_gumshoe=is_gumshoe,
            source_lists=list(pub.source_lists),
        )

    def compute_empirical_score(
        self,
        validated_hits: int,
        total_attempts: int,
        gumshoe_confirmed: int,
    ) -> tuple[float, float]:
        """Compute empirical score from placement outcomes.

        Returns (empirical_score, gumshoe_bonus).
        """
        if total_attempts == 0:
            return 0.0, 0.0

        success_rate = validated_hits / total_attempts
        base = success_rate * 100.0

        # Gumshoe bonus: up to 15 pts for gumshoe-confirmed hits
        if validated_hits > 0 and gumshoe_confirmed > 0:
            gumshoe_bonus = min(
                GUMSHOE_HIT_BONUS_MAX,
                (gumshoe_confirmed / validated_hits) * GUMSHOE_HIT_BONUS_MAX,
            )
        else:
            gumshoe_bonus = 0.0

        return base + gumshoe_bonus, gumshoe_bonus

    def compute_reputation_score(
        self, pub: Publication,
    ) -> tuple[float, float, float, float, float]:
        """Compute reputation score from publication metadata.

        Returns (reputation_score, da_norm, dr_norm, ai_norm, cit_norm).
        """
        da_n = self._normalize(pub.domain_authority, MAX_DA)
        dr_n = self._normalize(pub.domain_rating, MAX_DR)
        ai_n = self._normalize(pub.ai_score, MAX_AI_SCORE)
        cit_n = self._normalize(pub.citation_count, MAX_CITATIONS_NORM)

        score = (
            da_n * WEIGHT_DA
            + dr_n * WEIGHT_DR
            + ai_n * WEIGHT_AI
            + cit_n * WEIGHT_CIT
        )
        return score, da_n, dr_n, ai_n, cit_n

    @staticmethod
    def _normalize(value: int | float | None, max_val: float) -> float:
        """Normalize a metric to 0-100, defaulting None to NEUTRAL."""
        if value is None:
            return NEUTRAL
        return min(100.0, max(0.0, (float(value) / max_val) * 100.0))


# ---------------------------------------------------------------------------
# Singleton
# ---------------------------------------------------------------------------

_engine: PublicationViabilityEngine | None = None


def get_viability_engine() -> PublicationViabilityEngine:
    global _engine
    if _engine is None:
        _engine = PublicationViabilityEngine()
    return _engine
