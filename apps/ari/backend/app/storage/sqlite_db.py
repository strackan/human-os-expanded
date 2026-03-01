"""Simple SQLite storage for ARI results."""

import sqlite3
import json
from pathlib import Path
from datetime import datetime
from uuid import UUID
from typing import Optional

# Database file location
DB_PATH = Path(__file__).parent.parent.parent / "ari.db"


def get_connection() -> sqlite3.Connection:
    """Get a database connection."""
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Initialize the database schema."""
    conn = get_connection()
    cursor = conn.cursor()

    # Entities table (people and companies)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS entities (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            type TEXT NOT NULL,  -- 'person' or 'company'
            category TEXT,
            metadata TEXT,  -- JSON
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Analysis runs table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS analysis_runs (
            id TEXT PRIMARY KEY,
            entity_id TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',  -- pending, running, success, failed
            overall_score REAL,
            provider_scores TEXT,  -- JSON
            mention_rate REAL,
            started_at TEXT,
            completed_at TEXT,
            error_message TEXT,
            FOREIGN KEY (entity_id) REFERENCES entities(id)
        )
    """)

    # Responses table (individual AI responses)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS responses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            run_id TEXT NOT NULL,
            prompt_id TEXT NOT NULL,
            prompt_text TEXT NOT NULL,
            intent TEXT,
            provider TEXT NOT NULL,
            model_version TEXT,
            raw_response TEXT,
            latency_ms INTEGER,
            tokens_used INTEGER,
            entity_mentioned INTEGER,  -- 0 or 1
            entity_position INTEGER,
            recommendation_type TEXT,
            all_mentions TEXT,  -- JSON
            error TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (run_id) REFERENCES analysis_runs(id)
        )
    """)

    # Index for faster lookups
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_runs_entity_status
        ON analysis_runs(entity_id, status)
    """)

    conn.commit()
    conn.close()


def save_entity(entity_id: str, name: str, entity_type: str, category: str = None, metadata: dict = None):
    """Save or update an entity."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT OR REPLACE INTO entities (id, name, type, category, metadata)
        VALUES (?, ?, ?, ?, ?)
    """, (entity_id, name, entity_type, category, json.dumps(metadata or {})))

    conn.commit()
    conn.close()


def get_successful_run(entity_id: str) -> Optional[dict]:
    """Get the most recent successful run for an entity."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT * FROM analysis_runs
        WHERE entity_id = ? AND status = 'success'
        ORDER BY completed_at DESC
        LIMIT 1
    """, (entity_id,))

    row = cursor.fetchone()
    conn.close()

    if row:
        return dict(row)
    return None


def create_run(run_id: str, entity_id: str) -> str:
    """Create a new analysis run."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO analysis_runs (id, entity_id, status, started_at)
        VALUES (?, ?, 'running', ?)
    """, (run_id, entity_id, datetime.now().isoformat()))

    conn.commit()
    conn.close()
    return run_id


def complete_run(run_id: str, overall_score: float, provider_scores: dict, mention_rate: float):
    """Mark a run as successful."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        UPDATE analysis_runs
        SET status = 'success',
            overall_score = ?,
            provider_scores = ?,
            mention_rate = ?,
            completed_at = ?
        WHERE id = ?
    """, (overall_score, json.dumps(provider_scores), mention_rate, datetime.now().isoformat(), run_id))

    conn.commit()
    conn.close()


def fail_run(run_id: str, error_message: str):
    """Mark a run as failed."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        UPDATE analysis_runs
        SET status = 'failed',
            error_message = ?,
            completed_at = ?
        WHERE id = ?
    """, (error_message, datetime.now().isoformat(), run_id))

    conn.commit()
    conn.close()


def save_response(
    run_id: str,
    prompt_id: str,
    prompt_text: str,
    intent: str,
    provider: str,
    model_version: str,
    raw_response: str,
    latency_ms: int,
    tokens_used: int,
    entity_mentioned: bool,
    entity_position: int,
    recommendation_type: str,
    all_mentions: list,
    error: str = None,
):
    """Save an individual AI response."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO responses (
            run_id, prompt_id, prompt_text, intent, provider, model_version,
            raw_response, latency_ms, tokens_used, entity_mentioned, entity_position,
            recommendation_type, all_mentions, error
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        run_id, prompt_id, prompt_text, intent, provider, model_version,
        raw_response, latency_ms, tokens_used, 1 if entity_mentioned else 0,
        entity_position, recommendation_type, json.dumps(all_mentions), error
    ))

    conn.commit()
    conn.close()


def get_run_responses(run_id: str) -> list[dict]:
    """Get all responses for a run."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT * FROM responses WHERE run_id = ?
    """, (run_id,))

    rows = cursor.fetchall()
    conn.close()

    return [dict(row) for row in rows]


def get_all_runs() -> list[dict]:
    """Get all analysis runs with entity info."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT r.*, e.name as entity_name, e.type as entity_type
        FROM analysis_runs r
        JOIN entities e ON r.entity_id = e.id
        ORDER BY r.completed_at DESC
    """)

    rows = cursor.fetchall()
    conn.close()

    return [dict(row) for row in rows]


# Initialize database on module import
init_db()
