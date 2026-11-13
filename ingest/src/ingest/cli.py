"""ingest CLI: `python -m ingest.cli run [--since] [--limit] [--query] [--dry-run]`."""

import logging
import os
from dataclasses import dataclass, field
from datetime import date, datetime
from pathlib import Path
from typing import Annotated, Protocol

import psycopg
import typer

from ingest import db
from ingest.arxiv_client import DEFAULT_QUERY, ArxivClient
from ingest.db import Status
from ingest.embed import BATCH_SIZE
from ingest.models import Paper, Summary

app = typer.Typer(help="Ingest arXiv papers into Postgres.", no_args_is_help=True)
logger = logging.getLogger("ingest")


class EmbedderLike(Protocol):
    model: str
    calls: int

    def embed(self, papers: "list[Paper]") -> list[list[float]]: ...


class SummarizerLike(Protocol):
    calls: int

    def summarize(self, paper: Paper) -> Summary | None: ...


@dataclass
class Report:
    new: int = 0
    updated: int = 0
    skipped: int = 0
    failed: int = 0
    embedding_calls: int = 0
    summary_calls: int = 0
    changed_ids: list[str] = field(default_factory=list)

    def render(self, dry_run: bool) -> str:
        title = "Resumen (dry-run: no se escribió nada)" if dry_run else "Resumen"
        return (
            f"{title}\n"
            f"  nuevos:       {self.new}\n"
            f"  actualizados: {self.updated}\n"
            f"  omitidos:     {self.skipped}\n"
            f"  fallidos:     {self.failed}\n"
            f"  llamadas a embeddings: {self.embedding_calls}\n"
            f"  llamadas a resúmenes:  {self.summary_calls}"
        )


def _parse_since(value: str | None) -> date | None:
    if value is None:
        return None
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except ValueError as exc:
        raise typer.BadParameter("use el formato YYYY-MM-DD") from exc


def run_ingest(
    papers: list[Paper],
    conn: psycopg.Connection | None,
    *,
    dry_run: bool,
    embedder: EmbedderLike | None = None,
    summarizer: SummarizerLike | None = None,
) -> Report:
    """Core pipeline, separated from the CLI so tests can inject fakes."""
    report = Report()
    todo: list[tuple[Paper, Status]] = []
    for paper in papers:
        existing = db.get_existing(conn, paper.arxiv_id) if conn else None
        status = db.classify(existing, paper)
        if status is Status.SKIPPED:
            report.skipped += 1
        else:
            todo.append((paper, status))

    if dry_run:
        for paper, status in todo:
            typer.echo(f"[dry-run] {status.value}: {paper.arxiv_id}v{paper.version} {paper.title[:70]}")
            report.new += status is Status.NEW
            report.updated += status is Status.UPDATED
        return report

    assert conn is not None and embedder is not None and summarizer is not None
    for i in range(0, len(todo), BATCH_SIZE):
        chunk = todo[i : i + BATCH_SIZE]
        try:
            vectors = embedder.embed([p for p, _ in chunk])
        except Exception as exc:  # whole batch failed: count each paper
            logger.error("Embedding batch failed: %s", exc)
            report.failed += len(chunk)
            continue
        for (paper, status), vector in zip(chunk, vectors, strict=True):
            try:
                summary = summarizer.summarize(paper)
                db.upsert_paper(conn, paper, vector, summary, embedder.model)
            except Exception as exc:
                logger.error("Failed %s: %s", paper.arxiv_id, exc)
                report.failed += 1
                continue
            report.new += status is Status.NEW
            report.updated += status is Status.UPDATED
            report.changed_ids.append(paper.arxiv_id)
    report.embedding_calls = embedder.calls
    report.summary_calls = summarizer.calls
    return report


@app.callback()
def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")


@app.command()
def run(
    since: Annotated[str | None, typer.Option(help="Solo papers enviados desde YYYY-MM-DD.")] = None,
    limit: Annotated[int | None, typer.Option(min=1, help="Máximo de papers a traer.")] = None,
    dry_run: Annotated[bool, typer.Option("--dry-run", help="No escribe en la base ni llama a OpenAI.")] = False,
    query: Annotated[str, typer.Option(help="Consulta de arXiv.")] = DEFAULT_QUERY,
    changed_file: Annotated[Path, typer.Option(help="Archivo con los arxiv_id tocados.")] = Path("changed_ids.txt"),
) -> None:
    contact = os.environ.get("CONTACT_EMAIL")
    if not contact:
        raise typer.BadParameter("CONTACT_EMAIL no está definido (se envía en el User-Agent).")
    since_date = _parse_since(since)
    papers = list(ArxivClient(contact).search(query, since=since_date, limit=limit))
    typer.echo(f"arXiv devolvió {len(papers)} papers.")

    database_url = os.environ.get("DATABASE_URL")
    if not dry_run and not database_url:
        raise typer.BadParameter("DATABASE_URL no está definido.")
    conn = db.connect(database_url) if database_url else None
    try:
        if dry_run:
            report = run_ingest(papers, conn, dry_run=True)
        else:
            from ingest.embed import Embedder
            from ingest.summarize import Summarizer

            assert conn is not None
            before = db.count_rows(conn)
            typer.echo(f"Filas antes: {before}")
            report = run_ingest(papers, conn, dry_run=False, embedder=Embedder(), summarizer=Summarizer())
            typer.echo(f"Filas después: {db.count_rows(conn)}")
    finally:
        if conn:
            conn.close()

    typer.echo(report.render(dry_run))
    if not dry_run:
        changed_file.write_text("".join(f"{i}\n" for i in report.changed_ids))
        typer.echo(f"{len(report.changed_ids)} arxiv_id escritos en {changed_file}")
    if report.failed:
        raise typer.Exit(1)


if __name__ == "__main__":
    app()
