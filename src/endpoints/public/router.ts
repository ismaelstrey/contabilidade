import { Hono } from "hono";
import {
  addCacheHeaders,
  getArticleSlugFromPath,
  inferDeviceType,
  jsonSuccess,
  slugify,
  verifyTurnstile,
} from "../../utils/cms";

const app = new Hono<{ Bindings: Env }>();

const publicCache = "public, max-age=60, s-maxage=300, stale-while-revalidate=86400";

type PublicServiceRow = {
  id: number;
  nome: string;
  descricao: string | null;
  preco: number | null;
  ativo: number;
  slug: string | null;
  categoria: string | null;
  destaque: number;
  icon: string | null;
  image_url: string | null;
  sort_order: number;
  cta_label: string | null;
  meta_title: string | null;
  meta_description: string | null;
  canonical_url: string | null;
  schema_type: string | null;
};

type ArticleRow = {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image_url: string | null;
  og_image: string | null;
  category: string | null;
  category_slug: string | null;
  status: string;
  read_time_minutes: number;
  meta_title: string | null;
  meta_description: string | null;
  canonical_url: string | null;
  schema_type: string;
  published_at: string | null;
  updated_at: string;
};

type PublicServicePayload = Record<string, unknown>;
type PublicArticlePayload = Record<string, unknown>;

const servicePayloadBase = (service: PublicServiceRow): PublicServicePayload => ({
  id: service.id,
  nome: service.nome,
  title: service.nome,
  slug: service.slug || slugify(service.nome),
  descricao: service.descricao || "",
  description: service.descricao || "",
  preco: service.preco,
  categoria: service.categoria || "Contabilidade",
  destaque: Boolean(service.destaque),
  icon: service.icon,
  imageUrl: service.image_url,
  ctaLabel: service.cta_label || "Solicitar atendimento",
  seo: {
    metaTitle: service.meta_title || service.nome,
    metaDescription: service.meta_description || service.descricao || "",
    canonicalUrl: service.canonical_url,
    schemaType: service.schema_type || "Service",
  },
});

const servicePayload = (service: PublicServiceRow): PublicServicePayload => servicePayloadBase(service);

const articlePayloadBase = (article: ArticleRow, includeContent = false): PublicArticlePayload => ({
  id: article.id,
  title: article.title,
  slug: article.slug,
  excerpt: article.excerpt,
  content: includeContent ? article.content : undefined,
  category: article.category || "Contabilidade",
  categorySlug: article.category_slug || "contabilidade",
  coverImageUrl: article.cover_image_url,
  ogImage: article.og_image,
  status: article.status,
  readTime: `${article.read_time_minutes} min`,
  readTimeMinutes: article.read_time_minutes,
  date: article.published_at || article.updated_at,
  publishedAt: article.published_at,
  updatedAt: article.updated_at,
  seo: {
    metaTitle: article.meta_title || article.title,
    metaDescription: article.meta_description || article.excerpt,
    canonicalUrl: article.canonical_url,
    schemaType: article.schema_type || "Article",
  },
});

const articlePayload = (article: ArticleRow, includeContent = false): PublicArticlePayload => articlePayloadBase(article, includeContent);

app.get("/services", async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT id, nome, descricao, preco, ativo, slug, categoria, destaque, icon, image_url,
            sort_order, cta_label, meta_title, meta_description, canonical_url, schema_type
     FROM servicos
     WHERE ativo = 1
     ORDER BY destaque DESC, sort_order ASC, nome ASC`
  ).all<PublicServiceRow>();

  return addCacheHeaders(
    c.json(jsonSuccess("Servicos carregados com sucesso", results.map(servicePayload))),
    publicCache,
  );
});

app.get("/articles", async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT a.id, a.title, a.slug, a.excerpt, a.content, a.cover_image_url, a.og_image,
            c.name AS category, c.slug AS category_slug, a.status, a.read_time_minutes,
            a.meta_title, a.meta_description, a.canonical_url, a.schema_type,
            a.published_at, a.updated_at
     FROM articles a
     LEFT JOIN article_categories c ON c.id = a.category_id
     WHERE a.status = 'published'
       AND (a.published_at IS NULL OR a.published_at <= CURRENT_TIMESTAMP)
     ORDER BY COALESCE(a.published_at, a.updated_at) DESC`
  ).all<ArticleRow>();

  return addCacheHeaders(
    c.json(jsonSuccess("Artigos carregados com sucesso", results.map(article => articlePayload(article)))),
    publicCache,
  );
});

app.get("/articles/:slug", async (c) => {
  const article = await c.env.DB.prepare(
    `SELECT a.id, a.title, a.slug, a.excerpt, a.content, a.cover_image_url, a.og_image,
            c.name AS category, c.slug AS category_slug, a.status, a.read_time_minutes,
            a.meta_title, a.meta_description, a.canonical_url, a.schema_type,
            a.published_at, a.updated_at
     FROM articles a
     LEFT JOIN article_categories c ON c.id = a.category_id
     WHERE a.slug = ? AND a.status = 'published'
       AND (a.published_at IS NULL OR a.published_at <= CURRENT_TIMESTAMP)`
  ).bind(c.req.param("slug")).first<ArticleRow>();

  if (!article) {
    return c.json({ success: false, message: "Artigo nao encontrado" }, 404);
  }

  return addCacheHeaders(
    c.json(jsonSuccess("Artigo carregado com sucesso", articlePayload(article, true))),
    publicCache,
  );
});

