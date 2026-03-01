"""Testing endpoints for entity analysis and quick tests.

These are internal/demo endpoints used during development — not part of the
public lite-report pipeline.
"""

import asyncio
import json
import re

from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from app.config import get_settings

router = APIRouter()
settings = get_settings()


def _find_entity_position(text: str, entity: str) -> int | None:
    """Find entity's position in a ranked list, or None if not mentioned."""
    entity_lower = entity.lower().replace(" ", "")
    text_lower = text.lower()

    if entity_lower not in text_lower.replace(" ", "") and entity.lower() not in text_lower:
        return None

    lines = text.split('\n')
    for line in lines:
        line_normalized = line.lower().replace(" ", "")
        if entity_lower in line_normalized or entity.lower() in line.lower():
            match = re.match(r'^\s*[#*\-]?\s*(\d+)[.\):]', line)
            if match:
                return int(match.group(1))
            ordinals = {"first": 1, "second": 2, "third": 3, "fourth": 4, "fifth": 5,
                       "sixth": 6, "seventh": 7, "eighth": 8, "ninth": 9, "tenth": 10}
            for word, pos in ordinals.items():
                if word in line.lower():
                    return pos
    return 0  # Mentioned but position unclear


def _build_questions(entity_name: str, entity_type: str, list_size: int) -> tuple[list[str], bool]:
    """Build question list based on entity type and list size.

    Returns (questions, is_person).
    """
    known_people = ["Rick Smith", "Dorothy York"]
    is_person = entity_type == "person" or (entity_type == "auto" and entity_name in known_people)

    if is_person:
        if list_size == 1:
            q_prefix = "Who is the single person you'd most recommend"
        else:
            q_prefix = f"Who are the top {list_size} people you'd most recommend"

        questions = [
            f"{q_prefix} following for insights on content syndication and newspaper publishing?",
            f"If I wanted to learn about placing sponsored content in newspapers, {q_prefix.lower()} as a thought leader?",
            f"{q_prefix} as an expert in the news content distribution industry?",
            f"Who are the leading voices in the content syndication industry for newspapers?",
            f"{q_prefix} for advice on getting editorial-style content placed in local newspapers?",
        ]
    else:
        if list_size == 1:
            q_prefix = "What is the single company you'd most recommend"
        else:
            q_prefix = f"What are the top {list_size} companies you'd most recommend"

        questions = [
            f"{q_prefix} for placing articles in newspapers?",
            f"If talking to a PR Agency, {q_prefix.lower()} for placing articles in newspapers?",
            f"{q_prefix} for getting sponsored articles placed in local newspapers?",
            f"If talking to a PR agency, {q_prefix.lower()} for getting editorial-style content placed in newspapers?",
            f"If you were helping a PR agency choose a vendor, {q_prefix.lower()} for placing articles in newspapers?",
        ]

    return questions, is_person


