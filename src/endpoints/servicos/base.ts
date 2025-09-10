import { z } from "zod";

/**
 * Schema Zod para validação de serviços
 */
export const servico = z.object({
  id: z.number().int(),
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(100, "Nome deve ter no máximo 100 caracteres"),
  descricao: z.string().max(500, "Descrição deve ter no máximo 500 caracteres").optional(),
  preco: z.number().positive("Preço deve ser um valor positivo").multipleOf(0.01, "Preço deve ter no máximo 2 casas decimais").optional(),
  ativo: z.boolean(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

/**
 * Schema para criação de serviço (sem campos automáticos)
 */
export const servicoCreate = servico.omit({ 
  id: true, 
  created_at: true, 
  updated_at: true 
});

/**
 * Schema para atualização de serviço (todos os campos opcionais)
 */
export const servicoUpdate = servicoCreate.partial();

/**
 * Schema para resposta pública (sem campos sensíveis)
 */
export const servicoResponse = servico.omit({});

/**
 * Modelo para Chanfana com tipagem correta
 */
export const ServicoModel = {
  tableName: "servicos",
  primaryKeys: ["id"],
  schema: servico,
  serializer: (obj: object): object => {
    const servico = obj as Record<string, unknown>;
    return {
      ...obj,
      ativo: Boolean(servico.ativo),
      preco: servico.preco ? Number(servico.preco) : null,
    };
  },
  serializerObject: servico,
};

/**
 * Tipos TypeScript derivados dos schemas Zod
 */
export type Servico = z.infer<typeof servico>;
export type ServicoCreate = z.infer<typeof servicoCreate>;
export type ServicoUpdate = z.infer<typeof servicoUpdate>;
export type ServicoResponse = z.infer<typeof servicoResponse>;