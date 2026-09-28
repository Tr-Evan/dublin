update storage.buckets
set allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'travel-documents';

alter table public.travel_documents
  add constraint travel_documents_images_only_check
  check (mime_type in ('image/jpeg', 'image/png', 'image/webp'))
  not valid;
