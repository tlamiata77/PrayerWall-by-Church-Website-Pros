-- GraceWall initial schema: churches, member profiles, prayer requests, directory,
-- and super admin notifications, all protected by Row Level Security.
--
-- Access model
--   * Anyone (including logged-out website visitors) can read churches and
--     approved, non-archived prayer requests shared with the church or network.
--   * Requester email/phone and staff care notes live in prayer_request_private,
--     readable only by that church's staff and the person who submitted it.
--   * Members sign up and pick a church; staff approve them before they can see
--     the church directory.
--   * Pastors may register a new church themselves; it goes live immediately and
--     the super admin gets a notification.
--   * Super admins are listed by email in public.super_admin_emails (no API access).

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.churches (
  id text primary key default ('church-' || replace(gen_random_uuid()::text, '-', '')),
  slug text not null unique,
  name text not null,
  logo_url text,
  tagline text not null default '',
  denomination text not null default '',
  pastor_name text not null default '',
  contact_email text not null default '',
  phone text not null default '',
  address text not null default '',
  city text not null default '',
  state text not null default '',
  zip_code text,
  website_url text not null default '',
  theme_color text not null default 'teal_pink',
  primary_color text,
  accent_color text,
  welcome_message text not null default '',
  scripture_verse text not null default '',
  bulletin_title text,
  settings jsonb not null default '{
    "allowAnonymous": true,
    "requireStaffReviewBeforePublish": false,
    "autoApproveHighScores": true,
    "enablePraiseUpdates": true,
    "defaultPrintColumns": 2,
    "defaultWallLayout": "grid"
  }'::jsonb,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  name text not null default '',
  role text not null default 'congregation_member'
    check (role in ('super_admin', 'church_staff', 'congregation_member')),
  church_id text references public.churches (id) on delete set null,
  -- Staff approval of church membership (unlocks the directory)
  approved boolean not null default false,
  title text,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now()
);
create index profiles_church_id_idx on public.profiles (church_id);

create table public.prayer_requests (
  id text primary key default ('req-' || replace(gen_random_uuid()::text, '-', '')),
  church_id text not null references public.churches (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  title text not null,
  content text not null default '',
  requester_name text not null default 'Anonymous',
  is_anonymous boolean not null default false,
  visibility text not null default 'church' check (visibility in ('private', 'church', 'global')),
  category text not null default 'General',
  is_urgent boolean not null default false,
  is_answered boolean not null default false,
  answered_update text,
  prayer_count integer not null default 1,
  status text not null default 'pending' check (status in ('approved', 'flagged', 'rejected', 'pending')),
  moderation jsonb not null default '{}'::jsonb,
  bulletin_summary text,
  is_archived boolean not null default false,
  archived_at timestamptz,
  archived_reason text,
  is_archived_from_print boolean not null default false,
  archived_from_print_at timestamptz,
  recent_encouragements jsonb not null default '[]'::jsonb,
  last_resubmitted_at timestamptz,
  resubmitted_times integer not null default 0,
  created_at timestamptz not null default now()
);
create index prayer_requests_church_id_idx on public.prayer_requests (church_id, created_at desc);
create index prayer_requests_user_id_idx on public.prayer_requests (user_id);

-- Contact details and pastoral notes, kept out of the publicly readable table
create table public.prayer_request_private (
  request_id text primary key references public.prayer_requests (id) on delete cascade,
  church_id text not null references public.churches (id) on delete cascade,
  requester_email text,
  requester_phone text,
  staff_notes text
);
create index prayer_request_private_church_id_idx on public.prayer_request_private (church_id);

create table public.directory_members (
  id text primary key default ('dir-' || replace(gen_random_uuid()::text, '-', '')),
  church_id text not null references public.churches (id) on delete cascade,
  profile_id uuid references public.profiles (id) on delete set null,
  name text not null,
  role_title text not null default '',
  group_name text not null default 'Congregation Members',
  email text not null default '',
  phone text not null default '',
  photo_url text not null default '',
  address text,
  bio text,
  family_members text,
  joined_year text,
  is_public_in_directory boolean not null default true,
  created_at timestamptz not null default now()
);
create index directory_members_church_id_idx on public.directory_members (church_id);

create table public.admin_notifications (
  id bigint generated always as identity primary key,
  kind text not null,
  church_id text references public.churches (id) on delete cascade,
  message text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.super_admin_emails (
  email text primary key
);

alter table public.churches enable row level security;
alter table public.profiles enable row level security;
alter table public.prayer_requests enable row level security;
alter table public.prayer_request_private enable row level security;
alter table public.directory_members enable row level security;
alter table public.admin_notifications enable row level security;
alter table public.super_admin_emails enable row level security; -- no policies: never readable via the API

-- ---------------------------------------------------------------------------
-- Permission helpers (security definer so policies can read profiles without recursion)
-- ---------------------------------------------------------------------------

create function public.is_super_admin()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'super_admin'
  );
$$;

create function public.is_church_staff(target_church text)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and (role = 'super_admin' or (role = 'church_staff' and church_id = target_church))
  );
