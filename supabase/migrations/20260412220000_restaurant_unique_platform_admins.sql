-- Um restaurante por usuário (conta)
-- Se falhar, há mais de um restaurante para o mesmo user_id: apague ou mesche duplicatas no Table Editor e rode de novo.
alter table public.restaurants
  add constraint restaurants_user_id_unique unique (user_id);

-- Operadores da plataforma (promovidos manualmente no SQL Editor)
create table public.platform_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.platform_admins enable row level security;

-- Cada um só enxerga se é admin (para o app decidir mostrar o menu)
create policy "platform_admins_self_read"
  on public.platform_admins
  for select
  to authenticated
  using (user_id = auth.uid());

-- Alteração de plano só via função (evita admin mudar user_id ou dados de terceiros pelo cliente)
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
