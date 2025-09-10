import { z } from "zod";

/**
 * Regex para validação de telefone brasileiro
 * Aceita formatos: (11) 99999-9999, 11999999999, +5511999999999
 */
const telefoneRegex = /^(?:\+55)?\s?\(?([1-9]{2})\)?\s?9?\s?([0-9]{4,5})-?([0-9]{4})$/;

/**
 * Schema Zod para validação de contatos
 */
export const contato = z.object({
  id: z.number().int(),
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(100, "Nome deve ter no máximo 100 caracteres"),
  email: z.string().email("Email deve ter formato válido").max(255, "Email deve ter no máximo 255 caracteres"),
  telefone: z.string().regex(telefoneRegex, "Telefone deve estar no formato brasileiro: (11) 99999-9999"),
  empresa: z.string().max(100, "Nome da empresa deve ter no máximo 100 caracteres").optional(),
  servico_id: z.number().int().positive("ID do serviço deve ser um número positivo"),
  mensagem: z.string().min(10, "Mensagem deve ter pelo menos 10 caracteres").max(1000, "Mensagem deve ter no máximo 1000 caracteres"),
  status: z.enum(["novo", "em_andamento", "respondido", "finalizado"], {
    errorMap: () => ({ message: "Status deve ser: novo, em_andamento, respondido ou finalizado" })
  }),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

/**
 * Schema para criação de contato (público - sem campos automáticos)
 */
export const contatoCreate = contato.omit({ 
  id: true, 
  status: true,
  created_at: true, 
  updated_at: true 
});

/**
 * Schema para atualização de status do contato
 */
export const contatoUpdateStatus = z.object({
  status: z.enum(["novo", "em_andamento", "respondido", "finalizado"], {
    errorMap: () => ({ message: "Status deve ser: novo, em_andamento, respondido ou finalizado" })
  }),
});

/**
 * Schema para resposta com dados do serviço relacionado
 */
export const contatoResponse = contato.extend({
  servico: z.object({
    id: z.number().int(),
    nome: z.string(),
  }),
}).omit({ servico_id: true });

/**
 * Modelo para Chanfana com tipagem correta
 */
export const ContatoModel = {
  tableName: "contatos",
  primaryKeys: ["id"],
  schema: contato,
  serializer: (obj: object): object => {
    return {
      ...obj,
    };
  },
  serializerObject: contato,
};

/**
 * Tipos TypeScript derivados dos schemas Zod
 */
export type Contato = z.infer<typeof contato>;
export type ContatoCreate = z.infer<typeof contatoCreate>;
export type ContatoUpdateStatus = z.infer<typeof contatoUpdateStatus>;
export type ContatoResponse = z.infer<typeof contatoResponse>;

/**
 * Função utilitária para validar e formatar telefone brasileiro
 */
export function formatarTelefone(telefone: string): string {
  // Remove todos os caracteres não numéricos
  const numeros = telefone.replace(/\D/g, '');
  
  // Remove código do país se presente
  const semCodigoPais = numeros.startsWith('55') ? numeros.substring(2) : numeros;
  
  // Formatar para (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
  if (semCodigoPais.length === 11) {
    return `(${semCodigoPais.substring(0, 2)}) ${semCodigoPais.substring(2, 7)}-${semCodigoPais.substring(7)}`;
  } else if (semCodigoPais.length === 10) {
    return `(${semCodigoPais.substring(0, 2)}) ${semCodigoPais.substring(2, 6)}-${semCodigoPais.substring(6)}`;
  }
  
  return telefone; // Retorna original se não conseguir formatar
}