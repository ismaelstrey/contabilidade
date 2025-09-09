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

### 1. Estrutura de Endpoints

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
}
```

#### Endpoints Customizados
Para lógica específica, estender OpenAPIRoute:

```typescript
// Exemplo: dummyEndpoint.ts
import { contentJson, OpenAPIRoute } from "chanfana";
import { AppContext } from "../types";
import { z } from "zod";

export class DummyEndpoint extends OpenAPIRoute {
  public schema = {
    tags: ["Dummy"],
    summary: "this endpoint is an example",
    request: {
      params: z.object({ slug: z.string() }),
      body: contentJson(z.object({ name: z.string() }))
    },
    responses: { /* definir responses */ }
  };

  public async handle(c: AppContext) {
    const data = await this.getValidatedData<typeof this.schema>();
    // lógica do endpoint
  }
}
```

### 2. Modelos de Dados

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

// Modelo para Chanfana
export const TaskModel = {
  tableName: "tasks",
  primaryKeys: ["id"],
  schema: task,
  serializer: (obj: Record<string, string | number | boolean>) => {
    return {
      ...obj,
      completed: Boolean(obj.completed),
    };
  },
  serializerObject: task,
};
```

### 3. Roteamento

Organizar rotas por módulo usando Hono sub-routers:

```typescript
// router.ts
import { Hono } from "hono";
import { fromHono } from "chanfana";

export const tasksRouter = fromHono(new Hono());

// Registrar endpoints CRUD
tasksRouter.get("/", TaskList);
tasksRouter.post("/", TaskCreate);
tasksRouter.get("/:id", TaskRead);
tasksRouter.put("/:id", TaskUpdate);
tasksRouter.delete("/:id", TaskDelete);
```

### 4. Tratamento de Erros

Implementar tratamento global de erros no `index.ts`:

```typescript
app.onError((err, c) => {
  if (err instanceof ApiException) {
    return c.json(
      { success: false, errors: err.buildResponse() },
      err.status as ContentfulStatusCode,
    );
  }
  
  console.error("Global error handler caught:", err);
  return c.json(
    {
      success: false,
      errors: [{ code: 7000, message: "Internal Server Error" }],
    },
    500,
  );
});
```

### 5. Tipagem

Definir tipos globais em `types.ts`:

```typescript
import type { Context } from "hono";

export type AppContext = Context<{ Bindings: Env }>;
export type HandleArgs = [AppContext];
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