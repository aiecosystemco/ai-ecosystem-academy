-- Profile photo + phone on every campus account.
-- Phone occupancy: newest phone stays, older phones are logged out (code stays active).
-- Author WhatsApp / community links.

alter table campus_profiles add column if not exists phone text not null default '';
alter table campus_profiles add column if not exists avatar text not null default '';

alter table code_seats add column if not exists status text not null default 'active';

create table if not exists whatsapp_channels (
  id serial primary key,
  label text not null default '',
  url text not null default '',
  kind text not null default 'link',
  phone text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists whatsapp_messages (
  id serial primary key,
  channel_id integer not null,
  user_id text not null,
  body text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists whatsapp_messages_channel_idx
  on whatsapp_messages (channel_id, created_at desc);
