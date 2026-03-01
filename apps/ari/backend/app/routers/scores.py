"""Score calculation and retrieval endpoints."""

import asyncio
import json
from uuid import UUID, uuid4

from fastapi import APIRouter, BackgroundTasks, HTTPException, Query

from app.models.entity import DEMO_ENTITIES
from app.models.prompt import Intent, RenderedPrompt
from app.models.score import ARIScore, ComparisonResult, PromptResponse
from app.routers.prompts import CONTENT_SYNDICATION_PROMPTS
from app.services.prompt_runner import get_prompt_runner
from app.storage import sqlite_db as db

router = APIRouter(prefix="/scores")

# In-memory storage for jobs (runs are persisted to SQLite)
_jobs: dict[UUID, dict] = {}
# In-memory cache for scores (loaded from SQLite)
_scores: dict[UUID, ARIScore] = {}


def _load_score_from_db(entity_id: UUID, run_data: dict) -> None:
    """Load a score from the database into memory cache."""
    # Get responses from database
    responses_data = db.get_run_responses(run_data["id"])

    # Reconstruct PromptResponse objects
    all_responses = []
    sample_responses = []

    for r in responses_data:
        response = PromptResponse(
            prompt_id=r["prompt_id"],
            prompt_text=r["prompt_text"],
            intent=r["intent"] or "unknown",
            provider=r["provider"],
            model_version=r["model_version"],
            raw_response=r["raw_response"],
            latency_ms=r["latency_ms"],
            tokens_used=r["tokens_used"],
            entity_mentioned=bool(r["entity_mentioned"]),
            entity_position=r["entity_position"],
            recommendation_type=r["recommendation_type"],
            all_mentions=json.loads(r["all_mentions"]) if r["all_mentions"] else [],
            error=r["error"],
        )
        all_responses.append(response)

        # Collect sample responses where entity was mentioned
        if response.entity_mentioned and len(sample_responses) < 3:
            sample_responses.append({
                "provider": response.provider,
                "prompt": response.prompt_text,
                "response": response.raw_response[:500] + "..." if len(response.raw_response or "") > 500 else response.raw_response,
                "position": response.entity_position,
                "recommendation_type": response.recommendation_type,
            })

    # Get entity name
    entity_name = run_data.get("entity_name", "Unknown")
    if not entity_name or entity_name == "Unknown":
        for e in DEMO_ENTITIES:
            if str(e.id) == str(entity_id):
                entity_name = e.name
                break

    # Create ARIScore object
    provider_scores = json.loads(run_data["provider_scores"]) if run_data["provider_scores"] else {}

    # Calculate totals from responses
    total_prompts = len(all_responses)
    mentions_count = sum(1 for r in all_responses if r.entity_mentioned)

    score = ARIScore(
        entity_id=str(entity_id),
        entity_name=entity_name,
        overall_score=run_data["overall_score"],
        provider_scores=provider_scores,
        mention_rate=run_data["mention_rate"] or 0,
        total_prompts=total_prompts,
        mentions_count=mentions_count,
        sample_responses=sample_responses,
        all_responses=all_responses,
    )

    _scores[entity_id] = score


