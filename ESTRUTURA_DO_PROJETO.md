# Estrutura do Projeto: Sistema de Controle de Faturas com OCR

Este documento descreve a estrutura e os componentes principais do Sistema de Controle de Faturas com OCR.

## Visão Geral

O sistema permite o upload, processamento via OCR, classificação e gestão de faturas/contas digitalizadas, com recursos de notificações para vencimentos e valores excedidos.

## Estrutura de Diretórios

```
sistema-controle-faturas/
├── frontend/               # Aplicação React
│   ├── public/             # Arquivos públicos
│   └── src/                # Código fonte
│       ├── components/     # Componentes reutilizáveis
│       ├── pages/          # Páginas da aplicação
│       ├── services/       # Serviços e integrações com a API
│       └── types/          # Definições de tipos TypeScript
│
├── backend/                # API NestJS
│   ├── src/                # Código fonte
│   │   ├── config/         # Configurações
│   │   ├── entities/       # Entidades do banco de dados
│   │   ├── ocr/            # Serviço de OCR
│   │   ├── classification/ # Classificação de faturas
│   │   ├── invoices/       # Módulo de faturas
│   │   └── notifications/  # Módulo de notificações
│   └── uploads/            # Arquivos enviados pelo usuário
│
└── database/               # Scripts e configurações do banco
    ├── schema.sql          # Estrutura do banco de dados
    └── docker-compose.yml  # Configuração do ambiente de banco
```

## Componentes Principais

### Frontend

1. **Dashboard**: Visão geral das faturas, totais e vencimentos próximos
2. **Faturas**: Listagem, filtros, visualização e gestão das faturas
3. **Notificações**: Acompanhamento de alertas de vencimento e valores excedidos
4. **Upload de Faturas**: Interface para envio e processamento de novas faturas

### Backend

1. **OCR Service**: Extração de texto das faturas (Tesseract.js)
2. **Classification Service**: Classificação do tipo de despesa
3. **Invoices Service**: Gerenciamento das faturas
4. **Notifications Service**: Criação e envio de notificações

### Banco de Dados

1. **PostgreSQL**: Armazenamento principal das faturas e notificações
2. **MongoDB**: Utilizado pelo Agenda.js para agendamento de tarefas

## Fluxo Principal

1. Usuário faz upload da fatura (PDF/imagem)
2. Sistema processa com OCR para extrair texto
3. Sistema identifica informações importantes (valor, data, emissor)
4. Sistema classifica o tipo de despesa
5. Dados são armazenados no banco
6. Sistema verifica limites e agenda notificações quando necessário

## Tecnologias Utilizadas

- **Frontend**: React, TypeScript, Material UI
- **Backend**: NestJS, TypeORM, Tesseract.js, Agenda.js, NodeMailer
- **Banco de Dados**: PostgreSQL (dados), MongoDB (agendamento)
- **Infraestrutura**: Docker para ambiente de desenvolvimento
