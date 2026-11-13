import "server-only";

/** The database (or the embeddings provider) could not be reached. Pages map it to the 503 state. */
export class DataUnavailableError extends Error {
  override name = "DataUnavailableError";
  constructor(message = "Data source unavailable", options?: { cause?: unknown }) {
    super(message, options);
  }
}

export type InvalidQueryReason = "too_short" | "too_long";

export class InvalidQueryError extends Error {
  override name = "InvalidQueryError";
  readonly reason: InvalidQueryReason;
  constructor(reason: InvalidQueryReason, message: string) {
    super(message);
    this.reason = reason;
  }
}

/** Stored vectors were computed with a different model than the one used for queries. */
export class EmbeddingModelMismatchError extends Error {
  override name = "EmbeddingModelMismatchError";
  readonly expected: string;
  readonly found: string;
  constructor(expected: string, found: string) {
    super(`Query model "${expected}" does not match stored embeddings ("${found}")`);
    this.expected = expected;
    this.found = found;
  }
}

export class InvalidArgumentError extends Error {
  override name = "InvalidArgumentError";
}
