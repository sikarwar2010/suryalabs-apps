import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set");
}

/** Pure JS driver — avoids Turbopack breaking on native `pg` externals. */
const queryClient = postgres(databaseUrl, { max: 10 });

const db = drizzle(queryClient);

export default db;
