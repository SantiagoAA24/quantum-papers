import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";

import * as schema from "./schema";

// Node has no global WebSocket constructor compatible with the Neon driver.
neonConfig.webSocketConstructor = ws;

export function createDb(connectionString = process.env.DATABASE_URL) {
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  const pool = new Pool({ connectionString });
  return { db: drizzle(pool, { schema }), pool };
}

export { schema };