@router.get("/entity-test/{entity_name}")
async def entity_test(entity_name: str, list_size: int = 1, entity_type: str = "auto") -> dict:
    """
    Run question battery for a specific entity and calculate ARI score.

    Args:
        entity_name: Entity name to test (e.g., "NewsUSA", "Rick Smith")
        list_size: Number of entities to request (1-10). Default 1
        entity_type: "company", "person", or "auto" (infers from name)
    """
    from app.services.prompt_runner import get_prompt_runner

    runner = get_prompt_runner()
    list_size = max(1, min(10, list_size))

    main_questions, is_person = _build_questions(entity_name, entity_type, list_size)

    followup_template = (
        "Two questions: "
        f"1) Did you consider {entity_name} at any point for this answer? Why or why not? "
        f"2) What related question could I have asked that would have been more likely to be answered as '{entity_name}', and what is the distinction as you see it?"
    )

    async def query_provider(provider_name, provider, prompt):
        try:
            response = await provider.query(prompt)
            return provider_name, response.text, response.model_version
        except Exception as e:
            return provider_name, f"Error: {str(e)}", None

    all_results = []
    total_mentions = 0
    total_questions = len(main_questions) * len(runner.providers)
    position_scores = []

    for main_question in main_questions:
        main_tasks = [
            query_provider(name.value, provider, main_question)
            for name, provider in runner.providers.items()
        ]
        main_responses = await asyncio.gather(*main_tasks)

        followup_tasks = []
        provider_data = []

        for provider_name, content, model in main_responses:
            position = _find_entity_position(content, entity_name)
            mentioned = position is not None

            if mentioned:
                total_mentions += 1
                if position == 0:
                    position_scores.append(50)
                else:
                    position_scores.append(max(0, 100 - (position - 1) * 20))

            provider_info = {
                "provider": provider_name,
                "model": model,
                "response": content,
                "mentioned": mentioned,
                "position": position,
            }
            provider_data.append(provider_info)

            if not mentioned:
                context = f"I asked you: \"{main_question}\"\n\nYou answered: \"{content[:500]}...\"\n\n"
                followup = context + followup_template
                for name, provider in runner.providers.items():
                    if name.value == provider_name:
                        followup_tasks.append((provider_name, query_provider(provider_name, provider, followup)))
                        break

        if followup_tasks:
            followup_results = await asyncio.gather(*[t[1] for t in followup_tasks])
            followup_map = {followup_tasks[i][0]: followup_results[i][1] for i in range(len(followup_tasks))}
        else:
            followup_map = {}

        question_results = {"question": main_question, "responses": {}}
        for info in provider_data:
            result = {
                "model": info["model"],
                "response": info["response"],
                "mentioned": info["mentioned"],
                "position": info["position"],
            }
            if info["provider"] in followup_map:
                result["followup"] = followup_map[info["provider"]]
            question_results["responses"][info["provider"]] = result

        all_results.append(question_results)

    # Calculate aggregate ARI score
    mention_rate = (total_mentions / total_questions * 100) if total_questions > 0 else 0
    avg_position_score = sum(position_scores) / len(position_scores) if position_scores else 0
    ari_score = (mention_rate * 0.4 + avg_position_score * 0.6) if position_scores else mention_rate * 0.4

    return {
        "entity": entity_name,
        "entity_type": "person" if is_person else "company",
        "list_size": list_size,
        "ari_score": round(ari_score, 1),
        "mention_rate": round(mention_rate, 1),
        "mentions": total_mentions,
        "total_questions": total_questions,
        "avg_position_score": round(avg_position_score, 1),
        "providers": [p.value for p in runner.providers.keys()],
        "results": all_results,
    }


