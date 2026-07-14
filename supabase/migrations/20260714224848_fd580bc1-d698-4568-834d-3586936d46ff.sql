
-- === Bark Zero: revoke public writes on all Bark Zero tables ===
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'bark_zero_constitution','bark_zero_memories','bark_zero_knowledge',
    'bark_zero_creations','bark_zero_dreams','bark_zero_curiosities',
    'bark_zero_diary','bark_zero_evolution','bark_zero_launch_history'
  ];
  pol record;
BEGIN
  FOREACH t IN ARRAY tables LOOP
    FOR pol IN
      SELECT policyname FROM pg_policies
      WHERE schemaname='public' AND tablename=t
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, t);
    END LOOP;
  END LOOP;
END $$;

-- Re-add SELECT policies (public read) for panels that need it,
-- EXCEPT launch history which is internal-only.
CREATE POLICY "Public read constitution" ON public.bark_zero_constitution FOR SELECT USING (true);
CREATE POLICY "Public read memories"     ON public.bark_zero_memories     FOR SELECT USING (true);
CREATE POLICY "Public read knowledge"    ON public.bark_zero_knowledge    FOR SELECT USING (true);
CREATE POLICY "Public read creations"    ON public.bark_zero_creations    FOR SELECT USING (true);
CREATE POLICY "Public read dreams"       ON public.bark_zero_dreams       FOR SELECT USING (true);
CREATE POLICY "Public read curiosities"  ON public.bark_zero_curiosities  FOR SELECT USING (true);
CREATE POLICY "Public read diary"        ON public.bark_zero_diary        FOR SELECT USING (true);
CREATE POLICY "Public read evolution"    ON public.bark_zero_evolution    FOR SELECT USING (true);

-- Service role only: full access on every Bark Zero table (writes go through edge functions).
CREATE POLICY "Service role manages constitution"   ON public.bark_zero_constitution   FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role manages memories"       ON public.bark_zero_memories       FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role manages knowledge"      ON public.bark_zero_knowledge      FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role manages creations"      ON public.bark_zero_creations      FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role manages dreams"         ON public.bark_zero_dreams         FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role manages curiosities"    ON public.bark_zero_curiosities    FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role manages diary"          ON public.bark_zero_diary          FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role manages evolution"      ON public.bark_zero_evolution      FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role manages launch history" ON public.bark_zero_launch_history FOR ALL TO service_role USING (true) WITH CHECK (true);

-- === Security definer functions: restrict EXECUTE ===
REVOKE EXECUTE ON FUNCTION public.check_and_increment_usage(text, text, integer) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.check_and_increment_usage(text, text, integer) TO service_role;

REVOKE EXECUTE ON FUNCTION public.get_usage_count(text, text) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.get_usage_count(text, text) TO service_role;

REVOKE EXECUTE ON FUNCTION public.is_valid_maze_score(integer, integer) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.is_valid_maze_score(integer, integer) TO service_role;

REVOKE EXECUTE ON FUNCTION public.check_maze_rate_limit(text) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.check_maze_rate_limit(text) TO service_role;

-- get_leaderboard is intentionally called by the client to render the public maze leaderboard.
-- Keep it callable by anon/authenticated but not the broad PUBLIC pseudo-role.
REVOKE EXECUTE ON FUNCTION public.get_leaderboard(integer, integer) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_leaderboard(integer, integer) TO anon, authenticated, service_role;
