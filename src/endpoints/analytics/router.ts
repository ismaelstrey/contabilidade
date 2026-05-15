import { fromHono } from "chanfana";
import { Hono } from "hono";
import { z } from "zod";
import { requireHonoAuth } from "../../middleware/honoAuth";

const app = new Hono<{ Bindings: Env }>();

const pageViewSchema = z.object({
  path: z.string().min(1).max(500),
  title: z.string().max(200).optional(),
  referrer: z.string().max(500).optional(),
  visitorId: z.string().max(100).optional(),
});

type CountRow = {
  total: number;
};

type TopRow = {
  label: string;
  total: number;
};

type ContactStatusRow = {
  status: string;
  total: number;
};

const toNumber = (value: unknown): number => Number(value || 0);

const postSlugFromPath = (path: string): string | null => {
  const match = path.match(/^\/posts\/([^/?#]+)/);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
};

app.post("/track", async (c) => {
  const payload = await c.req.json().catch(() => null);
  const parsed = pageViewSchema.safeParse(payload);

  if (!parsed.success) {
    return c.json({ success: false, message: "Dados de acesso invalidos" }, 400);
  }

  const path = parsed.data.path.split("?")[0] || "/";
  const postSlug = postSlugFromPath(path);

  await c.env.DB.prepare(
    `INSERT INTO page_views (path, title, referrer, user_agent, visitor_id, post_slug)
     VALUES (?, ?, ?, ?, ?, ?)`
  )
    .bind(
      path,
      parsed.data.title || null,
      parsed.data.referrer || null,
      c.req.header("user-agent") || null,
      parsed.data.visitorId || null,
      postSlug
    )
    .run();

  return c.json({ success: true }, 201);
});

app.get("/summary", requireHonoAuth(["admin", "user"]), async (c) => {
  const [
    pageViews,
    pageViewsToday,
    uniqueVisitors,
    postViews,
    contactsTotal,
    contactsToday,
    contactsUnread,
    servicesActive,
    topPages,
    topPosts,
    contactStatus,
    popularServices,
    recentContacts,
  ] = await Promise.all([
    c.env.DB.prepare("SELECT COUNT(*) AS total FROM page_views WHERE created_at >= datetime('now', '-30 days')").first<CountRow>(),
    c.env.DB.prepare("SELECT COUNT(*) AS total FROM page_views WHERE date(created_at) = date('now')").first<CountRow>(),
    c.env.DB.prepare("SELECT COUNT(DISTINCT visitor_id) AS total FROM page_views WHERE visitor_id IS NOT NULL AND created_at >= datetime('now', '-30 days')").first<CountRow>(),
    c.env.DB.prepare("SELECT COUNT(*) AS total FROM page_views WHERE post_slug IS NOT NULL AND created_at >= datetime('now', '-30 days')").first<CountRow>(),
    c.env.DB.prepare("SELECT COUNT(*) AS total FROM contatos").first<CountRow>(),
    c.env.DB.prepare("SELECT COUNT(*) AS total FROM contatos WHERE date(created_at) = date('now')").first<CountRow>(),
    c.env.DB.prepare("SELECT COUNT(*) AS total FROM contatos WHERE status IN ('novo', 'em_andamento')").first<CountRow>(),
    c.env.DB.prepare("SELECT COUNT(*) AS total FROM servicos WHERE ativo = 1").first<CountRow>(),
    c.env.DB.prepare(
      `SELECT path AS label, COUNT(*) AS total
       FROM page_views
       WHERE created_at >= datetime('now', '-30 days')
       GROUP BY path
       ORDER BY total DESC
       LIMIT 8`
    ).all<TopRow>(),
    c.env.DB.prepare(
      `SELECT post_slug AS label, COUNT(*) AS total
       FROM page_views
       WHERE post_slug IS NOT NULL AND created_at >= datetime('now', '-30 days')
       GROUP BY post_slug
       ORDER BY total DESC
       LIMIT 8`
    ).all<TopRow>(),
    c.env.DB.prepare(
      `SELECT status, COUNT(*) AS total
       FROM contatos
       GROUP BY status`
    ).all<ContactStatusRow>(),
    c.env.DB.prepare(
      `SELECT COALESCE(s.nome, 'Sem servico informado') AS label, COUNT(c.id) AS total
       FROM contatos c
       LEFT JOIN servicos s ON s.id = c.servico_id
       GROUP BY c.servico_id, s.nome
       ORDER BY total DESC
       LIMIT 6`
    ).all<TopRow>(),
    c.env.DB.prepare(
      `SELECT id, nome, email, telefone, empresa, servico_id, mensagem, status, created_at, updated_at
       FROM contatos
       ORDER BY created_at DESC
       LIMIT 6`
    ).all(),
  ]);

  return c.json({
    success: true,
    message: "Resumo de analytics carregado com sucesso",
    data: {
      pageViews: toNumber(pageViews?.total),
      pageViewsToday: toNumber(pageViewsToday?.total),
      uniqueVisitors: toNumber(uniqueVisitors?.total),
      postViews: toNumber(postViews?.total),
      contactsTotal: toNumber(contactsTotal?.total),
      contactsToday: toNumber(contactsToday?.total),
      contactsUnread: toNumber(contactsUnread?.total),
      servicesActive: toNumber(servicesActive?.total),
      topPages: topPages.results,
      topPosts: topPosts.results,
      contactStatus: contactStatus.results,
      popularServices: popularServices.results,
      recentContacts: recentContacts.results,
    },
  });
});

export const analyticsRouter = fromHono(app);
