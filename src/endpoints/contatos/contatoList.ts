import { D1ListEndpoint } from "chanfana";
import { HandleArgs } from "../../types";
import { ContatoModel } from "./base";

/**
 * Endpoint para listagem de contatos
 * GET /contatos
 * Requer autenticação com role admin ou user
 */
export class ContatoList extends D1ListEndpoint<HandleArgs> {
  _meta = {
    model: ContatoModel,
  };
  public schema = {
    security: [{ bearerAuth: [] }],
    tags: ["Contatos"],
    summary: "Lista contatos recebidos",
    description: "Retorna lista paginada de contatos. Requer autenticação com role admin ou user.",
  };

  searchFields = ["nome", "email"];
  defaultOrderBy = "created_at DESC";
}