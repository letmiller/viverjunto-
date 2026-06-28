# ViverJunto — Web App

Plataforma de gestão da vida compartilhada para casais.

## Stack
- **React 18** + React Router v6
- **Supabase** — Auth + PostgreSQL (projeto: jgyvrhsvyiuvwkjhuxro)
- **Vercel** — Deploy

## Setup local

```bash
# 1. Instalar dependências
npm install

# 2. Rodar em desenvolvimento
npm start

# 3. Build de produção
npm run build
```

## Deploy no Vercel

```bash
# Instalar Vercel CLI
npm i -g vercel

# Fazer login
vercel login

# Deploy
vercel --prod
```

## Variáveis de ambiente (opcional para produção)
Crie `.env.local`:
```
REACT_APP_SUPABASE_URL=https://jgyvrhsvyiuvwkjhuxro.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Banco de dados
Já configurado no Supabase com:
- `profiles` — perfis dos usuários
- `households` — casas/famílias
- `household_members` — membros
- `tasks` — tarefas domésticas
- `transactions` — transações financeiras
- `goals` — metas e sonhos
- `shopping_items` — lista de compras
- `checkins` — check-in emocional
- `invites` — convites para parceiro

RLS (Row Level Security) ativado em todas as tabelas.

## Telas da Parte 1
- `/login` — Login com email/senha
- `/cadastro` — Criação de conta (cria household automaticamente)
- `/dashboard` — Dashboard principal com stats e tarefas

## Próximas partes
- Parte 2: Finanças completa
- Parte 3: Rotina doméstica
- Parte 4: Lista de compras
- Parte 5: Metas e sonhos
- Parte 6: Perfil e configurações
