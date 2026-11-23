-- Directory: family listings with per-person contact info and publish choices, and photo storage.
--
-- * A directory listing can be one person or a whole family ("The Smith Family"). Each person in
--   it has their own phone and email, and chooses separately whether each is published.
-- * Full contact details (published or not) live in directory_member_private, which only staff
--   (and the listed member themselves) can read. directory_members.contacts holds only the
--   published phone numbers and emails, because every approved member can read that table.
-- * Photos go in a private Storage bucket, one folder per church, readable by that church's
--   approved members and staff, written by staff.
--
-- Run once in the Supabase SQL Editor. Safe to run again.

-- ---------------------------------------------------------------------------
-- Contacts
-- ---------------------------------------------------------------------------

-- Published contacts only: [{"name": "...", "phone": "...", "email": "..."}]
alter table public.directory_members add column if not exists contacts jsonb not null default '[]'::jsonb;

-- Every contact with its publish choices:
-- [{"name": "...", "phone": "...", "email": "...", "showPhone": true, "showEmail": false}]
create table if not exists public.directory_member_private (
  member_id text primary key references public.directory_members (id) on delete cascade,
  church_id text not null references public.churches (id) on delete cascade,
  contacts jsonb not null default '[]'::jsonb
);
create index if not exists directory_member_private_church_id_idx on public.directory_member_private (church_id);

alter table public.directory_member_private enable row level security;

drop policy if exists "Staff and the member see private directory contacts" on public.directory_member_private;
create policy "Staff and the member see private directory contacts" on public.directory_member_private
  for select to authenticated
  using (
    public.is_church_staff(church_id)
    or exists (select 1 from public.directory_members d where d.id = member_id and d.profile_id = auth.uid())
  );

drop policy if exists "Staff add private directory contacts" on public.directory_member_private;
create policy "Staff add private directory contacts" on public.directory_member_private
  for insert to authenticated with check (public.is_church_staff(church_id));

drop policy if exists "Staff or the member edit private directory contacts" on public.directory_member_private;
create policy "Staff or the member edit private directory contacts" on public.directory_member_private
  for update to authenticated
  using (
    public.is_church_staff(church_id)
    or exists (select 1 from public.directory_members d where d.id = member_id and d.profile_id = auth.uid())
  )
  with check (
    public.is_church_staff(church_id)
    or exists (select 1 from public.directory_members d where d.id = member_id and d.profile_id = auth.uid())
  );

drop policy if exists "Staff remove private directory contacts" on public.directory_member_private;
create policy "Staff remove private directory contacts" on public.directory_member_private
  for delete to authenticated using (public.is_church_staff(church_id));

grant select, insert, update, delete on public.directory_member_private to authenticated;

-- Move existing single email/phone values into the new format. They were all shown before, so
-- they stay published. The old columns are then emptied: members can read that table, so an
-- unpublished number must never be left there.
insert into public.directory_member_private (member_id, church_id, contacts)
select d.id, d.church_id,
       jsonb_build_array(jsonb_build_object(
         'name', d.name, 'phone', d.phone, 'email', d.email,
         'showPhone', d.phone <> '', 'showEmail', d.email <> ''))
  from public.directory_members d
 where (d.phone <> '' or d.email <> '')
on conflict (member_id) do nothing;

update public.directory_members
   set contacts = jsonb_build_array(jsonb_strip_nulls(jsonb_build_object(
         'name', name,
         'phone', nullif(phone, ''),
         'email', nullif(email, '')))),
       phone = '',
       email = ''
 where (phone <> '' or email <> '') and contacts = '[]'::jsonb;

-- New pastors and newly approved members are added to the directory automatically. Their
-- contact details are saved for staff but not published until staff (or they) choose to.
create or replace function public._create_church_for(owner uuid, owner_email text, p jsonb)
returns text
language plpgsql security definer set search_path = ''
as $$
declare
  church_name text := nullif(btrim(coalesce(p ->> 'name', '')), '');
  base_slug text;
  final_slug text;
  new_id text;
  n integer := 1;
  pastor text := coalesce(nullif(btrim(p ->> 'pastorName'), ''), 'Pastor');
  dir_id text;
