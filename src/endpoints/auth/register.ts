import { OpenAPIRoute, contentJson } from 'chanfana';
import { z } from 'zod';
import { userRegister, userResponse } from './base';
import { hashPassword, generateJWT, generateRefreshToken } from '../../utils/auth';
import { AppContext } from '../../types';

export class AuthRegister extends OpenAPIRoute {
  public schema = {
    tags: ['Autenticação'],
    summary: 'Registrar novo usuário',
    description: 'Cria uma nova conta de usuário no sistema',
    request: {
      body: contentJson(userRegister),
    },
    responses: {
      '201': {
        description: 'Usuário criado com sucesso',
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
      '409': {
        description: 'Email já existe',
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

      // Verificar se email já existe
      const existingUser = await c.env.DB.prepare(
        'SELECT id FROM users WHERE email = ?'
      ).bind(validatedData.email).first();

      if (existingUser) {
        return c.json(
          {
            success: false,
            message: 'Email já está em uso',
          },
          409
        );
      }

      // Hash da senha
      const hashedPassword = await hashPassword(validatedData.senha, c.env.SALT_ROUNDS);

      // Inserir usuário no banco
      const result = await c.env.DB.prepare(`
        INSERT INTO users (nome, email, senha, role, active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `).bind(
        validatedData.nome,
        validatedData.email,
        hashedPassword,
        validatedData.role,
        1
      ).run();

      if (!result.success) {
        throw new Error('Erro ao criar usuário');
      }

      // Buscar usuário criado
      const newUser = await c.env.DB.prepare(
        'SELECT id, nome, email, role, active, created_at, updated_at FROM users WHERE id = ?'
      ).bind(result.meta.last_row_id).first();

      if (!newUser) {
        throw new Error('Erro ao recuperar usuário criado');
      }

      // Gerar tokens
      const jwtSecret = c.env.JWT_SECRET;
      const token = await generateJWT(
        {
          sub: (newUser.id as number).toString(),
          email: newUser.email as string,
          role: newUser.role as 'admin' | 'user' | 'viewer',
        },
        jwtSecret
      );

      const refreshToken = await generateRefreshToken(
        newUser.id as number,
        jwtSecret
      );

      return c.json(
        {
          success: true,
          message: 'Usuário criado com sucesso',
          data: {
            user: {
              id: newUser.id,
              nome: newUser.nome,
              email: newUser.email,
              role: newUser.role,
              active: Boolean(newUser.active),
              created_at: newUser.created_at,
              updated_at: newUser.updated_at,
            },
            token,
            refreshToken,
          },
        },
        201
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