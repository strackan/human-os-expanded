"""LLM-based response parser for extracting structured data from AI responses."""

import json
from typing import Any

from app.models.response import ParsedMention, RecommendationType, Sentiment
from app.services.ai_providers.openai_provider import OpenAIProvider


EXTRACTION_PROMPT = """Analyze this AI response and extract all entities (companies, people, products) mentioned as recommendations or options.

## Original Query
{query}

## AI Response
{response}

## Target Entity Type
{entity_type}

## Known Entities to Look For
{known_entities}

## Instructions
1. Extract ALL entities mentioned, not just known ones
2. Determine their position in the response (1 = first mentioned, 2 = second, etc.)
3. Classify how they were mentioned:
   - "explicit": AI explicitly recommends this ("I recommend...", "You should use...")
   - "ranked": Part of a ranked list ("The top 3 are...", "#1...")
   - "listed": Mentioned as an option without ranking
   - "mentioned": Just referenced without recommendation
4. Assess sentiment: positive, neutral, mixed, cautionary, negative
5. Include the surrounding context (1-2 sentences)

Return ONLY valid JSON in this exact format:
{{
  "entities": [
    {{
      "name": "Entity Name",
      "normalized_name": "entity name",
      "position": 1,
      "recommendation_type": "explicit|ranked|listed|mentioned",
      "sentiment": "positive|neutral|mixed|cautionary|negative",
      "context": "The surrounding sentence(s) where mentioned",
      "confidence": 0.95
    }}
  ],
  "response_quality": "complete|partial|evasive|declined"
}}

If no entities are found, return: {{"entities": [], "response_quality": "declined"}}"""


class ResponseParser:
    """Parse AI responses to extract structured entity mentions."""

    def __init__(self, parser_provider: OpenAIProvider | None = None):
        """
        Initialize the parser.

        Args:
            parser_provider: OpenAI provider for parsing (uses gpt-4o-mini by default)
        """
        self.provider = parser_provider

    async def parse(
        self,
        query: str,
        response: str,
        entity_type: str,
        known_entities: list[str] | None = None,
    ) -> list[ParsedMention]:
        """
        Parse an AI response to extract entity mentions.

        Args:
            query: The original prompt that generated this response
            response: The raw AI response text
            entity_type: Type of entities to look for (person, company, product)
            known_entities: Optional list of known entity names to prioritize

        Returns:
            List of ParsedMention objects
        """
        if not self.provider:
            # Fallback to simple extraction if no provider configured
            return self._simple_extract(response, known_entities or [])

        # Build the extraction prompt
        extraction_prompt = EXTRACTION_PROMPT.format(
            query=query,
            response=response,
            entity_type=entity_type,
            known_entities=", ".join(known_entities or ["None specified"]),
        )

        # Query the parser model
        parser_response = await self.provider.query(extraction_prompt)

        if not parser_response.success:
            # Fallback to simple extraction on error
            return self._simple_extract(response, known_entities or [])

        # Parse the JSON response
        try:
            data = self._extract_json(parser_response.text)
            return self._parse_extraction_result(data)
        except (json.JSONDecodeError, KeyError, ValueError):
            # Fallback to simple extraction on parse error
            return self._simple_extract(response, known_entities or [])

    def _extract_json(self, text: str) -> dict[str, Any]:
        """Extract JSON from text that may have markdown formatting."""
        # Try to find JSON in the response
        text = text.strip()

        # Remove markdown code blocks if present
        if text.startswith("```json"):
            text = text[7:]
        elif text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]

        return json.loads(text.strip())

    def _parse_extraction_result(self, data: dict[str, Any]) -> list[ParsedMention]:
        """Convert extraction result to ParsedMention objects."""
        mentions = []

        for entity in data.get("entities", []):
            # Map recommendation type string to enum
            rec_type_str = entity.get("recommendation_type", "mentioned")
            try:
                rec_type = RecommendationType(rec_type_str)
            except ValueError:
                rec_type = RecommendationType.MENTIONED

            # Map sentiment string to enum
            sentiment_str = entity.get("sentiment", "neutral")
            try:
                sentiment = Sentiment(sentiment_str)
            except ValueError:
                sentiment = Sentiment.NEUTRAL

            mentions.append(
                ParsedMention(
                    entity_name=entity.get("name", "Unknown"),
                    normalized_name=entity.get("normalized_name", entity.get("name", "").lower()),
                    position=entity.get("position"),
                    recommendation_type=rec_type,
                    sentiment=sentiment,
                    context=entity.get("context", ""),
                    confidence=entity.get("confidence", 0.8),
                )
            )

        return mentions

    def _simple_extract(
        self,
        response: str,
        known_entities: list[str],
    ) -> list[ParsedMention]:
        """
        Simple extraction without LLM - just check for known entity names.

        This is a fallback when the parser model isn't available.
        """
        mentions = []
        response_lower = response.lower()

        for i, entity in enumerate(known_entities):
            if entity.lower() in response_lower:
                # Find position in response
                pos = response_lower.find(entity.lower())

                # Extract context (100 chars around mention)
                start = max(0, pos - 50)
                end = min(len(response), pos + len(entity) + 50)
                context = response[start:end]

                mentions.append(
                    ParsedMention(
                        entity_name=entity,
                        normalized_name=entity.lower(),
                        position=i + 1,  # Simple ordering by known_entities list
                        recommendation_type=RecommendationType.MENTIONED,
                        sentiment=Sentiment.NEUTRAL,
                        context=f"...{context}...",
                        confidence=0.6,  # Lower confidence for simple extraction
                    )
                )

        return mentions


def get_parser(api_key: str | None = None) -> ResponseParser:
    """Factory function to create a parser with optional API key."""
    if api_key:
        # Use gpt-4o-mini for fast, cheap parsing
        provider = OpenAIProvider(api_key=api_key, model="gpt-4o-mini")
        return ResponseParser(parser_provider=provider)
    return ResponseParser()
