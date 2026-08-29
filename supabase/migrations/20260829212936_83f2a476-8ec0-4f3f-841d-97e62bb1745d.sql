CREATE TABLE public.twaldoge_faucet_claims (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet TEXT NOT NULL,
  amount_wei TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','success','failed')),
  tx_hash TEXT,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Backend-only table: the faucet edge function uses the service role.
GRANT ALL ON public.twaldoge_faucet_claims TO service_role;

ALTER TABLE public.twaldoge_faucet_claims ENABLE ROW LEVEL SECURITY;

-- Concurrency guard: at most one in-flight claim per wallet.
CREATE UNIQUE INDEX twaldoge_faucet_claims_one_pending_per_wallet
  ON public.twaldoge_faucet_claims (wallet)
  WHERE status = 'pending';

CREATE INDEX twaldoge_faucet_claims_wallet_created_idx
  ON public.twaldoge_faucet_claims (wallet, created_at DESC);