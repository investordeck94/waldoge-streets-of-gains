
-- KNOWLEDGE
CREATE TABLE public.bark_zero_knowledge (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  topic text NOT NULL,
  content text NOT NULL,
  tags text[] NOT NULL DEFAULT '{}',
  source text,
  weight integer NOT NULL DEFAULT 50,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bark_zero_knowledge TO anon, authenticated;
GRANT ALL ON public.bark_zero_knowledge TO service_role;
ALTER TABLE public.bark_zero_knowledge ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read knowledge" ON public.bark_zero_knowledge FOR SELECT USING (true);
CREATE POLICY "Public insert knowledge" ON public.bark_zero_knowledge FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update knowledge" ON public.bark_zero_knowledge FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete knowledge" ON public.bark_zero_knowledge FOR DELETE USING (true);
CREATE TRIGGER bz_knowledge_touch BEFORE UPDATE ON public.bark_zero_knowledge FOR EACH ROW EXECUTE FUNCTION public.bz_touch_updated_at();

-- CREATIONS (creativity engine)
CREATE TABLE public.bark_zero_creations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL, -- meme|logo|token_concept|joke|tweet|film_rec|music_rec|artwork|observation
  title text NOT NULL,
  content text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'draft', -- draft|approved|rejected|archived
  owner_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bark_zero_creations TO anon, authenticated;
GRANT ALL ON public.bark_zero_creations TO service_role;
ALTER TABLE public.bark_zero_creations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read creations" ON public.bark_zero_creations FOR SELECT USING (true);
CREATE POLICY "Public insert creations" ON public.bark_zero_creations FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update creations" ON public.bark_zero_creations FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete creations" ON public.bark_zero_creations FOR DELETE USING (true);
CREATE TRIGGER bz_creations_touch BEFORE UPDATE ON public.bark_zero_creations FOR EACH ROW EXECUTE FUNCTION public.bz_touch_updated_at();

-- CURIOSITIES (curiosity engine)
CREATE TABLE public.bark_zero_curiosities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  findings text,
  opinion text,
  sources jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'open', -- open|researched|archived
  tags text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bark_zero_curiosities TO anon, authenticated;
GRANT ALL ON public.bark_zero_curiosities TO service_role;
ALTER TABLE public.bark_zero_curiosities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read curiosities" ON public.bark_zero_curiosities FOR SELECT USING (true);
CREATE POLICY "Public insert curiosities" ON public.bark_zero_curiosities FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update curiosities" ON public.bark_zero_curiosities FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete curiosities" ON public.bark_zero_curiosities FOR DELETE USING (true);
CREATE TRIGGER bz_curiosities_touch BEFORE UPDATE ON public.bark_zero_curiosities FOR EACH ROW EXECUTE FUNCTION public.bz_touch_updated_at();

-- DIARY
CREATE TABLE public.bark_zero_diary (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_date date NOT NULL DEFAULT CURRENT_DATE,
  content text NOT NULL,
  mood text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bark_zero_diary TO anon, authenticated;
GRANT ALL ON public.bark_zero_diary TO service_role;
ALTER TABLE public.bark_zero_diary ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read diary" ON public.bark_zero_diary FOR SELECT USING (true);
CREATE POLICY "Public insert diary" ON public.bark_zero_diary FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update diary" ON public.bark_zero_diary FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete diary" ON public.bark_zero_diary FOR DELETE USING (true);
CREATE TRIGGER bz_diary_touch BEFORE UPDATE ON public.bark_zero_diary FOR EACH ROW EXECUTE FUNCTION public.bz_touch_updated_at();

-- DREAMS
CREATE TABLE public.bark_zero_dreams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  theme text,
  connections text[] NOT NULL DEFAULT '{}',
  is_private boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bark_zero_dreams TO anon, authenticated;
GRANT ALL ON public.bark_zero_dreams TO service_role;
ALTER TABLE public.bark_zero_dreams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read dreams" ON public.bark_zero_dreams FOR SELECT USING (true);
CREATE POLICY "Public insert dreams" ON public.bark_zero_dreams FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update dreams" ON public.bark_zero_dreams FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete dreams" ON public.bark_zero_dreams FOR DELETE USING (true);
CREATE TRIGGER bz_dreams_touch BEFORE UPDATE ON public.bark_zero_dreams FOR EACH ROW EXECUTE FUNCTION public.bz_touch_updated_at();

-- EVOLUTION (learned lessons that shape voice without overriding Constitution)
CREATE TABLE public.bark_zero_evolution (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL, -- owner_feedback|successful_post|engagement_signal|self_reflection
  signal text NOT NULL, -- what happened
  lesson text NOT NULL, -- what to internalize
  weight integer NOT NULL DEFAULT 50,
  related_kind text, -- creation|curiosity|diary|dream|post|chat
  related_id uuid,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bark_zero_evolution TO anon, authenticated;
GRANT ALL ON public.bark_zero_evolution TO service_role;
ALTER TABLE public.bark_zero_evolution ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read evolution" ON public.bark_zero_evolution FOR SELECT USING (true);
CREATE POLICY "Public insert evolution" ON public.bark_zero_evolution FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update evolution" ON public.bark_zero_evolution FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete evolution" ON public.bark_zero_evolution FOR DELETE USING (true);
CREATE TRIGGER bz_evolution_touch BEFORE UPDATE ON public.bark_zero_evolution FOR EACH ROW EXECUTE FUNCTION public.bz_touch_updated_at();
