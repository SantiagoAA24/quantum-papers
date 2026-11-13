import "server-only";

/**
 * Single place in web/ that names the embedding model. It must match the model
 * used by the ingest (ingest/src/ingest/models.py); searchPapers also checks
 * it against papers.embedding_model so a mismatch fails loudly.
 */
export const EMBEDDING_DIMENSIONS = 1536;

export function embeddingModel(): string {
  return process.env.EMBEDDING_MODEL || "text-embedding-3-small";
}

export type EmbeddingsProvider =
  | { kind: "openai"; apiKey: string; model: string }
  | {
      kind: "azure";
      apiKey: string;
      endpoint: string;
      deployment: string;
      apiVersion: string;
      model: string;
    };

/** Azure when AZURE_OPENAI_API_KEY is set, otherwise OpenAI (same rule as the ingest). */
export function embeddingsProvider(): EmbeddingsProvider | null {
  const model = embeddingModel();
  const azureKey = process.env.AZURE_OPENAI_API_KEY;
  const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
  if (azureKey && azureEndpoint) {
    return {
      kind: "azure",
      apiKey: azureKey,
      endpoint: azureEndpoint.replace(/\/+$/, ""),
      deployment: process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT || model,
      apiVersion: process.env.AZURE_OPENAI_API_VERSION || "2024-10-21",
      model,
    };
  }
  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey) return { kind: "openai", apiKey, model };
  return null;
}
