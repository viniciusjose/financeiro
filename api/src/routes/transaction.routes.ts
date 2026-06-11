import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { transactionController } from "@/controllers/index.js";
import {
  createTransactionSchema,
  deleteTransactionSchema,
  listTransactionsSchema,
  transactionIdSchema,
  updateTransactionSchema,
} from "./schemas/transaction.schema.js";

export async function transactionRoutes(app: FastifyInstance) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  typedApp.get("/transactions", {
    schema: listTransactionsSchema,
    preHandler: [app.authenticate],
    handler: transactionController.list,
  });

  typedApp.get("/transactions/:id", {
    schema: transactionIdSchema,
    preHandler: [app.authenticate],
    handler: transactionController.getById,
  });

  typedApp.post("/transactions", {
    schema: createTransactionSchema,
    preHandler: [app.authenticate],
    handler: transactionController.create,
  });

  typedApp.put("/transactions/:id", {
    schema: updateTransactionSchema,
    preHandler: [app.authenticate],
    handler: transactionController.update,
  });

  typedApp.delete("/transactions/:id", {
    schema: deleteTransactionSchema,
    preHandler: [app.authenticate],
    handler: transactionController.delete,
  });
}
