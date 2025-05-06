-- Criação do banco de dados
CREATE DATABASE invoice_system;

-- Conexão ao banco de dados
\c invoice_system;

-- Extensão para manipulação de datas
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de Faturas
CREATE TABLE invoice (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    issuer VARCHAR(255),
    amount DECIMAL(10, 2) NOT NULL,
    due_date DATE,
    issue_date DATE,
    description TEXT,
    category VARCHAR(50),
    paid BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) DEFAULT 'PROCESSANDO',
    raw_text TEXT,
    file_path VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trigger para atualização automática do timestamp de atualização
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW(); 
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_invoice_timestamp
BEFORE UPDATE ON invoice
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- Tabela de Notificações
CREATE TABLE notification (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER REFERENCES invoice(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    schedule_date DATE NOT NULL,
    sent BOOLEAN DEFAULT FALSE,
    email_to VARCHAR(255),
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para melhorar performance
CREATE INDEX idx_invoice_due_date ON invoice(due_date);
CREATE INDEX idx_invoice_category ON invoice(category);
CREATE INDEX idx_invoice_paid ON invoice(paid);
CREATE INDEX idx_notification_schedule_date ON notification(schedule_date);
CREATE INDEX idx_notification_sent ON notification(sent);
CREATE INDEX idx_notification_invoice_id ON notification(invoice_id);

-- Comentários nas tabelas para documentação
COMMENT ON TABLE invoice IS 'Armazena faturas processadas por OCR';
COMMENT ON TABLE notification IS 'Armazena notificações relacionadas a faturas';

-- Exemplo de dados iniciais para testes
INSERT INTO invoice (filename, issuer, amount, due_date, issue_date, category, status, description)
VALUES 
('conta_luz_janeiro.pdf', 'ENEL Energia', 157.89, '2025-01-25', '2025-01-05', 'energia', 'PROCESSADO', 'Conta de energia elétrica referente ao mês de janeiro'),
('conta_agua_janeiro.pdf', 'SABESP', 92.50, '2025-01-20', '2025-01-03', 'agua', 'PROCESSADO', 'Conta de água referente ao mês de janeiro'),
('aluguel_janeiro.pdf', 'Imobiliária Central', 1200.00, '2025-01-10', '2024-12-30', 'aluguel', 'PROCESSADO', 'Aluguel referente ao mês de janeiro');

-- Exemplo de notificações iniciais
INSERT INTO notification (invoice_id, type, schedule_date, sent, email_to, message)
VALUES 
(1, 'VENCIMENTO', '2025-01-23', FALSE, 'user@example.com', 'A fatura ENEL Energia no valor de R$ 157,89 vence em 2 dias (25/01/2025).'),
(2, 'VENCIMENTO', '2025-01-18', FALSE, 'user@example.com', 'A fatura SABESP no valor de R$ 92,50 vence em 2 dias (20/01/2025).'),
(3, 'LIMITE_EXCEDIDO', '2025-01-02', TRUE, 'user@example.com', 'Alerta: A fatura Imobiliária Central possui valor de R$ 1200,00, que excede o limite de R$ 1000 para a categoria aluguel.');

-- Permissões (ajustar conforme necessário para seu ambiente)
-- GRANT ALL PRIVILEGES ON DATABASE invoice_system TO seu_usuario;
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO seu_usuario;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO seu_usuario; 