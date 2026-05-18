type HttpMethod = "get" | "post" | "put" | "delete";

type ManualRegistry = {
  registerPath: (route: unknown) => void;
};

type RouteDoc = {
  method: HttpMethod;
  path: string;
  tags: string[];
  summary: string;
  description?: string;
  secure?: boolean;
  requestBody?: unknown;
  parameters?: unknown[];
  successDescription?: string;
};

const jsonEnvelope = {
  type: "object",
  properties: {
    success: { type: "boolean" },
    message: { type: "string" },
    data: {},
  },
};

const jsonBody = (schema: unknown, description = "Payload JSON"): unknown => ({
  description,
  required: true,
  content: {
    "application/json": {
      schema,
    },
  },
});

const multipartBody = (description = "Upload de arquivo"): unknown => ({
  description,
  required: true,
  content: {
    "multipart/form-data": {
      schema: {
        type: "object",
        required: ["file"],
        properties: {
          file: { type: "string", format: "binary" },
          folder: { type: "string", example: "articles/2026/05" },
          altText: { type: "string" },
        },
      },
    },
  },
});

const pathParam = (name: string, schema: unknown = { type: "string" }): unknown => ({
  name,
  in: "path",
  required: true,
  schema,
});

const register = (registry: ManualRegistry, doc: RouteDoc): void => {
  registry.registerPath({
    method: doc.method,
    path: doc.path,
    tags: doc.tags,
    summary: doc.summary,
    description: doc.description,
    security: doc.secure ? [{ bearerAuth: [] }] : undefined,
    parameters: doc.parameters,
    request: doc.requestBody ? { body: doc.requestBody } : undefined,
    responses: {
      "200": {
        description: doc.successDescription || "Operaçao realizada com sucesso",
        content: {
          "application/json": {
            schema: jsonEnvelope,
          },
        },
      },
      "400": {
        description: "Requisiçao invalida",
        content: {
          "application/json": {
            schema: jsonEnvelope,
          },
        },
      },
      "401": {
        description: "Nao autenticado",
        content: {
          "application/json": {
            schema: jsonEnvelope,
          },
        },
      },
      "403": {
        description: "Sem permissao",
        content: {
          "application/json": {
            schema: jsonEnvelope,
          },
        },
      },
      "404": {
        description: "Nao encontrado",
        content: {
          "application/json": {
            schema: jsonEnvelope,
          },
        },
      },
    },
  });
};

const servicePayload = {
  type: "object",
  required: ["nome", "descricao"],
  properties: {
    nome: { type: "string" },
    descricao: { type: "string" },
    preco: { type: "number", nullable: true },
    ativo: { type: "boolean" },
    slug: { type: "string" },
    categoria: { type: "string" },
    destaque: { type: "boolean" },
    icon: { type: "string" },
    imageUrl: { type: "string" },
    sortOrder: { type: "number" },
    ctaLabel: { type: "string" },
    metaTitle: { type: "string" },
    metaDescription: { type: "string" },
    canonicalUrl: { type: "string" },
  },
};

const articlePayload = {
  type: "object",
  required: ["title", "excerpt", "content"],
  properties: {
    title: { type: "string" },
    slug: { type: "string" },
    excerpt: { type: "string" },
    content: { type: "string" },
    coverImageUrl: { type: "string" },
    ogImage: { type: "string" },
    categoryId: { type: "number", nullable: true },
    status: { type: "string", enum: ["draft", "scheduled", "published", "archived"] },
    readTimeMinutes: { type: "number" },
    metaTitle: { type: "string" },
    metaDescription: { type: "string" },
    canonicalUrl: { type: "string" },
    scheduledAt: { type: "string", nullable: true },
    publishedAt: { type: "string", nullable: true },
  },
};

const contactPayload = {
  type: "object",
  required: ["nome", "email", "mensagem"],
  properties: {
    nome: { type: "string" },
    email: { type: "string", format: "email" },
    telefone: { type: "string" },
    empresa: { type: "string" },
    servicoId: { type: "number" },
    mensagem: { type: "string" },
    pagePath: { type: "string" },
    referrer: { type: "string" },
    origem: { type: "string" },
    turnstileToken: { type: "string" },
  },
};

const analyticsPayload = {
  type: "object",
  required: ["eventName", "path"],
  properties: {
    eventName: { type: "string", example: "page_view" },
    path: { type: "string", example: "/posts" },
    articleSlug: { type: "string" },
    visitorId: { type: "string" },
    sessionId: { type: "string" },
    referrer: { type: "string" },
    deviceType: { type: "string" },
    campaign: { type: "string" },
    metadata: { type: "object" },
  },
};

const userPayload = {
  type: "object",
  required: ["nome", "email"],
  properties: {
    nome: { type: "string" },
    email: { type: "string", format: "email" },
    senha: { type: "string", format: "password" },
    role: { type: "string", enum: ["admin", "editor", "user", "viewer"] },
    ativo: { type: "boolean" },
  },
};

