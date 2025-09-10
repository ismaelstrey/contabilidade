import { D1ListEndpoint } from "chanfana";
import { HandleArgs } from "../../types";
import { ServicoModel } from "./base";

/**
 * Endpoint para listagem de serviços
 * GET /servicos
 * Endpoint público - não requer autenticação
 */
export class ServicoList extends D1ListEndpoint<HandleArgs> {
  _meta = {
    model: ServicoModel,
  };
  
  // Campos disponíveis para busca
  searchFields = ["nome", "descricao"];
  
  // Ordenação padrão
  defaultOrderBy = "nome ASC";
  
  // Filtros padrão - apenas serviços ativos para usuários não autenticados
  defaultFilters = {
    ativo: true,
  };

  public schema = {
    tags: ["Serviços"],
    summary: "Lista serviços disponíveis",
    description: "Retorna lista paginada de serviços ativos. Suporta busca por nome e descrição.",
  };
}