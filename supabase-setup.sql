-- Run this entire script in Supabase > SQL Editor.
-- After creating your admin Auth user, copy its UUID into the final INSERT statement.

create extension if not exists pgcrypto;

create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 70),
  role text not null default 'Beginner / not sure',
  photo_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.member_private (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null unique references public.members(id) on delete cascade,
  lums_id text not null unique,
  email text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.fixtures (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  match_date date not null,
  match_time text,
  venue text,
  result text,
  status text not null default 'Upcoming'
    check (status in ('Upcoming','Completed','Postponed','Cancelled')),
  created_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_camp_admin()
returns boolean language sql stable security definer
set search_path = public
as $$
  select exists(select 1 from public.admin_users where user_id = auth.uid());
$$;


-- Public registration is performed through this single transaction so a failed
-- private-details insert cannot leave a half-created public squad card.
create or replace function public.register_camp_member(
  p_name text, p_role text, p_photo_url text, p_lums_id text, p_email text
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare new_member_id uuid;
begin
  if char_length(trim(p_name)) < 2 or char_length(trim(p_name)) > 70 then
    raise exception 'Please enter a valid full name.';
  end if;
  if trim(coalesce(p_lums_id,'')) = '' then
    raise exception 'LUMS ID is required.';
  end if;
  if trim(coalesce(p_email,'')) = '' or position('@' in p_email) < 2 then
    raise exception 'A valid email address is required.';
  end if;

  insert into public.members(name, role, photo_url)
  values (trim(p_name), coalesce(nullif(trim(p_role),''),'Beginner / not sure'), nullif(p_photo_url,''))
  returning id into new_member_id;

  insert into public.member_private(member_id, lums_id, email)
  values (new_member_id, trim(p_lums_id), lower(trim(p_email)));

  return new_member_id;
end;
$$;

revoke all on function public.register_camp_member(text,text,text,text,text) from public;
grant execute on function public.register_camp_member(text,text,text,text,text) to anon, authenticated;

alter table public.members enable row level security;
alter table public.member_private enable row level security;
alter table public.fixtures enable row level security;
alter table public.site_settings enable row level security;
alter table public.admin_users enable row level security;

-- Public visitors can view public member cards, fixtures and public website settings.
drop policy if exists "Public can view members" on public.members;
create policy "Public can view members" on public.members for select to anon, authenticated using (true);
drop policy if exists "Admins manage members" on public.members;
create policy "Admins manage members" on public.members for all to authenticated using (public.is_camp_admin()) with check (public.is_camp_admin());

-- Private registration details are never publicly readable.
drop policy if exists "Admins read private registration details" on public.member_private;
create policy "Admins read private registration details" on public.member_private for select to authenticated using (public.is_camp_admin());
drop policy if exists "Admins manage private registration details" on public.member_private;
create policy "Admins manage private registration details" on public.member_private for all to authenticated using (public.is_camp_admin()) with check (public.is_camp_admin());

drop policy if exists "Public can view fixtures" on public.fixtures;
create policy "Public can view fixtures" on public.fixtures for select to anon, authenticated using (true);
drop policy if exists "Admins manage fixtures" on public.fixtures;
create policy "Admins manage fixtures" on public.fixtures for all to authenticated using (public.is_camp_admin()) with check (public.is_camp_admin());

drop policy if exists "Public can view site settings" on public.site_settings;
create policy "Public can view site settings" on public.site_settings for select to anon, authenticated using (true);
drop policy if exists "Admins manage site settings" on public.site_settings;
create policy "Admins manage site settings" on public.site_settings for all to authenticated using (public.is_camp_admin()) with check (public.is_camp_admin());

drop policy if exists "Admins can view admin roster" on public.admin_users;
create policy "Admins can view admin roster" on public.admin_users for select to authenticated using (public.is_camp_admin());

-- Create public image buckets. Uploads are limited to 5 MB by the frontend.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values
 ('member-photos','member-photos',true,5242880,array['image/jpeg','image/png','image/webp']),
 ('site-assets','site-assets',true,5242880,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=true,file_size_limit=5242880,allowed_mime_types=excluded.allowed_mime_types;

-- Anyone can upload a member photo as part of registration.
drop policy if exists "Public uploads member photos" on storage.objects;
create policy "Public uploads member photos" on storage.objects for insert to anon, authenticated
with check (bucket_id='member-photos');

-- Admin-only uploads for site backgrounds and logos.
drop policy if exists "Admins upload site assets" on storage.objects;
create policy "Admins upload site assets" on storage.objects for insert to authenticated
with check (bucket_id='site-assets' and public.is_camp_admin());
drop policy if exists "Admins update site assets" on storage.objects;
create policy "Admins update site assets" on storage.objects for update to authenticated
using (bucket_id in ('site-assets','member-photos') and public.is_camp_admin())
with check (bucket_id in ('site-assets','member-photos') and public.is_camp_admin());
drop policy if exists "Admins delete site assets" on storage.objects;
create policy "Admins delete site assets" on storage.objects for delete to authenticated
using (bucket_id in ('site-assets','member-photos') and public.is_camp_admin());

-- Publicly viewable images in these public buckets.
drop policy if exists "Public can view camp images" on storage.objects;
create policy "Public can view camp images" on storage.objects for select to anon, authenticated
using (bucket_id in ('member-photos','site-assets'));

-- Default content. These values appear if no rows have been saved yet.
insert into public.site_settings(key,value) values
('main','{"hero_title":"LUMS Beginner Camp","hero_subtitle":"CRICKET TEAM","hero_description":"Never played before? Perfect. Learn the game, build confidence and have fun together on the pitch.","about_text":"A welcoming space for LUMS students to learn cricket, develop skills and enjoy the game together.","about_extra":"Our focus is on the basics: batting, bowling, fielding and teamwork. Beginners are welcome, and everyone gets a chance to learn and play.","background_url":"","logo_url":"","overlay_color":"#072a63"}'::jsonb),
('practice','{"days":"Monday, Wednesday, Friday","time":"5:00 PM – 6:30 PM","venue":"LUMS Cricket Ground","bring":"Sports shoes, water, positive attitude","equipment":"Equipment provided for beginners","frequency":3}'::jsonb)
on conflict(key) do nothing;

-- ADMIN SETUP:
-- 1. In Supabase Authentication > Users, create the admin user.
-- 2. Copy that user's UUID.
-- 3. Replace YOUR_AUTH_USER_UUID below, then run this INSERT separately.
-- insert into public.admin_users(user_id) values ('YOUR_AUTH_USER_UUID');
