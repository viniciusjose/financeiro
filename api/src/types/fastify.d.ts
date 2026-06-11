import type { FastifyJwtNamespace } from "@fastify/jwt";
import type { FastifyReply, FastifyRequest } from "fastify";

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: {
      sub: string;
      email: string;
    };
    user: {
      sub: string;
      email: string;
    };
  }
}

declare module "fastify" {
  interface FastifyInstance
    extends FastifyJwtNamespace<{ namespace: "access" }>,
      FastifyJwtNamespace<{ namespace: "refresh" }> {
    jwt: {
      access: {
        verify: <T = { sub: string; email: string }>(token: string) => Promise<T>;
      };
      refresh: {
        verify: <T = { sub: string; email: string }>(token: string) => Promise<T>;
      };
    };
  }

  interface FastifyReply {
    accessJwtSign(payload: { sub: string; email: string }): Promise<string>;
    refreshJwtSign(payload: { sub: string; email: string }): Promise<string>;
  }
}

export type AuthenticatedRequest = FastifyRequest & {
  user: {
    sub: string;
    email: string;
  };
};

export type ControllerHandler = (
  request: FastifyRequest,
  reply: FastifyReply,
) => Promise<FastifyReply | undefined>;
