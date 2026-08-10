# Prime Pork — Controle de Estoque

Sistema mobile-first para controle de estoque, compras de matéria-prima, vendas por cliente e mapa de clientes para uma produção de torresmo de rolo.

## Stack

- React 19 + Vite + Tailwind CSS v4
- Supabase (Postgres + Auth) — sem backend próprio
- Leaflet + OpenStreetMap (mapa) + Nominatim (geocodificação de endereços)
- `@tanstack/react-query` para dados

## Configuração inicial (fazer uma única vez)

### 1. Criar o projeto no Supabase

1. Crie uma conta gratuita em [supabase.com](https://supabase.com) e um novo projeto (região `South America (São Paulo)` é a mais próxima do Brasil).
2. No painel do projeto, vá em **Project Settings → API** e copie a **Project URL** e a **anon public key**.

### 2. Configurar as variáveis de ambiente

Copie `.env.example` para `.env` e preencha:

```bash
cp .env.example .env
```

```
VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

### 3. Rodar o schema do banco

No painel do Supabase, abra **SQL Editor**, cole todo o conteúdo de [`supabase/schema.sql`](./supabase/schema.sql) e execute. Isso cria as tabelas (`clients`, `purchases`, `orders`), as views de estoque/estatísticas, a função do dashboard e as políticas de segurança (RLS).

Se o banco já existia antes das colunas de pagamento/configurações de estoque baixo, rode também [`supabase/migration_002_payments_settings.sql`](./supabase/migration_002_payments_settings.sql) uma única vez.

### 4. Desativar cadastro público e criar seu login

Este app não tem tela de "criar conta" — os logins são criados manualmente pelo dono do negócio, já que é um sistema interno.

1. Em **Authentication → Providers → Email**, desative "Allow new users to sign up".
2. Em **Authentication → Users**, clique em "Add user" / "Invite" e crie o login (e-mail + senha) para cada pessoa que vai usar o sistema.

### 5. Instalar dependências e rodar

```bash
npm install
npm run dev
```

Acesse `http://localhost:5173` (ou a porta indicada no terminal) e entre com o e-mail/senha criados no passo 4.

## Estrutura

- `supabase/schema.sql` — schema completo do banco (tabelas, views, função do dashboard, RLS).
- `src/lib/supabaseClient.js` — cliente Supabase.
- `src/lib/geocode.js` — geocodificação de endereços via Nominatim.
- `src/hooks/` — hooks de dados (react-query) por entidade.
- `src/pages/` — telas, organizadas por área (estoque, vendas, clientes, mapa).

## Versão web publicada

A cada `git push` na branch `main`, o GitHub Actions ([`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml)) builda o app e publica em **GitHub Pages**:

```
https://brunamarchi.github.io/primepork/
```

Isso exige habilitar Pages uma única vez em **Settings → Pages → Build and deployment → Source → GitHub Actions** no repositório. A chave usada no build (`.env.production`) é a *anon/publishable key* do Supabase — ela é feita para ser pública (a segurança real vem das políticas RLS no banco), por isso é seguro deixá-la commitada no repositório.

## Fora de escopo (por enquanto)

- Service worker / uso offline.
- Múltiplos "tenants"/empresas — o sistema assume uma única empresa, com todos os logins vendo os mesmos dados.
