import { D1CreateEndpoint } from "chanfana";
import { HandleArgs } from "../../types";
import { TaskModel } from "./base";

export class TaskCreate extends D1CreateEndpoint<HandleArgs> {
  _meta = {
    model: TaskModel,
    fields: TaskModel.schema.pick({
      // this is purposely missing the id, because users shouldn't be able to define it
      name: true,
      slug: true,
      description: true,
      completed: true,
      due_date: true,
    }),
  };

  public schema = {
    security: [{ bearerAuth: [] }],
    tags: ["Tasks"],
    summary: "Cria uma nova task",
    description: "Cria uma nova task para o usuário autenticado",
  };
}
