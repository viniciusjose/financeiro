import type { FastifyInstance } from "fastify";
import { authRoutes } from "./auth.routes.js";
import { healthRoutes } from "./health.routes.js";
import { transactionRoutes } from "./transaction.routes.js";

export async function registerRoutes(app: FastifyInstance) {
  await app.register(healthRoutes);
  await app.register(authRoutes, { prefix: "/api" });
  await app.register(transactionRoutes, { prefix: "/api" });
}
