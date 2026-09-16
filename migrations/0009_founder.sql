-- Official founder email and author lock key (hash only — never store the secret in SQL).
-- Hash is sha256("aea-academy-v1" + author key).

update academy_settings
set
  contact_email = 'aiecosystemco@gmail.com',
  admin_password_hash = '51bbc90f9fe394eb752c2a092b277b8bd8ba4138b0f32874103937abd2c2ac06',
  updated_at = now()
where id = 1;

insert into payment_methods (id, label, network, details, active, sort_order)
values (
  'author-email',
  'Email the author',
  'Email',
  'aiecosystemco@gmail.com',
  true,
  30
)
on conflict (id) do update set
  label = excluded.label,
  network = excluded.network,
  details = excluded.details,
  active = true,
  updated_at = now();
