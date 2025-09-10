import { D1CreateEndpoint } from "chanfana";
import { HandleArgs } from "../../types";
import { ServicoModel } from "./base";

/**
 * Endpoint para criação de serviços
 * POST /servicos
 * Requer autenticação com role admin
 */
export class ServicoCreate extends D1CreateEndpoint<HandleArgs> {
  _meta = {
    model: ServicoModel,
    fields: ServicoModel.schema.pick({
      nome: true,
      descricao: true,
      preco: true,
      ativo: true,
    }),
  };

  public schema = {
    security: [{ bearerAuth: [] }],
    tags: ["Serviços"],
    summary: "Cria novo serviço",
    description: "Cria um novo serviço no sistema. Requer autenticação com role admin.",
  };
}