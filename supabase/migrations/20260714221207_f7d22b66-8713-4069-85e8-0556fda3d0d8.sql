
CREATE TABLE public.bark_zero_market_intel (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL CHECK (category IN ('ai','dogeos','anoncoin','meme','x')),
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  source TEXT,
  scores JSONB NOT NULL DEFAULT '{}'::jsonb,
  composite INTEGER NOT NULL DEFAULT 0,
  rank INTEGER,
  bark_take TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  scanned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (category, slug)
);

CREATE INDEX idx_bz_market_intel_active_composite
  ON public.bark_zero_market_intel (is_active, composite DESC);
CREATE INDEX idx_bz_market_intel_category_rank
  ON public.bark_zero_market_intel (category, rank);

GRANT SELECT ON public.bark_zero_market_intel TO anon, authenticated;
GRANT ALL ON public.bark_zero_market_intel TO service_role;

ALTER TABLE public.bark_zero_market_intel ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read market intel"
  ON public.bark_zero_market_intel FOR SELECT
  USING (true);

CREATE POLICY "Service role manages market intel"
  ON public.bark_zero_market_intel FOR ALL
  TO service_role USING (true) WITH CHECK (true);

CREATE TRIGGER bz_market_intel_touch
  BEFORE UPDATE ON public.bark_zero_market_intel
  FOR EACH ROW EXECUTE FUNCTION public.bz_touch_updated_at();
