-- Streets of Gains (DogeOS Chikyu testnet) reward attestation backend — Phase 2D.
-- All tables are backend-only: no anon/authenticated grants. Edge functions
-- reach them with the service role. On-chain replay protection remains
-- authoritative; these tables are an additional backend safety layer.

-- ---------------------------------------------------------------------------
-- Wallet ownership challenges (SIWE-style personal_sign proof)
-- ---------------------------------------------------------------------------
CREATE TABLE public.sog_auth_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet text NOT NULL,
  nonce text NOT NULL UNIQUE,
  statement text NOT NULL,
  issued_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX sog_auth_challenges_wallet_idx ON public.sog_auth_challenges (wallet, expires_at DESC);

GRANT ALL ON public.sog_auth_challenges TO service_role;
ALTER TABLE public.sog_auth_challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role manages sog auth challenges"
  ON public.sog_auth_challenges FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- Wallet sessions (opaque bearer token, only its SHA-256 hash is stored)
-- ---------------------------------------------------------------------------
CREATE TABLE public.sog_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash text NOT NULL UNIQUE,
  wallet text NOT NULL,
  issued_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  last_used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX sog_sessions_wallet_idx ON public.sog_sessions (wallet, expires_at DESC);

GRANT ALL ON public.sog_sessions TO service_role;
ALTER TABLE public.sog_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role manages sog sessions"
  ON public.sog_sessions FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- Authorized runs / attestations
--   status: authorized | submitted | confirmed | claimed | rejected
--   reward_amount_wei is stored as numeric(78,0) (uint256 safe)
-- ---------------------------------------------------------------------------
CREATE TABLE public.sog_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet text NOT NULL,
  run_id text NOT NULL,
  client_run_key text,
  score bigint NOT NULL,
  wave integer NOT NULL,
  level integer NOT NULL,
  duration_ms integer NOT NULL DEFAULT 0,
  reward_amount_wei numeric(78, 0) NOT NULL DEFAULT 0,
  chain_nonce numeric(78, 0) NOT NULL,
  deadline bigint NOT NULL,
  attestation_digest text,
  contract_address text NOT NULL,
  chain_id integer NOT NULL,
  status text NOT NULL DEFAULT 'authorized',
  tx_hash text,
  validation_error text,
  epoch_key date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sog_runs_status_chk
    CHECK (status IN ('authorized', 'submitted', 'confirmed', 'claimed', 'rejected')),
  CONSTRAINT sog_runs_score_chk CHECK (score >= 0),
  CONSTRAINT sog_runs_wave_chk CHECK (wave >= 0),
  CONSTRAINT sog_runs_level_chk CHECK (level >= 0),
  CONSTRAINT sog_runs_reward_chk CHECK (reward_amount_wei >= 0)
);

-- Hard replay protection: one authorization per (wallet, runId) and per logical
-- client run key. Enforced by the database, not by application logic alone.
CREATE UNIQUE INDEX sog_runs_wallet_runid_uniq ON public.sog_runs (wallet, run_id);
CREATE UNIQUE INDEX sog_runs_wallet_client_key_uniq
  ON public.sog_runs (wallet, client_run_key) WHERE client_run_key IS NOT NULL;
CREATE INDEX sog_runs_wallet_epoch_idx ON public.sog_runs (wallet, epoch_key);
CREATE INDEX sog_runs_epoch_idx ON public.sog_runs (epoch_key);
CREATE INDEX sog_runs_recent_idx ON public.sog_runs (wallet, created_at DESC);

GRANT ALL ON public.sog_runs TO service_role;
ALTER TABLE public.sog_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role manages sog runs"
  ON public.sog_runs FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TRIGGER sog_runs_touch
  BEFORE UPDATE ON public.sog_runs
  FOR EACH ROW EXECUTE FUNCTION public.bz_touch_updated_at();