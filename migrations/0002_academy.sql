create table if not exists academy_settings (
  id integer primary key check (id = 1),
  locked boolean not null default false,
  paid_access boolean not null default true,
  price_ngn integer not null default 5000,
  price_usd text not null default '3.78',
  admin_password_hash text not null,
  updated_at timestamptz not null default now()
);

insert into academy_settings (id, locked, paid_access, admin_password_hash)
values (1, false, true, '58e8597e896a1fa176abb9eef30c151543b99dcd0ec5d036487dc904d5ac6062')
on conflict (id) do nothing;

create table if not exists access_codes (
  code text primary key,
  status text not null default 'active',
  paid boolean not null default true,
  label text not null default '',
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  use_count integer not null default 0
);

create table if not exists sessions (
  token_hash text primary key,
  role text not null,
  access_code text,
  created_at timestamptz not null default now(),
  last_seen timestamptz not null default now()
);

create table if not exists payment_requests (
  id serial primary key,
  payment_ref text not null,
  note text not null default '',
  status text not null default 'pending',
  issued_code text,
  created_at timestamptz not null default now()
);

create table if not exists progress (
  access_code text not null,
  kind text not null,
  item_key text not null,
  done boolean not null default true,
  payload text not null default '{}',
  updated_at timestamptz not null default now(),
  primary key (access_code, kind, item_key)
);

create table if not exists access_log (
  id serial primary key,
  access_code text,
  event text not null,
  created_at timestamptz not null default now()
);

create index if not exists access_log_created_idx on access_log (created_at desc);
create index if not exists payment_requests_status_idx on payment_requests (status);
