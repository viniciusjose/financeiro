import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { categoryController } from "@/controllers/index.js";
import {
  categoryIdSchema,
  createCategorySchema,
  listCategoriesSchema,
  updateCategorySchema,
} from "./schemas/category.schema.js";

export async function categoryRoutes(app: FastifyInstance) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  typedApp.get("/categories", {
    schema: listCategoriesSchema,
    preHandler: [app.authenticate],
    handler: categoryController.list,
  });

  typedApp.get("/categories/:id", {
    schema: categoryIdSchema,
    preHandler: [app.authenticate],
    handler: categoryController.getById,
  });

  typedApp.post("/categories", {
    schema: createCategorySchema,
    preHandler: [app.authenticate],
    handler: categoryController.create,
  });

  typedApp.put("/categories/:id", {
    schema: updateCategorySchema,
    preHandler: [app.authenticate],
    handler: categoryController.update,
  });

  typedApp.delete("/categories/:id", {
    schema: categoryIdSchema,
    preHandler: [app.authenticate],
    handler: categoryController.delete,
  });
}
