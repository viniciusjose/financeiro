import type { FastifyReply, FastifyRequest } from "fastify";
import type { CreditCardService } from "@/services/credit-card.service.js";
import { sendError, sendSuccess } from "@/views/response.js";

export class CreditCardController {
  constructor(private readonly creditCardService: CreditCardService) {}

  list = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { includeInactive } = request.query as { includeInactive: boolean };
      const result = await this.creditCardService.list(request.user.sub, includeInactive);
      return sendSuccess(reply, result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao listar cartões";
      return sendError(reply, message, 500);
    }
  };

  getBill = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const { referenceDate } = request.query as { referenceDate?: string };
      const parsedReferenceDate = referenceDate ? new Date(`${referenceDate}T12:00:00.000Z`) : new Date();

      if (Number.isNaN(parsedReferenceDate.getTime())) {
        return sendError(reply, "Data de referência inválida", 400);
      }

      const result = await this.creditCardService.getBill(id, request.user.sub, parsedReferenceDate);
      return sendSuccess(reply, result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao buscar fatura";
      return sendError(reply, message, 404);
    }
  };

  getById = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const result = await this.creditCardService.getById(id, request.user.sub);
      return sendSuccess(reply, result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao buscar cartão";
      return sendError(reply, message, 404);
    }
  };

  create = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = request.body as {
        name: string;
        lastFourDigits: string;
        brand: "visa" | "mastercard" | "elo" | "amex" | "hipercard" | "diners" | "other";
        brandName?: string;
        closingDay: number;
        dueDay: number;
        bankAccountId: string;
        creditLimitCents?: number | null;
        color: string;
      };

      const result = await this.creditCardService.create({
        userId: request.user.sub,
        name: body.name,
        lastFourDigits: body.lastFourDigits,
        brand: body.brand,
        brandName: body.brandName,
        closingDay: body.closingDay,
        dueDay: body.dueDay,
        bankAccountId: body.bankAccountId,
        creditLimitCents: body.creditLimitCents,
        color: body.color,
      });

      return sendSuccess(reply, result, 201, "Cartão criado com sucesso");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao criar cartão";
      return sendError(reply, message, 400);
    }
  };

  update = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const body = request.body as {
        name?: string;
        lastFourDigits?: string;
        brand?: "visa" | "mastercard" | "elo" | "amex" | "hipercard" | "diners" | "other";
        brandName?: string | null;
        closingDay?: number;
        dueDay?: number;
        bankAccountId?: string;
        creditLimitCents?: number | null;
        color?: string;
        isActive?: boolean;
        isBlocked?: boolean;
      };

      const result = await this.creditCardService.update({
        id,
        userId: request.user.sub,
        name: body.name,
        lastFourDigits: body.lastFourDigits,
        brand: body.brand,
        brandName: body.brandName,
        closingDay: body.closingDay,
        dueDay: body.dueDay,
        bankAccountId: body.bankAccountId,
        creditLimitCents: body.creditLimitCents,
        color: body.color,
        isActive: body.isActive,
        isBlocked: body.isBlocked,
      });

      return sendSuccess(reply, result, 200, "Cartão atualizado com sucesso");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao atualizar cartão";
      const status = message === "Cartão não encontrado" ? 404 : 400;
      return sendError(reply, message, status);
    }
  };

  delete = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      await this.creditCardService.delete(id, request.user.sub);
      return sendSuccess(reply, null, 200, "Cartão removido com sucesso");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao remover cartão";
      return sendError(reply, message, 404);
    }
  };
}
