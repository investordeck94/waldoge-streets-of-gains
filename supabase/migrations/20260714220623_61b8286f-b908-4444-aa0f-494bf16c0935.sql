
CREATE TABLE public.bark_zero_launch_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_name text NOT NULL,
  ticker text NOT NULL,
  brief text,
  proposal jsonb NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  mint_address text,
  request_id text,
  signature text,
  narrative_score integer,
  launch_score integer,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bark_zero_launch_history TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bark_zero_launch_history TO anon;
GRANT ALL ON public.bark_zero_launch_history TO service_role;

ALTER TABLE public.bark_zero_launch_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read launch history"   ON public.bark_zero_launch_history FOR SELECT USING (true);
CREATE POLICY "Public insert launch history" ON public.bark_zero_launch_history FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update launch history" ON public.bark_zero_launch_history FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete launch history" ON public.bark_zero_launch_history FOR DELETE USING (true);

CREATE INDEX idx_bz_launch_history_created ON public.bark_zero_launch_history (created_at DESC);
CREATE INDEX idx_bz_launch_history_status  ON public.bark_zero_launch_history (status);

CREATE TRIGGER bz_launch_history_touch
BEFORE UPDATE ON public.bark_zero_launch_history
FOR EACH ROW EXECUTE FUNCTION public.bz_touch_updated_at();
