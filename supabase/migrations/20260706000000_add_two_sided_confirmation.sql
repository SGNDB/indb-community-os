ALTER TABLE public.community_shares
  ADD COLUMN receiver_confirmed_at timestamptz,
  ADD COLUMN sender_confirmed_at timestamptz;
