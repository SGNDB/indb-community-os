DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = 'fadla_request_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.fadla_request_messages;
  END IF;
END
$$;
