-- Create the storage bucket for news images
insert into storage.buckets (id, name, public) 
values ('news_images', 'news_images', true);

-- Allow public access to view images
create policy "Public Access" 
on storage.objects for select 
using ( bucket_id = 'news_images' );
