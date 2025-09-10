import { z } from "zod";

// Schema para validação de usuário
export const user = z.object({
  id: z.number().int(),
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(100, "Nome deve ter no máximo 100 caracteres"),
  email: z.string().email("Email deve ter formato válido").max(255, "Email deve ter no máximo 255 caracteres"),
  senha: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
  role: z.enum(["admin", "user", "viewer"], {
    errorMap: () => ({ message: "Role deve ser admin, user ou viewer" })
  }),
  active: z.boolean(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

// Schema para registro de usuário (sem id, created_at, updated_at)
export const userRegister = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(100, "Nome deve ter no máximo 100 caracteres"),
  email: z.string().email("Email deve ter formato válido").max(255, "Email deve ter no máximo 255 caracteres"),
  senha: z.string()
    .min(8, "Senha deve ter pelo menos 8 caracteres")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Senha deve conter pelo menos 1 maiúscula, 1 minúscula e 1 número"),
  role: z.enum(["admin", "user", "viewer"], {
    errorMap: () => ({ message: "Role deve ser admin, user ou viewer" })
  }).default("user"),
});

// Schema para login
export const userLogin = z.object({
  email: z.string().email("Email deve ter formato válido"),
  senha: z.string().min(1, "Senha é obrigatória"),
});

// Schema para resposta de usuário (sem senha)
export const userResponse = user.omit({ senha: true });

// Schema para payload do JWT
export const jwtPayload = z.object({
  sub: z.string(), // user id (string conforme padrão JWT)
  email: z.string().email(),
  role: z.enum(["admin", "user", "viewer"]),
  iat: z.number(),
  exp: z.number(),
});

// Modelo para Chanfana
export const UserModel = {
  tableName: "users",
  primaryKeys: ["id"],
  schema: user,
  serializer: (obj: Record<string, string | number | boolean>) => {
    return {
      ...obj,
      active: Boolean(obj.active),
    };
  },
  serializerObject: userResponse,
};

// Tipos TypeScript
export type User = z.infer<typeof user>;
export type UserRegister = z.infer<typeof userRegister>;
export type UserLogin = z.infer<typeof userLogin>;
export type UserResponse = z.infer<typeof userResponse>;
export type JwtPayload = z.infer<typeof jwtPayload>;