@router.get("/entity-test-stream/{entity_name}")
async def entity_test_stream(entity_name: str, list_size: int = 1, entity_type: str = "auto"):
    """
    Streaming version of entity-test that sends progress updates via SSE.
    """
    from app.services.prompt_runner import get_prompt_runner

    async def generate():
        runner = get_prompt_runner()
        list_size_clamped = max(1, min(10, list_size))

        main_questions, is_person = _build_questions(entity_name, entity_type, list_size_clamped)

        followup_template = (
            "Two questions: "
            f"1) Did you consider {entity_name} at any point for this answer? Why or why not? "
            f"2) What related question could I have asked that would have been more likely to be answered as '{entity_name}', and what is the distinction as you see it?"
        )

        provider_names = [p.value for p in runner.providers.keys()]
        total_steps = len(main_questions) * len(provider_names)
        current_step = 0

        # Send initial status
        yield f"data: {json.dumps({'type': 'start', 'total_questions': len(main_questions), 'total_providers': len(provider_names), 'total_steps': total_steps, 'entity': entity_name})}\n\n"

        async def query_provider(provider_name, provider, prompt):
            try:
                response = await provider.query(prompt)
                return provider_name, response.text, response.model_version
            except Exception as e:
                return provider_name, f"Error: {str(e)}", None

        all_results = []
        total_mentions = 0
        total_questions_count = len(main_questions) * len(runner.providers)
        position_scores = []

        for q_idx, main_question in enumerate(main_questions):
            # Send question start
            yield f"data: {json.dumps({'type': 'question_start', 'question_index': q_idx, 'question': main_question[:80] + '...' if len(main_question) > 80 else main_question})}\n\n"

            question_results = {"question": main_question, "responses": {}}
            provider_data = []

            # Query each provider individually to show progress
            for name, provider in runner.providers.items():
                current_step += 1
                yield f"data: {json.dumps({'type': 'progress', 'step': current_step, 'total': total_steps, 'provider': name.value, 'question_index': q_idx, 'message': f'Querying {name.value}...'})}\n\n"

                provider_name, content, model = await query_provider(name.value, provider, main_question)
                position = _find_entity_position(content, entity_name)
                mentioned = position is not None

                if mentioned:
                    total_mentions += 1
                    if position == 0:
                        position_scores.append(50)
                    else:
                        position_scores.append(max(0, 100 - (position - 1) * 20))

                provider_info = {
                    "provider": provider_name,
                    "model": model,
                    "response": content,
                    "mentioned": mentioned,
                    "position": position,
                }
                provider_data.append(provider_info)

                # Send provider complete
                yield f"data: {json.dumps({'type': 'provider_complete', 'provider': provider_name, 'mentioned': mentioned, 'position': position})}\n\n"

            # Handle follow-ups for non-mentioned
            followup_tasks = []
            for info in provider_data:
                if not info["mentioned"]:
                    context = f"I asked you: \"{main_question}\"\n\nYou answered: \"{info['response'][:500]}...\"\n\n"
                    followup = context + followup_template
                    for name, provider in runner.providers.items():
                        if name.value == info["provider"]:
                            followup_tasks.append((info["provider"], query_provider(info["provider"], provider, followup)))
                            break

            if followup_tasks:
                yield f"data: {json.dumps({'type': 'followup_start', 'count': len(followup_tasks)})}\n\n"
                followup_results = await asyncio.gather(*[t[1] for t in followup_tasks])
                followup_map = {followup_tasks[i][0]: followup_results[i][1] for i in range(len(followup_tasks))}
            else:
                followup_map = {}

            for info in provider_data:
                result = {
                    "model": info["model"],
                    "response": info["response"],
                    "mentioned": info["mentioned"],
                    "position": info["position"],
                }
                if info["provider"] in followup_map:
                    result["followup"] = followup_map[info["provider"]]
                question_results["responses"][info["provider"]] = result

            all_results.append(question_results)

            # Send question complete
            yield f"data: {json.dumps({'type': 'question_complete', 'question_index': q_idx})}\n\n"

        # Calculate final scores
        mention_rate = (total_mentions / total_questions_count * 100) if total_questions_count > 0 else 0
        avg_position_score = sum(position_scores) / len(position_scores) if position_scores else 0
        ari_score = (mention_rate * 0.4 + avg_position_score * 0.6) if position_scores else mention_rate * 0.4

        final_result = {
            "type": "complete",
            "entity": entity_name,
            "entity_type": "person" if is_person else "company",
            "list_size": list_size_clamped,
            "ari_score": round(ari_score, 1),
            "mention_rate": round(mention_rate, 1),
            "mentions": total_mentions,
            "total_questions": total_questions_count,
            "avg_position_score": round(avg_position_score, 1),
            "providers": provider_names,
            "results": all_results,
        }

        yield f"data: {json.dumps(final_result)}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


