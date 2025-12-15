-- Add superadmin support and site-wide settings
begin;

-- Add is_superadmin column to users table
alter table public.users add column if not exists is_superadmin boolean not null default false;

-- Create site_settings table for dynamic configuration
create table if not exists public.site_settings (
  key text primary key,
  value text not null,
  description text,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.users(id)
);

-- Enable RLS on site_settings
alter table public.site_settings enable row level security;

-- Anyone can read settings (needed for Edge Function and client)
drop policy if exists "site_settings_read_all" on public.site_settings;
create policy "site_settings_read_all" on public.site_settings
  for select using (true);

-- Only superadmins can modify settings
drop policy if exists "site_settings_superadmin_modify" on public.site_settings;
create policy "site_settings_superadmin_modify" on public.site_settings
  for all using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.is_superadmin = true
    )
  );

-- Insert default settings
insert into public.site_settings (key, value, description) values
  ('gemini_model', 'models/gemini-2.5-flash', 'Gemini model to use for verification'),
  ('verify_per_minute', '6', 'Max verifications per user per minute'),
  ('verify_per_hour', '60', 'Max verifications per user per hour'),
  ('verify_global_per_minute', '30', 'Max verifications globally per minute'),
  ('verify_global_per_hour', '240', 'Max verifications globally per hour')
on conflict (key) do nothing;

-- Function to check if user is superadmin
create or replace function public.is_superadmin()
returns boolean
language sql
security definer
stable
as $$
  select coalesce(
    (select is_superadmin from public.users where id = auth.uid()),
    false
  );
$$;

-- Function to promote user to superadmin (only callable by existing superadmin)
create or replace function public.set_superadmin(target_user_id uuid, make_superadmin boolean)
returns void
language plpgsql
security definer
as $$
begin
  -- Check if caller is superadmin
  if not exists (select 1 from public.users where id = auth.uid() and is_superadmin = true) then
    raise exception 'Only superadmins can modify superadmin status' using errcode = '42501';
  end if;

  -- Update target user
  update public.users
  set is_superadmin = make_superadmin
  where id = target_user_id;

  -- Log the action
  insert into public.audit_log (actor_id, action, target_id, details)
  values (auth.uid(), 'superadmin.set', target_user_id, jsonb_build_object('is_superadmin', make_superadmin));
end;
$$;

-- Function to update a site setting (only callable by superadmin)
create or replace function public.update_site_setting(setting_key text, setting_value text)
returns void
language plpgsql
security definer
as $$
begin
  -- Check if caller is superadmin
  if not exists (select 1 from public.users where id = auth.uid() and is_superadmin = true) then
    raise exception 'Only superadmins can modify site settings' using errcode = '42501';
  end if;

  -- Update or insert setting
  insert into public.site_settings (key, value, updated_at, updated_by)
  values (setting_key, setting_value, now(), auth.uid())
  on conflict (key) do update set
    value = excluded.value,
    updated_at = excluded.updated_at,
    updated_by = excluded.updated_by;

  -- Log the action
  insert into public.audit_log (actor_id, action, target_id, details)
  values (auth.uid(), 'setting.update', null, jsonb_build_object('key', setting_key, 'value', setting_value));
end;
$$;

-- Create index for superadmin lookups
create index if not exists users_superadmin_idx on public.users (is_superadmin) where is_superadmin = true;

commit;
