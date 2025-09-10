import { D1ListEndpoint } from "chanfana";
import { HandleArgs } from "../../types";
import { TaskModel } from "./base";

export class TaskList extends D1ListEndpoint<HandleArgs> {
  _meta = {
    model: TaskModel,
  };

  public schema = {
    security: [{ bearerAuth: [] }],
    tags: ["Tasks"],
    summary: "Lista todas as tasks",
    description: "Retorna uma lista paginada de todas as tasks do usuário autenticado",
  };

  searchFields = ["name", "slug", "description"];
  defaultOrderBy = "id DESC";
}
