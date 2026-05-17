import { Hono } from "hono";
import { requireHonoAuth } from "../../middleware/honoAuth";
import { getCurrentUser } from "../../middleware/auth";
import { auditLog, jsonSuccess, slugify } from "../../utils/cms";

const app = new Hono<{ Bindings: Env }>();

app.use("*", requireHonoAuth(["admin", "editor", "user"]));
app.use("*", async (c, next) => {
  await next();
  c.res.headers.set("Cache-Control", "private, no-store");
});

type ServicePayload = {
  nome?: string;
  descricao?: string;
  preco?: number | null;
  ativo?: boolean;
  slug?: string;
  categoria?: string;
  destaque?: boolean;
  icon?: string;
  imageUrl?: string;
  sortOrder?: number;
  ctaLabel?: string;
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
};

type ArticlePayload = {
  title?: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  coverImageUrl?: string;
  ogImage?: string;
  categoryId?: number | null;
  status?: "draft" | "scheduled" | "published" | "archived";
  readTimeMinutes?: number;
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  scheduledAt?: string | null;
  publishedAt?: string | null;
};

const parseBody = async <T>(request: Request): Promise<T> => {
  return await request.json() as T;
};

const serviceSelect = `
  id, nome, descricao, preco, ativo, slug, categoria, destaque, icon, image_url,
  sort_order, cta_label, meta_title, meta_description, canonical_url, schema_type,
  created_at, updated_at
`;

const articleSelect = `
  a.id, a.title, a.slug, a.excerpt, a.content, a.cover_image_url, a.og_image,
  a.category_id, c.name AS category, c.slug AS category_slug, a.status,
  a.read_time_minutes, a.meta_title, a.meta_description, a.canonical_url,
  a.schema_type, a.published_at, a.scheduled_at, a.created_at, a.updated_at
`;

