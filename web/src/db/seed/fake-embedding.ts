import { createHash } from "node:crypto";

export const EMBEDDING_DIMENSIONS = 1536;

/**
 * ============================================================================
 *  FAKE VECTORS - DEVELOPMENT ONLY
 *  These embeddings are NOT semantic. They are derived from a hash of the
 *  arxiv_id so that seeds are reproducible. Rows carry embedding_model =
 *  'dev-fake'. Phase 4 (Python ingest) replaces them with real
 *  text-embedding-3-small vectors.
 * ============================================================================
 */
export const FAKE_EMBEDDING_MODEL = "dev-fake";

/** Deterministic unit-length vector of 1536 floats derived from arxivId. */
export function fakeEmbedding(arxivId: string): number[] {
  const values: number[] = [];
  for (let counter = 0; values.length < EMBEDDING_DIMENSIONS; counter++) {
    const digest = createHash("sha256")
      .update(`${arxivId}:${counter}`)
      .digest();
    // 8 floats per digest: each 4-byte word mapped to [-1, 1).
    for (let i = 0; i + 4 <= digest.length; i += 4) {
      values.push(digest.readUInt32BE(i) / 2 ** 31 - 1);
    }
  }
  values.length = EMBEDDING_DIMENSIONS;
  const norm = Math.sqrt(values.reduce((s, v) => s + v * v, 0));
  return values.map((v) => v / norm);
}
