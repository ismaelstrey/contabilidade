-- Migration number: 0007
-- CMS, SEO, midia, relatorios e auditoria para escritorio de contabilidade

ALTER TABLE servicos ADD COLUMN slug TEXT;
ALTER TABLE servicos ADD COLUMN categoria TEXT DEFAULT 'Contabilidade';
ALTER TABLE servicos ADD COLUMN destaque INTEGER NOT NULL DEFAULT 0;
ALTER TABLE servicos ADD COLUMN icon TEXT;
ALTER TABLE servicos ADD COLUMN image_url TEXT;
ALTER TABLE servicos ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;
ALTER TABLE servicos ADD COLUMN cta_label TEXT DEFAULT 'Solicitar atendimento';
ALTER TABLE servicos ADD COLUMN meta_title TEXT;
ALTER TABLE servicos ADD COLUMN meta_description TEXT;
ALTER TABLE servicos ADD COLUMN canonical_url TEXT;
ALTER TABLE servicos ADD COLUMN schema_type TEXT DEFAULT 'Service';

UPDATE servicos
SET slug = lower(replace(replace(replace(nome, ' ', '-'), 'ç', 'c'), 'ã', 'a'))
WHERE slug IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_servicos_slug ON servicos(slug);
CREATE INDEX IF NOT EXISTS idx_servicos_ativo_sort ON servicos(ativo, sort_order, nome);

ALTER TABLE contatos ADD COLUMN origem TEXT DEFAULT 'site';
ALTER TABLE contatos ADD COLUMN page_path TEXT;
ALTER TABLE contatos ADD COLUMN referrer TEXT;
ALTER TABLE contatos ADD COLUMN utm_source TEXT;
ALTER TABLE contatos ADD COLUMN utm_medium TEXT;
ALTER TABLE contatos ADD COLUMN utm_campaign TEXT;
ALTER TABLE contatos ADD COLUMN priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high'));
ALTER TABLE contatos ADD COLUMN internal_notes TEXT;

