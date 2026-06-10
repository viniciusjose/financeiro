import { TransactionRepository } from "@/repositories/transaction.repository.js";
import { UserRepository } from "@/repositories/user.repository.js";
import { AuthService } from "./auth.service.js";
import { TransactionService } from "./transaction.service.js";

const userRepository = new UserRepository();
const transactionRepository = new TransactionRepository();

export const authService = new AuthService(userRepository);
export const transactionService = new TransactionService(transactionRepository);
