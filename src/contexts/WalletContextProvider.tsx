import { FC, ReactNode, useMemo, useCallback, useEffect } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { SolflareWalletAdapter } from "@solana/wallet-adapter-solflare";
import { WalletError } from "@solana/wallet-adapter-base";
import { SOLANA_RPC_URL } from "@/lib/constants";

// Import wallet adapter styles
import "@solana/wallet-adapter-react-ui/styles.css";

interface WalletContextProviderProps {
  children: ReactNode;
}

export const WalletContextProvider: FC<WalletContextProviderProps> = ({
  children,
}) => {
  // Debug: Check if Phantom is available in window
  useEffect(() => {
    const checkWalletAvailability = () => {
      const hasPhantom = typeof window !== 'undefined' && 'phantom' in window;
      const hasSolana = typeof window !== 'undefined' && 'solana' in window;
      const phantomProvider = (window as any)?.phantom?.solana;
      const solanaProvider = (window as any)?.solana;
      
      console.log("🔍 Wallet detection:", {
        hasPhantom,
        hasSolana,
        phantomIsPhantom: phantomProvider?.isPhantom,
        solanaIsPhantom: solanaProvider?.isPhantom,
        userAgent: navigator.userAgent.substring(0, 100),
      });
    };
    
    // Check immediately and after a delay (some wallets inject later)
    checkWalletAvailability();
    const timeout = setTimeout(checkWalletAvailability, 1000);
    return () => clearTimeout(timeout);
  }, []);

  // Initialize wallets - the adapters auto-detect mobile environments
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    []
  );

  // Handle wallet errors
  const onError = useCallback((error: WalletError) => {
    console.error("🔴 Wallet error:", error.name, error.message);
  }, []);

  return (
    <ConnectionProvider endpoint={SOLANA_RPC_URL}>
      <WalletProvider 
        wallets={wallets} 
        autoConnect
        onError={onError}
      >
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};
