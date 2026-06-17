
CREATE POLICY "Users read own mission proofs" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'mission-proofs' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users upload own mission proofs" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'mission-proofs' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users update own mission proofs" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'mission-proofs' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own mission proofs" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'mission-proofs' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Tighten the new aggregated function: revoke anon execute (signed-in users only).
REVOKE EXECUTE ON FUNCTION public.get_challenge_progress() FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_challenge_progress() TO authenticated;
