# CardápioPro

SaaS de cardápio digital para restaurantes: painel admin (categorias, produtos, imagens) e cardápio público por slug (`/m/:slug`). Stack: React, Vite, TypeScript, Tailwind CSS, Zustand, TanStack Query, Supabase (Auth, Postgres, Storage) e PWA.

## Pré-requisitos

- Node.js 20+ (recomendado)
- Conta e projeto no [Supabase](https://supabase.com)

## Configuração

1. Clone o repositório e instale dependências:

   ```bash
   npm install
   ```

2. Copie o exemplo de variáveis e preencha com os dados do seu projeto (Settings → API):

   ```bash
   cp .env.example .env
   ```

   - `VITE_SUPABASE_URL` — Project URL (`https://xxxx.supabase.co`)
   - `VITE_SUPABASE_ANON_KEY` — chave **anon** (JWT) do mesmo projeto

3. No Supabase, execute o SQL das migrações (SQL Editor → colar e rodar):

   - `supabase/migrations/20260412000000_init.sql`
   - Se o upload de imagens falhar por RLS, rode também `supabase/migrations/20260412100000_fix_storage_rls.sql`

4. Em Authentication, habilite o provedor **Email** e ajuste URLs de redirect se necessário.

## Scripts

| Comando        | Descrição              |
| -------------- | ---------------------- |
| `npm run dev`  | Servidor de desenvolvimento |
| `npm run build`| Build de produção      |
| `npm run preview` | Servir pasta `dist` |
| `npm run lint` | ESLint                 |

## Estrutura (frontend)

- `src/components`, `src/pages`, `src/layouts`, `src/hooks`, `src/services`, `src/store`, `src/routes`, `src/types`, `src/utils`

