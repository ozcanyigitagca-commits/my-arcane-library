-- My Arcane Library v8 / Supabase
-- Supabase Dashboard > SQL Editor içine yapıştırıp çalıştır.
create table if not exists public.books (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  author text default '',
  pages integer not null default 1,
  read integer not null default 0,
  category text not null default 'Roman',
  status text not null default 'unread',
  rating numeric not null default 0,
  cover text default '',
  notes text default '',
  fav boolean not null default false,
  history jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.books enable row level security;

drop policy if exists "books_select_own" on public.books;
create policy "books_select_own" on public.books for select using (auth.uid() = user_id);

drop policy if exists "books_insert_own" on public.books;
create policy "books_insert_own" on public.books for insert with check (auth.uid() = user_id);

drop policy if exists "books_update_own" on public.books;
create policy "books_update_own" on public.books for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "books_delete_own" on public.books;
create policy "books_delete_own" on public.books for delete using (auth.uid() = user_id);

create index if not exists books_user_id_idx on public.books(user_id);
create index if not exists books_updated_idx on public.books(updated_at desc);