$$;

create function public.is_church_member(target_church text)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and (role = 'super_admin' or (church_id = target_church and approved))
  );
$$;

-- ---------------------------------------------------------------------------
-- Church creation (used by sign-up and by already signed-in pastors)
-- ---------------------------------------------------------------------------

create function public._create_church_for(owner uuid, owner_email text, p jsonb)
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

  insert into public.directory_members (church_id, profile_id, name, role_title, group_name, email, phone)
  select new_id, pr.id, pr.name, coalesce(pr.title, 'Senior Pastor'), 'Pastoral Staff', pr.email, coalesce(pr.phone, '')
    from public.profiles pr where pr.id = owner;

  insert into public.admin_notifications (kind, church_id, message)
  values (
    'church_registered', new_id,
    'New church registered: ' || church_name || ' (' || pastor || ', ' || coalesce(owner_email, 'no email') || ')'
  );

  return new_id;
end;
$$;

-- A signed-in user registers a church and becomes its pastor/staff admin
create function public.register_church(p jsonb)
returns text
language plpgsql security definer set search_path = ''
as $$
declare
  me public.profiles;
begin
  select * into me from public.profiles where id = auth.uid();
  if me.id is null then
    raise exception 'Sign in before registering a church';
  end if;
  if me.role = 'church_staff' and me.church_id is not null then
    raise exception 'This account is already the staff admin of a church';
  end if;
  return public._create_church_for(me.id, me.email, p);
end;
$$;

-- ---------------------------------------------------------------------------
-- New auth users get a profile. Sign-up metadata:
--   { name, phone, title, church_id }            → member of that church (pending approval)
--   { name, phone, pending_church: {...church} } → registers a new church as its pastor
-- ---------------------------------------------------------------------------

create function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  wanted_church text := nullif(meta ->> 'church_id', '');
  is_admin boolean := exists (select 1 from public.super_admin_emails where lower(email) = lower(new.email));
begin
  if wanted_church is not null and not exists (select 1 from public.churches where id = wanted_church) then
    wanted_church := null;
  end if;

  insert into public.profiles (id, email, name, phone, title, avatar_url, role, church_id, approved)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(nullif(btrim(meta ->> 'name'), ''), split_part(coalesce(new.email, ''), '@', 1)),
    nullif(btrim(meta ->> 'phone'), ''),
    nullif(btrim(meta ->> 'title'), ''),
    nullif(btrim(meta ->> 'avatar_url'), ''),
    case when is_admin then 'super_admin' else 'congregation_member' end,
    wanted_church,
    is_admin
  );

  if jsonb_typeof(meta -> 'pending_church') = 'object' then
    perform public._create_church_for(new.id, new.email, meta -> 'pending_church');
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Guards: stop people from promoting themselves or rewriting protected fields
-- ---------------------------------------------------------------------------

