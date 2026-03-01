"""Shared LLM utility functions."""

import json


def extract_json(text: str) -> dict:
    """Extract JSON object from LLM text that may have markdown fences."""
    text = text.strip()
    if text.startswith("```json"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    return json.loads(text.strip())


def extract_json_list(text: str) -> list[dict]:
    """Extract a JSON array from LLM text that may have markdown fences."""
    text = text.strip()
    if text.startswith("```json"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    return json.loads(text.strip())
