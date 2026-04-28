-- CardápioPro — schema completo (idempotente: pode rodar em projeto novo ou já existente)
-- SQL Editor ou: supabase db push

-- Extensões
create extension if not exists "pgcrypto";

-- Restaurantes
create table if not exists public.restaurants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  slug text not null,
  plan text not null default 'free' check (plan in ('free', 'pro', 'enterprise')),
  created_at timestamptz not null default now()
);

alter table public.restaurants add column if not exists theme jsonb not null default '{}'::jsonb;

do $$
begin
  if not exists (
    select 1
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where c.conname = 'restaurants_slug_unique' and n.nspname = 'public' and t.relname = 'restaurants'
  ) then
    alter table public.restaurants add constraint restaurants_slug_unique unique (slug);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where c.conname = 'restaurants_user_id_unique' and n.nspname = 'public' and t.relname = 'restaurants'
  ) then
    alter table public.restaurants add constraint restaurants_user_id_unique unique (user_id);
  end if;
end
$$;

create index if not exists restaurants_user_id_idx on public.restaurants (user_id);

-- Categorias
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create index if not exists categories_restaurant_id_idx on public.categories (restaurant_id);

-- Produtos
create table if not exists public.products (
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

create index if not exists products_restaurant_id_idx on public.products (restaurant_id);
create index if not exists products_category_id_idx on public.products (category_id);

-- Operadores da plataforma
create table if not exists public.platform_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- RLS
alter table public.restaurants enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.platform_admins enable row level security;

drop policy if exists "restaurants_owner_all" on public.restaurants;
create policy "restaurants_owner_all"
  on public.restaurants
  for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "restaurants_public_select" on public.restaurants;
create policy "restaurants_public_select"
  on public.restaurants
  for select
  to anon
  using (true);

drop policy if exists "restaurants_platform_admin_select" on public.restaurants;
create policy "restaurants_platform_admin_select"
  on public.restaurants
  for select
  to authenticated
  using (
    exists (select 1 from public.platform_admins pa where pa.user_id = auth.uid())
  );

drop policy if exists "categories_owner_all" on public.categories;
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

drop policy if exists "categories_public_select" on public.categories;
create policy "categories_public_select"
  on public.categories
  for select
  to anon
  using (true);

drop policy if exists "products_owner_all" on public.products;
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

drop policy if exists "products_public_available_select" on public.products;
create policy "products_public_available_select"
  on public.products
  for select
  to anon
  using (is_available = true);

drop policy if exists "platform_admins_self_read" on public.platform_admins;
create policy "platform_admins_self_read"
  on public.platform_admins
  for select
  to authenticated
  using (user_id = auth.uid());

create or replace function public.admin_set_restaurant_plan(p_restaurant_id uuid, p_plan text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_count int;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if not exists (select 1 from public.platform_admins pa where pa.user_id = auth.uid()) then
    raise exception 'forbidden';
  end if;
  if p_plan is null or p_plan not in ('free', 'pro', 'enterprise') then
    raise exception 'invalid plan';
  end if;
  update public.restaurants
  set plan = p_plan
  where id = p_restaurant_id;
  get diagnostics updated_count = row_count;
  if updated_count = 0 then
    raise exception 'restaurant not found';
  end if;
end;
$$;

revoke all on function public.admin_set_restaurant_plan(uuid, text) from public;
grant execute on function public.admin_set_restaurant_plan(uuid, text) to authenticated;

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "product_images_public_read" on storage.objects;
create policy "product_images_public_read"
  on storage.objects
  for select
  to public
  using (bucket_id = 'product-images');

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

drop policy if exists "product_images_owner_insert" on storage.objects;
drop policy if exists "product_images_owner_update" on storage.objects;
drop policy if exists "product_images_owner_delete" on storage.objects;

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
