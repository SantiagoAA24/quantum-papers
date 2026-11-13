import "server-only";

import { EMBEDDING_DIMENSIONS, embeddingsProvider } from "./config";
import { DataUnavailableError } from "./errors";

type EmbeddingsResponse = { data?: { index: number; embedding: number[] }[] };

/** Embeds one query string with the configured provider (plain fetch, no SDK). */
export async function embedQuery(text: string): Promise<number[]> {
  const provider = embeddingsProvider();
  if (!provider) {
    throw new DataUnavailableError(
      "No embeddings provider configured (OPENAI_API_KEY or AZURE_OPENAI_API_KEY)",
    );
  }

  const url =
    provider.kind === "azure"
      ? `${provider.endpoint}/openai/deployments/${encodeURIComponent(provider.deployment)}/embeddings?api-version=${encodeURIComponent(provider.apiVersion)}`
      : "https://api.openai.com/v1/embeddings";
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (provider.kind === "azure") headers["api-key"] = provider.apiKey;
  else headers.authorization = `Bearer ${provider.apiKey}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ model: provider.model, input: text }),
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
  } catch (cause) {
    throw new DataUnavailableError("Embeddings request failed", { cause });
  }
  if (!response.ok) {
    throw new DataUnavailableError(`Embeddings provider returned ${response.status}`);
  }

  const body = (await response.json()) as EmbeddingsResponse;
  const vector = body.data?.[0]?.embedding;
  if (!vector || vector.length !== EMBEDDING_DIMENSIONS) {
    throw new DataUnavailableError(
      `Expected ${EMBEDDING_DIMENSIONS} dimensions, got ${vector?.length ?? 0}`,
    );
  }
  return vector;
}
