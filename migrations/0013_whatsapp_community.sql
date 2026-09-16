-- Official academy WhatsApp community — join link for everyone.
insert into whatsapp_channels (label, url, kind, phone, active)
select
  'Academy community',
  'https://chat.whatsapp.com/CI1z5P8BAWOL2oKsMRueUF',
  'group',
  '',
  true
where not exists (
  select 1 from whatsapp_channels
  where url = 'https://chat.whatsapp.com/CI1z5P8BAWOL2oKsMRueUF'
);
