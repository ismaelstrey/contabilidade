import { Context, Next } from "hono";

// Armazenamento em memória para rate limiting (em produção, usar Redis ou similar)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

/**
 * Middleware de rate limiting simples
 * @param maxRequests Número máximo de requests por janela de tempo
 * @param windowMs Janela de tempo em milissegundos
 */
export function rateLimiter(maxRequests: number = 5, windowMs: number = 60000) {
  return async (c: Context, next: Next) => {
    const clientIP = c.req.header("cf-connecting-ip") || 
                     c.req.header("x-forwarded-for") || 
                     c.req.header("x-real-ip") || 
                     "unknown";
    
    const now = Date.now();
    const key = `rate_limit:${clientIP}`;
    
    // Executar limpeza ocasional do cache (a cada 100 requests aproximadamente)
    if (Math.random() < 0.01) {
      cleanupRateLimitCache();
    }
    
    // Obter ou criar contador para este IP
    let requestData = requestCounts.get(key);
    
    if (!requestData || now > requestData.resetTime) {
      // Primeira request ou janela de tempo expirou
      requestData = {
        count: 1,
        resetTime: now + windowMs
      };
    } else {
      // Incrementar contador
      requestData.count++;
    }
    
    // Atualizar no mapa
    requestCounts.set(key, requestData);
    
    // Verificar se excedeu o limite
    if (requestData.count > maxRequests) {
      return c.json({
        success: false,
        errors: [{
          code: 429,
          message: "Muitas tentativas. Tente novamente em alguns minutos."
        }]
      }, 429);
    }
    
    // Adicionar headers informativos
    c.res.headers.set("X-RateLimit-Limit", maxRequests.toString());
    c.res.headers.set("X-RateLimit-Remaining", (maxRequests - requestData.count).toString());
    c.res.headers.set("X-RateLimit-Reset", new Date(requestData.resetTime).toISOString());
    
    await next();
  };
}

/**
 * Limpeza do cache de rate limiting
 * Remove entradas expiradas para evitar vazamento de memória
 */
function cleanupRateLimitCache() {
  const now = Date.now();
  for (const [key, data] of requestCounts.entries()) {
    if (now > data.resetTime) {
      requestCounts.delete(key);
    }
  }
}