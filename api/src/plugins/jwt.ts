import jwt from "@fastify/jwt";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { env } from "@/config/env.js";

const ACCESS_TOKEN_EXPIRES_IN = "1h";
const REFRESH_TOKEN_EXPIRES_IN = "3h";

export async function registerJwt(app: FastifyInstance) {
  await app.register(jwt, {
    secret: env.JWT_SECRET,
    namespace: "access",
    sign: {
      expiresIn: ACCESS_TOKEN_EXPIRES_IN,
    },
  });

  await app.register(jwt, {
    secret: env.JWT_REFRESH_SECRET,
    namespace: "refresh",
    sign: {
      expiresIn: REFRESH_TOKEN_EXPIRES_IN,
    },
  });

  app.decorate("authenticate", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.accessJwtVerify();
    } catch {
      return reply.status(401).send({
        success: false,
        message: "Token inválido ou expirado",
      });
    }
  });
}

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}
