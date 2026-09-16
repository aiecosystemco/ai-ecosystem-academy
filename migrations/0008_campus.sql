-- Campus accounts: Better Auth identity plus unique-code class portal.

alter table access_codes add column if not exists bound_user_id text not null default '';

alter table replacement_requests add column if not exists user_id text not null default '';

create table if not exists campus_profiles (
  user_id text primary key,
  role text not null default 'student',
  display_name text not null default '',
  referral_slug text not null default '',
  referred_by text not null default '',
  batch text not null default '',
  assigned_batch text not null default '',
  bound_code text not null default '',
  onboarded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists campus_profiles_referral_slug_idx
  on campus_profiles (referral_slug)
  where referral_slug <> '';

create index if not exists campus_profiles_role_idx on campus_profiles (role);
create index if not exists campus_profiles_batch_idx on campus_profiles (batch);
create index if not exists campus_profiles_bound_code_idx on campus_profiles (bound_code);

create table if not exists class_days (
  day_number integer primary key check (day_number >= 1 and day_number <= 30),
  live boolean not null default false,
  live_started_at timestamptz,
  live_by text not null default ''
);

insert into class_days (day_number)
select gs from generate_series(1, 30) as gs
on conflict (day_number) do nothing;

create table if not exists class_messages (
  id serial primary key,
  day_number integer not null,
  user_id text not null,
  author_name text not null default '',
  role text not null default 'student',
  kind text not null default 'text',
  body text not null default '',
  audio_data text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists class_messages_day_idx
  on class_messages (day_number, created_at);

create table if not exists public_posts (
  id serial primary key,
  user_id text not null,
  author_name text not null default '',
  role text not null default 'student',
  day_number integer,
  x_url text not null,
  x_handle text not null default '',
  x_status_id text not null default '',
  caption text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists public_posts_created_idx on public_posts (created_at desc);

create table if not exists post_likes (
  post_id integer not null,
  user_id text not null,
  is_author boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists post_comments (
  id serial primary key,
  post_id integer not null,
  user_id text not null,
  author_name text not null default '',
  body text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists post_comments_post_idx on post_comments (post_id, created_at);

create table if not exists earnings (
  id serial primary key,
  user_id text not null,
  kind text not null default 'referral',
  amount_ngn integer not null default 0,
  amount_usd text not null default '0',
  source_user_id text not null default '',
  note text not null default '',
  created_at timestamptz not null default now()
);

create unique index if not exists earnings_referral_source_idx
  on earnings (kind, source_user_id)
  where kind = 'referral' and source_user_id <> '';

create index if not exists earnings_user_idx on earnings (user_id, created_at desc);

create table if not exists book_ads (
  id serial primary key,
  user_id text not null,
  author_name text not null default '',
  title text not null,
  body text not null default '',
  link text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists book_ads_created_idx on book_ads (created_at desc);

create table if not exists student_ratings (
  tutor_user_id text not null,
  student_user_id text not null,
  score integer not null,
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (tutor_user_id, student_user_id)
);
