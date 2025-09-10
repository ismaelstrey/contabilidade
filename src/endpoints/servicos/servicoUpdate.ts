import { D1UpdateEndpoint } from "chanfana";
import { HandleArgs } from "../../types";
import { ServicoModel } from "./base";

/**
 * Endpoint para atualização de serviços
 * PUT /servicos/:id
 * Requer autenticação com role admin
 */
export class ServicoUpdate extends D1UpdateEndpoint<HandleArgs> {
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
    summary: "Atualiza serviço existente",
    description: "Atualiza os dados de um serviço existente. Requer autenticação com role admin.",
  };
}