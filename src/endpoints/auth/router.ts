import { Hono } from "hono";
import { fromHono } from "chanfana";
import { AuthRegister } from './register';
import { AuthLogin } from './login';
import { AuthRefresh } from './refresh';
import { AuthMe } from './me';

export const authRouter = fromHono(new Hono());

// Rotas de autenticação
authRouter.post('/auth/register', AuthRegister);
authRouter.post('/auth/login', AuthLogin);
authRouter.post('/auth/refresh', AuthRefresh);
authRouter.get('/auth/me', AuthMe);