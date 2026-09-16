-- Link a payment request to the signed-in student so approve can open class on that account.
-- Skrill Quick Checkout IPN fields (status_url).

alter table payment_requests add column if not exists user_id text not null default '';
alter table payment_requests add column if not exists skrill_status text not null default '';
alter table payment_requests add column if not exists skrill_mb_id text not null default '';

create index if not exists payment_requests_user_idx
  on payment_requests (user_id, created_at desc)
  where user_id <> '';

create index if not exists payment_requests_ref_idx
  on payment_requests (payment_ref);
