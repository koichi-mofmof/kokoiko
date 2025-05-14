CREATE POLICY "Authenticated users can delete their own profile images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'profile_images' AND auth.uid()::text = (storage.foldername(name))[1]);