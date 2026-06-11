import type { FastifyReply, FastifyRequest } from "fastify";
import { CategoryDeleteConflictError, type CategoryService } from "@/services/category.service.js";
import { sendError, sendSuccess } from "@/views/response.js";

export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  list = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { type, includeInactive } = request.query as {
        type?: "expense" | "income" | "both";
        includeInactive: boolean;
      };
      const result = await this.categoryService.list(request.user.sub, type, includeInactive);
      return sendSuccess(reply, result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao listar categorias";
      return sendError(reply, message, 500);
    }
  };

  getById = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const result = await this.categoryService.getById(id, request.user.sub);
      return sendSuccess(reply, result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao buscar categoria";
      return sendError(reply, message, 404);
    }
  };

  create = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = request.body as {
        name: string;
        description?: string | null;
        icon: string;
        color: string;
        type: "expense" | "income" | "both";
        spendingLimitCents?: number | null;
        sortOrder?: number;
      };

      const result = await this.categoryService.create({
        userId: request.user.sub,
        name: body.name,
        description: body.description,
        icon: body.icon,
        color: body.color,
        type: body.type,
        spendingLimitCents: body.spendingLimitCents,
        sortOrder: body.sortOrder,
      });

      return sendSuccess(reply, result, 201, "Categoria criada com sucesso");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao criar categoria";
      return sendError(reply, message, 400);
    }
  };

  update = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const body = request.body as {
        name?: string;
        description?: string | null;
        icon?: string;
        color?: string;
        type?: "expense" | "income" | "both";
        spendingLimitCents?: number | null;
        sortOrder?: number;
        isActive?: boolean;
      };

      const result = await this.categoryService.update({
        id,
        userId: request.user.sub,
        name: body.name,
        description: body.description,
        icon: body.icon,
        color: body.color,
        type: body.type,
        spendingLimitCents: body.spendingLimitCents,
        sortOrder: body.sortOrder,
        isActive: body.isActive,
      });

      return sendSuccess(reply, result, 200, "Categoria atualizada com sucesso");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao atualizar categoria";
      const status = message === "Categoria não encontrada" ? 404 : 400;
      return sendError(reply, message, status);
    }
  };

  delete = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      await this.categoryService.delete(id, request.user.sub);
      return sendSuccess(reply, null, 200, "Categoria removida com sucesso");
    } catch (error) {
      if (error instanceof CategoryDeleteConflictError) {
        return sendError(reply, error.message, 409);
      }

      const message = error instanceof Error ? error.message : "Erro ao remover categoria";
      return sendError(reply, message, 404);
    }
  };
}
