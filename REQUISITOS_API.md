# Requisitos da API - Sistema de Contabilidade

## Visão Geral

Este documento especifica os requisitos funcionais da API do sistema de contabilidade, desenvolvida como Cloudflare Worker seguindo os padrões estabelecidos no projeto.

## 1. Sistema de Autenticação

### 1.1 Modelo de Usuário

**Tabela: `users`**

| Campo | Tipo | Descrição | Obrigatório |
|-------|------|-----------|-------------|
| id | INTEGER PRIMARY KEY | Identificador único | Sim |
| nome | TEXT | Nome completo do usuário | Sim |
| email | TEXT UNIQUE | Email único para login | Sim |
| senha | TEXT | Hash da senha (bcrypt) | Sim |
| role | TEXT | Papel do usuário no sistema | Sim |
| created_at | DATETIME | Data de criação | Sim |
| updated_at | DATETIME | Data de atualização | Sim |
| active | BOOLEAN | Status ativo/inativo | Sim |

**Roles Disponíveis:**
- `admin`: Acesso total ao sistema
- `user`: Acesso limitado às funcionalidades básicas
- `viewer`: Apenas visualização

### 1.2 Endpoints de Autenticação

#### POST /auth/register
**Descrição**: Cadastro de novo usuário

**Request Body:**
```json
{
  "nome": "string",
  "email": "string",
  "senha": "string",
  "role": "admin|user|viewer"
}
```

**Response (201):**
```json
{
  "success": true,
  "result": {
    "id": "number",
    "nome": "string",
    "email": "string",
    "role": "string",
    "created_at": "datetime"
  }
}
```

#### POST /auth/login
**Descrição**: Autenticação de usuário

**Request Body:**
```json
{
  "email": "string",
  "senha": "string"
}
```

**Response (200):**
```json
{
  "success": true,
  "result": {
    "token": "jwt_token_string",
    "user": {
      "id": "number",
      "nome": "string",
      "email": "string",
      "role": "string"
    },
    "expires_in": "number"
  }
}
```

#### POST /auth/refresh
**Descrição**: Renovação de token JWT

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "success": true,
  "result": {
    "token": "new_jwt_token_string",
    "expires_in": "number"
  }
}
```

#### GET /auth/me
**Descrição**: Informações do usuário autenticado

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "success": true,
  "result": {
    "id": "number",
    "nome": "string",
    "email": "string",
    "role": "string",
    "created_at": "datetime"
  }
}
```

### 1.3 Middleware de Autenticação

**Funcionalidades:**
- Validação de JWT Token
- Verificação de expiração
- Extração de dados do usuário
- Controle de acesso por role

**Headers Obrigatórios:**
```
Authorization: Bearer <jwt_token>
```

## 2. Sistema de Serviços

### 2.1 Modelo de Serviço

**Tabela: `servicos`**

| Campo | Tipo | Descrição | Obrigatório |
|-------|------|-----------|-------------|
| id | INTEGER PRIMARY KEY | Identificador único | Sim |
| nome | TEXT | Nome do serviço | Sim |
| descricao | TEXT | Descrição detalhada | Não |
| preco | DECIMAL(10,2) | Preço do serviço | Não |
| ativo | BOOLEAN | Status ativo/inativo | Sim |
| created_at | DATETIME | Data de criação | Sim |
| updated_at | DATETIME | Data de atualização | Sim |

### 2.2 Endpoints de Serviços

#### GET /servicos
**Descrição**: Listagem de serviços ativos

**Query Parameters:**
- `page`: Número da página (opcional)
- `limit`: Itens por página (opcional)
- `search`: Busca por nome (opcional)

**Response (200):**
```json
{
  "success": true,
  "result": {
    "data": [
      {
        "id": "number",
        "nome": "string",
        "descricao": "string",
        "preco": "number",
        "ativo": "boolean"
      }
    ],
    "pagination": {
      "page": "number",
      "limit": "number",
      "total": "number",
      "pages": "number"
    }
  }
}
```