-- Runs as the caller (not security definer) so current_user tells API updates apart
-- from updates made inside this schema's own security-definer functions.
create function public.guard_profile_update()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  -- Security-definer functions here (approve_member, pray_for_request, ...) run as
  -- the owner and do their own checks; only guard direct API updates.
  if current_user not in ('anon', 'authenticated') then
    return new;
  end if;

  if public.is_super_admin() then
    return new;
  end if;

  new.id := old.id;
  new.email := old.email;
  new.created_at := old.created_at;

  if new.id = auth.uid() then
    -- Members may edit their own name/phone/title/photo. Switching church resets approval.
    new.role := old.role;
    if new.church_id is distinct from old.church_id then
      if old.role = 'church_staff' then
        new.church_id := old.church_id;
      else
        new.approved := false;
      end if;
    end if;
    if new.church_id is not distinct from old.church_id then
      new.approved := old.approved;
    end if;
  elsif public.is_church_staff(old.church_id) then
    -- Staff may approve members of their church and grant/revoke staff access
    new.church_id := old.church_id;
    if new.role = 'super_admin' or old.role = 'super_admin' then
      new.role := old.role;
    end if;
    if new.role = 'church_staff' then
      new.approved := true;
    end if;
  else
    raise exception 'Not allowed to edit this profile';
  end if;

  return new;
end;
$$;

create trigger guard_profile_update
  before update on public.profiles
  for each row execute function public.guard_profile_update();

-- Runs as the caller (not security definer) so current_user tells API updates apart
-- from updates made inside this schema's own security-definer functions.
create function public.guard_prayer_request_update()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  -- Security-definer functions here (approve_member, pray_for_request, ...) run as
  -- the owner and do their own checks; only guard direct API updates.
  if current_user not in ('anon', 'authenticated') then
    return new;
  end if;

  if public.is_church_staff(old.church_id) then
    new.church_id := old.church_id;
    return new;
  end if;

  -- The requester editing their own request (e.g. resubmitting or marking answered)
  new.id := old.id;
  new.church_id := old.church_id;
  new.user_id := old.user_id;
  new.status := old.status;
  new.visibility := old.visibility;
  new.prayer_count := old.prayer_count;
  new.moderation := old.moderation;
  new.bulletin_summary := old.bulletin_summary;
  new.is_archived_from_print := case when new.is_archived_from_print then old.is_archived_from_print else false end;
  return new;
end;
$$;

create trigger guard_prayer_request_update
  before update on public.prayer_requests
  for each row execute function public.guard_prayer_request_update();

-- ---------------------------------------------------------------------------
-- Actions available to visitors and members
-- ---------------------------------------------------------------------------

-- Submit a prayer request. Status is decided here, not by the browser:
-- the client's AI moderation result can only make a request stricter.
create function public.submit_prayer_request(p jsonb)
returns public.prayer_requests
language plpgsql security definer set search_path = ''
as $$
declare
  ch public.churches;
  vis text := coalesce(p ->> 'visibility', 'church');
  client_status text := coalesce(p ->> 'status', 'approved');
  final_status text;
  anon boolean := coalesce((p ->> 'isAnonymous')::boolean, false);
  row public.prayer_requests;
