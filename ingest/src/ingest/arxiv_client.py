"""Client for the arXiv Atom API (export.arxiv.org/api/query)."""

import logging
import re
import time
from collections.abc import Callable, Iterator
from datetime import date, datetime, timezone

import feedparser
import httpx
from tenacity import (
    retry,
    retry_if_exception,
    stop_after_attempt,
    wait_exponential,
)

from ingest.models import Paper

logger = logging.getLogger(__name__)

API_URL = "https://export.arxiv.org/api/query"
DEFAULT_QUERY = "cat:quant-ph AND cat:cs.LG"
PAGE_SIZE = 100
MIN_INTERVAL_SECONDS = 3.0

_ID_RE = re.compile(r"/abs/(?P<id>.+?)(?:v(?P<version>\d+))?$")


def _is_retryable(exc: BaseException) -> bool:
    if isinstance(exc, httpx.HTTPStatusError):
        status = exc.response.status_code
        return status == 429 or status >= 500
    return isinstance(exc, httpx.TransportError)


def _parse_dt(value: str) -> datetime:
    return datetime.fromisoformat(value.replace("Z", "+00:00")).astimezone(timezone.utc)


def parse_feed(text: str) -> tuple[list[Paper], int]:
    """Parse an Atom response into papers and the opensearch total."""
    feed = feedparser.parse(text)
    total = int(feed.feed.get("opensearch_totalresults", 0) or 0)
    papers: list[Paper] = []
    for entry in feed.entries:
        match = _ID_RE.search(entry.id)
        if match is None:
            logger.warning("Skipping entry with unparseable id: %s", entry.id)
            continue
        pdf_url = next(
            (
                link.href
                for link in entry.get("links", [])
                if link.get("title") == "pdf" or link.get("type") == "application/pdf"
            ),
            f"https://arxiv.org/pdf/{match['id']}",
        )
        papers.append(
            Paper(
                arxiv_id=match["id"],
                version=int(match["version"] or 1),
                title=" ".join(entry.title.split()),
                abstract=" ".join(entry.summary.split()),
                authors=[a.name for a in entry.get("authors", [])],
                primary_category=entry.arxiv_primary_category["term"],
                categories=[t["term"] for t in entry.get("tags", [])],
                doi=entry.get("arxiv_doi"),
                pdf_url=pdf_url,
                published_at=_parse_dt(entry.published),
                updated_at=_parse_dt(entry.updated),
            )
        )
    return papers, total


class ArxivClient:
    def __init__(
        self,
        contact_email: str,
        *,
        client: httpx.Client | None = None,
        sleep: Callable[[float], None] = time.sleep,
        wait_min: float = 4.0,
        max_attempts: int = 5,
    ) -> None:
        self._client = client or httpx.Client(timeout=30.0)
        self._headers = {"User-Agent": f"quantum-papers-ingest (mailto:{contact_email})"}
        self._sleep = sleep
        self._fetch = retry(
            retry=retry_if_exception(_is_retryable),
            wait=wait_exponential(multiplier=wait_min, max=60),
            stop=stop_after_attempt(max_attempts),
            sleep=sleep,
            reraise=True,
        )(self._fetch_once)

    def _fetch_once(self, params: dict[str, str | int]) -> str:
        response = self._client.get(API_URL, params=params, headers=self._headers)
        response.raise_for_status()
        return response.text

    def search(
        self,
        query: str = DEFAULT_QUERY,
        *,
        since: date | None = None,
        limit: int | None = None,
    ) -> Iterator[Paper]:
        """Yield papers newest first, one request per page, >= 3 s apart."""
        start = 0
        yielded = 0
        while limit is None or yielded < limit:
            if start > 0:
                self._sleep(MIN_INTERVAL_SECONDS)
            page_size = PAGE_SIZE if limit is None else min(PAGE_SIZE, limit - yielded)
            text = self._fetch(
                {
                    "search_query": query,
                    "start": start,
                    "max_results": page_size,
                    "sortBy": "submittedDate",
                    "sortOrder": "descending",
                }
            )
            papers, total = parse_feed(text)
            if not papers:
                return
            for paper in papers:
                if since is not None and paper.published_at.date() < since:
                    return
                yield paper
                yielded += 1
                if limit is not None and yielded >= limit:
                    return
            start += len(papers)
            if start >= total:
                return
