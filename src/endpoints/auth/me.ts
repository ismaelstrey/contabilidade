import { OpenAPIRoute } from 'chanfana';
import { userResponse } from './base';
import { verifyJWT, extractTokenFromHeader } from '../../utils/auth';
import { AppContext } from '../../types';

export class AuthMe extends OpenAPIRoute {
  public schema = {
    tags: ['Autenticação'],
    summary: 'Obter dados do usuário atual',
    description: 'Retorna os dados do usuário autenticado',
    security: [
      {
        bearerAuth: [],
      },
    ],
    responses: {
      '200': {
        description: 'Dados do usuário obtidos com sucesso',
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
                  },
                },
              },
            },
          },
        },
      },
      '401': {
        description: 'Token inválido ou não fornecido',
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
      // Extrair token do header
      const authHeader = c.req.header('Authorization');
      const token = extractTokenFromHeader(authHeader);

      if (!token) {
        return c.json(
          {
            success: false,
            message: 'Token de acesso não fornecido',
          },
          401
        );
      }

      // Verificar token
      const payload = await verifyJWT(token, c.env.JWT_SECRET);

      if (!payload) {
        return c.json(
          {
            success: false,
            message: 'Token inválido ou expirado',
          },
          401
        );
      }

      // Buscar usuário atualizado no banco
      const user = await c.env.DB.prepare(
        'SELECT id, nome, email, role, active, created_at, updated_at FROM users WHERE id = ? AND active = 1'
      ).bind(payload.sub).first();

      if (!user) {
        return c.json(
          {
            success: false,
            message: 'Usuário não encontrado ou inativo',
          },
          401
        );
      }

      return c.json(
        {
          success: true,
          message: 'Dados do usuário obtidos com sucesso',
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
          },
        },
        200
      );
    } catch (error: any) {
      console.error('Erro ao obter dados do usuário:', error);

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