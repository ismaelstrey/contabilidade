import { D1ReadEndpoint } from "chanfana";
import { HandleArgs } from "../../types";
import { TaskModel } from "./base";

export class TaskRead extends D1ReadEndpoint<HandleArgs> {
  _meta = {
    model: TaskModel,
  };

  public schema = {
    security: [{ bearerAuth: [] }],
    tags: ["Tasks"],
    summary: "Obtém uma task específica",
    description: "Retorna os detalhes de uma task específica do usuário autenticado",
  };
}
