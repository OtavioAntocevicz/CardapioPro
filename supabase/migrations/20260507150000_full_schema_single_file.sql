-- CardápioPro — SQL único para SQL Editor
-- Este arquivo consolida:
-- 1) 20260412000000_init.sql
-- 2) 20260507134000_plans_and_menus.sql

-- ============================================================================
-- PARTE 1: INIT
-- ============================================================================

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

-- ============================================================================
-- PARTE 2: PLANOS + MENUS + ADMIN
-- ============================================================================

-- CardápioPro — planos, cardápios e administração manual

-- 1) Restaurantes: assinatura manual e múltiplos restaurantes por conta
alter table public.restaurants
  add column if not exists subscription_status text not null default 'manual'
    check (subscription_status in ('active', 'trialing', 'paused', 'canceled', 'manual')),
  add column if not exists current_period_end timestamptz,
  add column if not exists updated_by_admin_id uuid references auth.users (id),
  add column if not exists updated_at timestamptz not null default now();

alter table public.restaurants
  drop constraint if exists restaurants_user_id_unique;

-- 2) Cardápios (menus)
create table if not exists public.menus (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  name text not null,
  slug text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists menus_restaurant_id_idx on public.menus (restaurant_id);

do $$
begin
  if not exists (
    select 1
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where c.conname = 'menus_restaurant_slug_unique' and n.nspname = 'public' and t.relname = 'menus'
  ) then
    alter table public.menus add constraint menus_restaurant_slug_unique unique (restaurant_id, slug);
  end if;
end
$$;

-- Backfill: menu padrão para restaurantes existentes
insert into public.menus (restaurant_id, name, slug, is_active)
select r.id, 'Principal', 'principal', true
from public.restaurants r
where not exists (select 1 from public.menus m where m.restaurant_id = r.id);

-- 3) Categories e products vinculados a menu
alter table public.categories
  add column if not exists menu_id uuid references public.menus (id) on delete cascade;

update public.categories c
set menu_id = m.id
from public.menus m
where m.restaurant_id = c.restaurant_id
  and m.slug = 'principal'
  and c.menu_id is null;

alter table public.categories
  alter column menu_id set not null;

create index if not exists categories_menu_id_idx on public.categories (menu_id);

alter table public.products
  add column if not exists menu_id uuid references public.menus (id) on delete cascade;

update public.products p
set menu_id = c.menu_id
from public.categories c
where c.id = p.category_id
  and p.menu_id is null;

update public.products p
set menu_id = m.id
from public.menus m
where m.restaurant_id = p.restaurant_id
  and m.slug = 'principal'
  and p.menu_id is null;

alter table public.products
  alter column menu_id set not null;

create index if not exists products_menu_id_idx on public.products (menu_id);

-- 4) RLS menus
alter table public.menus enable row level security;

drop policy if exists "menus_owner_all" on public.menus;
create policy "menus_owner_all"
  on public.menus
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.restaurants r
      where r.id = menus.restaurant_id
        and r.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.restaurants r
      where r.id = menus.restaurant_id
        and r.user_id = auth.uid()
    )
  );

drop policy if exists "menus_platform_admin_select" on public.menus;
create policy "menus_platform_admin_select"
  on public.menus
  for select
  to authenticated
  using (
    exists (select 1 from public.platform_admins pa where pa.user_id = auth.uid())
  );

drop policy if exists "menus_public_select" on public.menus;
create policy "menus_public_select"
  on public.menus
  for select
  to anon
  using (is_active = true);

-- 5) Ajustar políticas públicas para só menu ativo
drop policy if exists "categories_public_select" on public.categories;
create policy "categories_public_select"
  on public.categories
  for select
  to anon
  using (
    exists (
      select 1
      from public.menus m
      where m.id = categories.menu_id
        and m.is_active = true
    )
  );

drop policy if exists "products_public_available_select" on public.products;
create policy "products_public_available_select"
  on public.products
  for select
  to anon
  using (
    is_available = true
    and exists (
      select 1
      from public.menus m
      where m.id = products.menu_id
        and m.is_active = true
    )
  );