#### POST /servicos
**Descrição**: Cadastro de novo serviço (Requer autenticação - role: admin)

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "nome": "string",
  "descricao": "string",
  "preco": "number",
  "ativo": "boolean"
}
```

#### PUT /servicos/:id
**Descrição**: Atualização de serviço (Requer autenticação - role: admin)

#### DELETE /servicos/:id
**Descrição**: Exclusão de serviço (Requer autenticação - role: admin)

## 3. Sistema de Formulário de Contato

### 3.1 Modelo de Contato

**Tabela: `contatos`**

| Campo | Tipo | Descrição | Obrigatório |
|-------|------|-----------|-------------|
| id | INTEGER PRIMARY KEY | Identificador único | Sim |
| nome | TEXT | Nome do contato | Sim |
| email | TEXT | Email do contato | Sim |
| telefone | TEXT | Telefone do contato | Sim |
| empresa | TEXT | Nome da empresa | Não |
| servico_id | INTEGER | ID do serviço de interesse | Sim |
| mensagem | TEXT | Mensagem do contato | Sim |
| status | TEXT | Status do contato | Sim |
| created_at | DATETIME | Data de criação | Sim |
| updated_at | DATETIME | Data de atualização | Sim |

**Status Disponíveis:**
- `novo`: Contato recém-criado
- `em_andamento`: Em processo de atendimento
- `respondido`: Contato respondido
- `finalizado`: Contato finalizado

**Relacionamentos:**
- `servico_id` → `servicos.id` (Foreign Key)

### 3.2 Endpoints de Contato

#### POST /contatos
**Descrição**: Envio de formulário de contato (Público - sem autenticação)

**Request Body:**
```json
{
  "nome": "string",
  "email": "string",
  "telefone": "string",
  "empresa": "string",
  "servico_id": "number",
  "mensagem": "string"
}
```

**Validações:**
- `nome`: Mínimo 2 caracteres, máximo 100
- `email`: Formato de email válido
- `telefone`: Formato brasileiro (11) 99999-9999
- `empresa`: Máximo 100 caracteres (opcional)
- `servico_id`: Deve existir na tabela servicos e estar ativo
- `mensagem`: Mínimo 10 caracteres, máximo 1000

**Response (201):**
```json
{
  "success": true,
  "result": {
    "id": "number",
    "nome": "string",
    "email": "string",
    "telefone": "string",
    "empresa": "string",
    "servico": {
      "id": "number",
      "nome": "string"
    },
    "mensagem": "string",
    "status": "novo",
    "created_at": "datetime"
  }
}
```

#### GET /contatos
**Descrição**: Listagem de contatos (Requer autenticação - role: admin, user)

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `page`: Número da página (opcional)
- `limit`: Itens por página (opcional)
- `status`: Filtro por status (opcional)
- `servico_id`: Filtro por serviço (opcional)
- `search`: Busca por nome ou email (opcional)

**Response (200):**
```json
{
  "success": true,
  "result": {
    "data": [
      {
        "id": "number",
        "nome": "string",
        "email": "string",
        "telefone": "string",
        "empresa": "string",
        "servico": {
          "id": "number",
          "nome": "string"
        },
        "mensagem": "string",
        "status": "string",
        "created_at": "datetime"
      }
    ],
    "pagination": {
      "page": "number",
      "limit": "number",
      "total": "number",
      "pages": "number"
    }
  }
}
```

#### GET /contatos/:id
**Descrição**: Detalhes de um contato específico (Requer autenticação)

#### PUT /contatos/:id/status
**Descrição**: Atualização do status do contato (Requer autenticação - role: admin, user)

**Request Body:**
```json
{
  "status": "novo|em_andamento|respondido|finalizado"
}
```

## 4. Estrutura de Banco de Dados

### 4.1 Migrações Necessárias

**Migration 0002: Criar tabela users**
```sql
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    senha TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'user', 'viewer')),
    active BOOLEAN NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

**Migration 0003: Criar tabela servicos**
```sql
CREATE TABLE IF NOT EXISTS servicos (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    nome TEXT NOT NULL,
    descricao TEXT,
    preco DECIMAL(10,2),
    ativo BOOLEAN NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_servicos_ativo ON servicos(ativo);
CREATE INDEX idx_servicos_nome ON servicos(nome);
```

