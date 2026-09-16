alter table payment_requests add column if not exists method text not null default '';
alter table payment_requests add column if not exists network text not null default '';

create table if not exists payment_methods (
  id text primary key,
  label text not null,
  network text not null default '',
  details text not null default '',
  active boolean not null default false,
  sort_order integer not null default 10,
  updated_at timestamptz not null default now()
);

insert into payment_methods (id, label, network, details, active, sort_order) values
  ('tron-usdt', 'USDT on TRON', 'TRC-20', '', false, 1),
  ('usdt-eth', 'USDT / USDC on Ethereum', 'ERC-20', '', false, 2),
  ('bitcoin', 'Bitcoin', 'BTC', '', false, 3),
  ('paga', 'Paga', 'NGN', '', false, 4),
  ('us-bank', 'US bank transfer', 'USD', '', false, 5),
  ('other', 'Other crypto or rail', '', '', false, 6)
on conflict (id) do nothing;

create table if not exists content_overrides (
  example_key text primary key,
  slug text not null,
  title text not null default '',
  body text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists chapter_work (
  id serial primary key,
  access_code text not null,
  slug text not null,
  title text not null default '',
  tool text not null default '',
  work_kind text not null default 'image',
  prompt_text text not null default '',
  notes text not null default '',
  image_data text not null default '',
  example_key text not null default '',
  submitted_at timestamptz not null default now(),
  rating integer,
  review text not null default '',
  reviewed_at timestamptz
);

create index if not exists chapter_work_code_idx
  on chapter_work (access_code, slug, submitted_at desc);

create index if not exists chapter_work_unrated_idx
  on chapter_work (reviewed_at, submitted_at desc);

create index if not exists content_overrides_slug_idx
  on content_overrides (slug);
