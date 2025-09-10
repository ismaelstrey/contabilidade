import { Hono } from "hono";
import { fromHono } from "chanfana";
import { ServicoList } from './servicoList';
import { ServicoCreate } from './servicoCreate';
import { ServicoRead } from './servicoRead';
import { ServicoUpdate } from './servicoUpdate';
import { ServicoDelete } from './servicoDelete';

export const servicosRouter = fromHono(new Hono());

// Registrar endpoints CRUD de serviços
servicosRouter.get("/", ServicoList);
servicosRouter.post("/", ServicoCreate);
servicosRouter.get("/:id", ServicoRead);
servicosRouter.put("/:id", ServicoUpdate);
servicosRouter.delete("/:id", ServicoDelete);