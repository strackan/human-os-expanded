"""Anti-pattern detector and gap analysis engine.

Implements the Fancy Robot spec's Section 7: 10 named anti-patterns
and a priority-scored gap analysis framework. All detection is rules-based
(deterministic, no LLM needed).
"""

import logging

from app.models.audit import (
    AntiPatternType,
    AuditAnalysisResult,
    AuditPromptDimension,
    BrandProfile,
    DetectedAntiPattern,
    GapAnalysis,
    GapType,
    PromptAnalysisResult,
)

logger = logging.getLogger(__name__)

# Anti-pattern display names and descriptions
ANTI_PATTERN_NAMES = {
    AntiPatternType.KLEENEX_EFFECT: "The Kleenex Effect",
    AntiPatternType.PREMIUM_TAX: "The Premium Tax",
    AntiPatternType.MESSY_MIDDLE: "The Messy Middle",
    AntiPatternType.FOUNDER_INVISIBILITY: "Founder Invisibility",
    AntiPatternType.AWARD_AMNESIA: "Award Amnesia",
    AntiPatternType.NAME_FRAGMENTATION: "Name Fragmentation",
    AntiPatternType.DUAL_CATEGORY_TRAP: "The Dual-Category Trap",
    AntiPatternType.SOCIAL_PROOF_NOT_AI_PROOF: "Social Proof ≠ AI Proof",
    AntiPatternType.PORTFOLIO_ISOLATION: "Portfolio Isolation",
    AntiPatternType.AFFILIATE_DISTORTION: "Affiliate Distortion",
}


