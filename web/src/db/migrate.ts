import { createDb } from "./index.ts";

const { close, migrate } = await createDb();
try {
  await migrate("./src/db/migrations");
  console.log("Migrations applied.");
} finally {
  await close();
}
