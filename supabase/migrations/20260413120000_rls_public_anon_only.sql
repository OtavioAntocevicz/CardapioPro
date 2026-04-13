-- Isolamento multi-tenant: leitura "pública" do cardápio só como role `anon`.
-- Antes, `authenticated` podia ler todas as linhas (using (true)), e o painel usava
-- maybeSingle() sem filtro — qualquer login via o restaurante de outro usuário.
--
-- Admins da plataforma continuam listando todos os restaurantes no painel admin.

drop policy if exists "restaurants_public_select" on public.restaurants;
create policy "restaurants_public_select"
  on public.restaurants
  for select
  to anon
  using (true);

drop policy if exists "categories_public_select" on public.categories;
create policy "categories_public_select"
  on public.categories
  for select
  to anon
  using (true);

drop policy if exists "products_public_available_select" on public.products;
create policy "products_public_available_select"
  on public.products
  for select
  to anon
  using (is_available = true);

drop policy if exists "restaurants_platform_admin_select" on public.restaurants;
create policy "restaurants_platform_admin_select"
  on public.restaurants
  for select
  to authenticated
  using (
    exists (select 1 from public.platform_admins pa where pa.user_id = auth.uid())
  );
