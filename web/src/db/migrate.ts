import { migrate } from "drizzle-orm/neon-serverless/migrator";

import { createDb } from "./index";

const { db, pool } = createDb();
migrate(db, { migrationsFolder: "./src/db/migrations" })
  .then(() => console.log("Migrations applied."))
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
