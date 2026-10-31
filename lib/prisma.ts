import dns from "dns";
import { promisify } from "util";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const lookup4 = promisify(dns.lookup);

export async function createPrismaClient(connectionString: string): Promise<{ prisma: PrismaClient; pool: Pool }> {
  let resolvedConnectionString = connectionString;
  try {
    const url = new URL(connectionString);
    const result = await lookup4(url.hostname, { family: 4 });
    url.hostname = typeof result === "string" ? result : result.address;
    resolvedConnectionString = url.toString();
  } catch (error) {
    console.error("Failed to resolve hostname to IPv4, using original:", error);
  }
  const pool = new Pool({ connectionString: resolvedConnectionString });
  pool.on("error", (error) => console.error("Unexpected pool error:", error));
  return { prisma: new PrismaClient({ adapter: new PrismaPg(pool) }), pool };
}
