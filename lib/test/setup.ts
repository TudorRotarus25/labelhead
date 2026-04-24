import dotenv from "dotenv";
import { sql } from "drizzle-orm";
import { createDb, type Database } from "@/lib/db";

dotenv.config({ path: ".env.test.local" });
dotenv.config({ path: ".env.local" });

/** Shared test database instance. */
export const testDb: Database = createDb(process.env.DATABASE_URL);

/**
 * Truncates the notes table for test isolation.
 * Call in `beforeEach` to start each test with a clean slate.
 */
export async function cleanDatabase() {
  await testDb.execute(sql`TRUNCATE TABLE notes CASCADE`);
}
