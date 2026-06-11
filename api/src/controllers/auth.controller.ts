import type { FastifyReply, FastifyRequest } from "fastify";
import type { AuthService } from "@/services/auth.service.js";
import { sendError, sendSuccess } from "@/views/response.js";

type AuthUserPayload = {
  id: string;
  email: string;
};

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  register = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = await this.authService.register(
        request.body as {
          email: string;
          name: string;
          birthDate: string;
          password: string;
        },
      );

      const tokens = await this.issueTokens(reply, user);

      return sendSuccess(reply, { user, ...tokens }, 201, "Usuário criado com sucesso");
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

      const tokens = await this.issueTokens(reply, user);

      return sendSuccess(reply, tokens);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao realizar login";
      return sendError(reply, message, 401);
    }
  };

  refresh = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { refreshToken } = request.body as { refreshToken: string };
      const payload = await request.server.jwt.refresh.verify<{ sub: string; email: string }>(
        refreshToken,
      );

      const user = await this.authService.getProfile(payload.sub);

      if (!user) {
        return sendError(reply, "Usuário não encontrado", 404);
      }

      const tokens = await this.issueTokens(reply, user);

      return sendSuccess(reply, tokens, 200, "Token renovado com sucesso");
    } catch {
      return sendError(reply, "Refresh token inválido ou expirado", 401);
    }
  };

  me = async (request: FastifyRequest, reply: FastifyReply) => {
    const user = await this.authService.getProfile(request.user.sub);

    if (!user) {
      return sendError(reply, "Usuário não encontrado", 404);
    }

    return sendSuccess(reply, { user });
  };

  changePassword = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { currentPassword, newPassword } = request.body as {
        currentPassword: string;
        newPassword: string;
      };

      await this.authService.changePassword({
        userId: request.user.sub,
        currentPassword,
        newPassword,
      });

      return sendSuccess(reply, null, 200, "Senha alterada com sucesso");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao alterar senha";
      const statusCode = message === "Senha atual incorreta" ? 401 : 400;
      return sendError(reply, message, statusCode);
    }
  };

  private async issueTokens(reply: FastifyReply, user: AuthUserPayload) {
    const payload = { sub: user.id, email: user.email };

    const [accessToken, refreshToken] = await Promise.all([
      reply.accessJwtSign(payload),
      reply.refreshJwtSign(payload),
    ]);

    return { accessToken, refreshToken };
  }
}