CREATE TABLE IF NOT EXISTS contact_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    contact_id INTEGER NOT NULL,
    user_id INTEGER,
    event_type TEXT NOT NULL,
    from_status TEXT,
    to_status TEXT,
    note TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contact_id) REFERENCES contatos(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS article_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS article_tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    excerpt TEXT NOT NULL,
    content TEXT NOT NULL,
    cover_image_url TEXT,
    og_image TEXT,
    category_id INTEGER,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'archived')),
    read_time_minutes INTEGER NOT NULL DEFAULT 4,
    meta_title TEXT,
    meta_description TEXT,
    canonical_url TEXT,
    schema_type TEXT NOT NULL DEFAULT 'Article',
    author_id INTEGER,
    published_at DATETIME,
    scheduled_at DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES article_categories(id),
    FOREIGN KEY (author_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS article_tag_links (
    article_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    PRIMARY KEY (article_id, tag_id),
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES article_tags(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS media_assets (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    key TEXT NOT NULL UNIQUE,
    url TEXT NOT NULL,
    filename TEXT NOT NULL,
    content_type TEXT NOT NULL,
    size INTEGER NOT NULL,
    folder TEXT NOT NULL,
    alt_text TEXT,
    uploaded_by INTEGER,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS analytics_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    event_name TEXT NOT NULL,
    path TEXT NOT NULL,
    title TEXT,
    referrer TEXT,
    visitor_id TEXT,
    article_slug TEXT,
    service_slug TEXT,
    cta_id TEXT,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    device_type TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS analytics_daily (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    day TEXT NOT NULL,
    path TEXT NOT NULL,
    article_slug TEXT,
    service_slug TEXT,
    event_name TEXT NOT NULL,
    total INTEGER NOT NULL DEFAULT 0,
    unique_visitors INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    user_id INTEGER,
    action TEXT NOT NULL,
    resource TEXT NOT NULL,
    resource_id TEXT,
    details TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    user_id INTEGER NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    revoked_at DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS login_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    email TEXT NOT NULL,
    ip_address TEXT,
    success INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

PRAGMA foreign_keys=off;
CREATE TABLE IF NOT EXISTS users_next (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    senha TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'editor', 'user', 'viewer')),
    active BOOLEAN NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT OR IGNORE INTO users_next (id, nome, email, senha, role, active, created_at, updated_at)
SELECT id, nome, email, senha, role, active, created_at, updated_at FROM users;
DROP TABLE users;
ALTER TABLE users_next RENAME TO users;
PRAGMA foreign_keys=on;

CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_status_published ON articles(status, published_at);
CREATE INDEX IF NOT EXISTS idx_contatos_status_created ON contatos(status, created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_path_created ON analytics_events(path, created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_article_created ON analytics_events(article_slug, created_at);
CREATE INDEX IF NOT EXISTS idx_contact_events_contact_created ON contact_events(contact_id, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id, revoked_at);
CREATE INDEX IF NOT EXISTS idx_login_attempts_email_created ON login_attempts(email, created_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_analytics_daily_unique ON analytics_daily(day, path, event_name, COALESCE(article_slug, ''), COALESCE(service_slug, ''));

INSERT OR IGNORE INTO article_categories (name, slug, description) VALUES
('Gestao contabil', 'gestao-contabil', 'Conteudos sobre rotina contabil, fiscal e financeira.'),
('Tributario', 'tributario', 'Orientacoes sobre impostos, planejamento e regularizacao.'),
('Empresas', 'empresas', 'Guias para abertura, organizacao e crescimento de empresas.');

INSERT OR IGNORE INTO settings (key, value) VALUES
('site.name', 'Contabilidade Igrejinha'),
('site.url', 'https://contabilidadeigrejinha.com.br'),
('site.description', 'Escritorio de contabilidade em Igrejinha/RS para empresas que precisam de rotina fiscal, folha, abertura e consultoria com clareza.'),
('contact.email', 'contato@contabilidadeigrejinha.com.br'),
('contact.phone', ''),
('social.instagram', ''),
('social.linkedin', '');

INSERT OR IGNORE INTO articles (
  title, slug, excerpt, content, category_id, status, read_time_minutes,
  meta_title, meta_description, published_at
) VALUES
(
  'Como organizar a contabilidade da sua empresa em Igrejinha',
  'como-organizar-a-contabilidade-da-sua-empresa-em-igrejinha',
  'Veja os pontos essenciais para manter documentos, impostos e rotinas contabeis em dia.',
  'Uma contabilidade organizada reduz riscos, melhora a previsibilidade financeira e evita atrasos em obrigacoes fiscais.\n\nO primeiro passo e centralizar documentos, notas, extratos e informacoes de folha em uma rotina clara. Depois, e importante acompanhar impostos, vencimentos e relatorios gerenciais.\n\nCom apoio especializado, a empresa ganha tempo para focar na operacao enquanto mantem conformidade e visibilidade dos numeros.',
  (SELECT id FROM article_categories WHERE slug = 'gestao-contabil'),
  'published',
  4,
  'Como organizar a contabilidade da sua empresa em Igrejinha',
  'Guia pratico de organizacao contabil para empresas em Igrejinha/RS.',
  CURRENT_TIMESTAMP
),
(
  'Abertura de empresa: documentos e cuidados antes de comecar',
  'abertura-de-empresa-documentos-e-cuidados-antes-de-comecar',
  'Entenda o que separar antes de abrir uma empresa e como evitar enquadramentos inadequados.',
  'Abrir uma empresa exige mais do que escolher um nome. A definicao de atividade, regime tributario, natureza juridica e endereco fiscal influencia custos e obrigacoes.\n\nAntes de iniciar, separe documentos dos socios, defina atividades, estime faturamento e avalie se havera funcionarios. Esses dados ajudam a escolher o enquadramento correto.\n\nUma abertura bem planejada evita retrabalho e reduz riscos tributarios desde o primeiro mes.',
  (SELECT id FROM article_categories WHERE slug = 'empresas'),
  'published',
  5,
  'Abertura de empresa: documentos e cuidados',
  'Confira documentos e cuidados para abrir empresa com seguranca.',
  CURRENT_TIMESTAMP
);
