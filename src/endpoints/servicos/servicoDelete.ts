import { D1DeleteEndpoint } from "chanfana";
import { HandleArgs } from "../../types";
import { ServicoModel } from "./base";

/**
 * Endpoint para exclusão de serviços
 * DELETE /servicos/:id
 * Requer autenticação com role admin
 */
export class ServicoDelete extends D1DeleteEndpoint<HandleArgs> {
  _meta = {
    model: ServicoModel,
  };

  public schema = {
    security: [{ bearerAuth: [] }],
    tags: ["Serviços"],
    summary: "Exclui serviço existente",
    description: "Remove um serviço do sistema. Requer autenticação com role admin.",
  };
}