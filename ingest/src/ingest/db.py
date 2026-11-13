"""Postgres persistence: idempotent upserts keyed by arxiv_id."""

import hashlib
import re
import unicodedata
from dataclasses import dataclass
from enum import Enum

import psycopg
from pgvector import Vector
from pgvector.psycopg import register_vector

from ingest.models import EMBEDDING_MODEL, Paper, Summary


class Status(str, Enum):
    NEW = "new"
    UPDATED = "updated"
    SKIPPED = "skipped"


@dataclass(frozen=True)
class Existing:
    version: int
    embedding_model: str
    has_embedding: bool


def connect(url: str) -> psycopg.Connection:
    conn = psycopg.connect(url)
    register_vector(conn)
    return conn


def slugify(value: str) -> str:
    text = unicodedata.normalize("NFD", value)
    text = re.sub(r"[̀-ͯ]", "", text).lower()
    return re.sub(r"[^a-z0-9]+", "-", text).strip("-")


def _slug_or_hash(value: str) -> str:
    return slugify(value) or hashlib.sha1(value.encode()).hexdigest()[:12]


def get_existing(conn: psycopg.Connection, arxiv_id: str) -> Existing | None:
    row = conn.execute(
        "SELECT version, embedding_model, embedding IS NOT NULL FROM papers WHERE arxiv_id = %s",
        (arxiv_id,),
    ).fetchone()
    return Existing(row[0], row[1], row[2]) if row else None


def classify(existing: Existing | None, paper: Paper, model: str = EMBEDDING_MODEL) -> Status:
    """New, version changed or non-real embedding (e.g. dev-fake) means work; else skip."""
    if existing is None:
        return Status.NEW
    if (
        existing.version != paper.version
        or existing.embedding_model != model
        or not existing.has_embedding
    ):
        return Status.UPDATED
    return Status.SKIPPED


_UPSERT_PAPER = """
INSERT INTO papers (arxiv_id, title, abstract, published_at, updated_at, version,
                    primary_category, doi, pdf_url, ai_summary, embedding, embedding_model)
VALUES (%(arxiv_id)s, %(title)s, %(abstract)s, %(published_at)s, %(updated_at)s, %(version)s,
        %(primary_category)s, %(doi)s, %(pdf_url)s, %(ai_summary)s::jsonb, %(embedding)s,
        %(embedding_model)s)
ON CONFLICT (arxiv_id) DO UPDATE SET
  title = EXCLUDED.title,
  abstract = EXCLUDED.abstract,
  published_at = EXCLUDED.published_at,
  updated_at = EXCLUDED.updated_at,
  version = EXCLUDED.version,
  primary_category = EXCLUDED.primary_category,
  doi = EXCLUDED.doi,
  pdf_url = EXCLUDED.pdf_url,
  ai_summary = EXCLUDED.ai_summary,
  embedding = EXCLUDED.embedding,
  embedding_model = EXCLUDED.embedding_model
RETURNING id
"""


def upsert_paper(
    conn: psycopg.Connection,
    paper: Paper,
    embedding: list[float],
    summary: Summary | None,
    embedding_model: str = EMBEDDING_MODEL,
) -> int:
    """Upsert the paper, its authors, topics and bridge rows in one transaction."""
    with conn.transaction():
        row = conn.execute(
            _UPSERT_PAPER,
            {
                "arxiv_id": paper.arxiv_id,
                "title": paper.title,
                "abstract": paper.abstract,
                "published_at": paper.published_at,
                "updated_at": paper.updated_at,
                "version": paper.version,
                "primary_category": paper.primary_category,
                "doi": paper.doi,
                "pdf_url": paper.pdf_url,
                "ai_summary": summary.model_dump_json() if summary else None,
                "embedding": Vector(embedding),
                "embedding_model": embedding_model,
            },
        ).fetchone()
        assert row is not None
        paper_id: int = row[0]

        conn.execute("DELETE FROM paper_authors WHERE paper_id = %s", (paper_id,))
        seen: set[int] = set()
        for position, name in enumerate(paper.authors):
            author = conn.execute(
                """INSERT INTO authors (slug, name) VALUES (%s, %s)
                   ON CONFLICT (slug) DO UPDATE SET name = authors.name
                   RETURNING id""",
                (_slug_or_hash(name), name),
            ).fetchone()
            assert author is not None
            if author[0] in seen:
                continue
            seen.add(author[0])
            conn.execute(
                "INSERT INTO paper_authors (paper_id, author_id, position) VALUES (%s, %s, %s)",
                (paper_id, author[0], position),
            )

        conn.execute("DELETE FROM paper_topics WHERE paper_id = %s", (paper_id,))
        for category in dict.fromkeys(paper.categories):
            topic = conn.execute(
                """INSERT INTO topics (slug, label) VALUES (%s, %s)
                   ON CONFLICT (slug) DO UPDATE SET label = topics.label
                   RETURNING id""",
                (_slug_or_hash(category), category),
            ).fetchone()
            assert topic is not None
            conn.execute(
                "INSERT INTO paper_topics (paper_id, topic_id) VALUES (%s, %s) ON CONFLICT DO NOTHING",
                (paper_id, topic[0]),
            )
    return paper_id


def count_rows(conn: psycopg.Connection) -> dict[str, int]:
    tables = ("papers", "authors", "paper_authors", "topics", "paper_topics")
    return {t: conn.execute(f"SELECT count(*) FROM {t}").fetchone()[0] for t in tables}  # type: ignore[index]
