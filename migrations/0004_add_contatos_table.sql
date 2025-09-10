-- Migration number: 0004
-- Criar tabela contatos com relacionamento para servicos
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

-- Índices para otimização de consultas
CREATE INDEX idx_contatos_status ON contatos(status);
CREATE INDEX idx_contatos_servico_id ON contatos(servico_id);
CREATE INDEX idx_contatos_email ON contatos(email);
CREATE INDEX idx_contatos_created_at ON contatos(created_at);