-- 6) Auditoria admin
create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references auth.users (id) on delete cascade,
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  action text not null,
  old_plan text,
  new_plan text,
  old_status text,
  new_status text,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_logs_restaurant_idx on public.admin_audit_logs (restaurant_id, created_at desc);

alter table public.admin_audit_logs enable row level security;

drop policy if exists "admin_audit_logs_admin_select" on public.admin_audit_logs;
create policy "admin_audit_logs_admin_select"
  on public.admin_audit_logs
  for select
  to authenticated
  using (
    exists (select 1 from public.platform_admins pa where pa.user_id = auth.uid())
  );

-- 7) Funções de limite por plano
create or replace function public.plan_limits(p_plan text)
returns jsonb
language sql
immutable
as $$
  select case
    when p_plan = 'pro' then '{"max_restaurants":1,"max_menus":3,"max_categories_per_menu":5,"max_products_per_category":10}'::jsonb
    when p_plan = 'enterprise' then '{"max_restaurants":3,"max_menus":3,"max_categories_per_menu":10,"max_products_per_category":30}'::jsonb
    else '{"max_restaurants":1,"max_menus":1,"max_categories_per_menu":3,"max_products_per_category":5}'::jsonb
  end
$$;

create or replace function public.create_menu(
  p_restaurant_id uuid,
  p_name text,
  p_slug text,
  p_is_active boolean default false
)
returns public.menus
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
  v_plan text;
  v_limits jsonb;
  v_count int;
  v_row public.menus;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select r.user_id, r.plan into v_owner, v_plan
  from public.restaurants r
  where r.id = p_restaurant_id;

  if v_owner is null then
    raise exception 'restaurant not found';
  end if;
  if v_owner <> auth.uid() then
    raise exception 'forbidden';
  end if;

  v_limits := public.plan_limits(v_plan);
  select count(*) into v_count from public.menus m where m.restaurant_id = p_restaurant_id;

  if v_count >= (v_limits->>'max_menus')::int then
    raise exception 'plan_limit_exceeded:max_menus';
  end if;

  insert into public.menus (restaurant_id, name, slug, is_active)
  values (p_restaurant_id, trim(p_name), lower(trim(p_slug)), coalesce(p_is_active, false))
  returning * into v_row;

  if v_row.is_active then
    update public.menus
    set is_active = false
    where restaurant_id = p_restaurant_id
      and id <> v_row.id;
  end if;

  return v_row;
end;
$$;

create or replace function public.create_category(
  p_restaurant_id uuid,
  p_menu_id uuid,
  p_name text
)
returns public.categories
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
  v_plan text;
  v_limits jsonb;
  v_count int;
  v_menu_restaurant_id uuid;
  v_row public.categories;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select r.user_id, r.plan into v_owner, v_plan
  from public.restaurants r
  where r.id = p_restaurant_id;

  if v_owner is null then
    raise exception 'restaurant not found';
  end if;
  if v_owner <> auth.uid() then
    raise exception 'forbidden';
  end if;

  select m.restaurant_id into v_menu_restaurant_id from public.menus m where m.id = p_menu_id;
  if v_menu_restaurant_id is null or v_menu_restaurant_id <> p_restaurant_id then
    raise exception 'invalid menu';
  end if;

  v_limits := public.plan_limits(v_plan);
  select count(*) into v_count from public.categories c where c.menu_id = p_menu_id;
  if v_count >= (v_limits->>'max_categories_per_menu')::int then
    raise exception 'plan_limit_exceeded:max_categories_per_menu';
  end if;

  insert into public.categories (restaurant_id, menu_id, name)
  values (p_restaurant_id, p_menu_id, trim(p_name))
  returning * into v_row;

  return v_row;
end;
$$;

