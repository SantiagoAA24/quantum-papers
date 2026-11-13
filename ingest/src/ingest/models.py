"""Pydantic models shared by the ingestion modules."""

from datetime import datetime

from pydantic import BaseModel, Field

EMBEDDING_MODEL = "text-embedding-3-small"
EMBEDDING_DIMENSIONS = 1536


class Summary(BaseModel):
    """AI summary stored in papers.ai_summary (keys match web AiSummary)."""

    problema: str = Field(min_length=1)
    metodo: str = Field(min_length=1)
    resultado: str = Field(min_length=1)
    modelo: str = Field(min_length=1)
    fecha: str = Field(min_length=1)


class Paper(BaseModel):
    arxiv_id: str
    version: int = 1
    title: str
    abstract: str
    authors: list[str]
    primary_category: str
    categories: list[str]
    doi: str | None = None
    pdf_url: str
    published_at: datetime
    updated_at: datetime
