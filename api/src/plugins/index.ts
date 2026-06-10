import type { FastifyInstance } from "fastify";
import { registerCors } from "./cors.js";
import { registerHelmet } from "./helmet.js";
import { registerJwt } from "./jwt.js";
import { registerRateLimit } from "./rate-limit.js";

export async function registerPlugins(app: FastifyInstance) {
  await registerHelmet(app);
  await registerCors(app);
  await registerRateLimit(app);
  await registerJwt(app);
}
