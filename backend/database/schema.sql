
-- Tabela de mensagens e sugestões
CREATE TABLE IF NOT EXISTS mensagens (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    assunto VARCHAR(200) NOT NULL,
    texto TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'pendente',
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mensagens_status_data ON mensagens (status, criado_em);
