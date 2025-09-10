import { D1CreateEndpoint } from "chanfana";
import { HandleArgs } from "../../types";
import { ContatoModel, formatarTelefone } from "./base";

/**
 * Endpoint público para criação de contatos
 * POST /contatos
 * Não requer autenticação
 */
export class ContatoCreate extends D1CreateEndpoint<HandleArgs> {
  _meta = {
    model: ContatoModel,
    fields: ContatoModel.schema.pick({
      nome: true,
      email: true,
      telefone: true,
      servico_id: true,
      mensagem: true,
      empresa: true,
    }),
  };

  public schema = {
    tags: ["Contatos"],
    summary: "Cria novo contato",
    description: "Endpoint público para criação de contatos através do formulário do site",
  };

  async beforeCreate(c: HandleArgs, data: any) {
    // Verificar se o serviço existe e está ativo
    const servico = await c[0].env.DB.prepare(
      "SELECT id, nome FROM servicos WHERE id = ? AND ativo = 1"
    )
      .bind(data.servico_id)
      .first();

    if (!servico) {
      throw new Error("Serviço não encontrado ou não está disponível");
    }

    // Formatar telefone
    data.telefone = formatarTelefone(data.telefone);
    
    // Definir status padrão
    data.status = 'novo';
    
    return data;
  }
}