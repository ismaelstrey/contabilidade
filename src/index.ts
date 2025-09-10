import { ApiException, fromHono } from "chanfana";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { tasksRouter } from "./endpoints/tasks/router";
import { authRouter } from "./endpoints/auth/router";
import { servicosRouter } from "./endpoints/servicos/router";
import { contatosRouter } from "./endpoints/contatos/router";
import { testimonialsRouter } from "./endpoints/testimonials/router";
import { ContentfulStatusCode } from "hono/utils/http-status";
import { DummyEndpoint } from "./endpoints/dummyEndpoint";

// Start a Hono app
const app = new Hono<{ Bindings: Env }>();

// Configure CORS middleware
app.use('*', cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:4173',
    'https://contabilidadeigrejinha.com.br' // Substitua pela URL do seu frontend em produção
  ],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.onError((err, c) => {
  if (err instanceof ApiException) {
    // If it's a Chanfana ApiException, let Chanfana handle the response
    return c.json(
      { success: false, errors: err.buildResponse() },
      err.status as ContentfulStatusCode,
    );
  }

  // Log the error if it's not known (removed console.error for ESLint compliance)

  // For other errors, return a generic 500 response
  return c.json(
    {
      success: false,
      errors: [{ code: 7000, message: "Internal Server Error" }],
    },
    500,
  );
});

// Setup OpenAPI registry
const openapi = fromHono(app, {
  docs_url: "/",
  schema: {
    info: {
      title: "API Sistema de Contabilidade",
      version: "2.0.0",
      description: "API completa para sistema de contabilidade com autenticação JWT.",
    },
  },
});

// Add security schemes to the OpenAPI schema
openapi.registry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
  description: 'Token JWT obtido através do endpoint de login',
});

// Register routes
openapi.route("/api/v1", authRouter);

// Register tasks routes
openapi.route("/tasks", tasksRouter);

// Register servicos routes
openapi.route("/api/v1/servicos", servicosRouter);

// Register contatos routes
openapi.route("/api/v1/contatos", contatosRouter);

// Register testimonials routes
openapi.route("/api/v1/testimonials", testimonialsRouter);

// Register other endpoints
openapi.post("/dummy/:slug", DummyEndpoint);

// Export the Hono app
export default app;
