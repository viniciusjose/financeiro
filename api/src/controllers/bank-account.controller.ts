import type { FastifyReply, FastifyRequest } from "fastify";
import type { BankAccountService } from "@/services/bank-account.service.js";
import { sendError, sendSuccess } from "@/views/response.js";

export class BankAccountController {
  constructor(private readonly bankAccountService: BankAccountService) {}

  list = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { includeInactive } = request.query as { includeInactive: boolean };
      const result = await this.bankAccountService.list(request.user.sub, includeInactive);
      return sendSuccess(reply, result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao listar contas";
      return sendError(reply, message, 500);
    }
  };

  getById = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const result = await this.bankAccountService.getById(id, request.user.sub);
      return sendSuccess(reply, result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao buscar conta";
      return sendError(reply, message, 404);
    }
  };

  create = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = request.body as {
        name: string;
        bank: "itau" | "sofisa" | "nubank" | "inter" | "other";
        bankName?: string;
        type: "checking" | "savings" | "investment" | "wallet";
        initialBalance?: number;
        isDefault?: boolean;
      };

      const result = await this.bankAccountService.create({
        userId: request.user.sub,
        name: body.name,
        bank: body.bank,
        bankName: body.bankName,
        type: body.type,
        initialBalance: body.initialBalance,
        isDefault: body.isDefault,
      });

      return sendSuccess(reply, result, 201, "Conta criada com sucesso");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao criar conta";
      return sendError(reply, message, 400);
    }
  };

  update = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const body = request.body as {
        name?: string;
        bank?: "itau" | "sofisa" | "nubank" | "inter" | "other";
        bankName?: string | null;
        type?: "checking" | "savings" | "investment" | "wallet";
        initialBalance?: number;
        isDefault?: boolean;
        isActive?: boolean;
      };

      const result = await this.bankAccountService.update({
        id,
        userId: request.user.sub,
        name: body.name,
        bank: body.bank,
        bankName: body.bankName,
        type: body.type,
        initialBalance: body.initialBalance,
        isDefault: body.isDefault,
        isActive: body.isActive,
      });

      return sendSuccess(reply, result, 200, "Conta atualizada com sucesso");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao atualizar conta";
      const status = message === "Conta não encontrada" ? 404 : 400;
      return sendError(reply, message, status);
    }
  };

  delete = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      await this.bankAccountService.delete(id, request.user.sub);
      return sendSuccess(reply, null, 200, "Conta removida com sucesso");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao remover conta";
      const status =
        message === "Conta não encontrada"
          ? 404
          : message.includes("cartões vinculados")
            ? 400
            : 404;
      return sendError(reply, message, status);
    }
  };
}
