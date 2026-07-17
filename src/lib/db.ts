import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// To prevent exhausting PostgreSQL connections in development,
// we store the Prisma Client in a global variable.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Create a PostgreSQL connection pool using our database URL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create the Prisma PG adapter
const adapter = new PrismaPg(pool);

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
