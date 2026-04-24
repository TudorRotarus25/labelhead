import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Creates a Drizzle database instance connected to the given Postgres URL.
 * Used directly in tests to inject a test database connection.
 * @param url - Postgres connection string. Defaults to DATABASE_URL env var.
 */
export function createDb(url?: string) {
  const client = postgres(url ?? process.env.DATABASE_URL!, { ssl: "require" });
  return drizzle(client, { schema });
}

/** Default database singleton for production use. */
export const db = createDb();

/** The Drizzle database instance type, for function signatures. */
export type Database = ReturnType<typeof createDb>;
