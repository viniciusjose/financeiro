import type { FastifyInstance } from "fastify";
import { authRoutes } from "./auth.routes.js";
import { bankAccountRoutes } from "./bank-account.routes.js";
import { categoryRoutes } from "./category.routes.js";
import { creditCardRoutes } from "./credit-card.routes.js";
import { healthRoutes } from "./health.routes.js";
import { transactionRoutes } from "./transaction.routes.js";

export async function registerRoutes(app: FastifyInstance) {
  await app.register(healthRoutes);
  await app.register(authRoutes, { prefix: "/api" });
  await app.register(transactionRoutes, { prefix: "/api" });
  await app.register(bankAccountRoutes, { prefix: "/api" });
  await app.register(creditCardRoutes, { prefix: "/api" });
  await app.register(categoryRoutes, { prefix: "/api" });
}
