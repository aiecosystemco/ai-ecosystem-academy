create table if not exists studio_submissions (
  id serial primary key,
  access_code text not null,
  work_kind text not null,
  title text not null default '',
  body text not null,
  payload text not null default '{}',
  submitted_at timestamptz not null default now(),
  rating integer,
  review text not null default '',
  reviewed_at timestamptz
);

create index if not exists studio_submissions_code_idx
  on studio_submissions (access_code, submitted_at desc);

create index if not exists studio_submissions_unrated_idx
  on studio_submissions (reviewed_at, submitted_at desc);
