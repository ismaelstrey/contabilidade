# Sistema de Autenticação JWT

Este documento descreve o sistema de autenticação JWT implementado na API.

## Visão Geral

O sistema de autenticação utiliza JWT (JSON Web Tokens) para autenticar usuários e controlar acesso aos recursos da API. Foi implementado seguindo os padrões de segurança e as convenções do projeto.

## Estrutura Implementada

### 1. Migração de Banco de Dados
- **Arquivo**: `migrations/0002_add_users_table.sql`
- **Tabela**: `users`
- **Campos**:
  - `id`: Chave primária auto-incremento
  - `nome`: Nome do usuário (obrigatório)
  - `email`: Email único (obrigatório)
  - `senha`: Hash da senha (obrigatório)
  - `role`: Papel do usuário (`admin`, `user`, `viewer`)
  - `active`: Status ativo/inativo (padrão: true)
  - `created_at`: Data de criação
  - `updated_at`: Data de atualização

### 2. Modelo e Validações
- **Arquivo**: `src/endpoints/auth/base.ts`
- **Schemas Zod**:
  - `user`: Schema completo do usuário
  - `userRegister`: Schema para registro (sem campos automáticos)
  - `userLogin`: Schema para login
  - `userResponse`: Schema de resposta (sem senha)
  - `jwtPayload`: Schema do payload JWT

### 3. Utilitários de Autenticação
- **Arquivo**: `src/utils/auth.ts`
- **Funções**:
  - `hashPassword()`: Gera hash da senha
  - `verifyPassword()`: Verifica senha contra hash
  - `generateJWT()`: Gera token JWT
  - `verifyJWT()`: Verifica e decodifica JWT
  - `generateRefreshToken()`: Gera refresh token
  - `verifyRefreshToken()`: Verifica refresh token
  - `extractTokenFromHeader()`: Extrai token do header Authorization

### 4. Endpoints de Autenticação

#### POST `/api/v1/auth/register`
- **Descrição**: Registra novo usuário
- **Body**:
  ```json
  {
    "nome": "João Silva",
    "email": "joao@exemplo.com",
    "senha": "MinhaSenh@123",
    "role": "user"
  }
  ```
- **Resposta**: Dados do usuário + tokens

#### POST `/api/v1/auth/login`
- **Descrição**: Autentica usuário
- **Body**:
  ```json
  {
    "email": "joao@exemplo.com",
    "senha": "MinhaSenh@123"
  }
  ```
- **Resposta**: Dados do usuário + tokens

#### POST `/api/v1/auth/refresh`
- **Descrição**: Renova token de acesso
- **Body**:
  ```json
  {
    "refreshToken": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
  }
  ```
- **Resposta**: Novos tokens

#### GET `/api/v1/auth/me`
- **Descrição**: Obtém dados do usuário atual
- **Headers**: `Authorization: Bearer <token>`
- **Resposta**: Dados do usuário autenticado

### 5. Middleware de Autenticação
- **Arquivo**: `src/middleware/auth.ts`
- **Middlewares**:
  - `authMiddleware`: Autenticação obrigatória
  - `requireRole(roles)`: Autorização por papel
  - `optionalAuthMiddleware`: Autenticação opcional
- **Utilitários**:
  - `getCurrentUser(request)`: Obtém usuário do request
  - `hasRole(request, role)`: Verifica papel específico
  - `hasAnyRole(request, roles)`: Verifica múltiplos papéis

### 6. Tipos TypeScript
- **Arquivo**: `src/types.ts`
- **Tipos adicionados**:
  - `AuthenticatedUser`: Interface do usuário autenticado
  - `ApiResponse<T>`: Resposta padrão da API
  - `PaginationParams`: Parâmetros de paginação
  - `PaginatedResponse<T>`: Resposta paginada

## Como Usar

### 1. Configuração de Ambiente
Adicione as seguintes variáveis ao seu arquivo `.env` ou configuração do Cloudflare:

```env
JWT_SECRET=sua_chave_secreta_muito_forte_aqui
SALT_ROUNDS=bcrypt_salt_ou_string_personalizada
```

### 2. Executar Migrações
```bash
# Desenvolvimento local
pnpm seedLocalDb

# Produção
pnpm predeploy
```

### 3. Instalar Dependências
```bash
pnpm install
```

### 4. Proteger Endpoints

#### Autenticação Obrigatória
```typescript
import { authMiddleware } from '../middleware/auth';

// Aplicar middleware antes do handler
app.use('/api/protected/*', authMiddleware);
```

#### Autorização por Papel
```typescript
import { authMiddleware, requireRole } from '../middleware/auth';

// Apenas admins
app.use('/api/admin/*', authMiddleware, requireRole(['admin']));

// Admins e usuários
app.use('/api/users/*', authMiddleware, requireRole(['admin', 'user']));
```

#### Obter Usuário Atual
```typescript
import { getCurrentUser } from '../middleware/auth';

export class MyEndpoint extends OpenAPIRoute {
  async handle(request: Request, env: any, context: AppContext) {
    const user = getCurrentUser(request);
    
    if (user) {
      console.log(`Usuário: ${user.nome} (${user.role})`);
    }
  }
}
```

### 5. Exemplo de Uso no Frontend

```javascript
// Registro
const registerResponse = await fetch('/api/v1/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    nome: 'João Silva',
    email: 'joao@exemplo.com',
    senha: 'MinhaSenh@123',
    role: 'user'
  })
});

// Login
const loginResponse = await fetch('/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'joao@exemplo.com',
    senha: 'MinhaSenh@123'
  })
});

const { data } = await loginResponse.json();
const { token, refreshToken } = data;

// Usar token em requisições
const protectedResponse = await fetch('/api/v1/auth/me', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// Renovar token
const refreshResponse = await fetch('/api/v1/auth/refresh', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ refreshToken })
});
```

## Segurança

### Validações Implementadas
- **Senha forte**: Mínimo 8 caracteres, 1 maiúscula, 1 minúscula, 1 número
- **Email único**: Verificação de duplicidade
- **Hash de senha**: Usando SHA-256 + salt personalizado
- **Token expiration**: Access token (24h), Refresh token (30 dias)
- **Verificação de usuário ativo**: Tokens invalidados para usuários inativos

### Códigos de Erro
- `MISSING_TOKEN`: Token não fornecido
- `INVALID_TOKEN`: Token inválido ou expirado
- `USER_INACTIVE`: Usuário inativo
- `NOT_AUTHENTICATED`: Usuário não autenticado
- `INSUFFICIENT_PERMISSIONS`: Permissões insuficientes

## Próximos Passos

1. **Implementar logout**: Blacklist de tokens
2. **Reset de senha**: Endpoint para recuperação
3. **Auditoria**: Log de ações dos usuários
4. **Rate limiting**: Proteção contra ataques
5. **2FA**: Autenticação de dois fatores

## Documentação da API

Após iniciar o servidor, acesse `/` para ver a documentação OpenAPI completa com todos os endpoints de autenticação.