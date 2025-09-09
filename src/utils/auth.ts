import { sign, verify } from '@tsndr/cloudflare-worker-jwt';
import { JwtPayload } from '../endpoints/auth/base';

/**
 * Gera hash da senha usando bcrypt
 * @param password Senha em texto plano
 * @returns Hash da senha
 */
export async function hashPassword(password: string): Promise<string> {
  // Usando Web Crypto API disponível no Cloudflare Workers
  const encoder = new TextEncoder();
  const data = encoder.encode(password + process.env.SALT_ROUNDS || 'default_salt');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verifica se a senha corresponde ao hash
 * @param password Senha em texto plano
 * @param hash Hash armazenado
 * @returns True se a senha estiver correta
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

/**
 * Gera token JWT
 * @param payload Dados do usuário
 * @param secret Chave secreta
 * @param expiresIn Tempo de expiração em segundos (padrão: 24h)
 * @returns Token JWT
 */
export async function generateJWT(
  payload: Omit<JwtPayload, 'iat' | 'exp'>,
  secret: string,
  expiresIn: number = 86400 // 24 horas
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const jwtPayload: JwtPayload = {
    ...payload,
    iat: now,
    exp: now + expiresIn,
  };

  return await sign(jwtPayload, secret);
}

/**
 * Verifica e decodifica token JWT
 * @param token Token JWT
 * @param secret Chave secreta
 * @returns Payload decodificado ou null se inválido
 */
export async function verifyJWT(token: string, secret: string): Promise<JwtPayload | null> {
  try {
    const isValid = await verify(token, secret);
    if (!isValid) return null;

    // Decodifica o payload sem verificar (já verificamos acima)
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload as JwtPayload;
  } catch (error) {
    console.error('Erro ao verificar JWT:', error);
    return null;
  }
}

/**
 * Extrai token do header Authorization
 * @param authHeader Header Authorization
 * @returns Token ou null se não encontrado
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7); // Remove 'Bearer '
}

/**
 * Gera refresh token (token de longa duração)
 * @param userId ID do usuário
 * @param secret Chave secreta
 * @returns Refresh token
 */
export async function generateRefreshToken(userId: number, secret: string): Promise<string> {
  const payload = {
    sub: userId,
    type: 'refresh',
  };
  const now = Math.floor(Date.now() / 1000);
  const refreshPayload = {
    ...payload,
    iat: now,
    exp: now + (30 * 24 * 60 * 60), // 30 dias
  };

  return await sign(refreshPayload, secret);
}

/**
 * Verifica refresh token
 * @param token Refresh token
 * @param secret Chave secreta
 * @returns User ID ou null se inválido
 */
export async function verifyRefreshToken(token: string, secret: string): Promise<number | null> {
  try {
    const isValid = await verify(token, secret);
    if (!isValid) return null;

    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.type !== 'refresh') return null;

    return payload.sub;
  } catch (error) {
    console.error('Erro ao verificar refresh token:', error);
    return null;
  }
}