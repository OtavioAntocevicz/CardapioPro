-- CardápioPro — schema, RLS e storage
-- Execute no SQL Editor do Supabase ou via CLI: supabase db push

-- Extensões
create extension if not exists "pgcrypto";

-- Restaurantes (multi-tenant; plano reservado para monetização)
create table public.restaurants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  slug text not null,
  plan text not null default 'free' check (plan in ('free', 'pro', 'enterprise')),
  created_at timestamptz not null default now(),
  constraint restaurants_slug_unique unique (slug)
);

create index restaurants_user_id_idx on public.restaurants (user_id);

-- Categorias
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create index categories_restaurant_id_idx on public.categories (restaurant_id);

-- Produtos
create table public.products (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  category_id uuid references public.categories (id) on delete set null,
  name text not null,
  description text,
  price numeric(12, 2) not null check (price >= 0),
  image_url text,
  is_available boolean not null default true,
  created_at timestamptz not null default now()
);

create index products_restaurant_id_idx on public.products (restaurant_id);
create index products_category_id_idx on public.products (category_id);

-- RLS
alter table public.restaurants enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;

-- Restaurantes: dono gerencia tudo
create policy "restaurants_owner_all"
  on public.restaurants
  for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Leitura pública (cardápio por slug)
create policy "restaurants_public_select"
  on public.restaurants
  for select
  to anon, authenticated
  using (true);

-- Categorias: dono do restaurante
create policy "categories_owner_all"
  on public.categories
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.restaurants r
      where r.id = categories.restaurant_id
        and r.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.restaurants r
      where r.id = categories.restaurant_id
        and r.user_id = auth.uid()
    )
  );

create policy "categories_public_select"
  on public.categories
  for select
  to anon, authenticated
  using (true);

-- Produtos: dono
create policy "products_owner_all"
  on public.products
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.restaurants r
      where r.id = products.restaurant_id
        and r.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.restaurants r
      where r.id = products.restaurant_id
        and r.user_id = auth.uid()
    )
  );

-- Visitantes: apenas produtos disponíveis
create policy "products_public_available_select"
  on public.products
  for select
  to anon, authenticated
  using (is_available = true);

-- Storage: bucket público para URLs de imagem
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- Leitura pública das imagens
create policy "product_images_public_read"
  on storage.objects
  for select
  to public
  using (bucket_id = 'product-images');

-- Upload: validação via função SECURITY DEFINER (evita falha de RLS ao ler restaurants no contexto do Storage)
create or replace function public.restaurant_storage_path_allowed(p_bucket text, p_name text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  first_segment text;
begin
  if p_bucket is distinct from 'product-images' then
    return false;
  end if;
  first_segment := split_part(trim(both '/' from coalesce(p_name, '')), '/', 1);
  if first_segment is null or first_segment = '' then
    return false;
  end if;
  return exists (
    select 1
    from public.restaurants r
    where r.id::text = first_segment
      and r.user_id = (select auth.uid())
  );
end;
$$;

revoke all on function public.restaurant_storage_path_allowed(text, text) from public;
grant execute on function public.restaurant_storage_path_allowed(text, text) to authenticated;

create policy "product_images_owner_insert"
  on storage.objects
  for insert
  to authenticated
  with check (public.restaurant_storage_path_allowed(bucket_id, name));

create policy "product_images_owner_update"
  on storage.objects
  for update
  to authenticated
  using (public.restaurant_storage_path_allowed(bucket_id, name))
  with check (public.restaurant_storage_path_allowed(bucket_id, name));

create policy "product_images_owner_delete"
  on storage.objects
  for delete
  to authenticated
  using (public.restaurant_storage_path_allowed(bucket_id, name));
