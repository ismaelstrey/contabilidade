import { verifyJWT, extractTokenFromHeader } from '../utils/auth';
import { AuthenticatedUser } from '../types';

/**
 * Middleware de autenticação JWT
 * Verifica se o usuário está autenticado e adiciona os dados do usuário ao contexto
 */
export async function authMiddleware(
  request: Request,
  env: Env,
  _ctx: ExecutionContext
): Promise<Response | void> {
  // Extrair token do header Authorization
  const authHeader = request.headers.get('Authorization');
  const token = extractTokenFromHeader(authHeader);

  if (!token) {
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Token de acesso não fornecido',
        code: 'MISSING_TOKEN',
      }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Verificar token
  const payload = await verifyJWT(token, env.JWT_SECRET);

  if (!payload) {
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Token inválido ou expirado',
        code: 'INVALID_TOKEN',
      }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Verificar se usuário ainda existe e está ativo
  const user = await env.DB.prepare(
    'SELECT id, nome, email, role, active FROM users WHERE id = ?'
  ).bind(parseInt(payload.sub)).first() as {
    id: number;
    nome: string;
    email: string;
    role: 'admin' | 'user' | 'viewer';
    active: number;
  } | null;

  if (!user || !user.active) {
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Usuário não encontrado ou inativo',
        code: 'USER_NOT_FOUND',
      }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Adicionar dados do usuário ao request para uso posterior
  // Usando uma propriedade customizada no request
  (request as Request & { user?: AuthenticatedUser | null }).user = {
    id: user.id,
    nome: user.nome,
    email: user.email,
    role: user.role,
    active: Boolean(user.active),
  };

  // Continuar para o próximo middleware/handler
  return;
}

/**
 * Middleware de autorização por role
 * Verifica se o usuário tem a role necessária para acessar o recurso
 */
export function requireRole(allowedRoles: string[]) {
  return async function(
    request: Request,
    _env: Env,
    _ctx: ExecutionContext
  ): Promise<Response | void> {
    const user = (request as Request & { user?: AuthenticatedUser | null }).user;

    if (!user) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Usuário não autenticado',
          code: 'NOT_AUTHENTICATED',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (!allowedRoles.includes(user.role)) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Acesso negado. Permissões insuficientes.',
          code: 'INSUFFICIENT_PERMISSIONS',
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Usuário tem a role necessária, continuar
    return;
  };
}

/**
 * Middleware opcional de autenticação
 * Adiciona dados do usuário ao contexto se autenticado, mas não bloqueia se não estiver
 */
export async function optionalAuthMiddleware(
  request: Request,
  env: Env,
  _ctx: ExecutionContext
): Promise<Response | void> {
  const authHeader = request.headers.get('Authorization');
  const token = extractTokenFromHeader(authHeader);

  if (!token) {
    // Sem token, mas não bloqueia
    (request as Request & { user?: AuthenticatedUser | null }).user = null;
    return;
  }

  try {
    const payload = await verifyJWT(token, env.JWT_SECRET);

    if (payload) {
      const user = await env.DB.prepare(
        'SELECT id, nome, email, role, active FROM users WHERE id = ? AND active = 1'
      ).bind(parseInt(payload.sub)).first() as {
        id: number;
        nome: string;
        email: string;
        role: 'admin' | 'user' | 'viewer';
        active: number;
      } | null;

      if (user) {
        (request as Request & { user?: AuthenticatedUser | null }).user = {
          id: user.id,
          nome: user.nome,
          email: user.email,
          role: user.role,
          active: Boolean(user.active),
        };
      } else {
        (request as Request & { user?: AuthenticatedUser | null }).user = null;
      }
    } else {
      (request as Request & { user?: AuthenticatedUser | null }).user = null;
    }
  } catch {
    // Error handling (removed console.error for ESLint compliance)
    (request as Request & { user?: AuthenticatedUser | null }).user = null;
  }

  return;
}

/**
 * Utilitário para obter o usuário atual do request
 */
export function getCurrentUser(request: Request): AuthenticatedUser | null {
  return (request as Request & { user?: AuthenticatedUser | null }).user || null;
}

/**
 * Utilitário para verificar se o usuário tem uma role específica
 */
export function hasRole(request: Request, role: string): boolean {
  const user = getCurrentUser(request);
  return Boolean(user && user.role === role);
}

/**
 * Utilitário para verificar se o usuário tem uma das roles especificadas
 */
export function hasAnyRole(request: Request, roles: string[]): boolean {
  const user = getCurrentUser(request);
  return Boolean(user && roles.includes(user.role));
}