**Migration 0004: Criar tabela contatos**
```sql
CREATE TABLE IF NOT EXISTS contatos (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    nome TEXT NOT NULL,
    email TEXT NOT NULL,
    telefone TEXT NOT NULL,
    empresa TEXT,
    servico_id INTEGER NOT NULL,
    mensagem TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'novo' CHECK (status IN ('novo', 'em_andamento', 'respondido', 'finalizado')),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (servico_id) REFERENCES servicos(id)
);

CREATE INDEX idx_contatos_status ON contatos(status);
CREATE INDEX idx_contatos_servico_id ON contatos(servico_id);
CREATE INDEX idx_contatos_email ON contatos(email);
CREATE INDEX idx_contatos_created_at ON contatos(created_at);
```

## 5. Segurança e Validações

### 5.1 Autenticação JWT

**Configurações:**
- Algoritmo: HS256
- Expiração: 24 horas
- Secret: Variável de ambiente `JWT_SECRET`
- Refresh Token: 7 dias

**Payload do Token:**
```json
{
  "sub": "user_id",
  "email": "user_email",
  "role": "user_role",
  "iat": "issued_at",
  "exp": "expires_at"
}
```

### 5.2 Hash de Senhas

- Algoritmo: bcrypt
- Salt Rounds: 12
- Validação: Mínimo 8 caracteres, pelo menos 1 maiúscula, 1 minúscula, 1 número

### 5.3 Validações de Input

**Email:**
- Formato RFC 5322
- Máximo 255 caracteres
- Único na tabela users

**Telefone:**
- Formato brasileiro: (XX) XXXXX-XXXX
- Apenas números, parênteses, espaços e hífen

**Rate Limiting:**
- Login: 5 tentativas por IP a cada 15 minutos
- Contatos: 3 envios por IP a cada hora
- API Geral: 100 requests por IP a cada minuto

## 6. Códigos de Erro

### 6.1 Autenticação (7100-7199)
- `7100`: Token inválido
- `7101`: Token expirado
- `7102`: Credenciais inválidas
- `7103`: Usuário não encontrado
- `7104`: Usuário inativo
- `7105`: Permissão insuficiente
- `7106`: Email já cadastrado

### 6.2 Serviços (7200-7299)
- `7200`: Serviço não encontrado
- `7201`: Serviço inativo
- `7202`: Dados inválidos do serviço

### 6.3 Contatos (7300-7399)
- `7300`: Dados inválidos do contato
- `7301`: Serviço não encontrado
- `7302`: Email inválido
- `7303`: Telefone inválido
- `7304`: Mensagem muito curta
- `7305`: Rate limit excedido

## 7. Variáveis de Ambiente

```env
# JWT Configuration
JWT_SECRET=sua_chave_secreta_muito_forte
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Database
DB_NAME=contabilidade_db

# Rate Limiting
RATE_LIMIT_LOGIN=5
RATE_LIMIT_CONTACT=3
RATE_LIMIT_API=100

# Email Configuration (para notificações futuras)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu_email@gmail.com
SMTP_PASS=sua_senha_app
```

## 8. Documentação OpenAPI

**Tags Organizacionais:**
- `Authentication`: Endpoints de autenticação
- `Services`: Gerenciamento de serviços
- `Contacts`: Sistema de contatos
- `Users`: Gerenciamento de usuários

**Schemas Reutilizáveis:**
- `User`: Modelo de usuário
- `Service`: Modelo de serviço
- `Contact`: Modelo de contato
- `ErrorResponse`: Resposta de erro padrão
- `PaginationResponse`: Resposta paginada

## 9. Testes Necessários

### 9.1 Testes de Integração
- Fluxo completo de autenticação
- CRUD de serviços
- Envio e gerenciamento de contatos
- Validações de segurança
- Rate limiting

### 9.2 Testes de Unidade
- Validação de JWT
- Hash de senhas
- Validações de input
- Serialização de dados

---

**Observações:**
- Todos os endpoints devem seguir o padrão de resposta estabelecido no projeto
- Implementar logs estruturados para auditoria
- Considerar implementação de notificações por email para novos contatos
- Manter compatibilidade com o sistema de migrações existente