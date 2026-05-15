import { Hono } from "hono";
import { fromHono } from "chanfana";
import { ServicoList } from './servicoList';
import { ServicoCreate } from './servicoCreate';
import { ServicoRead } from './servicoRead';
import { ServicoUpdate } from './servicoUpdate';
import { ServicoDelete } from './servicoDelete';
import { requireHonoAuth } from '../../middleware/honoAuth';

const app = new Hono<{ Bindings: Env }>();

app.use("*", async (c, next) => {
  if (c.req.method === "GET") {
    await next();
    return;
  }

  return requireHonoAuth(["admin", "user"])(c, next);
});

export const servicosRouter = fromHono(app);

// Registrar endpoints CRUD de serviços
servicosRouter.get("/", ServicoList);
servicosRouter.post("/", ServicoCreate);
servicosRouter.get("/:id", ServicoRead);
servicosRouter.put("/:id", ServicoUpdate);
servicosRouter.delete("/:id", ServicoDelete);
