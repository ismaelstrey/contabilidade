import { D1ReadEndpoint } from "chanfana";
import { HandleArgs } from "../../types";
import { ContatoModel } from "./base";

/**
 * Endpoint para leitura de contato específico
 * GET /contatos/:id
 * Requer autenticação com role admin ou user
 */
export class ContatoRead extends D1ReadEndpoint<HandleArgs> {
  _meta = {
    model: ContatoModel,
  };

  public schema = {
    security: [{ bearerAuth: [] }],
    tags: ["Contatos"],
    summary: "Busca contato por ID",
    description: "Retorna os detalhes de um contato específico pelo seu ID. Requer autenticação.",
  };
}