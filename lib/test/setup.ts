import { sql } from "drizzle-orm";
import { createDb, type Database } from "@/lib/db";

/** Shared test database instance. Connects to the testcontainer started by globalSetup. */
export const testDb: Database = createDb(process.env.DATABASE_URL);

/**
 * Truncates the notes table for test isolation.
 * Call in `beforeEach` to start each test with a clean slate.
 */
export async function cleanDatabase() {
  await testDb.execute(sql`TRUNCATE TABLE notes CASCADE`);
}
