alter table academy_settings add column if not exists contact_email text not null default '';
alter table academy_settings add column if not exists share_guard boolean not null default true;

alter table access_codes add column if not exists revoked_reason text not null default '';
alter table access_codes add column if not exists replaced_by text not null default '';

alter table sessions add column if not exists device_id text not null default '';
alter table sessions add column if not exists device_kind text not null default '';
alter table sessions add column if not exists ua_hash text not null default '';

create table if not exists code_seats (
  access_code text not null,
  device_id text not null,
  device_kind text not null default '',
  time_zone text not null default '',
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  primary key (access_code, device_id)
);

create index if not exists code_seats_code_idx on code_seats (access_code, last_seen desc);

create table if not exists share_incidents (
  id serial primary key,
  access_code text not null,
  public_token text not null unique,
  reason text not null default 'second_person',
  device_a text not null default '',
  device_b text not null default '',
  created_at timestamptz not null default now(),
  replacement_code text not null default '',
  status text not null default 'open'
);

create index if not exists share_incidents_status_idx on share_incidents (status, created_at desc);

create table if not exists replacement_requests (
  id serial primary key,
  incident_token text not null default '',
  student_name text not null default '',
  student_email text not null default '',
  note text not null default '',
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create index if not exists replacement_requests_status_idx
  on replacement_requests (status, created_at desc);
