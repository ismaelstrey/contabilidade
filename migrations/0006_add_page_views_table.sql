-- Migration number: 0006
-- Registros agregaveis de acessos do site
CREATE TABLE IF NOT EXISTS page_views (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    path TEXT NOT NULL,
    title TEXT,
    referrer TEXT,
    user_agent TEXT,
    visitor_id TEXT,
    post_slug TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_page_views_path ON page_views(path);
CREATE INDEX idx_page_views_post_slug ON page_views(post_slug);
CREATE INDEX idx_page_views_visitor_id ON page_views(visitor_id);
CREATE INDEX idx_page_views_created_at ON page_views(created_at);
