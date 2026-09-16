-- Official book author: aiecosystemco@gmail.com signs in and opens the author lock.
-- Password is stored as a Better Auth scrypt hash only (never the secret in SQL).
-- Author lock key hash is sha256("aea-academy-v1" + author key).

update academy_settings
set
  contact_email = 'aiecosystemco@gmail.com',
  admin_password_hash = '51bbc90f9fe394eb752c2a092b277b8bd8ba4138b0f32874103937abd2c2ac06',
  updated_at = now()
where id = 1;

update "user"
set
  "email" = 'aiecosystemco@gmail.com',
  "name" = 'Daniel Christopher',
  "emailVerified" = true,
  "updatedAt" = now()
where "id" = 'founder-author'
  and not exists (
    select 1 from "user" other
    where lower(other."email") = 'aiecosystemco@gmail.com'
      and other."id" <> 'founder-author'
  );

insert into "user" ("id", "name", "email", "emailVerified", "createdAt", "updatedAt")
select
  'founder-author',
  'Daniel Christopher',
  'aiecosystemco@gmail.com',
  true,
  now(),
  now()
where not exists (
  select 1 from "user" where lower("email") = 'aiecosystemco@gmail.com'
)
on conflict ("id") do nothing;

-- Set the sign-in password on every credential row for this Gmail.
update "account"
set
  "password" = '9113e70e4c4f1ac81e6c9fdbb818b48a:757532131c03e62c94d60a00733230f816e2f196895ed21f2ecff507c9e04c95190a5cac438ab04a5964e159b8ff806ac5c96e88abefc534d0b19fba05fb18fd',
  "updatedAt" = now()
where "providerId" = 'credential'
  and "userId" in (
    select "id" from "user" where lower("email") = 'aiecosystemco@gmail.com'
  );

insert into "account" (
  "id",
  "accountId",
  "providerId",
  "userId",
  "password",
  "createdAt",
  "updatedAt"
)
select
  'founder-credential',
  u."id",
  'credential',
  u."id",
  '9113e70e4c4f1ac81e6c9fdbb818b48a:757532131c03e62c94d60a00733230f816e2f196895ed21f2ecff507c9e04c95190a5cac438ab04a5964e159b8ff806ac5c96e88abefc534d0b19fba05fb18fd',
  now(),
  now()
from "user" u
where lower(u."email") = 'aiecosystemco@gmail.com'
  and not exists (
    select 1 from "account" a
    where a."userId" = u."id" and a."providerId" = 'credential'
  )
on conflict ("id") do update set
  "password" = excluded."password",
  "userId" = excluded."userId",
  "accountId" = excluded."accountId",
  "updatedAt" = now();

insert into campus_profiles (
  user_id, role, display_name, referral_slug, onboarded
)
select
  u."id",
  'author',
  'Daniel Christopher',
  'aiecosystemco',
  true
from "user" u
where lower(u."email") = 'aiecosystemco@gmail.com'
on conflict (user_id) do update set
  role = 'author',
  onboarded = true,
  display_name = excluded.display_name,
  updated_at = now();

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
