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

3. No Supabase, execute o SQL (SQL Editor → colar e rodar **o arquivo inteiro**):

   - `supabase/migrations/20260412000000_init.sql` — schema completo (tabelas, RLS, storage, admin, tema `jsonb`, um restaurante por conta, leitura pública como `anon`)

4. Em Authentication, habilite o provedor **Email** e ajuste URLs de redirect se necessário.

### Administrar planos (você, dono da plataforma)

Não é obrigatório “ver todos os logins” no app: emails e contas ficam em **Supabase → Authentication → Users**. Para mudar o **plano** de um restaurante pelo painel:

1. No SQL Editor (uma vez), inclua seu usuário como admin da plataforma. O `user_id` é o UUID do seu usuário em Authentication → Users:

   ```sql
   insert into public.platform_admins (user_id)
   values ('cole-aqui-o-uuid-do-seu-usuario');
   ```

2. Faça login no CardápioPro e abra **Planos (admin)** no menu lateral (`/app/admin/plans`). Lá você altera `free` / `pro` / `enterprise` por restaurante. A lista mostra o `user_id` do dono; use-o para cruzar com a lista de usuários no Supabase se precisar do email.

Se a criação do schema falhar por **restaurante duplicado por usuário** (em bases já existentes), apague ou una linhas extras na tabela `restaurants` (mesmo `user_id`) antes de reaplicar.

## Deploy na Vercel

O Vite embute variáveis `VITE_*` **no build**. Sem elas no painel da Vercel, o site quebra ou mostra tela de configuração.

1. **Project → Settings → Environment Variables**
2. Adicione:
   - `VITE_SUPABASE_URL` = URL do projeto (`https://xxxx.supabase.co`)
   - `VITE_SUPABASE_ANON_KEY` = chave **anon** (JWT)
3. Marque **Production** e **Preview** (se usar branch preview).
4. Faça um **novo deploy** (Redeploy) depois de salvar — deploys antigos não recebem variáveis novas sozinhos.

O arquivo `vercel.json` redireciona rotas do React Router para `index.html`.

### Checklist antes do primeiro deploy

- [ ] Variáveis `VITE_SUPABASE_*` definidas no provedor (Vercel, etc.)
- [ ] Script SQL `20260412000000_init.sql` aplicado no mesmo projeto Supabase
- [ ] Bucket de storage `product-images` existe e políticas batem com as migrações (se usar fotos)

## CI (GitHub Actions)

No push/PR para `main` ou `master`, o workflow `.github/workflows/ci.yml` roda `lint`, `test:run` e `build`. Use **Node 20+** localmente para espelhar o CI.

## Scripts

| Comando            | Descrição                    |
| ------------------ | ---------------------------- |
| `npm run dev`      | Servidor de desenvolvimento  |
| `npm run build`    | Build de produção            |
| `npm run preview`  | Servir pasta `dist`          |
| `npm run lint`     | ESLint                       |
| `npm run test`     | Vitest (watch)               |
| `npm run test:run` | Vitest uma vez (CI / scripts)|

## Estrutura (frontend)

- `src/components`, `src/pages`, `src/layouts`, `src/hooks`, `src/services`, `src/store`, `src/routes`, `src/types`, `src/utils`

