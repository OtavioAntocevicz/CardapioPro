-- Corrige upload no Storage: políticas que consultam public.restaurants direto costumam falhar no RLS do Storage.
-- Rode no SQL Editor se você já aplicou a migração inicial sem esta função.

drop policy if exists "product_images_owner_insert" on storage.objects;
drop policy if exists "product_images_owner_update" on storage.objects;
drop policy if exists "product_images_owner_delete" on storage.objects;

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