begin
  select * into ch from public.churches where id = p ->> 'churchId';
  if ch.id is null then
    raise exception 'Unknown church';
  end if;
  if vis not in ('private', 'church', 'global') then
    vis := 'church';
  end if;
  if length(coalesce(p ->> 'title', '')) = 0 or length(p ->> 'title') > 300
     or length(coalesce(p ->> 'content', '')) > 5000 then
    raise exception 'Prayer request title or text is missing or too long';
  end if;

  if client_status = 'rejected' then
    final_status := 'rejected';
  elsif client_status in ('flagged', 'pending') then
    final_status := 'flagged';
  elsif coalesce((ch.settings ->> 'requireStaffReviewBeforePublish')::boolean, false) and vis <> 'private' then
    final_status := 'flagged';
  else
    final_status := 'approved';
  end if;

  insert into public.prayer_requests (
    church_id, user_id, title, content, requester_name, is_anonymous, visibility,
    category, is_urgent, status, moderation, bulletin_summary, recent_encouragements
  ) values (
    ch.id,
    auth.uid(),
    left(p ->> 'title', 300),
    coalesce(p ->> 'content', ''),
    case when anon then 'Anonymous Church Member'
         else left(coalesce(nullif(btrim(p ->> 'requesterName'), ''), 'Anonymous'), 120) end,
    anon,
    vis,
    coalesce(nullif(p ->> 'category', ''), 'General'),
    coalesce((p ->> 'isUrgent')::boolean, false),
    final_status,
    coalesce(p -> 'moderation', '{}'::jsonb),
    left(coalesce(p ->> 'bulletinSummary', p ->> 'title'), 300),
    jsonb_build_array(jsonb_build_object(
      'text', 'A prayer was lifted up as this request was shared.',
      'date', to_char(now(), 'YYYY-MM-DD')
    ))
  )
  returning * into row;

  if nullif(btrim(p ->> 'requesterEmail'), '') is not null or nullif(btrim(p ->> 'requesterPhone'), '') is not null then
    insert into public.prayer_request_private (request_id, church_id, requester_email, requester_phone)
    values (row.id, ch.id, left(btrim(p ->> 'requesterEmail'), 200), left(btrim(p ->> 'requesterPhone'), 50));
  end if;

  return row;
end;
$$;

-- "I prayed for this" from anyone who can see the request
create function public.pray_for_request(request_id text, encouragement text default null)
returns integer
language plpgsql security definer set search_path = ''
as $$
declare
  r public.prayer_requests;
  note text := nullif(btrim(left(coalesce(encouragement, ''), 500)), '');
begin
  select * into r from public.prayer_requests where id = request_id;
  if r.id is null
     or not (
       (r.status = 'approved' and not r.is_archived and r.visibility in ('church', 'global'))
       or (r.user_id is not null and r.user_id = auth.uid())
       or public.is_church_staff(r.church_id)
     ) then
    raise exception 'Prayer request not found';
  end if;

  update public.prayer_requests
     set prayer_count = prayer_count + 1,
         recent_encouragements = case
           when note is null then recent_encouragements
           else (
             select coalesce(jsonb_agg(e), '[]'::jsonb)
               from (
                 select e from jsonb_array_elements(
                   jsonb_build_array(jsonb_build_object('text', note, 'date', to_char(now(), 'YYYY-MM-DD')))
                   || recent_encouragements
                 ) with ordinality as t(e, i)
                 order by i
                 limit 5
               ) s
           )
         end
   where id = request_id
   returning prayer_count into r.prayer_count;

  return r.prayer_count;
end;
$$;

-- Staff approve a member: unlocks the directory and adds them to it
create function public.approve_member(member_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  m public.profiles;
begin
  select * into m from public.profiles where id = member_id;
  if m.id is null or m.church_id is null or not public.is_church_staff(m.church_id) then
    raise exception 'Not allowed to approve this member';
  end if;

  update public.profiles set approved = true where id = member_id;

  if not exists (select 1 from public.directory_members where profile_id = member_id and church_id = m.church_id) then
    insert into public.directory_members (church_id, profile_id, name, role_title, group_name, email, phone, photo_url, joined_year)
    values (
      m.church_id, m.id, m.name, coalesce(m.title, 'Congregation Member'),
      case when m.role = 'church_staff' then 'Pastoral Staff' else 'Congregation Members' end,
      m.email, coalesce(m.phone, ''), coalesce(m.avatar_url, ''), to_char(now(), 'YYYY')
    );
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security policies
-- ---------------------------------------------------------------------------

-- churches
create policy "Churches are public" on public.churches
  for select using (true);
create policy "Super admins add churches" on public.churches
  for insert to authenticated with check (public.is_super_admin());
create policy "Staff edit their church" on public.churches
  for update to authenticated using (public.is_church_staff(id)) with check (public.is_church_staff(id));
create policy "Super admins delete churches" on public.churches
  for delete to authenticated using (public.is_super_admin());

-- profiles
create policy "See own profile, staff see their church" on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_church_staff(church_id));
create policy "Edit own profile, staff manage their church" on public.profiles
  for update to authenticated
  using (id = auth.uid() or public.is_church_staff(church_id));