async def run_ari_calculation(job_id: UUID, entity_id: UUID, entity_name: str, entity_type: str, run_id: str) -> None:
    """Background task to run ARI calculation."""
    try:
        _jobs[job_id]["status"] = "running"
        _jobs[job_id]["message"] = "Initializing AI providers..."

        runner = get_prompt_runner()

        if not runner.providers:
            _jobs[job_id]["status"] = "failed"
            _jobs[job_id]["message"] = "No AI providers configured. Add API keys to .env"
            db.fail_run(run_id, "No AI providers configured")
            return

        _jobs[job_id]["message"] = f"Running with {len(runner.providers)} providers..."

        # Get prompts for the entity type (company or person)
        type_specific_prompts = [
            p for p in CONTENT_SYNDICATION_PROMPTS
            if p["entity_type"] == entity_type
        ]

        prompts = [
            RenderedPrompt(
                template_id=p["id"],
                prompt_text=p["template"],
                entity_type=p["entity_type"],
                weight=p.get("weight", 1.0),
                intent=Intent(p["intent"]) if p.get("intent") else None,
            )
            for p in type_specific_prompts
        ]

        # Get known entity names for parsing
        known_entities = [e.name for e in DEMO_ENTITIES]

        # Calculate estimated time (prompts run in parallel across providers, ~0.5s delay each)
        est_seconds = int(len(prompts) * 0.5) + 10  # prompts × 0.5s + buffer for API latency
        time_str = f"~{est_seconds}s" if est_seconds < 60 else f"~{est_seconds // 60}m {est_seconds % 60}s"

        # Calculate the score
        _jobs[job_id]["message"] = f"Querying {len(prompts)} prompts × {len(runner.providers)} providers ({time_str})..."

        ari_score = await runner.calculate_ari(
            entity_name=entity_name,
            entity_id=str(entity_id),
            prompts=prompts,
            known_entities=known_entities,
        )

        # Store the score in memory cache
        _scores[entity_id] = ari_score

        # Save to SQLite database
        db.complete_run(
            run_id=run_id,
            overall_score=ari_score.overall_score,
            provider_scores=ari_score.provider_scores,
            mention_rate=ari_score.mention_rate,
        )

        # Save all responses to database
        for response in ari_score.all_responses:
            db.save_response(
                run_id=run_id,
                prompt_id=response.prompt_id,
                prompt_text=response.prompt_text,
                intent=response.intent,
                provider=response.provider,
                model_version=response.model_version,
                raw_response=response.raw_response,
                latency_ms=response.latency_ms,
                tokens_used=response.tokens_used,
                entity_mentioned=response.entity_mentioned,
                entity_position=response.entity_position,
                recommendation_type=response.recommendation_type,
                all_mentions=response.all_mentions,
                error=response.error,
            )

        _jobs[job_id]["status"] = "completed"
        _jobs[job_id]["progress"] = 100
        _jobs[job_id]["message"] = f"Score calculated: {ari_score.overall_score:.1f}"

    except Exception as e:
        _jobs[job_id]["status"] = "failed"
        _jobs[job_id]["message"] = str(e)
        db.fail_run(run_id, str(e))


@router.post("/calculate/{entity_id}")
async def calculate_ari(
    entity_id: UUID,
    background_tasks: BackgroundTasks,
    force: bool = Query(False, description="Force recalculation even if successful run exists"),
) -> dict:
    """
    Trigger ARI score calculation for an entity.

    This is an async operation - returns a job_id for polling.
    Use force=true to recalculate even if a successful run exists.
    """
    # Find the entity
    entity = None
    for e in DEMO_ENTITIES:
        if e.id == entity_id:
            entity = e
            break

    if not entity:
        raise HTTPException(status_code=404, detail="Entity not found")

    # Check for existing successful run (unless force=True)
    if not force:
        existing_run = db.get_successful_run(str(entity_id))
        if existing_run:
            # Load the score into memory cache if not already there
            if entity_id not in _scores:
                _load_score_from_db(entity_id, existing_run)

            return {
                "job_id": existing_run["id"],
                "entity_id": str(entity_id),
                "status": "completed",
                "message": f"Using existing successful run (score: {existing_run['overall_score']:.1f}). Use force=true to recalculate.",
                "cached": True,
            }

    # Save entity to database
    db.save_entity(
        entity_id=str(entity_id),
        name=entity.name,
        entity_type=entity.type.value,
        category="content_syndication",
        metadata={"aliases": entity.aliases} if entity.aliases else None,
    )

    job_id = uuid4()
    run_id = str(uuid4())

    # Create run record in database
    db.create_run(run_id, str(entity_id))

    # Create job record (in-memory for polling)
    _jobs[job_id] = {
        "job_id": str(job_id),
        "entity_id": str(entity_id),
        "run_id": run_id,
        "status": "pending",
        "progress": 0,
        "message": "Job queued",
    }

    # Trigger background calculation with entity type
    background_tasks.add_task(run_ari_calculation, job_id, entity_id, entity.name, entity.type.value, run_id)

    return {
        "job_id": str(job_id),
        "entity_id": str(entity_id),
        "run_id": run_id,
        "status": "pending",
        "message": "ARI calculation started. Poll /calculate/{job_id}/status for progress.",
    }


