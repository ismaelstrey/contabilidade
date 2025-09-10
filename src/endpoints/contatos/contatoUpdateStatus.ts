import { D1UpdateEndpoint } from "chanfana";
import { HandleArgs } from "../../types";
import { ContatoModel } from "./base";

/**
 * Endpoint para atualização de status do contato
 * PUT /contatos/:id/status
 * Requer autenticação com role admin ou user
 */
export class ContatoUpdateStatus extends D1UpdateEndpoint<HandleArgs> {
  _meta = {
    model: ContatoModel,
    fields: ContatoModel.schema.pick({
      status: true,
    }),
  };

  public schema = {
    security: [{ bearerAuth: [] }],
    tags: ["Contatos"],
    summary: "Atualiza status do contato",
    description: "Atualiza o status de um contato específico. Requer autenticação com role admin ou user.",
  };


}