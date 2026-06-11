import { BankAccountRepository } from "@/repositories/bank-account.repository.js";
import { CategoryRepository } from "@/repositories/category.repository.js";
import { CreditCardRepository } from "@/repositories/credit-card.repository.js";
import { TransactionRepository } from "@/repositories/transaction.repository.js";
import { UserRepository } from "@/repositories/user.repository.js";
import { AuthService } from "./auth.service.js";
import { BankAccountService } from "./bank-account.service.js";
import { CategoryService } from "./category.service.js";
import { CreditCardService } from "./credit-card.service.js";
import { TransactionService } from "./transaction.service.js";

const userRepository = new UserRepository();
const transactionRepository = new TransactionRepository();
const bankAccountRepository = new BankAccountRepository();
const creditCardRepository = new CreditCardRepository();
const categoryRepository = new CategoryRepository();

export const authService = new AuthService(userRepository);
export const categoryService = new CategoryService(categoryRepository, transactionRepository);
export const creditCardService = new CreditCardService(
  creditCardRepository,
  bankAccountRepository,
  transactionRepository,
);
export const transactionService = new TransactionService(
  transactionRepository,
  categoryService,
  creditCardService,
  bankAccountRepository,
);
export const bankAccountService = new BankAccountService(
  bankAccountRepository,
  creditCardRepository,
);
