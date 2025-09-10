import { D1ReadEndpoint } from "chanfana";
import { HandleArgs } from "../../types";
import { ServicoModel } from "./base";

/**
 * Endpoint para leitura de serviço específico
 * GET /servicos/:id
 * Endpoint público - não requer autenticação
 */
export class ServicoRead extends D1ReadEndpoint<HandleArgs> {
  _meta = {
    model: ServicoModel,
  };

  public schema = {
    tags: ["Serviços"],
    summary: "Busca serviço por ID",
    description: "Retorna os detalhes de um serviço específico pelo seu ID.",

  };
}