import type { FastifyReply, FastifyRequest } from "fastify";
import type { AuthService } from "@/services/auth.service.js";
import { sendError, sendSuccess } from "@/views/response.js";

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  register = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = await this.authService.register(
        request.body as {
          email: string;
          name: string;
          password: string;
        },
      );

      const token = await reply.jwtSign({
        sub: user.id,
        email: user.email,
      });

      return sendSuccess(reply, { user, token }, 201, "Usuário criado com sucesso");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao registrar usuário";
      return sendError(reply, message, 400);
    }
  };

  login = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = await this.authService.login(
        request.body as {
          email: string;
          password: string;
        },
      );

      const token = await reply.jwtSign({
        sub: user.id,
        email: user.email,
      });

      return sendSuccess(reply, { user, token }, 200, "Login realizado com sucesso");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao realizar login";
      return sendError(reply, message, 401);
    }
  };

  me = async (request: FastifyRequest, reply: FastifyReply) => {
    return sendSuccess(reply, { user: request.user });
  };
}