create or replace function public.create_product(
  p_restaurant_id uuid,
  p_menu_id uuid,
  p_category_id uuid,
  p_name text,
  p_description text,
  p_price numeric,
  p_image_url text,
  p_is_available boolean default true
)
returns public.products
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
  v_plan text;
  v_limits jsonb;
  v_count int;
  v_category_restaurant_id uuid;
  v_category_menu_id uuid;
  v_row public.products;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select r.user_id, r.plan into v_owner, v_plan
  from public.restaurants r
  where r.id = p_restaurant_id;

  if v_owner is null then
    raise exception 'restaurant not found';
  end if;
  if v_owner <> auth.uid() then
    raise exception 'forbidden';
  end if;

  if p_category_id is not null then
    select c.restaurant_id, c.menu_id into v_category_restaurant_id, v_category_menu_id
    from public.categories c
    where c.id = p_category_id;

    if v_category_restaurant_id is null
      or v_category_restaurant_id <> p_restaurant_id
      or v_category_menu_id <> p_menu_id then
      raise exception 'invalid category';
    end if;
  end if;

  v_limits := public.plan_limits(v_plan);
  select count(*) into v_count from public.products p where p.category_id = p_category_id;
  if v_count >= (v_limits->>'max_products_per_category')::int then
    raise exception 'plan_limit_exceeded:max_products_per_category';
  end if;

  insert into public.products (
    restaurant_id, menu_id, category_id, name, description, price, image_url, is_available
  )
  values (
    p_restaurant_id, p_menu_id, p_category_id, trim(p_name), p_description, p_price, p_image_url, coalesce(p_is_available, true)
  )
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.create_menu(uuid, text, text, boolean) from public;
grant execute on function public.create_menu(uuid, text, text, boolean) to authenticated;
revoke all on function public.create_category(uuid, uuid, text) from public;
grant execute on function public.create_category(uuid, uuid, text) to authenticated;
revoke all on function public.create_product(uuid, uuid, uuid, text, text, numeric, text, boolean) from public;
grant execute on function public.create_product(uuid, uuid, uuid, text, text, numeric, text, boolean) to authenticated;

-- 8) Funções admin: plano/status + resumo de uso
create or replace function public.admin_set_restaurant_plan_status(
  p_restaurant_id uuid,
  p_plan text,
  p_status text,
  p_period_end timestamptz default null,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old_plan text;
  v_old_status text;
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
  if p_status is null or p_status not in ('active', 'trialing', 'paused', 'canceled', 'manual') then
    raise exception 'invalid status';
  end if;

  select plan, subscription_status into v_old_plan, v_old_status
  from public.restaurants
  where id = p_restaurant_id;

  if v_old_plan is null then
    raise exception 'restaurant not found';
  end if;

  update public.restaurants
  set
    plan = p_plan,
    subscription_status = p_status,
    current_period_end = p_period_end,
    updated_by_admin_id = auth.uid(),
    updated_at = now()
  where id = p_restaurant_id;

  insert into public.admin_audit_logs (
    admin_user_id, restaurant_id, action, old_plan, new_plan, old_status, new_status, note
  ) values (
    auth.uid(), p_restaurant_id, 'plan_status_update', v_old_plan, p_plan, v_old_status, p_status, p_note
  );
end;
$$;

revoke all on function public.admin_set_restaurant_plan_status(uuid, text, text, timestamptz, text) from public;
grant execute on function public.admin_set_restaurant_plan_status(uuid, text, text, timestamptz, text) to authenticated;

create or replace function public.admin_restaurants_usage()
returns table (
  restaurant_id uuid,
  restaurant_name text,
  restaurant_slug text,
  user_id uuid,
  plan text,
  subscription_status text,
  current_period_end timestamptz,
  menus_count int,
  categories_count int,
  products_count int
)
language sql
security definer
set search_path = public
as $$
  select
    r.id as restaurant_id,
    r.name as restaurant_name,
    r.slug as restaurant_slug,
    r.user_id,
    r.plan,
    r.subscription_status,
    r.current_period_end,
    (select count(*)::int from public.menus m where m.restaurant_id = r.id) as menus_count,
    (select count(*)::int from public.categories c where c.restaurant_id = r.id) as categories_count,
    (select count(*)::int from public.products p where p.restaurant_id = r.id) as products_count
  from public.restaurants r
  where exists (select 1 from public.platform_admins pa where pa.user_id = auth.uid())
  order by r.created_at desc
$$;

revoke all on function public.admin_restaurants_usage() from public;
grant execute on function public.admin_restaurants_usage() to authenticated;

-- Compatibilidade com implementação antiga do front (plano somente)
create or replace function public.admin_set_restaurant_plan(p_restaurant_id uuid, p_plan text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.admin_set_restaurant_plan_status(p_restaurant_id, p_plan, 'manual', null, null);
end;
$$;

-- ============================================================================
-- PARTE 3: NOTIFICAÇÕES DE SUPORTE/PLANO
-- ============================================================================

create table if not exists public.support_notifications (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  request_type text not null check (request_type in ('plan', 'support')),
  contact_whatsapp text not null,
  message text not null,
  status text not null default 'new' check (status in ('new', 'in_progress', 'done')),
  created_at timestamptz not null default now(),
  handled_at timestamptz,
  handled_by_admin_id uuid references auth.users (id)
);

create index if not exists support_notifications_created_idx
  on public.support_notifications (created_at desc);

create index if not exists support_notifications_restaurant_idx
  on public.support_notifications (restaurant_id);

alter table public.support_notifications enable row level security;

drop policy if exists "support_notifications_owner_insert" on public.support_notifications;
create policy "support_notifications_owner_insert"
  on public.support_notifications
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.restaurants r
      where r.id = support_notifications.restaurant_id
        and r.user_id = auth.uid()
    )
  );

