import { app, setPrismaClient } from "./app";
import { env } from "./config/env";
import { createPrismaClient } from "./lib/prisma";

async function startServer(): Promise<void> {
  const { prisma, pool } = await createPrismaClient(env.databaseUrl);
  setPrismaClient(prisma);

  const port = env.port;
  const server = app.listen(port, () => console.log(`Server running at http://localhost:${port}`));
  const shutdown = (signal: string) => {
    console.log(`${signal} received, shutting down gracefully`);
    server.close(async () => {
      await prisma.$disconnect();
      await pool.end();
      process.exit(0);
    });
  };
  process.once("SIGTERM", () => shutdown("SIGTERM"));
  process.once("SIGINT", () => shutdown("SIGINT"));
}

process.on("uncaughtException", (error) => console.error("Uncaught Exception:", error));
process.on("unhandledRejection", (reason) => console.error("Unhandled Rejection:", reason));

void startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exitCode = 1;
});
