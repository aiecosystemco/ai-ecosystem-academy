-- Skrill is the only published pay rail. Author can add crypto / NFT later.
-- Class AI thread is private per student, per day.

update payment_methods
set active = false, details = '', updated_at = now()
where id in ('paga', 'us-bank', 'usdt-eth', 'tron-usdt', 'bitcoin', 'other', 'author-email');

insert into payment_methods (id, label, network, details, active, sort_order)
values (
  'skrill',
  'Skrill',
  'Card · worldwide',
  'aiecosystemco@gmail.com',
  true,
  1
)
on conflict (id) do update set
  label = excluded.label,
  network = excluded.network,
  details = excluded.details,
  active = true,
  sort_order = 1,
  updated_at = now();

create table if not exists class_ai_messages (
  id serial primary key,
  day_number integer not null,
  user_id text not null,
  role text not null default 'user',
  body text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists class_ai_user_day_idx
  on class_ai_messages (user_id, day_number, created_at);
