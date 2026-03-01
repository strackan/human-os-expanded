"""FastAPI application entry point."""

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import article_pipeline, audit, deliverables, entities, lite_report, optimizer, prompts, publications, scores, testing

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan handler for startup/shutdown."""
    # Startup
    providers = settings.get_available_providers()
    print(f"ARI Backend starting up...")
    print(f"Available AI providers: {providers or 'None configured'}")
    print(f"Supabase configured: {settings.has_supabase()}")

    yield

    # Shutdown
    print("ARI Backend shutting down...")


app = FastAPI(
    title="ARI - AI Recommendation Index",
    description="Measure how AI recommends your brand across ChatGPT, Claude, Perplexity, and Gemini.",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS middleware for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "http://localhost:4202",
        "http://localhost:4200",
        "http://localhost:4000",
        "http://localhost:4010",
        "https://fancyrobot.ai",
        "https://www.fancyrobot.ai",
        "https://fancy-robot.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(entities.router, prefix=settings.api_v1_prefix, tags=["entities"])
app.include_router(scores.router, prefix=settings.api_v1_prefix, tags=["scores"])
app.include_router(prompts.router, prefix=settings.api_v1_prefix, tags=["prompts"])
app.include_router(deliverables.router, prefix=settings.api_v1_prefix, tags=["deliverables"])
app.include_router(optimizer.router, prefix=settings.api_v1_prefix, tags=["optimizer"])
app.include_router(lite_report.router, prefix=settings.api_v1_prefix, tags=["lite-report"])
app.include_router(audit.router, prefix=settings.api_v1_prefix, tags=["audit"])
app.include_router(testing.router, prefix=settings.api_v1_prefix, tags=["testing"])
app.include_router(article_pipeline.router, prefix=settings.api_v1_prefix, tags=["articles"])
app.include_router(publications.router, prefix=settings.api_v1_prefix, tags=["publications"])


@app.get("/")
async def root() -> dict[str, str]:
    """Root endpoint with API info."""
    return {
        "name": "ARI - AI Recommendation Index",
        "version": "0.1.0",
        "docs": "/docs",
    }


@app.get("/health")
async def health_check() -> dict[str, str | list[str] | bool]:
    """Health check endpoint."""
    return {
        "status": "healthy",
        "providers": settings.get_available_providers(),
        "supabase": settings.has_supabase(),
    }
