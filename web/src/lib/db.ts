import "server-only";

import { createDb, type Db } from "@/db";
import {
  DataUnavailableError,
  EmbeddingModelMismatchError,
  InvalidArgumentError,
  InvalidQueryError,
} from "./errors";

type Handle = { url: string; db: Db; close: () => Promise<void> };

let handle: Promise<Handle> | null = null;
let handleUrl: string | undefined;

/** Lazy shared client. Re-created if DATABASE_URL changes (used by the integration tests). */
export async function getDb(): Promise<Db> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new DataUnavailableError("DATABASE_URL is not set");
  if (!handle || handleUrl !== url) {
    handleUrl = url;
    handle = createDb(url).then((h) => ({ url, db: h.db, close: h.close }));
  }
  try {
    return (await handle).db;
  } catch (cause) {
    handle = null;
    throw new DataUnavailableError("Could not create database client", { cause });
  }
}

export async function closeDb(): Promise<void> {
  const current = handle;
  handle = null;
  if (current) await (await current).close();
}

/** Runs a data access function; any driver failure becomes DataUnavailableError. */
export async function withDb<T>(fn: (db: Db) => Promise<T>): Promise<T> {
  const db = await getDb();
  try {
    return await fn(db);
  } catch (error) {
    if (
      error instanceof DataUnavailableError ||
      error instanceof InvalidQueryError ||
      error instanceof EmbeddingModelMismatchError ||
      error instanceof InvalidArgumentError
    ) {
      throw error;
    }
    throw new DataUnavailableError("Database query failed", { cause: error });
  }
}
