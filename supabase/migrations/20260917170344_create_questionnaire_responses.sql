create table public.questionnaire_responses (
  id uuid primary key default gen_random_uuid(),
  nickname text not null check (nickname like 'DEMO-REQ-001-20260918-01%'),
  organization text not null check (organization like 'DEMO-REQ-001-20260918-01%'),
  profession text not null check (profession like 'DEMO-REQ-001-20260918-01%'),
  job_title text not null check (job_title like 'DEMO-REQ-001-20260918-01%'),
  created_at timestamptz not null default now()
);

alter table public.questionnaire_responses enable row level security;

revoke all on table public.questionnaire_responses from anon, authenticated;
