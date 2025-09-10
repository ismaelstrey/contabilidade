import { D1DeleteEndpoint } from "chanfana";
import { HandleArgs } from "../../types";
import { TaskModel } from "./base";

export class TaskDelete extends D1DeleteEndpoint<HandleArgs> {
  _meta = {
    model: TaskModel,
  };

  public schema = {
    security: [{ bearerAuth: [] }],
    tags: ["Tasks"],
    summary: "Exclui uma task",
    description: "Remove uma task específica do usuário autenticado",
  };
}