app.post("/contacts", async (c) => {
  const payload = await c.req.json<Record<string, string | number | undefined>>().catch(() => null);

  if (!payload) {
    return c.json({ success: false, message: "Dados invalidos" }, 400);
  }

  const turnstileOk = await verifyTurnstile(String(payload.turnstileToken || ""), c.req.raw, c.env);
  if (!turnstileOk) {
    return c.json({ success: false, message: "Validacao anti-spam reprovada" }, 400);
  }

  const nome = String(payload.nome || "").trim();
  const email = String(payload.email || "").trim();
  const telefone = String(payload.telefone || "").trim();
  const mensagem = String(payload.mensagem || "").trim();
  const servicoId = Number(payload.servico_id || payload.servicoId || 1);

  if (nome.length < 2 || !email.includes("@") || telefone.length < 8 || mensagem.length < 10) {
    return c.json({ success: false, message: "Preencha nome, email, telefone e mensagem corretamente" }, 400);
  }

  const result = await c.env.DB.prepare(
    `INSERT INTO contatos (
      nome, email, telefone, empresa, servico_id, mensagem, status,
      origem, page_path, referrer, utm_source, utm_medium, utm_campaign
    ) VALUES (?, ?, ?, ?, ?, ?, 'novo', ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      nome,
      email,
      telefone,
      payload.empresa ? String(payload.empresa).slice(0, 100) : null,
      servicoId,
      mensagem,
      payload.origem ? String(payload.origem) : "site",
      payload.pagePath ? String(payload.pagePath).slice(0, 500) : null,
      payload.referrer ? String(payload.referrer).slice(0, 500) : null,
      payload.utmSource ? String(payload.utmSource).slice(0, 100) : null,
      payload.utmMedium ? String(payload.utmMedium).slice(0, 100) : null,
      payload.utmCampaign ? String(payload.utmCampaign).slice(0, 100) : null,
    )
    .run();

  await c.env.DB.prepare(
    `INSERT INTO analytics_events (event_name, path, title, referrer, visitor_id, service_slug, cta_id, utm_source, utm_medium, utm_campaign, device_type)
     VALUES ('contact_submit', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      payload.pagePath ? String(payload.pagePath).slice(0, 500) : "/contato",
      "Formulario de contato",
      payload.referrer ? String(payload.referrer).slice(0, 500) : null,
      payload.visitorId ? String(payload.visitorId).slice(0, 100) : null,
      payload.serviceSlug ? String(payload.serviceSlug).slice(0, 120) : null,
      payload.ctaId ? String(payload.ctaId).slice(0, 120) : "contact_form",
      payload.utmSource ? String(payload.utmSource).slice(0, 100) : null,
      payload.utmMedium ? String(payload.utmMedium).slice(0, 100) : null,
      payload.utmCampaign ? String(payload.utmCampaign).slice(0, 100) : null,
      inferDeviceType(c.req.header("user-agent")),
    )
    .run();

  return c.json(jsonSuccess("Solicitacao enviada com sucesso", { id: result.meta.last_row_id }), 201);
});

app.post("/analytics/events", async (c) => {
  const payload = await c.req.json<Record<string, string | undefined>>().catch(() => null);

  if (!payload?.path) {
    return c.json({ success: false, message: "Evento invalido" }, 400);
  }

  const path = payload.path.split("?")[0].slice(0, 500) || "/";
  const eventName = (payload.eventName || "page_view").slice(0, 80);
  const articleSlug = payload.articleSlug || getArticleSlugFromPath(path);

  await c.env.DB.prepare(
    `INSERT INTO analytics_events (
      event_name, path, title, referrer, visitor_id, article_slug, service_slug,
      cta_id, utm_source, utm_medium, utm_campaign, device_type
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      eventName,
      path,
      payload.title ? payload.title.slice(0, 200) : null,
      payload.referrer ? payload.referrer.slice(0, 500) : null,
      payload.visitorId ? payload.visitorId.slice(0, 100) : null,
      articleSlug ? articleSlug.slice(0, 120) : null,
      payload.serviceSlug ? payload.serviceSlug.slice(0, 120) : null,
      payload.ctaId ? payload.ctaId.slice(0, 120) : null,
      payload.utmSource ? payload.utmSource.slice(0, 100) : null,
      payload.utmMedium ? payload.utmMedium.slice(0, 100) : null,
      payload.utmCampaign ? payload.utmCampaign.slice(0, 100) : null,
      inferDeviceType(c.req.header("user-agent")),
    )
    .run();

  if (eventName === "page_view") {
    await c.env.DB.prepare(
      `INSERT INTO page_views (path, title, referrer, user_agent, visitor_id, post_slug)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
      .bind(
        path,
        payload.title ? payload.title.slice(0, 200) : null,
        payload.referrer ? payload.referrer.slice(0, 500) : null,
        c.req.header("user-agent") || null,
        payload.visitorId ? payload.visitorId.slice(0, 100) : null,
        articleSlug,
      )
      .run();
  }

  return c.json({ success: true }, 201);
});

export const publicRouter = app;
