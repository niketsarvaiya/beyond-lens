-- ============================================================
-- Beyond Lens — Supabase Schema
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── ENUM TYPES ──────────────────────────────────────────────────────────────
create type user_role as enum ('admin', 'execution');
create type video_status as enum (
  'uploaded', 'ai_reviewed', 'under_review', 'feedback_sent',
  'in_revision', 'approved', 'scheduled', 'live'
);
create type platform as enum ('Instagram', 'LinkedIn');
create type feedback_priority as enum ('must_fix', 'nice_to_improve');
create type feedback_status as enum ('pending', 'in_progress', 'done', 'clarification_needed');
create type taste_rule_source as enum ('inferred', 'explicit');

-- ─── USERS ───────────────────────────────────────────────────────────────────
create table users (
  id          text primary key,        -- e.g. "niket"
  name        text not null,
  role        user_role not null,
  color       text not null default '#6366F1',
  created_at  timestamptz default now()
);

-- ─── CAMPAIGNS ───────────────────────────────────────────────────────────────
create table campaigns (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null unique,
  created_at  timestamptz default now()
);

-- ─── VIDEOS ──────────────────────────────────────────────────────────────────
create table videos (
  id                  uuid primary key default uuid_generate_v4(),
  name                text not null,
  campaign            text not null,
  project             text,
  platform            platform not null,
  status              video_status not null default 'uploaded',
  go_live_date        date,
  uploaded_by         text references users(id),
  current_version     int not null default 1,
  drive_folder        text,
  thumbnail_url       text,
  duration_seconds    int,
  tags                text[] default '{}',
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

-- ─── VIDEO VERSIONS ──────────────────────────────────────────────────────────
create table video_versions (
  id               uuid primary key default uuid_generate_v4(),
  video_id         uuid references videos(id) on delete cascade,
  version          int not null,
  drive_url        text not null,
  thumbnail_url    text,
  uploaded_by      text references users(id),
  uploaded_at      timestamptz default now(),
  size_bytes       bigint,
  duration_seconds int,
  unique (video_id, version)
);

-- ─── AI REVIEWS ──────────────────────────────────────────────────────────────
create table ai_reviews (
  id                uuid primary key default uuid_generate_v4(),
  video_id          uuid references videos(id) on delete cascade,
  video_version     int not null,
  generated_at      timestamptz default now(),
  overall_score     numeric(4,2) not null,
  confidence_score  int not null,
  taste_alignment   int not null,
  summary           text not null,
  model_version     text not null,
  -- Dimension scores stored as JSONB for flexibility
  dimensions        jsonb not null default '{}',
  must_fix          jsonb not null default '[]',
  nice_to_improve   jsonb not null default '[]'
);

-- ─── FEEDBACK ITEMS ──────────────────────────────────────────────────────────
create table feedback_items (
  id           uuid primary key default uuid_generate_v4(),
  video_id     uuid references videos(id) on delete cascade,
  ai_review_id uuid references ai_reviews(id),
  created_by   text references users(id),
  description  text not null,
  timestamp    text,                    -- "0:12"
  priority     feedback_priority not null,
  status       feedback_status not null default 'pending',
  dimension    text,
  is_from_ai   boolean not null default false,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- ─── FEEDBACK REPLIES ────────────────────────────────────────────────────────
create table feedback_replies (
  id           uuid primary key default uuid_generate_v4(),
  feedback_id  uuid references feedback_items(id) on delete cascade,
  author_id    text references users(id),
  message      text not null,
  created_at   timestamptz default now()
);

-- ─── TASTE PROFILE ───────────────────────────────────────────────────────────
create table taste_profiles (
  id                      uuid primary key default uuid_generate_v4(),
  owner_id                text references users(id),
  version                 int not null default 1,
  dimension_weights       jsonb not null default '{}',
  total_feedback_samples  int not null default 0,
  updated_at              timestamptz default now(),
  unique (owner_id, version)
);

create table taste_profile_rules (
  id               uuid primary key default uuid_generate_v4(),
  profile_id       uuid references taste_profiles(id) on delete cascade,
  source           taste_rule_source not null,
  dimension        text not null,
  rule             text not null,
  weight           numeric(4,2) not null default 1.0,
  confidence       int not null default 50,
  examples_count   int not null default 0,
  last_updated     timestamptz default now()
);

-- ─── LEARNING ENTRIES ────────────────────────────────────────────────────────
create table learning_entries (
  id                uuid primary key default uuid_generate_v4(),
  video_id          uuid references videos(id),
  ai_review_id      uuid references ai_reviews(id),
  reviewer_id       text references users(id),
  ai_scores         jsonb not null default '{}',
  human_scores      jsonb not null default '{}',
  delta             jsonb not null default '{}',
  missed_issues     text[] default '{}',
  overemphasized    text[] default '{}',
  human_priorities  text[] default '{}',
  insight           text not null,
  created_at        timestamptz default now()
);

-- ─── SOCIAL METRICS (cached) ─────────────────────────────────────────────────
create table social_metrics (
  id              uuid primary key default uuid_generate_v4(),
  platform        platform not null,
  period          text not null,
  followers       int,
  followers_growth numeric(6,2),
  engagement      int,
  engagement_rate numeric(5,2),
  reach           int,
  impressions     int,
  top_posts       jsonb default '[]',
  fetched_at      timestamptz default now()
);

-- ─── INDEXES ─────────────────────────────────────────────────────────────────
create index idx_videos_status   on videos(status);
create index idx_videos_platform on videos(platform);
create index idx_videos_uploaded_by on videos(uploaded_by);
create index idx_feedback_video  on feedback_items(video_id);
create index idx_feedback_status on feedback_items(status);
create index idx_reviews_video   on ai_reviews(video_id);
create index idx_learning_reviewer on learning_entries(reviewer_id);

-- ─── UPDATED_AT TRIGGER ───────────────────────────────────────────────────────
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger videos_updated_at before update on videos
  for each row execute procedure set_updated_at();

create trigger feedback_updated_at before update on feedback_items
  for each row execute procedure set_updated_at();

-- ─── ROW LEVEL SECURITY ───────────────────────────────────────────────────────
alter table users          enable row level security;
alter table videos         enable row level security;
alter table video_versions enable row level security;
alter table ai_reviews     enable row level security;
alter table feedback_items enable row level security;
alter table feedback_replies enable row level security;
alter table taste_profiles enable row level security;
alter table taste_profile_rules enable row level security;
alter table learning_entries enable row level security;
alter table social_metrics enable row level security;

-- All authenticated users can read videos
create policy "authenticated read videos" on videos
  for select using (auth.role() = 'authenticated');

-- Only admins can see AI reviews
create policy "admin read ai_reviews" on ai_reviews
  for select using (
    (select role from users where id = auth.uid()::text) = 'admin'
  );

-- Execution team can read feedback items for their videos
create policy "read feedback" on feedback_items
  for select using (auth.role() = 'authenticated');

-- Only admins can insert/update AI reviews and taste profiles
create policy "admin write ai_reviews" on ai_reviews
  for all using (
    (select role from users where id = auth.uid()::text) = 'admin'
  );

create policy "admin write taste_profiles" on taste_profiles
  for all using (
    (select role from users where id = auth.uid()::text) = 'admin'
  );