begin
  if church_name is null then
    raise exception 'Church name is required';
  end if;

  base_slug := coalesce(
    nullif(btrim(regexp_replace(lower(church_name), '[^a-z0-9]+', '-', 'g'), '-'), ''),
    'church'
  );
  final_slug := base_slug;
  while exists (select 1 from public.churches where slug = final_slug) loop
    n := n + 1;
    final_slug := base_slug || '-' || n;
  end loop;

  insert into public.churches (
    slug, name, tagline, denomination, pastor_name, contact_email, phone, address,
    city, state, zip_code, website_url, theme_color, primary_color, accent_color,
    welcome_message, scripture_verse, bulletin_title, created_by
  ) values (
    final_slug,
    church_name,
    coalesce(nullif(btrim(p ->> 'tagline'), ''), 'Growing in faith, grounded in grace'),
    coalesce(nullif(btrim(p ->> 'denomination'), ''), 'Non-Denominational'),
    pastor,
    coalesce(nullif(btrim(p ->> 'contactEmail'), ''), owner_email, ''),
    coalesce(btrim(p ->> 'phone'), ''),
    coalesce(btrim(p ->> 'address'), ''),
    coalesce(btrim(p ->> 'city'), ''),
    coalesce(btrim(p ->> 'state'), ''),
    nullif(btrim(p ->> 'zipCode'), ''),
    coalesce(btrim(p ->> 'websiteUrl'), ''),
    'teal_pink', '#4eb8b9', '#c219b0',
    'Welcome to the ' || church_name || ' prayer wall. How may our congregation stand with you in faith today?',
    'Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God. — Philippians 4:6',
    church_name || ' Weekly Intercessory Prayer List',
    owner
  )
  returning id into new_id;

  update public.profiles
     set church_id = new_id,
         approved = true,
         role = case when role = 'super_admin' then role else 'church_staff' end,
         title = coalesce(title, 'Senior Pastor'),
         name = case when name = '' then pastor else name end
   where id = owner;

  insert into public.directory_members (church_id, profile_id, name, role_title, group_name)
  select new_id, pr.id, pr.name, coalesce(pr.title, 'Senior Pastor'), 'Pastoral Staff'
    from public.profiles pr where pr.id = owner
  returning id into dir_id;

  insert into public.directory_member_private (member_id, church_id, contacts)
  select dir_id, new_id, jsonb_build_array(jsonb_build_object(
           'name', pr.name, 'phone', coalesce(pr.phone, ''), 'email', coalesce(pr.email, ''),
           'showPhone', false, 'showEmail', false))
    from public.profiles pr where pr.id = owner;

  insert into public.admin_notifications (kind, church_id, message)
  values (
    'church_registered', new_id,
    'New church registered: ' || church_name || ' (' || pastor || ', ' || coalesce(owner_email, 'no email') || ')'
  );

  return new_id;
end;
$$;


create or replace function public.approve_member(member_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  m public.profiles;
  dir_id text;
begin
  select * into m from public.profiles where id = member_id;
  if m.id is null or m.church_id is null or not public.is_church_staff(m.church_id) then
    raise exception 'Not allowed to approve this member';
  end if;

  update public.profiles set approved = true where id = member_id;

  if not exists (select 1 from public.directory_members where profile_id = member_id and church_id = m.church_id) then
    insert into public.directory_members (church_id, profile_id, name, role_title, group_name, photo_url, joined_year)
    values (
      m.church_id, m.id, m.name, coalesce(m.title, 'Congregation Member'),
      case when m.role = 'church_staff' then 'Pastoral Staff' else 'Congregation Members' end,
      coalesce(m.avatar_url, ''), to_char(now(), 'YYYY')
    )
    returning id into dir_id;

    insert into public.directory_member_private (member_id, church_id, contacts)
    values (dir_id, m.church_id, jsonb_build_array(jsonb_build_object(
      'name', m.name, 'phone', coalesce(m.phone, ''), 'email', coalesce(m.email, ''),
      'showPhone', false, 'showEmail', false)));
  end if;
end;
$$;

revoke execute on function public._create_church_for(uuid, text, jsonb) from public, anon, authenticated;
revoke execute on function public.approve_member(uuid) from public, anon;
grant execute on function public.approve_member(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Photo storage (Supabase Storage; skipped where the storage schema doesn't exist)
-- ---------------------------------------------------------------------------
do $storage$
begin
  if not exists (select 1 from information_schema.schemata where schema_name = 'storage') then
    raise notice 'No storage schema here; skipping the directory photo bucket';
    return;
  end if;

  insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values ('directory-photos', 'directory-photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
  on conflict (id) do nothing;

  -- Files are stored as <church id>/<file name>
  execute 'drop policy if exists "Church members see directory photos" on storage.objects';
  execute $p$create policy "Church members see directory photos" on storage.objects
    for select to authenticated
    using (bucket_id = 'directory-photos'
      and (public.is_church_staff((storage.foldername(name))[1])
        or public.is_church_member((storage.foldername(name))[1])))$p$;

  execute 'drop policy if exists "Staff upload directory photos" on storage.objects';
  execute $p$create policy "Staff upload directory photos" on storage.objects
    for insert to authenticated
    with check (bucket_id = 'directory-photos' and public.is_church_staff((storage.foldername(name))[1]))$p$;

  execute 'drop policy if exists "Staff replace directory photos" on storage.objects';
  execute $p$create policy "Staff replace directory photos" on storage.objects
    for update to authenticated
    using (bucket_id = 'directory-photos' and public.is_church_staff((storage.foldername(name))[1]))$p$;

  execute 'drop policy if exists "Staff remove directory photos" on storage.objects';
  execute $p$create policy "Staff remove directory photos" on storage.objects
    for delete to authenticated
    using (bucket_id = 'directory-photos' and public.is_church_staff((storage.foldername(name))[1]))$p$;
end
$storage$;
