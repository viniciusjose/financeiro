import { authService, transactionService } from "@/services/index.js";
import { AuthController } from "./auth.controller.js";
import { HealthController } from "./health.controller.js";
import { TransactionController } from "./transaction.controller.js";

export const healthController = new HealthController();
export const authController = new AuthController(authService);
export const transactionController = new TransactionController(transactionService);