@router.get("/calculate/{job_id}/status")
async def get_calculation_status(job_id: UUID) -> dict:
    """Get the status of an ARI calculation job."""
    if job_id not in _jobs:
        raise HTTPException(status_code=404, detail="Job not found")

    return _jobs[job_id]


@router.get("/runs")
async def list_all_runs() -> list[dict]:
    """List all analysis runs."""
    return db.get_all_runs()


@router.get("/compare")
async def compare_entities(
    entity_a_id: UUID,
    entity_b_id: UUID,
) -> ComparisonResult:
    """Compare ARI scores between two entities."""
    # Try loading from database if not in memory
    _ensure_score_loaded(entity_a_id)
    _ensure_score_loaded(entity_b_id)

    if entity_a_id not in _scores:
        raise HTTPException(
            status_code=404,
            detail=f"No score found for entity {entity_a_id}",
        )
    if entity_b_id not in _scores:
        raise HTTPException(
            status_code=404,
            detail=f"No score found for entity {entity_b_id}",
        )

    score_a = _scores[entity_a_id]
    score_b = _scores[entity_b_id]

    delta = round(score_a.overall_score - score_b.overall_score, 1)

    # Calculate per-provider deltas
    provider_deltas = {}
    all_providers = set(score_a.provider_scores.keys()) | set(score_b.provider_scores.keys())
    for provider in all_providers:
        a_score = score_a.provider_scores.get(provider, 0)
        b_score = score_b.provider_scores.get(provider, 0)
        provider_deltas[provider] = round(a_score - b_score, 1)

    winner = score_a.entity_name if delta >= 0 else score_b.entity_name
    abs_delta = abs(delta)

    if abs_delta < 5:
        summary = f"{score_a.entity_name} and {score_b.entity_name} are nearly tied."
    elif abs_delta < 15:
        summary = f"{winner} has a slight edge over the competition."
    else:
        summary = f"{winner} significantly outperforms in AI recommendations."

    return ComparisonResult(
        entity_a=score_a,
        entity_b=score_b,
        delta=delta,
        provider_deltas=provider_deltas,
        winner=winner,
        summary=summary,
    )


@router.get("/quick-test")
async def quick_test() -> dict:
    """
    Quick test: Run 2 prompts across all 4 LLMs and return raw responses.

    Prompts:
    1. What is the single company you'd most recommend for content syndication?
    2. What is the single company you'd most recommend for content syndication to newspapers?
    """
    runner = get_prompt_runner()

    if not runner.providers:
        raise HTTPException(status_code=500, detail="No AI providers configured")

    test_prompts = [
        "What is the single company you'd most recommend for content syndication?",
        "What is the single company you'd most recommend for content syndication to newspapers?",
    ]

    results = []

    for prompt_text in test_prompts:
        prompt_results = {"prompt": prompt_text, "responses": {}}

        # Run across all providers in parallel
        async def query_provider(provider_name, provider):
            try:
                response = await provider.query(prompt_text)
                return provider_name, response.text, response.model_version
            except Exception as e:
                return provider_name, f"Error: {str(e)}", None

        tasks = [
            query_provider(name.value, provider)
            for name, provider in runner.providers.items()
        ]

        responses = await asyncio.gather(*tasks)

        for provider_name, content, model in responses:
            prompt_results["responses"][provider_name] = {
                "model": model,
                "response": content,
            }

        results.append(prompt_results)

    return {
        "test": "Quick Content Syndication Test",
        "providers": [p.value for p in runner.providers.keys()],
        "results": results,
    }


