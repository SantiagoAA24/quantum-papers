import httpx
import pytest
import respx

from ingest.arxiv_client import API_URL, DEFAULT_QUERY, ArxivClient, parse_feed

from .conftest import fixture_text


def make_client(sleeps: list[float]) -> ArxivClient:
    return ArxivClient("test@example.com", sleep=sleeps.append, wait_min=1.0, max_attempts=3)


def test_parse_feed_fields() -> None:
    papers, total = parse_feed(fixture_text("page1.xml"))
    assert total == 3168
    assert [p.arxiv_id for p in papers] == ["2611.17246", "2611.16903", "2611.15250"]
    first = papers[0]
    assert first.version == 1
    assert "v1" not in first.arxiv_id
    assert first.title and "\n" not in first.title
    assert first.authors
    assert first.primary_category in first.categories
    assert {"quant-ph", "cs.LG"} <= set(first.categories) | {first.primary_category}
    assert first.pdf_url.startswith("http") and "pdf" in first.pdf_url
    assert first.published_at.tzinfo is not None
    assert first.doi is None


def test_parse_version_and_doi() -> None:
    text = fixture_text("page1.xml").replace("2611.17246v1", "2611.17246v3", 1)
    text = text.replace(
        '<arxiv:primary_category term="quant-ph"/>',
        '<arxiv:primary_category term="quant-ph"/><arxiv:doi>10.1000/xyz</arxiv:doi>',
        1,
    )
    papers, _ = parse_feed(text)
    assert papers[0].version == 3
    assert papers[0].arxiv_id == "2611.17246"
    assert papers[0].doi == "10.1000/xyz"


@respx.mock
def test_request_params_and_user_agent() -> None:
    route = respx.get(API_URL).respond(200, text=fixture_text("page1.xml"))
    list(make_client([]).search(limit=2))
    request = route.calls.last.request
    assert request.url.params["search_query"] == DEFAULT_QUERY
    assert request.url.params["sortBy"] == "submittedDate"
    assert request.url.params["sortOrder"] == "descending"
    assert request.url.params["max_results"] == "2"
    assert "test@example.com" in request.headers["user-agent"]


@respx.mock
def test_pagination_sleeps_between_pages_only() -> None:
    sleeps: list[float] = []
    route = respx.get(API_URL).mock(
        side_effect=[
            httpx.Response(200, text=fixture_text("page1.xml")),
            httpx.Response(200, text=fixture_text("page2.xml")),
        ]
    )
    # limit 5 with pages of 3 (fixture) then 2: simulate by limit=5 -> first request asks 5
    papers = list(make_client(sleeps).search(limit=5))
    assert [p.arxiv_id for p in papers] == [
        "2611.17246", "2611.16903", "2611.15250", "2611.14731", "2611.14006",
    ]
    assert route.call_count == 2
    assert route.calls[1].request.url.params["start"] == "3"
    assert sleeps == [3.0]


@respx.mock
def test_since_stops_pagination() -> None:
    from datetime import date

    route = respx.get(API_URL).respond(200, text=fixture_text("page1.xml"))
    papers = list(make_client([]).search(since=date(2026, 11, 12)))
    assert [p.arxiv_id for p in papers] == ["2611.17246", "2611.16903"]
    assert route.call_count == 1


@respx.mock
@pytest.mark.parametrize("status", [429, 503])
def test_retries_then_succeeds(status: int) -> None:
    sleeps: list[float] = []
    route = respx.get(API_URL).mock(
        side_effect=[httpx.Response(status), httpx.Response(200, text=fixture_text("page1.xml"))]
    )
    papers = list(make_client(sleeps).search(limit=1))
    assert len(papers) == 1
    assert route.call_count == 2
    assert len(sleeps) == 1 and sleeps[0] > 0


@respx.mock
def test_retries_exhausted_raises() -> None:
    route = respx.get(API_URL).respond(503)
    with pytest.raises(httpx.HTTPStatusError):
        list(make_client([]).search(limit=1))
    assert route.call_count == 3


@respx.mock
def test_client_error_not_retried() -> None:
    route = respx.get(API_URL).respond(400)
    with pytest.raises(httpx.HTTPStatusError):
        list(make_client([]).search(limit=1))
    assert route.call_count == 1
