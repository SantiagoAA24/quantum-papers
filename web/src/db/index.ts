import { Pool as NeonPool, neonConfig } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import ws from "ws";

import * as schema from "./schema.ts";

export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;

// Node has no global WebSocket constructor compatible with the Neon driver.
neonConfig.webSocketConstructor = ws;

function isLocal(connectionString: string): boolean {
  const { hostname } = new URL(connectionString);
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

/**
 * Neon (WebSocket Pool) for remote URLs; plain node-postgres Pool for a local
 * Postgres, because the Neon driver cannot talk to a server without its proxy.
 * Both support interactive transactions (SET LOCAL ...).
 */
export async function createDb(connectionString = process.env.DATABASE_URL) {
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  if (isLocal(connectionString)) {
    const { Pool } = await import("pg");
    const { drizzle } = await import("drizzle-orm/node-postgres");
    const { migrate } = await import("drizzle-orm/node-postgres/migrator");
    const pool = new Pool({ connectionString });
    const db = drizzle(pool, { schema });
    return {
      db: db as Db,
      close: () => pool.end(),
      migrate: (folder: string) => migrate(db, { migrationsFolder: folder }),
    };
  }
  const { migrate } = await import("drizzle-orm/neon-serverless/migrator");
  const pool = new NeonPool({ connectionString });
  const db = drizzleNeon(pool, { schema });
  return {
    db: db as Db,
    close: () => pool.end(),
    migrate: (folder: string) => migrate(db, { migrationsFolder: folder }),
  };
}

export { schema };
