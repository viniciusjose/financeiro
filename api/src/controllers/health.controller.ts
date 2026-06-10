import type { FastifyReply, FastifyRequest } from "fastify";
import { sendSuccess } from "@/views/response.js";

export class HealthController {
  check = async (_request: FastifyRequest, reply: FastifyReply) => {
    return sendSuccess(reply, {
      status: "ok",
      timestamp: new Date().toISOString(),
    });
  };
}
