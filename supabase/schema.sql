-- Docs app schema. Paste into Supabase → SQL Editor → Run. Safe to re-run.
--
-- Access model: RLS is ENABLED on every table with NO policies, so the browser (publishable key)
-- can't read or write any rows. All data access goes through the Express API, which uses the
-- secret key and enforces permissions in server/lib/access.js.

-- ── profiles: one row per auth user (public info we can join on) ─────────────
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text not null unique,
  name       text not null,
  created_at timestamptz not null default now()
);

-- Auto-create a profile whenever a Supabase auth user is created (seed script, dashboard, etc.)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    lower(new.email),
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── documents ────────────────────────────────────────────────────────────────
create table if not exists public.documents (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references public.profiles (id) on delete cascade,
  title      text not null default 'Untitled document'
             check (char_length(title) between 1 and 200),
  -- Tiptap/ProseMirror JSON document. Storing structure (not HTML) preserves formatting exactly.
  content    jsonb not null default '{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists documents_owner_idx on public.documents (owner_id, updated_at desc);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists documents_touch_updated_at on public.documents;
create trigger documents_touch_updated_at
  before update on public.documents
  for each row execute function public.touch_updated_at();

-- ── document_shares: who else can access a document, and how ─────────────────
create table if not exists public.document_shares (
  document_id uuid not null references public.documents (id) on delete cascade,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  role        text not null check (role in ('viewer', 'editor')),
  created_at  timestamptz not null default now(),
  primary key (document_id, user_id)
);

create index if not exists document_shares_user_idx on public.document_shares (user_id);

-- ── Lock down direct access from the browser ─────────────────────────────────
alter table public.profiles        enable row level security;
alter table public.documents       enable row level security;
alter table public.document_shares enable row level security;
