import { OpenAPIRoute, contentJson } from 'chanfana';
import { userResponse } from './base';
import { verifyRefreshToken, generateJWT, generateRefreshToken } from '../../utils/auth';
import { AppContext } from '../../types';
import { z } from 'zod';

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token é obrigatório'),
});

export class AuthRefresh extends OpenAPIRoute {
  public schema = {
    tags: ['Autenticação'],
    summary: 'Renovar token de acesso',
    description: 'Renova o token de acesso usando um refresh token válido',
    request: {
      body: contentJson(refreshTokenSchema),
    },
    responses: {
      '200': {
        description: 'Token renovado com sucesso',
        ...contentJson(
          z.object({
            success: z.boolean(),
            message: z.string(),
            data: z.object({
              user: userResponse,
              token: z.string(),
              refreshToken: z.string(),
            }),
          })
        ),
      },
      '400': {
        description: 'Dados inválidos',
        ...contentJson(
          z.object({
            success: z.boolean(),
            message: z.string(),
            errors: z.array(z.string()),
          })
        ),
      },
      '401': {
        description: 'Refresh token inválido',
        ...contentJson(
          z.object({
            success: z.boolean(),
            message: z.string(),
          })
        ),
      },
    },
  };

  public async handle(c: AppContext): Promise<object> {
    try {
      // Validar dados de entrada
      const validatedData = await this.getValidatedData<typeof this.schema>();

      // Verificar refresh token
      const userId = await verifyRefreshToken(
        validatedData.body.refreshToken,
        c.env.JWT_SECRET
      );

      if (!userId) {
        return c.json(
          {
            success: false,
            message: 'Refresh token inválido ou expirado',
          },
          401
        );
      }

      // Buscar usuário
      const user = await c.env.DB.prepare(
        'SELECT id, nome, email, role, active, created_at, updated_at FROM users WHERE id = ? AND active = 1'
      ).bind(userId).first();

      if (!user) {
        return c.json(
          {
            success: false,
            message: 'Usuário não encontrado ou inativo',
          },
          401
        );
      }

      // Gerar novos tokens
      const jwtSecret = c.env.JWT_SECRET;
      const token = await generateJWT(
        {
          sub: (user.id as number).toString(),
          email: user.email as string,
          role: user.role as 'admin' | 'user' | 'viewer',
        },
        jwtSecret
      );

      const newRefreshToken = await generateRefreshToken(
        user.id as number,
        jwtSecret
      );

      return c.json(
        {
          success: true,
          message: 'Token renovado com sucesso',
          data: {
            user: {
              id: user.id,
              nome: user.nome,
              email: user.email,
              role: user.role,
              active: Boolean(user.active),
              created_at: user.created_at,
              updated_at: user.updated_at,
            },
            token,
            refreshToken: newRefreshToken,
          },
        },
        200
      );
    } catch (error: unknown) {
      // Error handling (removed console.error for ESLint compliance)

      if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
        const zodError = error as unknown as { errors: Array<{ path: string[]; message: string }> };
        return c.json(
          {
            success: false,
            message: 'Dados inválidos',
            errors: zodError.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
          },
          400
        );
      }

      return c.json(
        {
          success: false,
          message: 'Erro interno do servidor',
        },
        500
      );
    }
  }
}