const saveService = async (c: { env: Env; req: { raw: Request } }, payload: ServicePayload, id?: number): Promise<number> => {
  const nome = payload.nome?.trim();
  const descricao = payload.descricao?.trim() || "";
  if (!nome || nome.length < 2) {throw new Error("Nome do servico e obrigatorio");}

  const slug = payload.slug ? slugify(payload.slug) : slugify(nome);
  const values = [
    nome,
    descricao,
    payload.preco ?? null,
    payload.ativo === false ? 0 : 1,
    slug,
    payload.categoria || "Contabilidade",
    payload.destaque ? 1 : 0,
    payload.icon || null,
    payload.imageUrl || null,
    payload.sortOrder || 0,
    payload.ctaLabel || "Solicitar atendimento",
    payload.metaTitle || nome,
    payload.metaDescription || descricao.slice(0, 160),
    payload.canonicalUrl || null,
  ];

  if (id) {
    await c.env.DB.prepare(
      `UPDATE servicos
       SET nome = ?, descricao = ?, preco = ?, ativo = ?, slug = ?, categoria = ?,
           destaque = ?, icon = ?, image_url = ?, sort_order = ?, cta_label = ?,
           meta_title = ?, meta_description = ?, canonical_url = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    ).bind(...values, id).run();
    await auditLog(c.req.raw, c.env, "update", "service", id, payload);
    return id;
  }

  const result = await c.env.DB.prepare(
    `INSERT INTO servicos (
      nome, descricao, preco, ativo, slug, categoria, destaque, icon, image_url,
      sort_order, cta_label, meta_title, meta_description, canonical_url
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(...values).run();
  await auditLog(c.req.raw, c.env, "create", "service", result.meta.last_row_id, payload);
  return result.meta.last_row_id;
};

app.get("/dashboard", async (c) => {
  const [
    visitsToday,
    visits7,
    visits30,
    unique30,
    contactsTotal,
    contactsToday,
    contactsPending,
    articlesPublished,
    topPages,
    topArticles,
    leadsByService,
    contactsByStatus,
    recentContacts,
    conversions30,
  ] = await Promise.all([
    c.env.DB.prepare("SELECT COUNT(*) total FROM analytics_events WHERE event_name = 'page_view' AND date(created_at) = date('now')").first<{ total: number }>(),
    c.env.DB.prepare("SELECT COUNT(*) total FROM analytics_events WHERE event_name = 'page_view' AND created_at >= datetime('now', '-7 days')").first<{ total: number }>(),
    c.env.DB.prepare("SELECT COUNT(*) total FROM analytics_events WHERE event_name = 'page_view' AND created_at >= datetime('now', '-30 days')").first<{ total: number }>(),
    c.env.DB.prepare("SELECT COUNT(DISTINCT visitor_id) total FROM analytics_events WHERE visitor_id IS NOT NULL AND created_at >= datetime('now', '-30 days')").first<{ total: number }>(),
    c.env.DB.prepare("SELECT COUNT(*) total FROM contatos").first<{ total: number }>(),
    c.env.DB.prepare("SELECT COUNT(*) total FROM contatos WHERE date(created_at) = date('now')").first<{ total: number }>(),
    c.env.DB.prepare("SELECT COUNT(*) total FROM contatos WHERE status IN ('novo', 'em_andamento')").first<{ total: number }>(),
    c.env.DB.prepare("SELECT COUNT(*) total FROM articles WHERE status = 'published'").first<{ total: number }>(),
    c.env.DB.prepare(
      `SELECT path AS label, COUNT(*) total FROM analytics_events
       WHERE event_name = 'page_view' AND created_at >= datetime('now', '-30 days')
       GROUP BY path ORDER BY total DESC LIMIT 10`
    ).all(),
    c.env.DB.prepare(
      `SELECT article_slug AS label, COUNT(*) total FROM analytics_events
       WHERE article_slug IS NOT NULL AND created_at >= datetime('now', '-30 days')
       GROUP BY article_slug ORDER BY total DESC LIMIT 10`
    ).all(),
    c.env.DB.prepare(
      `SELECT COALESCE(s.nome, 'Sem servico') AS label, COUNT(c.id) total
       FROM contatos c LEFT JOIN servicos s ON s.id = c.servico_id
       GROUP BY c.servico_id, s.nome ORDER BY total DESC LIMIT 10`
    ).all(),
    c.env.DB.prepare("SELECT status AS label, COUNT(*) total FROM contatos GROUP BY status ORDER BY total DESC").all(),
    c.env.DB.prepare(
      `SELECT id, nome, email, telefone, empresa, servico_id, mensagem, status, priority,
              origem, page_path, referrer, created_at, updated_at
       FROM contatos ORDER BY created_at DESC LIMIT 8`
    ).all(),
    c.env.DB.prepare("SELECT COUNT(*) total FROM analytics_events WHERE event_name = 'contact_submit' AND created_at >= datetime('now', '-30 days')").first<{ total: number }>(),
  ]);

  const visits = Number(visits30?.total || 0);
  const conversions = Number(conversions30?.total || 0);

  return c.json(jsonSuccess("Dashboard carregado com sucesso", {
    visitsToday: Number(visitsToday?.total || 0),
    visits7: Number(visits7?.total || 0),
    visits30: visits,
    uniqueVisitors30: Number(unique30?.total || 0),
    contactsTotal: Number(contactsTotal?.total || 0),
    contactsToday: Number(contactsToday?.total || 0),
    contactsPending: Number(contactsPending?.total || 0),
    articlesPublished: Number(articlesPublished?.total || 0),
    conversionRate: visits > 0 ? Number(((conversions / visits) * 100).toFixed(2)) : 0,
    topPages: topPages.results,
    topArticles: topArticles.results,
    leadsByService: leadsByService.results,
    contactsByStatus: contactsByStatus.results,
    recentContacts: recentContacts.results,
  }));
});

app.get("/services", async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT ${serviceSelect} FROM servicos ORDER BY sort_order ASC, nome ASC`
  ).all();
  return c.json(jsonSuccess("Servicos carregados com sucesso", results));
});

app.post("/services", async (c) => {
  try {
    const id = await saveService(c, await parseBody<ServicePayload>(c.req.raw));
    return c.json(jsonSuccess("Servico criado com sucesso", { id }), 201);
  } catch (error) {
    return c.json({ success: false, message: error instanceof Error ? error.message : "Erro ao criar servico" }, 400);
  }
});

app.put("/services/:id", async (c) => {
  try {
    const id = Number(c.req.param("id"));
    await saveService(c, await parseBody<ServicePayload>(c.req.raw), id);
    return c.json(jsonSuccess("Servico atualizado com sucesso", { id }));
  } catch (error) {
    return c.json({ success: false, message: error instanceof Error ? error.message : "Erro ao atualizar servico" }, 400);
  }
});

app.delete("/services/:id", async (c) => {
  const id = Number(c.req.param("id"));
  await c.env.DB.prepare("DELETE FROM servicos WHERE id = ?").bind(id).run();
  await auditLog(c.req.raw, c.env, "delete", "service", id);
  return c.json(jsonSuccess("Servico removido com sucesso", { id }));
});

app.get("/article-categories", async (c) => {
  const { results } = await c.env.DB.prepare("SELECT * FROM article_categories ORDER BY name ASC").all();
  return c.json(jsonSuccess("Categorias carregadas com sucesso", results));
});

app.get("/articles", async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT ${articleSelect}
     FROM articles a LEFT JOIN article_categories c ON c.id = a.category_id
     ORDER BY COALESCE(a.published_at, a.updated_at) DESC`
  ).all();
  return c.json(jsonSuccess("Artigos carregados com sucesso", results));
});

app.get("/articles/:id", async (c) => {
  const article = await c.env.DB.prepare(
    `SELECT ${articleSelect}
     FROM articles a LEFT JOIN article_categories c ON c.id = a.category_id
     WHERE a.id = ?`
  ).bind(Number(c.req.param("id"))).first();
  if (!article) {return c.json({ success: false, message: "Artigo nao encontrado" }, 404);}
  return c.json(jsonSuccess("Artigo carregado com sucesso", article));
});

const saveArticle = async (c: { env: Env; req: { raw: Request } }, payload: ArticlePayload, id?: number): Promise<number> => {
  if (!payload.title?.trim() || !payload.excerpt?.trim() || !payload.content?.trim()) {
    throw new Error("Titulo, resumo e conteudo sao obrigatorios");
  }

  const user = getCurrentUser(c.req.raw);
  const slug = payload.slug ? slugify(payload.slug) : slugify(payload.title);
  const status = payload.status || "draft";
  const publishedAt = status === "published"
    ? (payload.publishedAt || new Date().toISOString())
    : payload.publishedAt || null;
  const values = [
    payload.title.trim(),
    slug,
    payload.excerpt.trim(),
    payload.content,
    payload.coverImageUrl || null,
    payload.ogImage || payload.coverImageUrl || null,
    payload.categoryId || null,
    status,
    payload.readTimeMinutes || Math.max(2, Math.ceil(payload.content.split(/\s+/).length / 180)),
    payload.metaTitle || payload.title.trim(),
    payload.metaDescription || payload.excerpt.trim().slice(0, 160),
    payload.canonicalUrl || null,
    publishedAt,
    payload.scheduledAt || null,
  ];

  if (id) {
    await c.env.DB.prepare(
      `UPDATE articles
       SET title = ?, slug = ?, excerpt = ?, content = ?, cover_image_url = ?, og_image = ?,
           category_id = ?, status = ?, read_time_minutes = ?, meta_title = ?,
           meta_description = ?, canonical_url = ?, published_at = ?, scheduled_at = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    ).bind(...values, id).run();
    await auditLog(c.req.raw, c.env, "update", "article", id, payload);
    return id;
  }

  const result = await c.env.DB.prepare(
    `INSERT INTO articles (
      title, slug, excerpt, content, cover_image_url, og_image, category_id,
      status, read_time_minutes, meta_title, meta_description, canonical_url,
      published_at, scheduled_at, author_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(...values, user?.id || null).run();
  await auditLog(c.req.raw, c.env, "create", "article", result.meta.last_row_id, payload);
  return result.meta.last_row_id;
};

app.post("/articles", async (c) => {
  try {
    const id = await saveArticle(c, await parseBody<ArticlePayload>(c.req.raw));
    return c.json(jsonSuccess("Artigo criado com sucesso", { id }), 201);
  } catch (error) {
    return c.json({ success: false, message: error instanceof Error ? error.message : "Erro ao criar artigo" }, 400);
  }
});

app.put("/articles/:id", async (c) => {
  try {
    const id = Number(c.req.param("id"));
    await saveArticle(c, await parseBody<ArticlePayload>(c.req.raw), id);
    return c.json(jsonSuccess("Artigo atualizado com sucesso", { id }));
  } catch (error) {
    return c.json({ success: false, message: error instanceof Error ? error.message : "Erro ao atualizar artigo" }, 400);
  }
});

app.delete("/articles/:id", async (c) => {
  const id = Number(c.req.param("id"));
  await c.env.DB.prepare("UPDATE articles SET status = 'archived', updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(id).run();
  await auditLog(c.req.raw, c.env, "archive", "article", id);
  return c.json(jsonSuccess("Artigo arquivado com sucesso", { id }));
});

app.get("/contacts", async (c) => {
  const status = c.req.query("status");
  const search = c.req.query("search");
  const where: string[] = [];
  const bindings: string[] = [];
  if (status && status !== "all") {
    where.push("c.status = ?");
    bindings.push(status);
  }
  if (search) {
    where.push("(c.nome LIKE ? OR c.email LIKE ? OR c.empresa LIKE ?)");
    bindings.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  const { results } = await c.env.DB.prepare(
    `SELECT c.*, s.nome AS servico_nome
     FROM contatos c LEFT JOIN servicos s ON s.id = c.servico_id
     ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
     ORDER BY c.created_at DESC LIMIT 200`
  ).bind(...bindings).all();
  return c.json(jsonSuccess("Contatos carregados com sucesso", results));
});

app.put("/contacts/:id/status", async (c) => {
  const id = Number(c.req.param("id"));
  const payload = await parseBody<{ status: string; note?: string; priority?: string }>(c.req.raw);
  const current = await c.env.DB.prepare("SELECT status FROM contatos WHERE id = ?").bind(id).first<{ status: string }>();
  if (!current) {return c.json({ success: false, message: "Contato nao encontrado" }, 404);}
  await c.env.DB.prepare(
    "UPDATE contatos SET status = ?, priority = COALESCE(?, priority), updated_at = CURRENT_TIMESTAMP WHERE id = ?"
  ).bind(payload.status, payload.priority || null, id).run();
  const user = getCurrentUser(c.req.raw);
  await c.env.DB.prepare(
    `INSERT INTO contact_events (contact_id, user_id, event_type, from_status, to_status, note)
     VALUES (?, ?, 'status_change', ?, ?, ?)`
  ).bind(id, user?.id || null, current.status, payload.status, payload.note || null).run();
  await auditLog(c.req.raw, c.env, "status_change", "contact", id, payload);
  return c.json(jsonSuccess("Status atualizado com sucesso", { id }));
});

app.get("/media", async (c) => {
  const { results } = await c.env.DB.prepare("SELECT * FROM media_assets ORDER BY created_at DESC LIMIT 200").all();
  return c.json(jsonSuccess("Midias carregadas com sucesso", results));
});

app.post("/media", async (c) => {
  const bucket = "MEDIA_BUCKET" in c.env ? c.env.MEDIA_BUCKET as R2Bucket : undefined;
  if (!bucket) {return c.json({ success: false, message: "Bucket R2 nao configurado" }, 503);}

  const formData = await c.req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {return c.json({ success: false, message: "Arquivo nao enviado" }, 400);}
  if (!["image/jpeg", "image/png", "image/webp", "image/svg+xml"].includes(file.type)) {
    return c.json({ success: false, message: "Tipo de arquivo nao permitido" }, 400);
  }
  if (file.size > 5 * 1024 * 1024) {
    return c.json({ success: false, message: "Arquivo deve ter ate 5MB" }, 400);
  }

  const folder = String(formData.get("folder") || "site").replace(/[^a-z0-9/-]/gi, "").slice(0, 80) || "site";
  const safeName = `${crypto.randomUUID()}-${slugify(file.name.replace(/\.[^.]+$/, "")) || "imagem"}`;
  const extension = file.name.includes(".") ? file.name.split(".").pop() : "bin";
  const key = `${folder}/${safeName}.${extension}`;
  await bucket.put(key, file.stream(), { httpMetadata: { contentType: file.type } });
  const publicBase = "MEDIA_PUBLIC_URL" in c.env ? c.env.MEDIA_PUBLIC_URL as string : "";
  const url = publicBase ? `${publicBase.replace(/\/$/, "")}/${key}` : `/api/v1/admin/media/${encodeURIComponent(key)}`;
  const user = getCurrentUser(c.req.raw);
  const result = await c.env.DB.prepare(
    `INSERT INTO media_assets (key, url, filename, content_type, size, folder, alt_text, uploaded_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(key, url, file.name, file.type, file.size, folder, String(formData.get("altText") || ""), user?.id || null).run();
  await auditLog(c.req.raw, c.env, "upload", "media", result.meta.last_row_id, { key });
  return c.json(jsonSuccess("Midia enviada com sucesso", { id: result.meta.last_row_id, key, url }), 201);
});

app.delete("/media/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const media = await c.env.DB.prepare("SELECT key FROM media_assets WHERE id = ?").bind(id).first<{ key: string }>();
  if (!media) {return c.json({ success: false, message: "Midia nao encontrada" }, 404);}
  const bucket = "MEDIA_BUCKET" in c.env ? c.env.MEDIA_BUCKET as R2Bucket : undefined;
  if (bucket) {await bucket.delete(media.key);}
  await c.env.DB.prepare("DELETE FROM media_assets WHERE id = ?").bind(id).run();
  await auditLog(c.req.raw, c.env, "delete", "media", id, media);
  return c.json(jsonSuccess("Midia removida com sucesso", { id }));
});

app.get("/settings", async (c) => {
  const { results } = await c.env.DB.prepare("SELECT key, value FROM settings ORDER BY key ASC").all<{ key: string; value: string }>();
  return c.json(jsonSuccess("Configuracoes carregadas com sucesso", Object.fromEntries(results.map(item => [item.key, item.value]))));
});

app.put("/settings", async (c) => {
  const payload = await parseBody<Record<string, string>>(c.req.raw);
  const keys = Object.keys(payload).filter(key => key.length <= 80);
  await Promise.all(keys.map(key => c.env.DB.prepare(
    `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`
  ).bind(key, String(payload[key]).slice(0, 2000)).run()));
  await auditLog(c.req.raw, c.env, "update", "settings", "site", keys);
  return c.json(jsonSuccess("Configuracoes salvas com sucesso", { updated: keys.length }));
});

export const adminRouter = app;