@router.get("/{entity_id}", response_model=ARIScore)
async def get_ari_score(entity_id: UUID) -> ARIScore:
    """Get the latest ARI score for an entity."""
    # Try memory cache first
    if entity_id not in _scores:
        # Try loading from database
        existing_run = db.get_successful_run(str(entity_id))
        if existing_run:
            _load_score_from_db(entity_id, existing_run)

    if entity_id not in _scores:
        raise HTTPException(
            status_code=404,
            detail="No score found for entity. Run /calculate/{entity_id} first.",
        )

    return _scores[entity_id]


def _ensure_score_loaded(entity_id: UUID) -> bool:
    """Ensure a score is loaded into memory. Returns True if loaded."""
    if entity_id not in _scores:
        existing_run = db.get_successful_run(str(entity_id))
        if existing_run:
            _load_score_from_db(entity_id, existing_run)
    return entity_id in _scores


@router.get("/{entity_id}/history", response_model=list[ARIScore])
async def get_score_history(
    entity_id: UUID,
    limit: int = 10,
) -> list[ARIScore]:
    """Get historical ARI scores for trending."""
    _ensure_score_loaded(entity_id)
    # For MVP, just return current score if exists
    if entity_id in _scores:
        return [_scores[entity_id]]
    return []


@router.get("/{entity_id}/responses", response_model=list[PromptResponse])
async def get_all_responses(
    entity_id: UUID,
    intent: str | None = None,
    mentioned_only: bool = False,
) -> list[PromptResponse]:
    """
    Get all prompt/provider responses for an entity.

    Args:
        entity_id: Entity UUID
        intent: Filter by intent (best, top, recommend, compare, discover, evaluate)
        mentioned_only: Only return responses where entity was mentioned
    """
    _ensure_score_loaded(entity_id)
    if entity_id not in _scores:
        raise HTTPException(
            status_code=404,
            detail="No score found for entity. Run /calculate/{entity_id} first.",
        )

    responses = _scores[entity_id].all_responses

    # Filter by intent if specified
    if intent:
        responses = [r for r in responses if r.intent == intent]

    # Filter to only mentioned if specified
    if mentioned_only:
        responses = [r for r in responses if r.entity_mentioned]

    return responses


@router.get("/{entity_id}/responses/summary")
async def get_responses_summary(entity_id: UUID) -> dict:
    """Get a summary of responses grouped by intent and provider."""
    _ensure_score_loaded(entity_id)
    if entity_id not in _scores:
        raise HTTPException(
            status_code=404,
            detail="No score found for entity. Run /calculate/{entity_id} first.",
        )

    score = _scores[entity_id]
    responses = score.all_responses

    # Group by intent
    by_intent: dict[str, dict] = {}
    for r in responses:
        if r.intent not in by_intent:
            by_intent[r.intent] = {
                "total": 0,
                "mentioned": 0,
                "providers": {},
            }
        by_intent[r.intent]["total"] += 1
        if r.entity_mentioned:
            by_intent[r.intent]["mentioned"] += 1

        # Track by provider within intent
        if r.provider not in by_intent[r.intent]["providers"]:
            by_intent[r.intent]["providers"][r.provider] = {
                "total": 0,
                "mentioned": 0,
            }
        by_intent[r.intent]["providers"][r.provider]["total"] += 1
        if r.entity_mentioned:
            by_intent[r.intent]["providers"][r.provider]["mentioned"] += 1

    # Calculate mention rates
    for intent_data in by_intent.values():
        intent_data["mention_rate"] = (
            intent_data["mentioned"] / intent_data["total"] * 100
            if intent_data["total"] > 0
            else 0
        )
        for provider_data in intent_data["providers"].values():
            provider_data["mention_rate"] = (
                provider_data["mentioned"] / provider_data["total"] * 100
                if provider_data["total"] > 0
                else 0
            )

    return {
        "entity_id": str(entity_id),
        "entity_name": score.entity_name,
        "total_responses": len(responses),
        "total_mentioned": sum(1 for r in responses if r.entity_mentioned),
        "overall_mention_rate": score.mention_rate,
        "by_intent": by_intent,
    }