-- prayer_requests
create policy "Public prayers, own prayers, staff see their church" on public.prayer_requests
  for select
  using (
    (status = 'approved' and not is_archived and visibility in ('church', 'global'))
    or (user_id is not null and user_id = auth.uid())
    or public.is_church_staff(church_id)
  );
create policy "Staff add prayers (imports)" on public.prayer_requests
  for insert to authenticated with check (public.is_church_staff(church_id));
create policy "Staff or requester edit prayers" on public.prayer_requests
  for update to authenticated
  using (public.is_church_staff(church_id) or user_id = auth.uid());
create policy "Staff delete prayers" on public.prayer_requests
  for delete to authenticated using (public.is_church_staff(church_id));

-- prayer_request_private
create policy "Staff and requester see contact details" on public.prayer_request_private
  for select to authenticated
  using (
    public.is_church_staff(church_id)
    or exists (select 1 from public.prayer_requests r where r.id = request_id and r.user_id = auth.uid())
  );
create policy "Staff add contact details" on public.prayer_request_private
  for insert to authenticated with check (public.is_church_staff(church_id));
create policy "Staff edit contact details and notes" on public.prayer_request_private
  for update to authenticated using (public.is_church_staff(church_id)) with check (public.is_church_staff(church_id));
create policy "Staff delete contact details" on public.prayer_request_private
  for delete to authenticated using (public.is_church_staff(church_id));

-- directory_members
create policy "Approved members see their directory" on public.directory_members
  for select to authenticated
  using (
    public.is_church_staff(church_id)
    or (is_public_in_directory and public.is_church_member(church_id))
    or profile_id = auth.uid()
  );
create policy "Staff add directory entries" on public.directory_members
  for insert to authenticated with check (public.is_church_staff(church_id));
create policy "Staff or the member edit a directory entry" on public.directory_members
  for update to authenticated
  using (public.is_church_staff(church_id) or profile_id = auth.uid())
  with check (public.is_church_staff(church_id) or profile_id = auth.uid());
create policy "Staff remove directory entries" on public.directory_members
  for delete to authenticated using (public.is_church_staff(church_id));

-- admin_notifications
create policy "Super admins read notifications" on public.admin_notifications
  for select to authenticated using (public.is_super_admin());
create policy "Super admins mark notifications read" on public.admin_notifications
  for update to authenticated using (public.is_super_admin()) with check (public.is_super_admin());

-- ---------------------------------------------------------------------------
-- Grants (new tables are not exposed to the Data API automatically)
-- ---------------------------------------------------------------------------

grant usage on schema public to anon, authenticated;

grant select on public.churches, public.prayer_requests to anon, authenticated;
grant insert, update, delete on public.churches, public.prayer_requests to authenticated;
grant select, insert, update, delete on public.prayer_request_private, public.directory_members to authenticated;
grant select, update on public.profiles, public.admin_notifications to authenticated;

revoke execute on function public._create_church_for(uuid, text, jsonb) from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
grant execute on function public.submit_prayer_request(jsonb) to anon, authenticated;
grant execute on function public.pray_for_request(text, text) to anon, authenticated;
grant execute on function public.register_church(jsonb) to authenticated;
grant execute on function public.approve_member(uuid) to authenticated;
grant execute on function public.is_super_admin() to anon, authenticated;
grant execute on function public.is_church_staff(text) to anon, authenticated;
grant execute on function public.is_church_member(text) to anon, authenticated;
