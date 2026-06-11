import { z } from "zod";

export const registerSchema = {
  body: z.object({
    email: z.string().email("E-mail inválido"),
    name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
    birthDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Data de nascimento inválida")
      .refine((value) => !Number.isNaN(new Date(`${value}T00:00:00.000Z`).getTime()), {
        message: "Data de nascimento inválida",
      })
      .refine((value) => new Date(`${value}T00:00:00.000Z`) <= new Date(), {
        message: "Data de nascimento não pode ser no futuro",
      }),
    password: z.string().min(8, "Senha deve ter no mínimo 8 caracteres"),
  }),
};

export const loginSchema = {
  body: z.object({
    email: z.string().email("E-mail inválido"),
    password: z.string().min(1, "Senha é obrigatória"),
  }),
};

export const refreshSchema = {
  body: z.object({
    refreshToken: z.string().min(1, "Refresh token é obrigatório"),
  }),
};

export const changePasswordSchema = {
  body: z
    .object({
      currentPassword: z.string().min(1, "Senha atual é obrigatória"),
      newPassword: z.string().min(8, "Senha deve ter no mínimo 8 caracteres"),
    })
    .refine((data) => data.currentPassword !== data.newPassword, {
      message: "A nova senha deve ser diferente da senha atual",
      path: ["newPassword"],
    }),
};
