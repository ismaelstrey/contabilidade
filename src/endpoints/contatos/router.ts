import { Hono } from "hono";
import { fromHono } from "chanfana";
import { ContatoCreate } from './contatoCreate';
import { ContatoList } from './contatoList';
import { ContatoRead } from './contatoRead';
import { ContatoUpdateStatus } from './contatoUpdateStatus';
import { rateLimiter } from '../../middleware/rateLimiting';

const app = new Hono();

// Aplicar rate limiting apenas ao endpoint público de criação
app.use("/", rateLimiter(5, 60000)); // 5 requests por minuto

export const contatosRouter = fromHono(app);

// Registrar endpoints de contatos
contatosRouter.post("/", ContatoCreate);           // Público - criação de contato com rate limiting
contatosRouter.get("/", ContatoList);             // Autenticado - listagem
contatosRouter.get("/:id", ContatoRead);          // Autenticado - leitura
contatosRouter.put("/:id/status", ContatoUpdateStatus); // Autenticado - atualização de status