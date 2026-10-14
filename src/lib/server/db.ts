import "server-only";
import { PrismaClient } from "@prisma/client";

// Reuse one client across hot reloads in dev.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Supabase is a network hop away: give interactive transactions more headroom
// than Prisma's 5s default (product saves run many statements in one transaction).
export const db =
  globalForPrisma.prisma ??
  new PrismaClient({ transactionOptions: { timeout: 20_000, maxWait: 10_000 } });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
