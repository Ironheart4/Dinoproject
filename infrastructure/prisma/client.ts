import dns from "dns";
import { promisify } from "util";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { logger } from "../../core/logger";

const lookup4 = promisify(dns.lookup);

/**
 * Creates the Prisma client on a Postgres pool. The database host is resolved to IPv4 first because
 * some hosts (for example Render) cannot reach Supabase over IPv6; if resolution fails the original
 * connection string is used.
 */
export async function createPrismaClient(
  connectionString: string,
): Promise<{ prisma: PrismaClient; pool: Pool }> {
  let resolvedConnectionString = connectionString;
  try {
    const url = new URL(connectionString);
    const result = await lookup4(url.hostname, { family: 4 });
    url.hostname = typeof result === "string" ? result : result.address;
    resolvedConnectionString = url.toString();
  } catch (error) {
    logger.warn("Failed to resolve database hostname to IPv4, using the original", { message: String(error) });
  }
  const pool = new Pool({ connectionString: resolvedConnectionString });
  pool.on("error", (error) => logger.error("Unexpected database pool error", { message: String(error) }));
  return { prisma: new PrismaClient({ adapter: new PrismaPg(pool) }), pool };
}
