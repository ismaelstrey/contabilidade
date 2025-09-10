# Sistema de Contabilidade - API

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/cloudflare/templates/tree/main/chanfana-openapi-template)

![Sistema de Contabilidade Preview](https://imagedelivery.net/wSMYJvS3Xw-n339CbDyDIA/91076b39-1f5b-46f6-7f14-536a6f183000/public)

## Sobre o Projeto

Este é um sistema completo de API para contabilidade desenvolvido com Cloudflare Workers, OpenAPI 3.1, [chanfana](https://github.com/cloudflare/chanfana) e [Hono](https://github.com/honojs/hono).

O sistema oferece funcionalidades completas para gerenciamento de:
- **Serviços** - Cadastro e gerenciamento de serviços oferecidos
- **Contatos** - Sistema de contato com clientes e leads
- **Testimonials** - Depoimentos de clientes com suporte a imagens
- **Autenticação** - Sistema JWT com controle de acesso baseado em roles
- **Rate Limiting** - Proteção contra abuso de endpoints públicos

## Funcionalidades Principais

### 🔐 Autenticação e Autorização
- Sistema JWT completo com refresh tokens
- Controle de acesso baseado em roles (admin/user)
- Middleware de autenticação para endpoints protegidos
- Hash seguro de senhas com bcrypt

### 📋 Gerenciamento de Serviços
- CRUD completo para serviços
- Validação de dados com Zod
- Controle de status (ativo/inativo)
- Endpoints protegidos para administradores

### 📞 Sistema de Contatos
- Endpoint público para recebimento de contatos
- Validação de telefone brasileiro
- Relacionamento com serviços
- Rate limiting para prevenir spam
- Gerenciamento administrativo de contatos

### ⭐ Testimonials
- Sistema completo de depoimentos
- Suporte a upload de imagens
- Sistema de avaliação (1-5 estrelas)
- Endpoint público para criação
- Gerenciamento administrativo

### 🛡️ Segurança
- Rate limiting configurável por endpoint
- Validação rigorosa de dados de entrada
- Sanitização de conteúdo
- Headers de segurança

## Tecnologias Utilizadas

- **Runtime**: Cloudflare Workers
- **Framework**: Hono.js
- **OpenAPI**: Chanfana (geração automática de schema)
- **Banco de Dados**: Cloudflare D1 (SQLite)
- **Validação**: Zod
- **Autenticação**: JWT + bcrypt
- **Testes**: Vitest
- **TypeScript**: Tipagem completa

## Estrutura da API

### Endpoints Disponíveis

#### Autenticação
- `POST /api/v1/auth/login` - Login de usuário
- `POST /api/v1/auth/refresh` - Renovar token JWT

#### Serviços
- `GET /api/v1/servicos` - Listar serviços (público)
- `POST /api/v1/servicos` - Criar serviço (admin)
- `GET /api/v1/servicos/:id` - Obter serviço específico (público)
- `PUT /api/v1/servicos/:id` - Atualizar serviço (admin)
- `DELETE /api/v1/servicos/:id` - Deletar serviço (admin)

#### Contatos
- `POST /api/v1/contatos` - Criar contato (público, rate limited)
- `GET /api/v1/contatos` - Listar contatos (admin)
- `GET /api/v1/contatos/:id` - Obter contato específico (admin)
- `PUT /api/v1/contatos/:id` - Atualizar status do contato (admin)

#### Testimonials
- `POST /api/v1/testimonials` - Criar testimonial (público, rate limited)
- `GET /api/v1/testimonials` - Listar testimonials (público)
- `GET /api/v1/testimonials/:id` - Obter testimonial específico (público)
- `PUT /api/v1/testimonials/:id` - Atualizar testimonial (admin)
- `DELETE /api/v1/testimonials/:id` - Deletar testimonial (admin)

## Configuração e Instalação

### Pré-requisitos
- Node.js 18+
- pnpm (recomendado) ou npm
- Conta Cloudflare com Workers habilitado

### Passos de Instalação

1. **Clone o projeto e instale dependências:**
   ```bash
   git clone <repository-url>
   cd contabilidade
   pnpm install
   ```

2. **Configure o banco de dados D1:**
   ```bash
   npx wrangler d1 create contabilidade-db
   ```
   Atualize o `database_id` no arquivo `wrangler.jsonc` com o ID retornado.

3. **Configure as variáveis de ambiente:**
   ```bash
   # No wrangler.jsonc, adicione:
   "vars": {
     "JWT_SECRET": "sua_chave_secreta_jwt_muito_forte_aqui",
     "SALT_ROUNDS": "12"
   }
   ```

4. **Execute as migrações do banco:**
   ```bash
   npx wrangler d1 migrations apply contabilidade-db --remote
   ```

5. **Inicie o servidor de desenvolvimento:**
   ```bash
   pnpm dev
   ```

6. **Deploy para produção:**
   ```bash
   npx wrangler deploy
   ```

## Desenvolvimento

### Executar Localmente
```bash
pnpm dev
```
O servidor estará disponível em `http://localhost:8787`

### Executar Testes
```bash
pnpm test
```

### Gerar Schema OpenAPI
```bash
pnpm run schema
```

### Estrutura do Projeto

```
src/
├── endpoints/          # Definição dos endpoints
│   ├── auth/          # Autenticação
│   ├── servicos/      # Gerenciamento de serviços
│   ├── contatos/      # Sistema de contatos
│   └── testimonials/  # Sistema de testimonials
├── middleware/        # Middlewares (auth, rate limiting)
├── utils/            # Utilitários (auth, upload de imagens)
├── types.ts          # Definições de tipos TypeScript
└── index.ts          # Router principal

migrations/           # Migrações do banco de dados
tests/               # Testes de integração
```

## Banco de Dados

O sistema utiliza Cloudflare D1 (SQLite) com as seguintes tabelas:

- **users** - Usuários do sistema
- **servicos** - Serviços oferecidos
- **contatos** - Contatos de clientes
- **testimonials** - Depoimentos de clientes
- **tasks** - Sistema de tarefas (exemplo)

## Segurança

- Todas as senhas são hasheadas com bcrypt
- Tokens JWT com expiração configurável
- Rate limiting em endpoints públicos
- Validação rigorosa de entrada de dados
- Sanitização de conteúdo HTML
- Headers de segurança configurados

## Monitoramento

```bash
# Monitorar logs em tempo real
npx wrangler tail

# Ver métricas
npx wrangler metrics
```

## Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## Documentação Adicional

- [Chanfana Documentation](https://chanfana.com/)
- [Hono Documentation](https://hono.dev/docs)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [Cloudflare D1](https://developers.cloudflare.com/d1/)
- [Vitest Documentation](https://vitest.dev/guide/)
