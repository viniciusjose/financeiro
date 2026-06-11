import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { creditCardController } from "@/controllers/index.js";
import {
  createCreditCardSchema,
  creditCardIdSchema,
  getCreditCardBillSchema,
  listCreditCardsSchema,
  updateCreditCardSchema,
} from "./schemas/credit-card.schema.js";

export async function creditCardRoutes(app: FastifyInstance) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  typedApp.get("/credit-cards", {
    schema: listCreditCardsSchema,
    preHandler: [app.authenticate],
    handler: creditCardController.list,
  });

  typedApp.get("/credit-cards/:id", {
    schema: creditCardIdSchema,
    preHandler: [app.authenticate],
    handler: creditCardController.getById,
  });

  typedApp.get("/credit-cards/:id/bill", {
    schema: getCreditCardBillSchema,
    preHandler: [app.authenticate],
    handler: creditCardController.getBill,
  });

  typedApp.post("/credit-cards", {
    schema: createCreditCardSchema,
    preHandler: [app.authenticate],
    handler: creditCardController.create,
  });

  typedApp.put("/credit-cards/:id", {
    schema: updateCreditCardSchema,
    preHandler: [app.authenticate],
    handler: creditCardController.update,
  });

  typedApp.delete("/credit-cards/:id", {
    schema: creditCardIdSchema,
    preHandler: [app.authenticate],
    handler: creditCardController.delete,
  });
}
