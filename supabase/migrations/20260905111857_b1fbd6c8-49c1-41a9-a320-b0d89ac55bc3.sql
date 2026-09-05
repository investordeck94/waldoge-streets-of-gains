CREATE TABLE public.sog_weekly_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet text NOT NULL,
  run_id text NOT NULL,
  client_run_key text NOT NULL,
  score bigint NOT NULL,
  wave integer NOT NULL,
  level integer NOT NULL,
  duration_ms integer NOT NULL DEFAULT 0,
  difficulty integer NOT NULL,
  week_start date NOT NULL,
  status text NOT NULL DEFAULT 'verified',
  verified_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX sog_weekly_runs_wallet_key_uidx
  ON public.sog_weekly_runs (wallet, client_run_key);
CREATE INDEX sog_weekly_runs_rank_idx
  ON public.sog_weekly_runs (week_start, score DESC, verified_at ASC);

GRANT ALL ON public.sog_weekly_runs TO service_role;

ALTER TABLE public.sog_weekly_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages sog weekly runs"
  ON public.sog_weekly_runs FOR ALL TO service_role
  USING (true) WITH CHECK (true);