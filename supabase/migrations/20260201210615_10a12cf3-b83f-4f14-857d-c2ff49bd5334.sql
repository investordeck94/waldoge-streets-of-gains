-- Drop the overly permissive SELECT policy that exposes all wallet activity
DROP POLICY IF EXISTS "Users can view their own usage" ON public.wallet_usage;

-- Create a restrictive policy - only service role can read wallet usage data
-- Edge functions use service role to check/increment usage, so this is sufficient
CREATE POLICY "Only service role can read usage data" 
ON public.wallet_usage 
FOR SELECT 
USING (auth.role() = 'service_role');

-- Note: The existing "Service role can manage usage" policy already covers INSERT/UPDATE/DELETE
-- This ensures wallet activity data is only accessible through our edge functions