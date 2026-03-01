"""Deliverables management endpoints."""

import os
from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel

router = APIRouter(prefix="/deliverables")

# Base path to customers directory (relative to project root)
CUSTOMERS_DIR = Path(__file__).parent.parent.parent.parent / "customers"


class CustomerInfo(BaseModel):
    """Customer summary info."""
    slug: str
    name: str
    deliverable_count: int


class DeliverableInfo(BaseModel):
    """Deliverable file info."""
    filename: str
    title: str
    path: str


class DeliverableContent(BaseModel):
    """Deliverable content response."""
    slug: str
    filename: str
    title: str
    content: str


def _get_deliverable_title(filename: str) -> str:
    """Extract human-readable title from filename."""
    # Remove number prefix and extension: 01-client-proposal.md -> Client Proposal
    name = filename.replace(".md", "")
    if name.startswith(("01-", "02-", "03-", "04-", "05-")):
        name = name[3:]
    # Convert kebab-case to title case
    return name.replace("-", " ").title()


def _is_customer_dir(path: Path) -> bool:
    """Check if directory is a valid customer (has deliverables folder)."""
    return (path / "deliverables").is_dir()


def _get_customer_name(slug: str) -> str:
    """Convert slug to display name."""
    # Map known slugs to proper names
    name_map = {
        "usmoneyreserve": "U.S. Money Reserve",
        "toysfortots": "Toys for Tots",
    }
    return name_map.get(slug, slug.replace("-", " ").title())


@router.get("/", response_model=list[CustomerInfo])
async def list_customers() -> list[CustomerInfo]:
    """List all customers with deliverables."""
    if not CUSTOMERS_DIR.exists():
        return []

    customers = []
    for item in CUSTOMERS_DIR.iterdir():
        if item.is_dir() and not item.name.startswith("_") and _is_customer_dir(item):
            deliverables_dir = item / "deliverables"
            deliverable_count = len([
                f for f in deliverables_dir.iterdir()
                if f.suffix == ".md" and not f.name.startswith("README")
            ])
            customers.append(CustomerInfo(
                slug=item.name,
                name=_get_customer_name(item.name),
                deliverable_count=deliverable_count,
            ))

    return sorted(customers, key=lambda c: c.name)


@router.get("/{slug}", response_model=list[DeliverableInfo])
async def list_deliverables(slug: str) -> list[DeliverableInfo]:
    """List deliverables for a customer."""
    customer_dir = CUSTOMERS_DIR / slug
    if not customer_dir.exists() or not _is_customer_dir(customer_dir):
        raise HTTPException(status_code=404, detail=f"Customer '{slug}' not found")

    deliverables_dir = customer_dir / "deliverables"
    deliverables = []

    for f in sorted(deliverables_dir.iterdir()):
        if f.suffix == ".md" and not f.name.startswith("README"):
            deliverables.append(DeliverableInfo(
                filename=f.name,
                title=_get_deliverable_title(f.name),
                path=f"/{slug}/{f.name}",
            ))

    return deliverables


@router.get("/{slug}/{doc}", response_model=DeliverableContent)
async def get_deliverable(slug: str, doc: str) -> DeliverableContent:
    """Get markdown content for a deliverable."""
    # Ensure doc ends with .md
    if not doc.endswith(".md"):
        doc = f"{doc}.md"

    file_path = CUSTOMERS_DIR / slug / "deliverables" / doc
    if not file_path.exists():
        raise HTTPException(status_code=404, detail=f"Deliverable '{doc}' not found")

    content = file_path.read_text(encoding="utf-8")

    return DeliverableContent(
        slug=slug,
        filename=doc,
        title=_get_deliverable_title(doc),
        content=content,
    )


@router.get("/{slug}/{doc}/pdf")
async def get_deliverable_pdf(slug: str, doc: str):
    """Download deliverable as branded PDF."""
    from app.services.pdf_generator import generate_pdf

    # Ensure doc ends with .md
    if not doc.endswith(".md"):
        doc = f"{doc}.md"

    file_path = CUSTOMERS_DIR / slug / "deliverables" / doc
    if not file_path.exists():
        raise HTTPException(status_code=404, detail=f"Deliverable '{doc}' not found")

    content = file_path.read_text(encoding="utf-8")
    title = _get_deliverable_title(doc)
    customer_name = _get_customer_name(slug)

    try:
        pdf_bytes = generate_pdf(content, title, customer_name)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")

    filename = doc.replace(".md", ".pdf")

    return StreamingResponse(
        iter([pdf_bytes]),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/{slug}/proposal/pptx")
async def get_proposal_pptx(slug: str):
    """Download client proposal as branded PowerPoint."""
    from app.services.pptx_generator import generate_pptx

    # Look for the client proposal file
    proposal_file = CUSTOMERS_DIR / slug / "deliverables" / "01-client-proposal.md"
    if not proposal_file.exists():
        raise HTTPException(status_code=404, detail="Client proposal not found")

    content = proposal_file.read_text(encoding="utf-8")
    customer_name = _get_customer_name(slug)

    try:
        pptx_bytes = generate_pptx(content, customer_name)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PPTX generation failed: {str(e)}")

    filename = f"{slug}-proposal.pptx"

    return StreamingResponse(
        iter([pptx_bytes]),
        media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
