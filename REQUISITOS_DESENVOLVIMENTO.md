# Requisitos de Desenvolvimento - Backend Contabilidade

## Visão Geral do Projeto

Este é um projeto de backend desenvolvido para ser executado na **Cloudflare Workers**, utilizando uma arquitetura moderna com OpenAPI 3.1, validação automática e geração de documentação.

## Stack Tecnológica

### Core Framework
- **Runtime**: Cloudflare Workers
- **Framework Web**: [Hono](https://hono.dev/) v4.8.2
- **OpenAPI**: [Chanfana](https://chanfana.com/) v2.8.1 para geração automática de schema e validação
- **Linguagem**: TypeScript v5.8.3
- **Validação**: Zod v3.25.67

### Banco de Dados
- **Database**: Cloudflare D1 (SQLite)
- **Migrations**: Sistema de migração nativo do Wrangler
- **ORM**: Chanfana D1 AutoEndpoints para operações CRUD automatizadas

### Ferramentas de Desenvolvimento
- **Build Tool**: Wrangler v4.21.x
- **Testes**: Vitest com @cloudflare/vitest-pool-workers
- **Gerenciador de Pacotes**: pnpm (conforme scripts do package.json)
- **TypeScript Config**: Strict mode habilitado

## Estrutura de Arquivos

```
src/
├── index.ts              # Ponto de entrada principal
├── types.ts              # Definições de tipos globais
└── endpoints/            # Endpoints organizados por domínio
    ├── dummyEndpoint.ts  # Exemplo de endpoint customizado
    └── tasks/            # Módulo de tasks
        ├── base.ts       # Modelo e schema base
        ├── router.ts     # Roteamento do módulo
        ├── taskCreate.ts # Endpoint de criação
        ├── taskList.ts   # Endpoint de listagem
        ├── taskRead.ts   # Endpoint de leitura
        ├── taskUpdate.ts # Endpoint de atualização
        └── taskDelete.ts # Endpoint de exclusão

migrations/               # Migrações do banco de dados
tests/                   # Testes de integração
```

## Padrões de Desenvolvimento

### 1. Padrões de Tipagem TypeScript

#### Schemas Zod
Todos os schemas devem ser definidos usando Zod para validação e tipagem:

```typescript
// Schema base com validações
export const user = z.object({
  id: z.number().int(),
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(100, "Nome deve ter no máximo 100 caracteres"),
  email: z.string().email("Email deve ter formato válido").max(255, "Email deve ter no máximo 255 caracteres"),
  senha: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
  role: z.enum(["admin", "user", "viewer"], {
    errorMap: () => ({ message: "Role deve ser admin, user ou viewer" })
  }),
  active: z.boolean(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

// Derivar schemas específicos
export const userRegister = user.omit({ id: true, created_at: true, updated_at: true });
export const userResponse = user.omit({ senha: true });

// Tipos TypeScript derivados
export type User = z.infer<typeof user>;
export type UserRegister = z.infer<typeof userRegister>;
export type UserResponse = z.infer<typeof userResponse>;
```

#### Tratamento de Erros com Tipagem
Sempre usar conversão de tipo segura para erros:

```typescript
// ❌ INCORRETO - conversão direta
const zodError = error as { issues: Array<{ path: string[]; message: string }> };

// ✅ CORRETO - conversão segura
const zodError = error as unknown as { issues: Array<{ path: string[]; message: string }> };
```

#### Tipos Globais
Definir tipos compartilhados em `src/types.ts`:

```typescript
// Interface para usuário autenticado
export interface AuthenticatedUser {
  id: number;
  nome: string;
  email: string;
  role: 'admin' | 'user' | 'viewer';
  active: boolean;
}

// Tipos para contexto da aplicação
export type AppContext = Context<{ Bindings: Env }>;
export type HandleArgs = [AppContext];

// Tipos para respostas da API
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
  code?: string;
}
```

### 2. Estrutura de Endpoints

#### Endpoints Automatizados (CRUD)
Utilizar Chanfana D1 AutoEndpoints para operações CRUD padrão:

```typescript
// Exemplo: taskList.ts
import { D1ListEndpoint } from "chanfana";
import { HandleArgs } from "../../types";
import { TaskModel } from "./base";

export class TaskList extends D1ListEndpoint<HandleArgs> {
  _meta = {
    model: TaskModel,
  };
  searchFields = ["name", "slug", "description"];
  defaultOrderBy = "id DESC";

  public schema = {
    security: [{ bearerAuth: [] }],
    tags: ["Tasks"],
    summary: "Lista todas as tasks",
    description: "Retorna lista paginada de tasks do usuário autenticado",
  };
}
```

#### Endpoints Customizados
Para lógica específica, estender OpenAPIRoute com tipagem completa:

```typescript
// Exemplo: endpoint de autenticação
import { OpenAPIRoute, contentJson } from "chanfana";
import { AppContext } from "../types";
import { z } from "zod";

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
    },
  };

  public async handle(c: AppContext): Promise<object> {
    const data = await this.getValidatedData<typeof this.schema>();
    // lógica do endpoint com tipagem completa
  }
}
```

### 3. Modelos de Dados

Todos os modelos devem seguir o padrão estabelecido em `base.ts`:

```typescript
import { z } from "zod";

// Schema Zod para validação
export const task = z.object({
  id: z.number().int(),
  name: z.string(),
  slug: z.string(),
  description: z.string(),
  completed: z.boolean(),
  due_date: z.string().datetime(),
});

// Modelo para Chanfana com tipagem correta
export const TaskModel = {
  tableName: "tasks",
  primaryKeys: ["id"],
  schema: task,
  serializer: (obj: Record<string, unknown>): object => {
    return {
      ...obj,
      completed: Boolean(obj.completed),
    };
  },
  serializerObject: task,
};

// Tipos TypeScript derivados
export type Task = z.infer<typeof task>;
```

### 4. Middleware de Autenticação

Padrão para middleware com tipagem completa:

```typescript
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

  // Adicionar usuário ao request com tipagem
  const user: AuthenticatedUser = {
    id: payload.sub,
    nome: payload.nome,
    email: payload.email,
    role: payload.role,
    active: true,
  };
  
  (request as Request & { user: AuthenticatedUser }).user = user;
}

// Utilitários tipados
export function getCurrentUser(request: Request): AuthenticatedUser | null {
  return (request as Request & { user?: AuthenticatedUser }).user || null;
}

export function hasRole(request: Request, role: string): boolean {
  const user = getCurrentUser(request);
  return user?.role === role || false;
}
```

### 5. Utilitários de Autenticação

Padrão para funções utilitárias com tipagem:

```typescript
import { sign, verify } from '@tsndr/cloudflare-worker-jwt';
import { JwtPayload } from '../endpoints/auth/base';

/**
 * Gera token JWT com tipagem completa
 */
export async function generateJWT(
  payload: Omit<JwtPayload, 'iat' | 'exp'>,
  secret: string,
  expiresIn: number = 86400
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const jwtPayload: JwtPayload = {
    ...payload,
    sub: payload.sub.toString(),
    iat: now,
    exp: now + expiresIn,
  };

  return await sign(jwtPayload, secret);
}

/**
 * Verifica token JWT com retorno tipado
 */
export async function verifyJWT(token: string, secret: string): Promise<JwtPayload | null> {
  try {
    const isValid = await verify(token, secret);
    if (!isValid) return null;
    
    // Decodificar payload com tipagem
    const payload = JSON.parse(atob(token.split('.')[1])) as JwtPayload;
    return payload;
  } catch {
    return null;
  }
}
```

### 6. Roteamento

Organizar rotas por módulo usando Hono sub-routers com tipagem:

```typescript
// router.ts
import { Hono } from "hono";
import { fromHono } from "chanfana";
import { TaskList } from './taskList';
import { TaskCreate } from './taskCreate';
import { TaskRead } from './taskRead';
import { TaskUpdate } from './taskUpdate';
import { TaskDelete } from './taskDelete';

export const tasksRouter = fromHono(new Hono());

// Registrar endpoints CRUD com tipagem
tasksRouter.get("/", TaskList);
tasksRouter.post("/", TaskCreate);
tasksRouter.get("/:id", TaskRead);
tasksRouter.put("/:id", TaskUpdate);
tasksRouter.delete("/:id", TaskDelete);
```

```typescript
// Exemplo: router de autenticação
import { Hono } from "hono";
import { fromHono } from "chanfana";
import { AuthRegister } from './register';
import { AuthLogin } from './login';
import { AuthRefresh } from './refresh';
import { AuthMe } from './me';

export const authRouter = fromHono(new Hono());

// Rotas de autenticação
authRouter.post('/auth/register', AuthRegister);
authRouter.post('/auth/login', AuthLogin);
authRouter.post('/auth/refresh', AuthRefresh);
authRouter.get('/auth/me', AuthMe);
```

### 7. Tratamento de Erros

Implementar tratamento global de erros no `index.ts` com tipagem:

```typescript
import { ApiException } from "chanfana";
import { ContentfulStatusCode } from "hono/utils/http-status";

app.onError((err, c) => {
  if (err instanceof ApiException) {
    // Chanfana ApiException com tipagem
    return c.json(
      { success: false, errors: err.buildResponse() },
      err.status as ContentfulStatusCode,
    );
  }

  // Log removido para conformidade com ESLint
  // Para outros erros, retornar resposta 500 genérica
  return c.json(
    {
      success: false,
      errors: [{ code: 7000, message: "Internal Server Error" }],
    },
    500,
  );
});
```

### 8. Validação de Dados

Padrão para validação usando `getValidatedData` com tipagem:

```typescript
export class AuthLogin extends OpenAPIRoute {
  public async handle(c: AppContext): Promise<object> {
    try {
      // Validação com tipagem completa
      const data = await this.getValidatedData<typeof this.schema>();
      
      // Acessar dados validados com tipagem
      const { email, senha } = data.body;
      
      // Lógica do endpoint...
      
    } catch (error) {
      // Tratamento de erro Zod com tipagem segura
      if (error && typeof error === 'object' && 'issues' in error) {
        const zodError = error as unknown as { 
          issues: Array<{ path: string[]; message: string }> 
        };
        
        const errors = zodError.issues.map(issue => 
          `${issue.path.join('.')}: ${issue.message}`
        );
        
        return {
          success: false,
          message: 'Dados inválidos',
          errors,
        };
      }
      
      throw error;
    }
  }
}
```

### 9. Boas Práticas de Tipagem

#### Regras Obrigatórias:
1. **Nunca usar `any`** - sempre especificar tipos explícitos ou usar `unknown`
2. **Conversões de tipo seguras** - usar `as unknown as Type` para conversões complexas
3. **Schemas Zod primeiro** - definir schemas antes dos tipos TypeScript
4. **Tipos derivados** - usar `z.infer<typeof schema>` para gerar tipos
5. **Validação obrigatória** - sempre usar `getValidatedData` em endpoints
6. **Comentários em português** - documentar funções e interfaces complexas
7. **Await obrigatório** - sempre usar `await` com `getValidatedData`

#### Estrutura de Arquivos:
```
src/
├── types.ts              # Tipos globais compartilhados
├── endpoints/
│   └── [modulo]/
│       ├── base.ts       # Schemas Zod e tipos do módulo
│       ├── router.ts     # Roteamento do módulo
│       └── [endpoint].ts # Implementação dos endpoints
├── middleware/
│   └── auth.ts          # Middleware de autenticação tipado
└── utils/
    └── auth.ts          # Utilitários de autenticação tipados
```

#### Exemplo Completo de Módulo:
```typescript
// base.ts - Schemas e tipos
export const item = z.object({
  id: z.number().int(),
  name: z.string().min(1).max(100),
  active: z.boolean(),
});

export const ItemModel = {
  tableName: "items",
  primaryKeys: ["id"],
  schema: item,
  serializer: (obj: Record<string, unknown>): object => ({
    ...obj,
    active: Boolean(obj.active),
  }),
  serializerObject: item,
};

export type Item = z.infer<typeof item>;
```

### 6. Migrações de Banco

Criar migrações numeradas sequencialmente:

```sql
-- Migration number: 0001
CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT NOT NULL,
    completed INTEGER NOT NULL,
    due_date DATETIME NOT NULL
);
```

## Scripts de Desenvolvimento

```json
{
  "scripts": {
    "cf-typegen": "wrangler types",
    "deploy": "wrangler deploy",
    "dev": "pnpm seedLocalDb && wrangler dev",
    "predeploy": "wrangler d1 migrations apply DB --remote",
    "seedLocalDb": "wrangler d1 migrations apply DB --local",
    "schema": "npx chanfana",
    "test": "wrangler deploy --dry-run && npx vitest run --config tests/vitest.config.mts"
  }
}
```

## Configuração do Ambiente

### wrangler.jsonc
```json
{
  "compatibility_date": "2025-04-01",
  "main": "src/index.ts",
  "name": "contabilidade",
  "upload_source_maps": true,
  "observability": { "enabled": true },
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "openapi-template-db",
      "database_id": "[SEU_DATABASE_ID]"
    }
  ]
}
```

### tsconfig.json
```json
{
  "compilerOptions": {
    "target": "esnext",
    "lib": ["esnext"],
    "module": "esnext",
    "moduleResolution": "bundler",
    "types": ["@types/node", "./worker-configuration.d.ts"],
    "noEmit": true,
    "isolatedModules": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "strict": true
  },
  "include": ["src"]
}
```

## Fluxo de Desenvolvimento

1. **Setup Inicial**:
   ```bash
   pnpm install
   npx wrangler d1 create [database-name]
   # Atualizar database_id no wrangler.jsonc
   ```

2. **Desenvolvimento Local**:
   ```bash
   pnpm dev  # Aplica migrações e inicia dev server
   ```

3. **Criação de Novos Endpoints**:
   - Criar modelo em `base.ts`
   - Implementar endpoints CRUD ou customizados
   - Registrar no router
   - Adicionar ao router principal

4. **Migrações**:
   ```bash
   # Local
   npx wrangler d1 migrations apply DB --local
   
   # Produção
   npx wrangler d1 migrations apply DB --remote
   ```

5. **Testes**:
   ```bash
   pnpm test
   ```

6. **Deploy**:
   ```bash
   pnpm deploy
   ```

## Convenções de Nomenclatura

- **Arquivos**: camelCase (ex: `taskCreate.ts`)
- **Classes**: PascalCase (ex: `TaskCreate`)
- **Variáveis/Funções**: camelCase
- **Constantes**: UPPER_SNAKE_CASE
- **Tabelas DB**: snake_case (ex: `tasks`)
- **Campos DB**: snake_case (ex: `due_date`)

## Documentação OpenAPI

- Documentação automática disponível na rota `/`
- Schema exportável via `pnpm schema`
- Validação automática de request/response
- Tags organizadas por domínio

## Observabilidade

- Source maps habilitados para debugging
- Observability nativa da Cloudflare ativada
- Logs estruturados para erros
- Tratamento centralizado de exceções

---

**Nota**: Este documento deve ser atualizado sempre que novos padrões forem estabelecidos ou a arquitetura do projeto evoluir.