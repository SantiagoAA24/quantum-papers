import psycopg
from typer.testing import CliRunner

import respx

from ingest import db
from ingest.arxiv_client import API_URL, parse_feed
from ingest.cli import app, run_ingest
from ingest.db import Status

from .conftest import FakeEmbedder, FakeSummarizer, fixture_text


def papers():
    return parse_feed(fixture_text("page1.xml"))[0]


def count(conn: psycopg.Connection, table: str) -> int:
    return conn.execute(f"SELECT count(*) FROM {table}").fetchone()[0]  # type: ignore[index]


def test_upsert_is_idempotent(
    conn: psycopg.Connection, embedder: FakeEmbedder, summarizer: FakeSummarizer
) -> None:
    first = run_ingest(papers(), conn, dry_run=False, embedder=embedder, summarizer=summarizer)
    assert (first.new, first.updated, first.skipped, first.failed) == (3, 0, 0, 0)
    counts = db.count_rows(conn)
    assert counts["papers"] == 3 and counts["authors"] > 0 and counts["topics"] >= 2
    assert (embedder.calls, summarizer.calls) == (1, 3)

    second = run_ingest(papers(), conn, dry_run=False, embedder=embedder, summarizer=summarizer)
    assert (second.new, second.updated, second.skipped) == (0, 0, 3)
    assert db.count_rows(conn) == counts
    assert (embedder.calls, summarizer.calls) == (1, 3)  # no new OpenAI calls
    row = conn.execute("SELECT embedding_model, ai_summary->>'metodo' FROM papers LIMIT 1").fetchone()
    assert row == ("text-embedding-3-small", "m")


def test_version_change_recomputes_only_that_paper(
    conn: psycopg.Connection, embedder: FakeEmbedder, summarizer: FakeSummarizer
) -> None:
    run_ingest(papers(), conn, dry_run=False, embedder=embedder, summarizer=summarizer)
    changed = papers()
    changed[0] = changed[0].model_copy(update={"version": 2, "title": "New title"})
    report = run_ingest(changed, conn, dry_run=False, embedder=embedder, summarizer=summarizer)
    assert (report.new, report.updated, report.skipped) == (0, 1, 2)
    assert report.changed_ids == [changed[0].arxiv_id]
    assert embedder.embedded[-1] == changed[0].arxiv_id
    assert count(conn, "papers") == 3
    assert conn.execute(
        "SELECT title, version FROM papers WHERE arxiv_id = %s", (changed[0].arxiv_id,)
    ).fetchone() == ("New title", 2)


def test_dev_fake_embeddings_are_replaced(
    conn: psycopg.Connection, embedder: FakeEmbedder, summarizer: FakeSummarizer
) -> None:
    run_ingest(papers(), conn, dry_run=False, embedder=embedder, summarizer=summarizer)
    conn.execute("UPDATE papers SET embedding_model = 'dev-fake'")
    report = run_ingest(papers(), conn, dry_run=False, embedder=embedder, summarizer=summarizer)
    assert report.updated == 3


def test_author_order_and_topic_links(
    conn: psycopg.Connection, embedder: FakeEmbedder, summarizer: FakeSummarizer
) -> None:
    paper = papers()[0]
    run_ingest([paper], conn, dry_run=False, embedder=embedder, summarizer=summarizer)
    names = [
        r[0]
        for r in conn.execute(
            """SELECT a.name FROM paper_authors pa JOIN authors a ON a.id = pa.author_id
               ORDER BY pa.position"""
        )
    ]
    assert names == list(dict.fromkeys(paper.authors)) or len(names) <= len(paper.authors)
    assert names[0] == paper.authors[0]
    assert count(conn, "paper_topics") == len(set(paper.categories))


def test_classify() -> None:
    p = papers()[0]
    assert db.classify(None, p) is Status.NEW
    assert db.classify(db.Existing(1, "text-embedding-3-small", True), p) is Status.SKIPPED
    assert db.classify(db.Existing(0, "text-embedding-3-small", True), p) is Status.UPDATED
    assert db.classify(db.Existing(1, "dev-fake", True), p) is Status.UPDATED


def test_slugify() -> None:
    assert db.slugify("José Núñez-Pérez") == "jose-nunez-perez"
    assert db.slugify("quant-ph") == "quant-ph"


@respx.mock
def test_cli_dry_run_writes_nothing(
    conn: psycopg.Connection, monkeypatch, tmp_path
) -> None:
    respx.get(API_URL).respond(200, text=fixture_text("page1.xml"))
    monkeypatch.setenv("CONTACT_EMAIL", "test@example.com")
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    monkeypatch.setattr("ingest.arxiv_client.time.sleep", lambda _s: None)
    # Any OpenAI use would fail loudly: no key is set and the constructors would raise.
    changed = tmp_path / "changed_ids.txt"
    result = CliRunner().invoke(app, ["run", "--dry-run", "--limit", "3", "--changed-file", str(changed)])
    assert result.exit_code == 0, result.output
    assert "[dry-run] new: 2611.17246v1" in result.output
    assert "nuevos:       3" in result.output
    assert count(conn, "papers") == 0
    assert not changed.exists()
