import rateLimit from "@fastify/rate-limit";
import type { FastifyInstance } from "fastify";
import { env } from "@/config/env.js";

export async function registerRateLimit(app: FastifyInstance) {
  await app.register(rateLimit, {
    max: env.RATE_LIMIT_MAX,
    timeWindow: env.RATE_LIMIT_TIME_WINDOW,
  });
}
