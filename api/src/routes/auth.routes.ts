import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { authController } from "@/controllers/index.js";
import {
  changePasswordSchema,
  loginSchema,
  refreshSchema,
  registerSchema,
} from "./schemas/auth.schema.js";

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

  typedApp.post("/auth/refresh", {
    schema: refreshSchema,
    handler: authController.refresh,
  });

  typedApp.get("/auth/me", {
    preHandler: [app.authenticate],
    handler: authController.me,
  });

  typedApp.put("/auth/password", {
    preHandler: [app.authenticate],
    schema: changePasswordSchema,
    handler: authController.changePassword,
  });
}