drop policy if exists "support_notifications_owner_select" on public.support_notifications;
create policy "support_notifications_owner_select"
  on public.support_notifications
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "support_notifications_admin_select" on public.support_notifications;
create policy "support_notifications_admin_select"
  on public.support_notifications
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.platform_admins pa
      where pa.user_id = auth.uid()
    )
  );

drop policy if exists "support_notifications_admin_update" on public.support_notifications;
create policy "support_notifications_admin_update"
  on public.support_notifications
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.platform_admins pa
      where pa.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.platform_admins pa
      where pa.user_id = auth.uid()
    )
  );

-- ============================================================================
-- PARTE 3: Selo de destaque em produtos
-- ============================================================================

alter table public.products add column if not exists highlight_badge text
  check (highlight_badge is null or highlight_badge in ('new', 'bestseller', 'special'));

create or replace function public.create_product(
  p_restaurant_id uuid,
  p_menu_id uuid,
  p_category_id uuid,
  p_name text,
  p_description text,
  p_price numeric,
  p_image_url text,
  p_is_available boolean default true,
  p_highlight_badge text default null
)
returns public.products
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
  v_plan text;
  v_limits jsonb;
  v_count int;
  v_category_restaurant_id uuid;
  v_category_menu_id uuid;
  v_row public.products;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  if p_highlight_badge is not null
    and p_highlight_badge not in ('new', 'bestseller', 'special') then
    raise exception 'invalid highlight_badge';
  end if;

  select r.user_id, r.plan into v_owner, v_plan
  from public.restaurants r
  where r.id = p_restaurant_id;

  if v_owner is null then
    raise exception 'restaurant not found';
  end if;
  if v_owner <> auth.uid() then
    raise exception 'forbidden';
  end if;

  if p_category_id is not null then
    select c.restaurant_id, c.menu_id into v_category_restaurant_id, v_category_menu_id
    from public.categories c
    where c.id = p_category_id;

    if v_category_restaurant_id is null
      or v_category_restaurant_id <> p_restaurant_id
      or v_category_menu_id <> p_menu_id then
      raise exception 'invalid category';
    end if;
  end if;

  v_limits := public.plan_limits(v_plan);
  select count(*) into v_count from public.products p where p.category_id = p_category_id;
  if v_count >= (v_limits->>'max_products_per_category')::int then
    raise exception 'plan_limit_exceeded:max_products_per_category';
  end if;

  insert into public.products (
    restaurant_id, menu_id, category_id, name, description, price, image_url, is_available, highlight_badge
  )
  values (
    p_restaurant_id, p_menu_id, p_category_id, trim(p_name), p_description, p_price, p_image_url,
    coalesce(p_is_available, true), p_highlight_badge
  )
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.create_product(uuid, uuid, uuid, text, text, numeric, text, boolean, text) from public;
grant execute on function public.create_product(uuid, uuid, uuid, text, text, numeric, text, boolean, text) to authenticated;
