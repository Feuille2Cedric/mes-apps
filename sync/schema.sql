-- Run once in Supabase SQL Editor. No existing app tables are modified.
begin;
create table if not exists public.personal_app_state (
  owner_id uuid not null references auth.users(id) on delete cascade,
  app text not null check (app in ('curio','mes-apps')),
  revision bigint not null default 1,
  document jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (owner_id,app)
);
alter table public.personal_app_state enable row level security;
revoke all on public.personal_app_state from anon, authenticated;
grant select on public.personal_app_state to authenticated;
drop policy if exists personal_app_read_own on public.personal_app_state;
create policy personal_app_read_own on public.personal_app_state for select to authenticated using ((select auth.uid())=owner_id);

create table if not exists public.personal_app_history (
  owner_id uuid not null references auth.users(id) on delete cascade,
  app text not null,
  revision bigint not null,
  document jsonb not null,
  saved_at timestamptz not null default now(),
  primary key(owner_id,app,revision)
);
alter table public.personal_app_history enable row level security;
revoke all on public.personal_app_history from anon,authenticated;
grant select on public.personal_app_history to authenticated;
drop policy if exists personal_history_read_own on public.personal_app_history;
create policy personal_history_read_own on public.personal_app_history for select to authenticated using ((select auth.uid())=owner_id);

create or replace function public.personal_app_save(p_app text,p_revision bigint,p_document jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_owner uuid:=auth.uid(); v_row public.personal_app_state; v_revision bigint;
begin
  if v_owner is null then raise exception 'Authentication required' using errcode='42501'; end if;
  if p_app is null or p_app not in ('curio','mes-apps') or p_revision is null or p_revision<0 or p_document is null or jsonb_typeof(p_document)<>'object' then
    raise exception 'Invalid document' using errcode='22023';
  end if;
  if octet_length(p_document::text)>10485760 then raise exception 'Document too large' using errcode='22023'; end if;
  perform pg_advisory_xact_lock(hashtextextended(v_owner::text||':'||p_app,0));
  select * into v_row from public.personal_app_state where owner_id=v_owner and app=p_app;
  v_revision:=coalesce(v_row.revision,0);
  if v_revision<>p_revision then return jsonb_build_object('conflict',true,'revision',v_revision); end if;
  if v_revision>0 then
    insert into public.personal_app_history(owner_id,app,revision,document) values(v_owner,p_app,v_revision,v_row.document) on conflict do nothing;
    delete from public.personal_app_history where owner_id=v_owner and app=p_app and revision<v_revision-19;
  end if;
  insert into public.personal_app_state(owner_id,app,revision,document) values(v_owner,p_app,v_revision+1,p_document)
  on conflict(owner_id,app) do update set revision=excluded.revision,document=excluded.document,updated_at=now();
  return jsonb_build_object('revision',v_revision+1);
end;
$$;
revoke all on function public.personal_app_save(text,bigint,jsonb) from public,anon;
grant execute on function public.personal_app_save(text,bigint,jsonb) to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('personal-app-images','personal-app-images',false,12582912,array['image/png','image/jpeg','image/gif','image/webp'])
on conflict(id) do nothing;
drop policy if exists personal_images_read on storage.objects;
create policy personal_images_read on storage.objects for select to authenticated using(bucket_id='personal-app-images' and (storage.foldername(name))[1]=(select auth.uid())::text and (storage.foldername(name))[2] in ('curio','mes-apps'));
drop policy if exists personal_images_insert on storage.objects;
create policy personal_images_insert on storage.objects for insert to authenticated with check(bucket_id='personal-app-images' and (storage.foldername(name))[1]=(select auth.uid())::text and (storage.foldername(name))[2] in ('curio','mes-apps'));
commit;
