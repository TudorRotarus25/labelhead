import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Creates a Drizzle database instance connected to the given Postgres URL.
 * Used directly in tests to inject a test database connection.
 * @param url - Postgres connection string. Defaults to DATABASE_URL env var.
 */
export function createDb(url?: string) {
  const connectionString = url ?? process.env.DATABASE_URL!;
  const client = postgres(connectionString, { ssl: needsSsl(connectionString) ? "require" : false });
  return drizzle(client, { schema });
}

function needsSsl(url: string): boolean {
  const { hostname, searchParams } = new URL(url);
  if (searchParams.get("sslmode") === "disable") return false;
  return hostname !== "localhost" && hostname !== "127.0.0.1";
}

/** Default database singleton for production use. */
export const db = createDb();

/** The Drizzle database instance type, for function signatures. */
export type Database = ReturnType<typeof createDb>;
