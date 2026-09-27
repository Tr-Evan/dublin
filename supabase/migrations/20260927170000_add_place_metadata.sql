alter table public.places
  add column if not exists official_website text,
  add column if not exists booking_link text,
  add column if not exists price_range text,
  add column if not exists transport_details jsonb;
