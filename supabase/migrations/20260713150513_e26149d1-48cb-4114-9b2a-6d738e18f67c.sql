
CREATE TABLE public.bark_zero_constitution (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section TEXT NOT NULL,
  content TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 100,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bark_zero_constitution TO anon, authenticated;
GRANT ALL ON public.bark_zero_constitution TO service_role;
ALTER TABLE public.bark_zero_constitution ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read constitution" ON public.bark_zero_constitution FOR SELECT USING (true);
CREATE POLICY "Public insert constitution" ON public.bark_zero_constitution FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update constitution" ON public.bark_zero_constitution FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete constitution" ON public.bark_zero_constitution FOR DELETE USING (true);

CREATE TABLE public.bark_zero_memories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  weight INTEGER NOT NULL DEFAULT 50,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bark_zero_memories TO anon, authenticated;
GRANT ALL ON public.bark_zero_memories TO service_role;
ALTER TABLE public.bark_zero_memories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read memories" ON public.bark_zero_memories FOR SELECT USING (true);
CREATE POLICY "Public insert memories" ON public.bark_zero_memories FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update memories" ON public.bark_zero_memories FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete memories" ON public.bark_zero_memories FOR DELETE USING (true);

CREATE INDEX idx_bz_constitution_active_priority ON public.bark_zero_constitution(is_active, priority DESC);
CREATE INDEX idx_bz_memories_active_weight ON public.bark_zero_memories(is_active, weight DESC);
CREATE INDEX idx_bz_memories_category ON public.bark_zero_memories(category);

CREATE OR REPLACE FUNCTION public.bz_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER bz_constitution_touch BEFORE UPDATE ON public.bark_zero_constitution
  FOR EACH ROW EXECUTE FUNCTION public.bz_touch_updated_at();
CREATE TRIGGER bz_memories_touch BEFORE UPDATE ON public.bark_zero_memories
  FOR EACH ROW EXECUTE FUNCTION public.bz_touch_updated_at();
