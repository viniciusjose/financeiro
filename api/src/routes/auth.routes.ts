import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { authController } from "@/controllers/index.js";
import { loginSchema, registerSchema } from "./schemas/auth.schema.js";

export async function authRoutes(app: FastifyInstance) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  typedApp.post("/auth/register", {
    schema: registerSchema,
    handler: authController.register,
  });

  typedApp.post("/auth/login", {
    schema: loginSchema,
    handler: authController.login,
  });

  typedApp.get("/auth/me", {
    preHandler: [app.authenticate],
    handler: authController.me,
  });
}
