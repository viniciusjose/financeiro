import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { bankAccountController } from "@/controllers/index.js";
import {
  bankAccountIdSchema,
  createBankAccountSchema,
  listBankAccountsSchema,
  updateBankAccountSchema,
} from "./schemas/bank-account.schema.js";

export async function bankAccountRoutes(app: FastifyInstance) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  typedApp.get("/bank-accounts", {
    schema: listBankAccountsSchema,
    preHandler: [app.authenticate],
    handler: bankAccountController.list,
  });

  typedApp.get("/bank-accounts/:id", {
    schema: bankAccountIdSchema,
    preHandler: [app.authenticate],
    handler: bankAccountController.getById,
  });

  typedApp.post("/bank-accounts", {
    schema: createBankAccountSchema,
    preHandler: [app.authenticate],
    handler: bankAccountController.create,
  });

  typedApp.put("/bank-accounts/:id", {
    schema: updateBankAccountSchema,
    preHandler: [app.authenticate],
    handler: bankAccountController.update,
  });

  typedApp.delete("/bank-accounts/:id", {
    schema: bankAccountIdSchema,
    preHandler: [app.authenticate],
    handler: bankAccountController.delete,
  });
}
