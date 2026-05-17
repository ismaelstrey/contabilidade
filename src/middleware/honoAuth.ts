import type { Context, MiddlewareHandler, Next } from "hono";
import { authMiddleware, requireRole } from "./auth";

type Role = "admin" | "editor" | "user" | "viewer";
type AppBindings = { Bindings: Env };

export function requireHonoAuth(allowedRoles: Role[] = ["admin", "editor", "user", "viewer"]): MiddlewareHandler<AppBindings> {
  return async (c: Context<AppBindings>, next: Next) => {
    const authResponse = await authMiddleware(c.req.raw, c.env, c.executionCtx);

    if (authResponse) {
      return authResponse;
    }

    const roleResponse = await requireRole(allowedRoles)(c.req.raw, c.env, c.executionCtx);

    if (roleResponse) {
      return roleResponse;
    }

    await next();
  };
}
