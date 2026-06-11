import {
  authService,
  bankAccountService,
  categoryService,
  creditCardService,
  transactionService,
} from "@/services/index.js";
import { AuthController } from "./auth.controller.js";
import { BankAccountController } from "./bank-account.controller.js";
import { CategoryController } from "./category.controller.js";
import { CreditCardController } from "./credit-card.controller.js";
import { HealthController } from "./health.controller.js";
import { TransactionController } from "./transaction.controller.js";

export const healthController = new HealthController();
export const authController = new AuthController(authService);
export const transactionController = new TransactionController(transactionService);
export const bankAccountController = new BankAccountController(bankAccountService);
export const categoryController = new CategoryController(categoryService);
export const creditCardController = new CreditCardController(creditCardService);
