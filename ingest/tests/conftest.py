import os
import re
from collections.abc import Iterator
from pathlib import Path

import psycopg
import pytest
from pgvector.psycopg import register_vector

from ingest.models import EMBEDDING_DIMENSIONS, Paper, Summary

FIXTURES = Path(__file__).parent / "fixtures"
MIGRATION = next((Path(__file__).parents[2] / "web/src/db/migrations").glob("0000_*.sql"))
TEST_SCHEMA = "test_ingest"


def fixture_text(name: str) -> str:
    return (FIXTURES / name).read_text()


class FakeEmbedder:
    model = "text-embedding-3-small"

    def __init__(self) -> None:
        self.calls = 0
        self.embedded: list[str] = []

    def embed(self, papers: list[Paper]) -> list[list[float]]:
        self.calls += 1
        self.embedded += [p.arxiv_id for p in papers]
        return [[1.0] + [0.0] * (EMBEDDING_DIMENSIONS - 1) for _ in papers]


class FakeSummarizer:
    def __init__(self) -> None:
        self.calls = 0

    def summarize(self, paper: Paper) -> Summary | None:
        self.calls += 1
        return Summary(problema="p", metodo="m", resultado="r", modelo="fake", fecha="2026-01-01")


@pytest.fixture
def embedder() -> FakeEmbedder:
    return FakeEmbedder()


@pytest.fixture
def summarizer() -> FakeSummarizer:
    return FakeSummarizer()


@pytest.fixture
def conn() -> Iterator[psycopg.Connection]:
    """Connection on a throwaway schema of the dev database, dropped afterwards."""
    url = os.environ.get("DATABASE_URL")
    if not url:
        pytest.skip("DATABASE_URL not set; skipping database tests")
    connection = psycopg.connect(url, autocommit=True)
    try:
        connection.execute(f"DROP SCHEMA IF EXISTS {TEST_SCHEMA} CASCADE")
        connection.execute(f"CREATE SCHEMA {TEST_SCHEMA}")
        connection.execute(f"SET search_path = {TEST_SCHEMA}, public")
        register_vector(connection)
        sql = MIGRATION.read_text().replace('"public".', "")
        for statement in re.split(r"--> statement-breakpoint", sql):
            if statement.strip():
                connection.execute(statement)
        yield connection
    finally:
        connection.execute(f"DROP SCHEMA IF EXISTS {TEST_SCHEMA} CASCADE")
        connection.close()