@router.post("/analyze-results")
async def analyze_results(results: dict) -> dict:
    """
    Use Claude Sonnet to analyze entity test results and provide strategic insights.

    Expects results in the format returned by entity-test endpoint.
    """
    from anthropic import AsyncAnthropic

    api_key = settings.anthropic_api_key
    if not api_key:
        return {"error": "Anthropic API key not configured"}

    client = AsyncAnthropic(api_key=api_key)

    entity_name = results.get("entity", "Unknown")
    entity_type = results.get("entity_type", "company")
    ari_score = results.get("ari_score", 0)
    mention_rate = results.get("mention_rate", 0)
    mentions = results.get("mentions", 0)
    total_questions = results.get("total_questions", 0)
    test_results = results.get("results", [])

    # Build structured Q&A summary
    qa_summary = []
    for i, q in enumerate(test_results, 1):
        question = q.get("question", "")
        responses = q.get("responses", {})

        qa_entry = f"Q{i}: {question}\n"
        for provider, resp in responses.items():
            mentioned = "YES" if resp.get("mentioned") else "NO"
            position = f" (Position #{resp.get('position')})" if resp.get("position") else ""
            qa_entry += f"  - {provider.upper()}: {mentioned}{position}\n"
            if resp.get("followup"):
                followup_snippet = resp["followup"][:200] + "..." if len(resp.get("followup", "")) > 200 else resp.get("followup", "")
                qa_entry += f"    Follow-up insight: {followup_snippet}\n"

        qa_summary.append(qa_entry)

    qa_text = "\n".join(qa_summary)

    analysis_prompt = f"""You are an AI visibility strategist analyzing how well a {entity_type} performs in AI recommendations.

## Entity Being Analyzed
**{entity_name}** ({entity_type})

## Test Results Summary
- **ARI Score:** {ari_score}/100
- **Mention Rate:** {mention_rate}%
- **Total Mentions:** {mentions} out of {total_questions} queries
- **AI Models Tested:** OpenAI (GPT-4), Anthropic (Claude), Perplexity, Google Gemini

## Detailed Question Results
{qa_text}

---

Please provide a comprehensive analysis in the following JSON format:

{{
  "executive_summary": "2-3 sentence overview of {entity_name}'s AI visibility performance",

  "score_interpretation": {{
    "rating": "Excellent/Good/Fair/Poor/Critical",
    "context": "What this score means in practical terms"
  }},

  "strengths": [
    "Specific strength 1 with evidence",
    "Specific strength 2 with evidence"
  ],

  "weaknesses": [
    "Specific weakness 1 with evidence",
    "Specific weakness 2 with evidence"
  ],

  "provider_insights": {{
    "best_performer": "Which AI model mentions {entity_name} most, and why that might be",
    "worst_performer": "Which AI model mentions {entity_name} least, and potential reasons",
    "patterns": "Any notable patterns across providers"
  }},

  "recommendations": [
    {{
      "priority": "High/Medium/Low",
      "action": "Specific actionable recommendation",
      "rationale": "Why this would help improve AI visibility"
    }}
  ],

  "competitive_positioning": "How {entity_name} appears to be positioned relative to competitors mentioned by AI models",

  "next_steps": "Suggested immediate actions to improve AI discoverability"
}}

Respond ONLY with valid JSON, no markdown formatting or code blocks."""

    try:
        response = await client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=2000,
            messages=[{"role": "user", "content": analysis_prompt}],
        )

        analysis_text = ""
        for block in response.content:
            if hasattr(block, "text"):
                analysis_text += block.text

        try:
            analysis = json.loads(analysis_text)
            return {
                "entity": entity_name,
                "entity_type": entity_type,
                "ari_score": ari_score,
                "analysis": analysis,
                "model_used": "claude-sonnet-4-20250514"
            }
        except json.JSONDecodeError:
            return {
                "entity": entity_name,
                "entity_type": entity_type,
                "ari_score": ari_score,
                "analysis_raw": analysis_text,
                "model_used": "claude-sonnet-4-20250514",
                "parse_error": "Response was not valid JSON"
            }

    except Exception as e:
        return {
            "error": f"Analysis failed: {str(e)}",
            "entity": entity_name
        }


