-- Presence, password recovery, and digital certificates. Class media reuses class_messages.audio_data.

create table if not exists password_recovery (
  id serial primary key,
  user_id text not null,
  email text not null,
  token_hash text not null default '',
  expires_at timestamptz,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists password_recovery_email_idx
  on password_recovery (email, created_at desc);

create unique index if not exists password_recovery_token_idx
  on password_recovery (token_hash)
  where token_hash <> '';

create table if not exists certificates (
  user_id text primary key,
  serial text not null unique,
  display_name text not null,
  issued_at timestamptz not null default now()
);

create index if not exists certificates_serial_idx on certificates (serial);
