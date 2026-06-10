import type { FastifyReply } from "fastify";
import type { ApiResponse } from "@/types/api.js";

export function sendSuccess<T>(reply: FastifyReply, data: T, statusCode = 200, message?: string) {
  const response: ApiResponse<T> = {
    success: true,
    data,
    ...(message && { message }),
  };

  return reply.status(statusCode).send(response);
}

export function sendError(reply: FastifyReply, message: string, statusCode = 400) {
  const response: ApiResponse = {
    success: false,
    message,
  };

  return reply.status(statusCode).send(response);
}