export const registerManualOpenApiRoutes = (registry: ManualRegistry): void => {
  [
    { method: "get", path: "/api/v1/public/services", tags: ["Publico"], summary: "Lista serviços públicos" },
    { method: "get", path: "/api/v1/public/articles", tags: ["Publico"], summary: "Lista artigos publicados" },
    { method: "get", path: "/api/v1/public/articles/{slug}", tags: ["Publico"], summary: "Busca artigo publicado por slug", parameters: [pathParam("slug")] },
    { method: "post", path: "/api/v1/public/contacts", tags: ["Publico"], summary: "Envia contato público", requestBody: jsonBody(contactPayload) },
    { method: "post", path: "/api/v1/public/analytics/events", tags: ["Publico"], summary: "Registra evento de analytics público", requestBody: jsonBody(analyticsPayload) },
    { method: "get", path: "/api/v1/admin/dashboard", tags: ["Admin"], summary: "Resumo do dashboard administrativo", secure: true },
    { method: "get", path: "/api/v1/admin/services", tags: ["Admin Serviços"], summary: "Lista serviços no admin", secure: true },
    { method: "post", path: "/api/v1/admin/services", tags: ["Admin Serviços"], summary: "Cria serviço", secure: true, requestBody: jsonBody(servicePayload) },
    { method: "put", path: "/api/v1/admin/services/{id}", tags: ["Admin Serviços"], summary: "Atualiza serviço", secure: true, parameters: [pathParam("id", { type: "integer" })], requestBody: jsonBody(servicePayload) },
    { method: "delete", path: "/api/v1/admin/services/{id}", tags: ["Admin Serviços"], summary: "Remove serviço", secure: true, parameters: [pathParam("id", { type: "integer" })] },
    { method: "get", path: "/api/v1/admin/users", tags: ["Admin Usuários"], summary: "Lista usuários", secure: true },
    { method: "post", path: "/api/v1/admin/users", tags: ["Admin Usuários"], summary: "Cria usuário", secure: true, requestBody: jsonBody({ ...userPayload, required: ["nome", "email", "senha"] }) },
    { method: "put", path: "/api/v1/admin/users/{id}", tags: ["Admin Usuários"], summary: "Atualiza usuário", secure: true, parameters: [pathParam("id", { type: "integer" })], requestBody: jsonBody(userPayload) },
    { method: "delete", path: "/api/v1/admin/users/{id}", tags: ["Admin Usuários"], summary: "Remove usuário", secure: true, parameters: [pathParam("id", { type: "integer" })] },
    { method: "put", path: "/api/v1/admin/profile", tags: ["Admin Perfil"], summary: "Atualiza perfil do usuário autenticado", secure: true, requestBody: jsonBody({ type: "object", required: ["nome", "email"], properties: { nome: { type: "string" }, email: { type: "string", format: "email" } } }) },
    { method: "get", path: "/api/v1/admin/article-categories", tags: ["Admin Artigos"], summary: "Lista categorias de artigos", secure: true },
    { method: "get", path: "/api/v1/admin/articles", tags: ["Admin Artigos"], summary: "Lista artigos no admin", secure: true },
    { method: "get", path: "/api/v1/admin/articles/{id}", tags: ["Admin Artigos"], summary: "Busca artigo por ID", secure: true, parameters: [pathParam("id", { type: "integer" })] },
    { method: "post", path: "/api/v1/admin/articles", tags: ["Admin Artigos"], summary: "Cria artigo", secure: true, requestBody: jsonBody(articlePayload) },
    { method: "put", path: "/api/v1/admin/articles/{id}", tags: ["Admin Artigos"], summary: "Atualiza artigo", secure: true, parameters: [pathParam("id", { type: "integer" })], requestBody: jsonBody(articlePayload) },
    { method: "delete", path: "/api/v1/admin/articles/{id}", tags: ["Admin Artigos"], summary: "Arquiva artigo", secure: true, parameters: [pathParam("id", { type: "integer" })] },
    { method: "get", path: "/api/v1/admin/contacts", tags: ["Admin Contatos"], summary: "Lista contatos/leads", secure: true },
    { method: "put", path: "/api/v1/admin/contacts/{id}/status", tags: ["Admin Contatos"], summary: "Atualiza status de contato", secure: true, parameters: [pathParam("id", { type: "integer" })], requestBody: jsonBody({ type: "object", required: ["status"], properties: { status: { type: "string" }, note: { type: "string" }, priority: { type: "string" } } }) },
    { method: "get", path: "/api/v1/admin/media", tags: ["Admin Mídia"], summary: "Lista mídias", secure: true },
    { method: "post", path: "/api/v1/admin/media", tags: ["Admin Mídia"], summary: "Faz upload de mídia para R2", secure: true, requestBody: multipartBody() },
    { method: "delete", path: "/api/v1/admin/media/{id}", tags: ["Admin Mídia"], summary: "Remove mídia", secure: true, parameters: [pathParam("id", { type: "integer" })] },
    { method: "get", path: "/api/v1/admin/settings", tags: ["Admin Configurações"], summary: "Lista configurações", secure: true },
    { method: "put", path: "/api/v1/admin/settings", tags: ["Admin Configurações"], summary: "Salva configurações", secure: true, requestBody: jsonBody({ type: "object", additionalProperties: { type: "string" } }) },
  ].forEach((doc) => register(registry, doc as RouteDoc));
};
