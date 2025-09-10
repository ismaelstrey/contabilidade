import { OpenAPIRoute, contentJson } from 'chanfana';
import { z } from 'zod';
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
        description: 'Credenciais inválidas',
        ...contentJson(
          z.object({
            success: z.boolean(),
            message: z.string(),
          })
        ),
      },
      '403': {
        description: 'Usuário inativo',
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
        user.senha as string,
        c.env.SALT_ROUNDS
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
          sub: (user.id as number).toString(),
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