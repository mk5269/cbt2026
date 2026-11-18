import { existsSync } from "node:fs";
import path from "node:path";
import EmbeddedPostgres from "embedded-postgres";

const databaseDir = path.join(process.cwd(), ".pgdata");
const pg = new EmbeddedPostgres({
  databaseDir,
  user: "postgres",
  password: "postgres",
  port: 5433,
  persistent: true,
  autoRehydrateSymlinks: true,
  initdbFlags: ["--encoding=UTF8", "--locale=C"],
});

if (!existsSync(path.join(databaseDir, "PG_VERSION"))) {
  await pg.initialise();
}

await pg.start();

try {
  await pg.createDatabase("cbt2026");
  console.log("created database cbt2026");
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  if (!message.toLowerCase().includes("already exists")) throw error;
  console.log("database cbt2026 already exists");
}

console.log("Postgres is ready at postgresql://postgres:postgres@localhost:5433/cbt2026");
console.log("Leave this terminal open while developing. Stop it with Ctrl+C.");
process.stdin.resume();
