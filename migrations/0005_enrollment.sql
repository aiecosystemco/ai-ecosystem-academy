alter table payment_requests add column if not exists student_name text not null default '';
alter table payment_requests add column if not exists phone text not null default '';
alter table payment_requests add column if not exists x_handle text not null default '';
alter table payment_requests add column if not exists batch text not null default '';

-- Author-published rails. ETH address is copied exactly from the wallet screenshot
-- (Ethereum / ERC-20 only — never reuse this address on TRON).
update payment_methods
set
  label = 'USDT on Ethereum',
  network = 'ERC-20',
  details = '0x303bd57330745db5ecff2dfeab98aee6de1b4270',
  active = true,
  sort_order = 1,
  updated_at = now()
where id = 'usdt-eth';

update payment_methods
set
  label = 'Paga',
  network = 'NGN',
  details = E'Account name: Christopher Daniel\nBank: PAGA\nAccount number: 3282834831',
  active = true,
  sort_order = 2,
  updated_at = now()
where id = 'paga';

update payment_methods
set
  label = 'US bank transfer',
  network = 'USD',
  details = E'Account name: Christopher Daniel\nBank: Lead Bank\nAccount number: 218382491446\nRouting number: 101019644\nAccount type: Personal Checking\nBank address: 9450 Southwest Gemini Drive, Beaverton, OR, 97008, USA',
  active = true,
  sort_order = 3,
  updated_at = now()
where id = 'us-bank';

-- No TRC-20 address was provided. Do not publish the Ethereum address on TRON.
update payment_methods
set active = false, updated_at = now()
where id in ('tron-usdt', 'bitcoin', 'other');
