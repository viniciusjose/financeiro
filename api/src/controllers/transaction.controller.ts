import type { FastifyReply, FastifyRequest } from "fastify";
import type { TransactionService } from "@/services/transaction.service.js";
import { sendError, sendSuccess } from "@/views/response.js";

export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  list = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { page, perPage } = request.query as { page: number; perPage: number };
      const result = await this.transactionService.list(request.user.sub, page, perPage);
      return sendSuccess(reply, result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao listar transações";
      return sendError(reply, message, 500);
    }
  };

  getById = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const transaction = await this.transactionService.getById(id, request.user.sub);
      return sendSuccess(reply, transaction);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao buscar transação";
      return sendError(reply, message, 404);
    }
  };

  create = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = request.body as {
        description: string;
        amount: string;
        type: "income" | "expense";
        category: string;
        date: string;
      };

      const transaction = await this.transactionService.create({
        userId: request.user.sub,
        description: body.description,
        amount: body.amount,
        type: body.type,
        category: body.category,
        date: new Date(body.date),
      });

      return sendSuccess(reply, transaction, 201, "Transação criada com sucesso");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao criar transação";
      return sendError(reply, message, 400);
    }
  };

  update = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const body = request.body as {
        description?: string;
        amount?: string;
        type?: "income" | "expense";
        category?: string;
        date?: string;
      };

      const transaction = await this.transactionService.update({
        id,
        userId: request.user.sub,
        description: body.description,
        amount: body.amount,
        type: body.type,
        category: body.category,
        date: body.date ? new Date(body.date) : undefined,
      });

      return sendSuccess(reply, transaction, 200, "Transação atualizada com sucesso");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao atualizar transação";
      return sendError(reply, message, 400);
    }
  };

  delete = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      await this.transactionService.delete(id, request.user.sub);
      return sendSuccess(reply, null, 200, "Transação removida com sucesso");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao remover transação";
      return sendError(reply, message, 404);
    }
  };
}
