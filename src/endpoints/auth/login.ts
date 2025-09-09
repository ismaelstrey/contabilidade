import { OpenAPIRoute, contentJson } from 'chanfana';
import { userLogin, userResponse } from './base';
import { verifyPassword, generateJWT, generateRefreshToken } from '../../utils/auth';
import { AppContext } from '../../types';

export class AuthLogin extends OpenAPIRoute {
  public schema = {
    tags: ['Autenticação'],

    summary: 'Login de usuário',
    description: 'Autentica um usuário e retorna tokens de acesso',
    request: {
      body: contentJson(userLogin),
    },
    responses: {
      '200': {
        description: 'Login realizado com sucesso',
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
        description: 'Credenciais inválidas',
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
      '403': {
        description: 'Usuário inativo',
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
      const data = await this.getValidatedData<typeof this.schema>();
      const validatedData = data.body;

      // Buscar usuário por email
      const user = await c.env.DB.prepare(
        'SELECT id, nome, email, senha, role, active, created_at, updated_at FROM users WHERE email = ?'
      ).bind(validatedData.email).first();

      if (!user) {
        return c.json(
          {
            success: false,
            message: 'Credenciais inválidas',
          },
          401
        );
      }

      // Verificar se usuário está ativo
      if (!user.active) {
        return c.json(
          {
            success: false,
            message: 'Usuário inativo. Entre em contato com o administrador.',
          },
          403
        );
      }

      // Verificar senha
      const isPasswordValid = await verifyPassword(
        validatedData.senha,
        user.senha as string
      );

      if (!isPasswordValid) {
        return c.json(
          {
            success: false,
            message: 'Credenciais inválidas',
          },
          401
        );
      }

      // Gerar tokens
      const jwtSecret = c.env.JWT_SECRET;
      const token = await generateJWT(
        {
          sub: user.id as number,
          email: user.email as string,
          role: user.role as 'admin' | 'user' | 'viewer',
        },
        jwtSecret
      );

      const refreshToken = await generateRefreshToken(
        user.id as number,
        jwtSecret
      );

      return c.json(
        {
          success: true,
          message: 'Login realizado com sucesso',
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
            refreshToken,
          },
        },
        200
      );
    } catch (error: any) {
      console.error('Erro no login:', error);

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