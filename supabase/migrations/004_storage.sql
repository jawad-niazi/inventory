-- Supabase Storage bucket for product images
-- Run in Supabase SQL editor after creating the bucket in Dashboard (Storage > New bucket: product-images, public)

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- Allow public read; writes go through server service role
create policy "product_images_public_read"
  on storage.objects for select
  using (bucket_id = 'product-images');