class AntiPatternDetector:
    """Detects anti-patterns and generates gap analysis from audit results."""

    def detect(
        self,
        profile: BrandProfile,
        analysis: AuditAnalysisResult,
        results: list[PromptAnalysisResult],
    ) -> tuple[list[DetectedAntiPattern], list[GapAnalysis]]:
        """Run all anti-pattern detections and gap analysis.

        Returns (anti_patterns, gaps) tuple.
        """
        anti_patterns: list[DetectedAntiPattern] = []

        anti_patterns.extend(self._detect_kleenex_effect(profile, analysis))
        anti_patterns.extend(self._detect_premium_tax(results))
        anti_patterns.extend(self._detect_messy_middle(analysis, results))
        anti_patterns.extend(self._detect_founder_invisibility(analysis))
        anti_patterns.extend(self._detect_award_amnesia(profile, results))
        anti_patterns.extend(self._detect_name_fragmentation(profile, results))
        anti_patterns.extend(self._detect_dual_category_trap(profile, analysis))
        anti_patterns.extend(self._detect_social_proof_not_ai(profile, analysis))
        anti_patterns.extend(self._detect_portfolio_isolation(profile, results))
        anti_patterns.extend(self._detect_affiliate_distortion(analysis, results))

        gaps = self._generate_gap_analysis(profile, analysis, anti_patterns)

        logger.info(
            f"Detected {len(anti_patterns)} anti-patterns and {len(gaps)} gaps"
        )
        return anti_patterns, gaps

    # --- Individual Pattern Detectors ---

    def _detect_kleenex_effect(
        self, profile: BrandProfile, analysis: AuditAnalysisResult
    ) -> list[DetectedAntiPattern]:
        """Any competitor >70% mention rate in category_default dimension."""
        cat_scores = [
            ds for ds in analysis.dimension_scores
            if ds.dimension == AuditPromptDimension.CATEGORY_DEFAULT
        ]

        for comp_name, rate in analysis.competitor_mention_rates.items():
            if rate > 0.70:
                leader = profile.category_leader or comp_name
                return [DetectedAntiPattern(
                    pattern_type=AntiPatternType.KLEENEX_EFFECT,
                    display_name=ANTI_PATTERN_NAMES[AntiPatternType.KLEENEX_EFFECT],
                    severity="critical",
                    evidence=(
                        f"{comp_name} appears in {rate*100:.0f}% of AI responses, "
                        f"dominating the category. {profile.company_name} must compete "
                        f"against this default recommendation."
                    ),
                    recommendation=(
                        f"CREATE content that directly differentiates from {comp_name}. "
                        f"PUBLISH comparison content and unique positioning narratives "
                        f"to break the default association."
                    ),
                )]
        return []

    def _detect_premium_tax(
        self, results: list[PromptAnalysisResult]
    ) -> list[DetectedAntiPattern]:
        """Brand only mentioned with cautionary/mixed sentiment re: price."""
        mentioned = [r for r in results if r.brand_mentioned]
        if not mentioned:
            return []

        cautionary_count = sum(
            1 for r in mentioned
            if r.sentiment in ("cautionary", "mixed")
        )
        total_mentioned = len(mentioned)

        if total_mentioned >= 3 and (cautionary_count / total_mentioned) > 0.5:
            # Check if price/cost language appears
            price_keywords = ["price", "cost", "expensive", "premium", "pricey", "afford"]
            price_mentions = sum(
                1 for r in mentioned
                if any(kw in r.context.lower() for kw in price_keywords)
            )
            if price_mentions >= 2:
                return [DetectedAntiPattern(
                    pattern_type=AntiPatternType.PREMIUM_TAX,
                    display_name=ANTI_PATTERN_NAMES[AntiPatternType.PREMIUM_TAX],
                    severity="high",
                    evidence=(
                        f"{cautionary_count} of {total_mentioned} mentions include "
                        f"cautionary sentiment, often related to pricing. AI models "
                        f"perceive the brand as expensive relative to alternatives."
                    ),
                    recommendation=(
                        "PUBLISH value-focused content emphasizing ROI and total cost of "
                        "ownership. CREATE comparison guides that reframe the price conversation."
                    ),
                )]
        return []

    def _detect_messy_middle(
        self, analysis: AuditAnalysisResult, results: list[PromptAnalysisResult]
    ) -> list[DetectedAntiPattern]:
        """Brand avg position 4-7 across prompts, never top-2."""
        mentioned = [r for r in results if r.brand_mentioned and r.position]
        if len(mentioned) < 3:
            return []

        positions = [r.position for r in mentioned]
        avg_pos = sum(positions) / len(positions)
        min_pos = min(positions)

        if 4 <= avg_pos <= 7 and min_pos > 2:
            return [DetectedAntiPattern(
                pattern_type=AntiPatternType.MESSY_MIDDLE,
                display_name=ANTI_PATTERN_NAMES[AntiPatternType.MESSY_MIDDLE],
                severity="high",
                evidence=(
                    f"Average position is {avg_pos:.1f} with best position at #{min_pos}. "
                    f"The brand is recognized but never recommended first — stuck in "
                    f"the 'messy middle' of AI recommendations."
                ),
                recommendation=(
                    "STRENGTHEN top-of-mind positioning through authoritative content. "
                    "TARGET specific dimensions where position improvement is most feasible."
                ),
            )]
        return []

    def _detect_founder_invisibility(
        self, analysis: AuditAnalysisResult
    ) -> list[DetectedAntiPattern]:
        """Founder retrieval score < 20."""
        if analysis.founder_retrieval < 20:
            return [DetectedAntiPattern(
                pattern_type=AntiPatternType.FOUNDER_INVISIBILITY,
                display_name=ANTI_PATTERN_NAMES[AntiPatternType.FOUNDER_INVISIBILITY],
                severity="high",
                evidence=(
                    f"Founder retrieval score is {analysis.founder_retrieval:.0f}/100. "
                    f"AI models cannot identify the company's leadership, missing "
                    f"a key trust signal."
                ),
                recommendation=(
                    "PUBLISH founder profiles, interviews, and thought leadership content. "
                    "ENSURE founder information is prominent on the website and in press."
                ),
            )]
        return []

    def _detect_award_amnesia(
        self, profile: BrandProfile, results: list[PromptAnalysisResult]
    ) -> list[DetectedAntiPattern]:
        """Profile has awards but AI responses never cite them."""
        if not profile.awards:
            return []

        # Check if any award keywords appear in responses
        award_keywords = [a.lower()[:20] for a in profile.awards[:5]]
        award_found = False
        for r in results:
            if r.brand_mentioned:
                response_lower = r.raw_response.lower()
                if any(kw in response_lower for kw in award_keywords):
                    award_found = True
                    break

        if not award_found:
            return [DetectedAntiPattern(
                pattern_type=AntiPatternType.AWARD_AMNESIA,
                display_name=ANTI_PATTERN_NAMES[AntiPatternType.AWARD_AMNESIA],
                severity="medium",
                evidence=(
                    f"The brand has {len(profile.awards)} awards/certifications, "
                    f"but none appear in AI responses. AI models are unaware of "
                    f"these credibility signals."
                ),
                recommendation=(
                    "INTEGRATE award mentions into website copy, press releases, and "
                    "structured data. PUBLISH content that references specific awards."
                ),
            )]
        return []

    def _detect_name_fragmentation(
        self, profile: BrandProfile, results: list[PromptAnalysisResult]
    ) -> list[DetectedAntiPattern]:
        """Brand aliases appear as separate entities in responses."""
        if not profile.aliases:
            return []

        alias_mentions = 0
        for r in results:
            if r.raw_response:
                response_lower = r.raw_response.lower()
                for alias in profile.aliases:
                    if alias.lower() in response_lower and profile.company_name.lower() not in response_lower:
                        alias_mentions += 1
                        break

        if alias_mentions >= 2:
            return [DetectedAntiPattern(
                pattern_type=AntiPatternType.NAME_FRAGMENTATION,
                display_name=ANTI_PATTERN_NAMES[AntiPatternType.NAME_FRAGMENTATION],
                severity="medium",
                evidence=(
                    f"Brand aliases ({', '.join(profile.aliases[:3])}) appear as separate "
                    f"entities in {alias_mentions} responses. AI models don't recognize "
                    f"these as the same company."
                ),
                recommendation=(
                    "CONSOLIDATE brand naming across all digital presence. "
                    "ENSURE consistent use of the primary brand name in all content."
                ),
            )]
        return []

    def _detect_dual_category_trap(
        self, profile: BrandProfile, analysis: AuditAnalysisResult
    ) -> list[DetectedAntiPattern]:
        """Brand profile has 2+ categories but only appears in 1."""
        if not profile.adjacent_categories or len(profile.adjacent_categories) < 2:
            return []

        # Check if adjacent category dimension has very low scores
        adj_score = None
        for ds in analysis.dimension_scores:
            if ds.dimension == AuditPromptDimension.ADJACENT_CATEGORY:
                adj_score = ds
                break

        if adj_score and adj_score.mention_rate < 0.15:
            return [DetectedAntiPattern(
                pattern_type=AntiPatternType.DUAL_CATEGORY_TRAP,
                display_name=ANTI_PATTERN_NAMES[AntiPatternType.DUAL_CATEGORY_TRAP],
                severity="medium",
                evidence=(
                    f"The brand operates in multiple categories "
                    f"({', '.join(profile.adjacent_categories[:3])}) but is only "
                    f"recognized in the primary category. Adjacent category mention "
                    f"rate is {adj_score.mention_rate*100:.0f}%."
                ),
                recommendation=(
                    "CREATE cross-category content that bridges the primary category "
                    "with adjacent ones. PUBLISH thought leadership spanning categories."
                ),
            )]
        return []

    def _detect_social_proof_not_ai(
        self, profile: BrandProfile, analysis: AuditAnalysisResult
    ) -> list[DetectedAntiPattern]:
        """Profile indicates strong social/sales, but mention_frequency < 30."""
        # Heuristic: if the company has awards, press, and good differentiators
        # but AI still doesn't mention them
        has_strong_signals = (
            len(profile.awards) >= 2
            or len(profile.press_mentions) >= 2
            or len(profile.differentiators) >= 3
        )

        if has_strong_signals and analysis.mention_frequency < 30:
            return [DetectedAntiPattern(
                pattern_type=AntiPatternType.SOCIAL_PROOF_NOT_AI_PROOF,
                display_name=ANTI_PATTERN_NAMES[AntiPatternType.SOCIAL_PROOF_NOT_AI_PROOF],
                severity="high",
                evidence=(
                    f"Despite strong offline signals (awards, press, differentiators), "
                    f"the brand is only mentioned in {analysis.mention_frequency:.0f}% of "
                    f"AI responses. Traditional credibility isn't translating to AI visibility."
                ),
                recommendation=(
                    "BRIDGE the gap between offline reputation and AI training data. "
                    "PUBLISH digital content that mirrors your offline strengths. "
                    "ENSURE structured data and authoritative citations online."
                ),
            )]
        return []

    def _detect_portfolio_isolation(
        self, profile: BrandProfile, results: list[PromptAnalysisResult]
    ) -> list[DetectedAntiPattern]:
        """Profile has sibling brands, AI doesn't connect them."""
        if not profile.sibling_brands:
            return []

        sibling_mentioned = False
        for r in results:
            if r.brand_mentioned:
                response_lower = r.raw_response.lower()
                for sibling in profile.sibling_brands:
                    if sibling.lower() in response_lower:
                        sibling_mentioned = True
                        break
            if sibling_mentioned:
                break

        if not sibling_mentioned:
            return [DetectedAntiPattern(
                pattern_type=AntiPatternType.PORTFOLIO_ISOLATION,
                display_name=ANTI_PATTERN_NAMES[AntiPatternType.PORTFOLIO_ISOLATION],
                severity="low",
                evidence=(
                    f"Sibling brands ({', '.join(profile.sibling_brands[:3])}) are never "
                    f"mentioned alongside the primary brand. AI models treat them as "
                    f"completely separate entities."
                ),
                recommendation=(
                    "CREATE content that connects portfolio brands. PUBLISH company "
                    "pages that highlight the brand family and shared expertise."
                ),
            )]
        return []

    def _detect_affiliate_distortion(
        self, analysis: AuditAnalysisResult, results: list[PromptAnalysisResult]
    ) -> list[DetectedAntiPattern]:
        """Low-quality competitors outrank in roundup-style prompts."""
        # Check category_default dimension: if brand mention rate is very low
        # but competitors are high, it suggests affiliate/SEO-driven distortion
        cat_dim = None
        for ds in analysis.dimension_scores:
            if ds.dimension == AuditPromptDimension.CATEGORY_DEFAULT:
                cat_dim = ds
                break

        if not cat_dim or cat_dim.mention_rate > 0.3:
            return []

        # Check if any competitor has significantly higher rates
        high_comp_count = sum(
            1 for rate in analysis.competitor_mention_rates.values()
            if rate > 0.6
        )

        if high_comp_count >= 2 and cat_dim.mention_rate < 0.15:
            return [DetectedAntiPattern(
                pattern_type=AntiPatternType.AFFILIATE_DISTORTION,
                display_name=ANTI_PATTERN_NAMES[AntiPatternType.AFFILIATE_DISTORTION],
                severity="medium",
                evidence=(
                    f"Multiple competitors have >60% mention rates while the brand "
                    f"has only {cat_dim.mention_rate*100:.0f}% in category prompts. "
                    f"This may indicate affiliate/SEO content driving AI training bias."
                ),
                recommendation=(
                    "PUBLISH authoritative, non-commercial content to compete with "
                    "affiliate-driven narratives. CREATE expert-level comparison "
                    "content that positions the brand fairly."
                ),
            )]
        return []

    # --- Gap Analysis ---

    def _generate_gap_analysis(
        self,
        profile: BrandProfile,
        analysis: AuditAnalysisResult,
        anti_patterns: list[DetectedAntiPattern],
    ) -> list[GapAnalysis]:
        """Generate priority-scored gap analysis from audit results."""
        gaps: list[GapAnalysis] = []

        # Content gaps: low mention rate in specific dimensions
        for ds in analysis.dimension_scores:
            if ds.mention_rate < 0.3:
                impact = 1.0 - ds.mention_rate
                effort = 0.4  # Content creation is medium effort
                coverage = DIMENSION_WEIGHTS.get(ds.dimension, 0.1)

                gaps.append(GapAnalysis(
                    gap_type=GapType.CONTENT,
                    description=(
                        f"Low visibility in {ds.dimension.value} dimension "
                        f"({ds.mention_rate*100:.0f}% mention rate)"
                    ),
                    impact=impact,
                    effort=effort,
                    coverage=coverage,
                    priority_score=impact * coverage / effort,
                    recommendation=(
                        f"Create targeted content for the {ds.dimension.value} "
                        f"dimension to improve AI visibility."
                    ),
                ))

        # Narrative gaps: low narrative accuracy
        if analysis.narrative_accuracy < 50:
            gaps.append(GapAnalysis(
                gap_type=GapType.NARRATIVE,
                description=(
                    f"AI models describe the brand inaccurately "
                    f"(accuracy score: {analysis.narrative_accuracy:.0f}/100)"
                ),
                impact=0.8,
                effort=0.5,
                coverage=0.6,
                priority_score=0.8 * 0.6 / 0.5,
                recommendation=(
                    "Publish clear, factual content about products, history, and "
                    "differentiators to correct AI model narratives."
                ),
            ))

        # Competitive gaps: competitors dominate
        for comp_name, rate in analysis.competitor_mention_rates.items():
            brand_rate = analysis.mention_frequency / 100
            if rate > brand_rate * 2 and rate > 0.5:
                gaps.append(GapAnalysis(
                    gap_type=GapType.COMPETITIVE,
                    description=(
                        f"{comp_name} has {rate*100:.0f}% mention rate vs "
                        f"brand's {analysis.mention_frequency:.0f}%"
                    ),
                    impact=0.7,
                    effort=0.6,
                    coverage=0.4,
                    priority_score=0.7 * 0.4 / 0.6,
                    recommendation=(
                        f"Create direct comparison content against {comp_name}. "
                        f"Highlight unique differentiators that {comp_name} lacks."
                    ),
                ))

        # Structural gaps: from anti-patterns
        for ap in anti_patterns:
            if ap.severity in ("critical", "high"):
                gaps.append(GapAnalysis(
                    gap_type=GapType.STRUCTURAL,
                    description=f"{ap.display_name}: {ap.evidence[:100]}",
                    impact=0.9 if ap.severity == "critical" else 0.7,
                    effort=0.7,
                    coverage=0.5,
                    priority_score=(0.9 if ap.severity == "critical" else 0.7) * 0.5 / 0.7,
                    recommendation=ap.recommendation,
                ))

        # Sort by priority score descending
        gaps.sort(key=lambda g: g.priority_score, reverse=True)
        return gaps


# Import weights for gap analysis
from app.services.audit_prompt_generator import DIMENSION_WEIGHTS
