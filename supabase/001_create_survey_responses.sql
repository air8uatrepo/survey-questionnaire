create table if not exists public.survey_responses (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 100),
  phone text not null check (char_length(phone) between 6 and 30),
  address text not null check (char_length(address) between 1 and 300),
  nickname text not null check (char_length(nickname) between 1 and 100),
  created_at timestamptz not null default now()
);

alter table public.survey_responses enable row level security;
revoke all on table public.survey_responses from anon, authenticated;
