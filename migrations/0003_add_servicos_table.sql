-- Migration number: 0003
-- Criar tabela servicos
CREATE TABLE IF NOT EXISTS servicos (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    nome TEXT NOT NULL,
    descricao TEXT,
    preco DECIMAL(10,2),
    ativo BOOLEAN NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índices para otimização de consultas
CREATE INDEX idx_servicos_ativo ON servicos(ativo);
CREATE INDEX idx_servicos_nome ON servicos(nome);