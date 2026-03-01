"""Entity management endpoints."""

from uuid import UUID

from fastapi import APIRouter, HTTPException

from app.models.entity import DEMO_ENTITIES, Entity, EntityCreate, EntityType

router = APIRouter(prefix="/entities")

# In-memory storage for MVP (replace with Supabase later)
_entities: dict[UUID, Entity] = {}


def _seed_demo_entities() -> None:
    """Seed demo entities if not already present."""
    if _entities:
        return

    for entity in DEMO_ENTITIES:
        _entities[entity.id] = entity


@router.get("/", response_model=list[Entity])
async def list_entities(entity_type: EntityType | None = None) -> list[Entity]:
    """List all entities, optionally filtered by type."""
    _seed_demo_entities()

    entities = list(_entities.values())
    if entity_type:
        entities = [e for e in entities if e.type == entity_type]

    return entities


@router.post("/", response_model=Entity, status_code=201)
async def create_entity(entity_data: EntityCreate) -> Entity:
    """Create a new entity."""
    entity = Entity(**entity_data.model_dump())
    _entities[entity.id] = entity
    return entity


@router.get("/{entity_id}", response_model=Entity)
async def get_entity(entity_id: UUID) -> Entity:
    """Get a specific entity by ID."""
    _seed_demo_entities()

    if entity_id not in _entities:
        raise HTTPException(status_code=404, detail="Entity not found")

    return _entities[entity_id]


@router.delete("/{entity_id}", status_code=204)
async def delete_entity(entity_id: UUID) -> None:
    """Delete an entity."""
    if entity_id not in _entities:
        raise HTTPException(status_code=404, detail="Entity not found")

    del _entities[entity_id]


@router.get("/by-name/{name}", response_model=Entity)
async def get_entity_by_name(name: str) -> Entity:
    """Get entity by name (case-insensitive)."""
    _seed_demo_entities()

    name_lower = name.lower()
    for entity in _entities.values():
        if entity.name.lower() == name_lower:
            return entity
        if any(alias.lower() == name_lower for alias in entity.aliases):
            return entity

    raise HTTPException(status_code=404, detail=f"Entity '{name}' not found")
