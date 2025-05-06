# Instruções para Executar o Sistema de Controle de Faturas com OCR

Este guia explica como configurar e executar o Sistema de Controle de Faturas com OCR em ambiente de desenvolvimento.

## Pré-requisitos

- Node.js (v14 ou superior)
- npm (v6 ou superior)
- Docker e Docker Compose
- PostgreSQL (ou usar via Docker)
- MongoDB (ou usar via Docker)

## Configuração do Ambiente

### 1. Banco de Dados

O modo mais simples é usar o Docker Compose para iniciar os bancos de dados:

```bash
cd database
docker-compose up -d
```

Isso irá iniciar:

- PostgreSQL na porta 5432
- MongoDB na porta 27017
- PgAdmin na porta 5050 (acesso via http://localhost:5050 - email: admin@admin.com, senha: admin)

### 2. Backend (NestJS)

```bash
cd backend

# Instalar dependências
npm install

# Criar arquivo .env com as configurações
cp .env.example .env

# Editar as configurações no arquivo .env conforme necessário

# Iniciar em modo desenvolvimento
npm run start:dev
```

O servidor backend estará disponível em http://localhost:3000

### 3. Frontend (React)

```bash
cd frontend

# Instalar dependências
npm install

# Iniciar em modo desenvolvimento
npm start
```

A aplicação frontend estará disponível em http://localhost:3001

## Funcionalidades Principais

1. **Upload de Faturas**: Na página inicial, use o componente de upload para enviar uma fatura (PDF ou imagem)
2. **Dashboard**: Visualize resumos e estatísticas de suas faturas
3. **Faturas**: Gerencie, filtre e visualize todas as suas faturas
4. **Notificações**: Acompanhe e envie alertas para faturas com vencimento próximo ou valores excedidos

## Estrutura dos Arquivos de Configuração

### Backend (.env)

```
# Banco de Dados
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=invoice_system

# Email
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=usuario@example.com
EMAIL_PASS=senha_segura
EMAIL_FROM=sistema@faturas.com
DEFAULT_NOTIFICATION_EMAIL=usuario@example.com

# MongoDB (para Agenda.js)
MONGODB_URI=mongodb://root:root@localhost/invoice-system

# Ambiente
NODE_ENV=development
```

## Notas Adicionais

- **Processamento OCR**: O processamento OCR pode levar alguns segundos dependendo do tamanho e da complexidade do arquivo.
- **Suporte a PDF**: Para processar PDFs corretamente, o sistema precisa converter as páginas em imagens primeiro.
- **Classificação de Faturas**: A classificação automática usa palavras-chave no texto extraído para determinar a categoria.

## Problemas Comuns

- **Erro de Conexão ao Banco**: Verifique se os serviços Docker estão rodando com `docker ps`
- **Falha no OCR**: Certifique-se que o arquivo enviado tem boa qualidade e é legível
- **Erros de CORS**: Se o frontend não conseguir comunicar com o backend, verifique as configurações CORS no código backend
