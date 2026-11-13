"""Embeddings with OpenAI or Azure OpenAI (text-embedding-3-small, 1536 dims)."""

import logging
import os
from collections.abc import Sequence

from openai import AzureOpenAI, OpenAI

from ingest.models import EMBEDDING_DIMENSIONS, EMBEDDING_MODEL, Paper

logger = logging.getLogger(__name__)

BATCH_SIZE = 64


def make_client() -> OpenAI:
    """Azure when AZURE_OPENAI_* is configured, otherwise OpenAI."""
    if os.environ.get("AZURE_OPENAI_API_KEY"):
        return AzureOpenAI(
            api_key=os.environ["AZURE_OPENAI_API_KEY"],
            azure_endpoint=os.environ["AZURE_OPENAI_ENDPOINT"],
            api_version=os.environ.get("AZURE_OPENAI_API_VERSION", "2024-10-21"),
        )
    if os.environ.get("OPENAI_API_KEY"):
        return OpenAI()
    raise RuntimeError("Set OPENAI_API_KEY or AZURE_OPENAI_API_KEY (+ AZURE_OPENAI_ENDPOINT).")


def embedding_input(paper: Paper) -> str:
    return f"{paper.title}\n\n{paper.abstract}"


class Embedder:
    model = EMBEDDING_MODEL

    def __init__(self, client: OpenAI | None = None) -> None:
        self._client = client or make_client()
        # On Azure the "model" is the deployment name.
        self._deployment = (
            os.environ.get("AZURE_OPENAI_EMBEDDING_DEPLOYMENT", EMBEDDING_MODEL)
            if isinstance(self._client, AzureOpenAI)
            else EMBEDDING_MODEL
        )
        self.calls = 0

    def embed(self, papers: Sequence[Paper]) -> list[list[float]]:
        vectors: list[list[float]] = []
        for i in range(0, len(papers), BATCH_SIZE):
            batch = [embedding_input(p) for p in papers[i : i + BATCH_SIZE]]
            self.calls += 1
            response = self._client.embeddings.create(model=self._deployment, input=batch)
            ordered = sorted(response.data, key=lambda d: d.index)
            for item in ordered:
                if len(item.embedding) != EMBEDDING_DIMENSIONS:
                    raise ValueError(f"Expected {EMBEDDING_DIMENSIONS} dims, got {len(item.embedding)}")
                vectors.append(item.embedding)
        return vectors
