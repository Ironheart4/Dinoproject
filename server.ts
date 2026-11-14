import { app, setPrismaClient } from "./app";
import { env } from "./config/env";
import { logger } from "./core/logger";
import { createPrismaClient } from "./infrastructure/prisma/client";

async function startServer(): Promise<void> {
  const { prisma, pool } = await createPrismaClient(env.databaseUrl);
  setPrismaClient(prisma);

  const port = env.port;
  const server = app.listen(port, () => {
    logger.info(`Server running at http://localhost:${port}`);
  });

  const shutdown = (signal: string) => {
    logger.info(`${signal} received, shutting down gracefully`);
    server.close(async () => {
      await prisma.$disconnect();
      await pool.end();
      process.exit(0);
    });
  };
  process.once("SIGTERM", () => shutdown("SIGTERM"));
  process.once("SIGINT", () => shutdown("SIGINT"));
}

process.on("uncaughtException", (error) => logger.error("Uncaught Exception", error));
process.on("unhandledRejection", (reason) => logger.error("Unhandled Rejection", reason));

void startServer().catch((error) => {
  logger.error("Failed to start server", error);
  process.exitCode = 1;
});
