-- Server-issued run lifecycle (H-1) --------------------------------------
CREATE TABLE public.sog_run_starts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id text NOT NULL UNIQUE,
  wallet text NOT NULL,
  session_id uuid,
  difficulty integer NOT NULL,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL,
  consumed_at timestamp with time zone,
  status text NOT NULL DEFAULT 'open',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT ALL ON public.sog_run_starts TO service_role;
ALTER TABLE public.sog_run_starts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role manages sog run starts"
  ON public.sog_run_starts FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE INDEX sog_run_starts_wallet_idx ON public.sog_run_starts (wallet, created_at DESC);
CREATE INDEX sog_run_starts_expiry_idx ON public.sog_run_starts (expires_at);

-- Weekly settlement ledger (M-1) -----------------------------------------
CREATE TABLE public.sog_weekly_settlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start date NOT NULL UNIQUE,
  winner_wallet text NOT NULL,
  winner_score bigint NOT NULL,
  winner_run_id text,
  prize_wei numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending_payout',
  tx_hash text,
  tx_verified_at timestamp with time zone,
  settled_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT ALL ON public.sog_weekly_settlements TO service_role;
ALTER TABLE public.sog_weekly_settlements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role manages sog weekly settlements"
  ON public.sog_weekly_settlements FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE TRIGGER sog_weekly_settlements_touch
  BEFORE UPDATE ON public.sog_weekly_settlements
  FOR EACH ROW EXECUTE FUNCTION public.bz_touch_updated_at();

-- Atomic rate limiting (M-2) ---------------------------------------------
CREATE TABLE public.sog_rate_events (
  id bigserial PRIMARY KEY,
  bucket text NOT NULL,
  subject text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT ALL ON public.sog_rate_events TO service_role;
ALTER TABLE public.sog_rate_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role manages sog rate events"
  ON public.sog_rate_events FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE INDEX sog_rate_events_lookup_idx ON public.sog_rate_events (bucket, subject, created_at DESC);

CREATE OR REPLACE FUNCTION public.sog_consume_rate_limit(
  p_bucket text, p_subject text, p_limit integer, p_window_seconds integer
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE used integer;
BEGIN
  IF p_limit <= 0 THEN RETURN false; END IF;
  -- Serialize all concurrent checks for this (bucket, subject) in this tx.
  PERFORM pg_advisory_xact_lock(hashtextextended(p_bucket || ':' || p_subject, 0));
  SELECT count(*) INTO used FROM sog_rate_events
   WHERE bucket = p_bucket AND subject = p_subject
     AND created_at > now() - make_interval(secs => p_window_seconds);
  IF used >= p_limit THEN RETURN false; END IF;
  INSERT INTO sog_rate_events (bucket, subject) VALUES (p_bucket, p_subject);
  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.sog_consume_rate_limit(text, text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sog_consume_rate_limit(text, text, integer, integer) TO service_role;

-- Expiry / growth control (M-5) ------------------------------------------
CREATE OR REPLACE FUNCTION public.sog_purge_expired()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM sog_auth_challenges WHERE expires_at < now() - interval '1 day';
  DELETE FROM sog_sessions WHERE expires_at < now() - interval '7 days';
  DELETE FROM sog_run_starts WHERE expires_at < now() - interval '7 days' AND consumed_at IS NULL;
  DELETE FROM sog_rate_events WHERE created_at < now() - interval '1 day';
END;
$$;
REVOKE ALL ON FUNCTION public.sog_purge_expired() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sog_purge_expired() TO service_role;

-- Run identity uniqueness (H-2) ------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS sog_runs_wallet_key_uidx ON public.sog_runs (wallet, client_run_key);
CREATE UNIQUE INDEX IF NOT EXISTS sog_weekly_runs_runid_uidx ON public.sog_weekly_runs (run_id);