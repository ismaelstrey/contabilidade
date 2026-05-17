import { getCurrentUser } from "../middleware/auth";

export type ApiSuccess<T> = {
  success: true;
  message: string;
  data: T;
};

export type ApiFailure = {
  success: false;
  message: string;
  errors?: unknown;
};

export const jsonSuccess = <T>(message: string, data: T): ApiSuccess<T> => ({
  success: true,
  message,
  data,
});

export const slugify = (value: string): string => {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
};

export const getClientIp = (request: Request): string => {
  return request.headers.get("cf-connecting-ip")
    || request.headers.get("x-forwarded-for")
    || request.headers.get("x-real-ip")
    || "unknown";
};

export const inferDeviceType = (userAgent: string | null): string => {
  const ua = (userAgent || "").toLowerCase();
  if (/ipad|tablet/.test(ua)) {return "tablet";}
  if (/mobile|android|iphone/.test(ua)) {return "mobile";}
  return "desktop";
};

export const getArticleSlugFromPath = (path: string): string | null => {
  const match = path.match(/^\/posts\/([^/?#]+)/);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
};

export const addCacheHeaders = (response: Response, value: string): Response => {
  response.headers.set("Cache-Control", value);
  return response;
};

export const auditLog = async (
  request: Request,
  env: Env,
  action: string,
  resource: string,
  resourceId?: string | number,
  details?: unknown,
): Promise<void> => {
  const user = getCurrentUser(request);
  await env.DB.prepare(
    `INSERT INTO audit_logs (user_id, action, resource, resource_id, details, ip_address, user_agent)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      user?.id || null,
      action,
      resource,
      resourceId ? String(resourceId) : null,
      details ? JSON.stringify(details).slice(0, 2000) : null,
      getClientIp(request),
      request.headers.get("user-agent") || null,
    )
    .run();
};

export const verifyTurnstile = async (
  token: string | undefined,
  request: Request,
  env: Env,
): Promise<boolean> => {
  const secret = "TURNSTILE_SECRET_KEY" in env ? env.TURNSTILE_SECRET_KEY : undefined;

  if (!secret) {return true;}
  if (!token) {return false;}

  const formData = new FormData();
  formData.append("secret", secret);
  formData.append("response", token);
  formData.append("remoteip", getClientIp(request));

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: formData,
  });
  const result = await response.json<{ success?: boolean }>();
  return Boolean(result.success);
};
