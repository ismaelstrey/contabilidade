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
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean' },
                message: { type: 'string' },
                data: {
                  type: 'object',
                  properties: {
                    user: userResponse,
                    token: { type: 'string' },
                    refreshToken: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
      '400': {
        description: 'Dados inválidos',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean' },
                message: { type: 'string' },
                errors: { type: 'array', items: { type: 'string' } },
              },
            },
          },
        },
      },
      '401': {
        description: 'Refresh token inválido',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean' },
                message: { type: 'string' },
              },
            },
          },
        },
      },
    },
  };

  public async handle(c: AppContext) {
    try {
      // Validar dados de entrada
      const validatedData = this.getValidatedData<typeof this.schema>();

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
          sub: user.id as number,
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
    } catch (error: any) {
      console.error('Erro ao renovar token:', error);

      if (error.name === 'ZodError') {
        return c.json(
          {
            success: false,
            message: 'Dados inválidos',
            errors: error.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`),
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