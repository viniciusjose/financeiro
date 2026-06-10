import { z } from "zod";

export const registerSchema = {
  body: z.object({
    email: z.string().email("E-mail inválido"),
    name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
    password: z.string().min(8, "Senha deve ter no mínimo 8 caracteres"),
  }),
};

export const loginSchema = {
  body: z.object({
    email: z.string().email("E-mail inválido"),
    password: z.string().min(1, "Senha é obrigatória"),
  }),
};