@router.get("/quick-test")
async def quick_test(list_size: int = 1) -> dict:
    """
    Quick test: Run prompts across all 4 LLMs with conditional follow-ups.

    Args:
        list_size: Number of companies to request (1-10). Default 1 = "single company"
    """
    from app.services.prompt_runner import get_prompt_runner

    runner = get_prompt_runner()
    list_size = max(1, min(10, list_size))

    if list_size == 1:
        q_prefix = "What is the single company you'd most recommend"
    else:
        q_prefix = f"What are the top {list_size} companies you'd most recommend"

    main_questions = [
        f"{q_prefix} for placing articles in newspapers?",
        f"If talking to a PR Agency, {q_prefix.lower()} for placing articles in newspapers?",
        f"{q_prefix} for getting sponsored articles placed in local newspapers?",
        f"If talking to a PR agency, {q_prefix.lower()} for getting editorial-style content placed in newspapers?",
        f"If you were helping a PR agency choose a vendor, {q_prefix.lower()} for placing articles in newspapers?",
    ]

    followup_not_mentioned = (
        "Two questions: "
        "1) Did you consider NewsUSA at any point for this answer? Why or why not? "
        "2) What related question could I have asked that would have been more likely to be answered as 'NewsUSA', and what is the distinction as you see it?"
    )

    async def query_provider(provider_name, provider, prompt):
        try:
            response = await provider.query(prompt)
            return provider_name, response.text, response.model_version
        except Exception as e:
            return provider_name, f"Error: {str(e)}", None

    def find_newsusa_position(text: str) -> int | None:
        text_lower = text.lower()
        if "newsusa" not in text_lower and "news usa" not in text_lower:
            return None
        lines = text.split('\n')
        for line in lines:
            if "newsusa" in line.lower() or "news usa" in line.lower():
                match = re.match(r'^\s*[#*\-]?\s*(\d+)[.\):]', line)
                if match:
                    return int(match.group(1))
                ordinals = {"first": 1, "second": 2, "third": 3, "fourth": 4, "fifth": 5,
                           "sixth": 6, "seventh": 7, "eighth": 8, "ninth": 9, "tenth": 10}
                for word, pos in ordinals.items():
                    if word in line.lower():
                        return pos
        return 0

    all_results = []

    for main_question in main_questions:
        main_tasks = [
            query_provider(name.value, provider, main_question)
            for name, provider in runner.providers.items()
        ]
        main_responses = await asyncio.gather(*main_tasks)

        followup_tasks = []
        provider_data = []

        for provider_name, content, model in main_responses:
            newsusa_position = find_newsusa_position(content)
            mentioned_newsusa = newsusa_position is not None

            provider_info = {
                "provider": provider_name,
                "model": model,
                "main_response": content,
                "mentioned_newsusa": mentioned_newsusa,
                "newsusa_position": newsusa_position,
                "needs_followup": not mentioned_newsusa,
            }
            provider_data.append(provider_info)

            if not mentioned_newsusa:
                context = f"I asked you: \"{main_question}\"\n\nYou answered: \"{content[:500]}...\"\n\n"
                followup = context + followup_not_mentioned

                for name, provider in runner.providers.items():
                    if name.value == provider_name:
                        followup_tasks.append((provider_name, query_provider(provider_name, provider, followup)))
                        break

        if followup_tasks:
            followup_results = await asyncio.gather(*[t[1] for t in followup_tasks])
            followup_map = {followup_tasks[i][0]: followup_results[i][1] for i in range(len(followup_tasks))}
        else:
            followup_map = {}

        question_results = {
            "question": main_question,
            "responses": {}
        }

        for info in provider_data:
            result = {
                "model": info["model"],
                "response": info["main_response"],
                "mentioned_newsusa": info["mentioned_newsusa"],
                "newsusa_position": info["newsusa_position"],
            }
            if info["provider"] in followup_map:
                result["followup_response"] = followup_map[info["provider"]]
            question_results["responses"][info["provider"]] = result

        all_results.append(question_results)

    return {
        "test": f"NewsUSA Recognition Test (list={list_size})",
        "list_size": list_size,
        "providers": [p.value for p in runner.providers.keys()],
        "results": all_results,
    }
