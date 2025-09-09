import { verifyJWT, extractTokenFromHeader } from '../utils/auth';
import { JwtPayload } from '../endpoints/auth/base';

/**
 * Middleware de autenticação JWT
 * Verifica se o usuário está autenticado e adiciona os dados do usuário ao contexto
 */
export async function authMiddleware(
  request: Request,
  env: any,
  ctx: ExecutionContext
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
  ).bind(payload.sub).first();

  if (!user || !user.active) {
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Usuário não encontrado ou inativo',
        code: 'USER_INACTIVE',
      }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Adicionar dados do usuário ao request para uso posterior
  // Usando uma propriedade customizada no request
  (request as any).user = {
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
    env: any,
    ctx: ExecutionContext
  ): Promise<Response | void> {
    const user = (request as any).user;

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
  env: any,
  ctx: ExecutionContext
): Promise<Response | void> {
  const authHeader = request.headers.get('Authorization');
  const token = extractTokenFromHeader(authHeader);

  if (!token) {
    // Sem token, mas não bloqueia
    (request as any).user = null;
    return;
  }

  try {
    const payload = await verifyJWT(token, env.JWT_SECRET);

    if (payload) {
      const user = await env.DB.prepare(
        'SELECT id, nome, email, role, active FROM users WHERE id = ? AND active = 1'
      ).bind(payload.sub).first();

      if (user) {
        (request as any).user = {
          id: user.id,
          nome: user.nome,
          email: user.email,
          role: user.role,
          active: Boolean(user.active),
        };
      } else {
        (request as any).user = null;
      }
    } else {
      (request as any).user = null;
    }
  } catch (error) {
    console.error('Erro no middleware de autenticação opcional:', error);
    (request as any).user = null;
  }

  return;
}

/**
 * Utilitário para obter o usuário atual do request
 */
export function getCurrentUser(request: Request): any | null {
  return (request as any).user || null;
}

/**
 * Utilitário para verificar se o usuário tem uma role específica
 */
export function hasRole(request: Request, role: string): boolean {
  const user = getCurrentUser(request);
  return user && user.role === role;
}

/**
 * Utilitário para verificar se o usuário tem uma das roles especificadas
 */
export function hasAnyRole(request: Request, roles: string[]): boolean {
  const user = getCurrentUser(request);
  return user && roles.includes(user.role);
}