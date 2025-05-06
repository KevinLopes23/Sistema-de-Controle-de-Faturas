# Sistema de Controle de Faturas com OCR

Sistema para gerenciamento automatizado de faturas e contas, com reconhecimento óptico de caracteres (OCR).

## Funcionalidades

- Upload de faturas em formato PDF ou imagem
- Reconhecimento automático do conteúdo via OCR
- Classificação inteligente por tipo de despesa
- Armazenamento estruturado em banco de dados
- Alertas automáticos por e-mail (vencimentos, limites excedidos)
- Dashboard para visualização e gestão

## Arquitetura

| Componente     | Tecnologia              |
| -------------- | ----------------------- |
| Frontend       | React                   |
| Backend API    | NestJS                  |
| OCR            | Tesseract.js            |
| Classificação  | Regras manuais/Keywords |
| Banco de Dados | PostgreSQL              |
| Agendamento    | Agenda.js               |
| Emails         | NodeMailer              |

## Estrutura do Projeto

```
sistema-controle-faturas/
├── frontend/         # Aplicação React
├── backend/          # API NestJS
└── database/         # Scripts SQL e migrations
```

## Fluxo Básico

1. Usuário faz upload da fatura (PDF/imagem)
2. Sistema processa com OCR para extrair dados
3. Algoritmo classifica o tipo de despesa
4. Dados são armazenados no banco
5. Sistema agenda alertas baseados nas datas/valores
