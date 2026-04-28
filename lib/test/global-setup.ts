import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

/**
 * Vitest globalSetup — runs once before the entire test run.
 *
 * Starts an ephemeral Postgres container, applies drizzle migrations, and
 * exposes the connection URL via process.env.DATABASE_URL so forked test
 * workers inherit it. The container is stopped in teardown.
 */

let container: StartedPostgreSqlContainer | undefined;

export async function setup() {
  container = await new PostgreSqlContainer("postgres:17-alpine").start();
  const uri = container.getConnectionUri();

  const migrationClient = postgres(uri, { max: 1 });
  try {
    await migrate(drizzle(migrationClient), { migrationsFolder: "./drizzle" });
  } finally {
    await migrationClient.end();
  }

  process.env.DATABASE_URL = uri;
}

export async function teardown() {
  await container?.stop();
}
