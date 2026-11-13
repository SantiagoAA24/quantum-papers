"""AI summaries as validated JSON."""

import json
import logging
import os
from datetime import date

from openai import OpenAI
from pydantic import ValidationError

from ingest.embed import make_client
from ingest.models import Paper, Summary

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = (
    "Eres un asistente que resume papers científicos de aprendizaje automático cuántico. "
    "Responde solo con un objeto JSON con las claves 'problema', 'metodo' y 'resultado'. "
    "Cada valor es una o dos frases en español, fieles al resumen del paper, sin inventar datos."
)


class Summarizer:
    def __init__(self, client: OpenAI | None = None, model: str | None = None) -> None:
        self._client = client or make_client()
        model = model or os.environ.get("SUMMARY_MODEL")
        if not model:
            raise RuntimeError("Set SUMMARY_MODEL (model or Azure deployment name).")
        self.model = model
        self.calls = 0

    def summarize(self, paper: Paper) -> Summary | None:
        """Return a validated summary, or None after one failed retry."""
        for attempt in (1, 2):
            self.calls += 1
            try:
                response = self._client.chat.completions.create(
                    model=self.model,
                    response_format={"type": "json_object"},
                    messages=[
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": f"{paper.title}\n\n{paper.abstract}"},
                    ],
                )
                data = json.loads(response.choices[0].message.content or "")
                return Summary.model_validate(
                    {**data, "modelo": self.model, "fecha": date.today().isoformat()}
                )
            except (ValidationError, ValueError, TypeError, AttributeError) as exc:
                logger.warning(
                    "Invalid summary for %s (attempt %d/2): %s", paper.arxiv_id, attempt, exc
                )
        logger.warning("Leaving ai_summary null for %s", paper.arxiv_id)
        return None
