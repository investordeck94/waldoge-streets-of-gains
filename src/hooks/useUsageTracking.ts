import { useState, useEffect, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { USAGE_LIMITS } from "@/lib/constants";
import { UserTier } from "./useWaldogeBalance";

interface DailyUsage {
  chat: number;
  raidGenerator: number;
  memeGenerator: number;
  nftCreator: number;
  date: string;
}

interface UsageTrackingState {
  usage: DailyUsage;
  canUse: (feature: keyof Omit<DailyUsage, "date">) => boolean;
  getRemainingUses: (feature: keyof Omit<DailyUsage, "date">) => number;
  incrementUsage: (feature: keyof Omit<DailyUsage, "date">) => void;
  clearHistory: () => void;
}

const getStorageKey = (walletAddress: string) => `waldoge_usage_${walletAddress}`;
const getChatHistoryKey = (walletAddress: string) => `waldoge_chat_${walletAddress}`;

const getTodayString = () => new Date().toISOString().split("T")[0];

const getDefaultUsage = (): DailyUsage => ({
  chat: 0,
  raidGenerator: 0,
  memeGenerator: 0,
  nftCreator: 0,
  date: getTodayString(),
});

export const useUsageTracking = (tier: UserTier): UsageTrackingState => {
  const { publicKey } = useWallet();
  const [usage, setUsage] = useState<DailyUsage>(getDefaultUsage());

  // Load usage from localStorage
  useEffect(() => {
    if (!publicKey) {
      setUsage(getDefaultUsage());
      return;
    }

    const storageKey = getStorageKey(publicKey.toString());
    const storedUsage = localStorage.getItem(storageKey);

    if (storedUsage) {
      const parsed: DailyUsage = JSON.parse(storedUsage);
      
      // Reset if it's a new day
      if (parsed.date !== getTodayString()) {
        const newUsage = getDefaultUsage();
        localStorage.setItem(storageKey, JSON.stringify(newUsage));
        setUsage(newUsage);
      } else {
        setUsage(parsed);
      }
    } else {
      const newUsage = getDefaultUsage();
      localStorage.setItem(storageKey, JSON.stringify(newUsage));
      setUsage(newUsage);
    }
  }, [publicKey]);

  const getLimit = useCallback(
    (feature: keyof Omit<DailyUsage, "date">): number => {
      if (tier === "none" || tier === "preview") {
        return USAGE_LIMITS.TIER_0[feature];
      }
      if (tier === "basic") {
        return USAGE_LIMITS.TIER_1[feature];
      }
      if (tier === "chaos") {
        return USAGE_LIMITS.TIER_2[feature];
      }
      return 0;
    },
    [tier]
  );

  const canUse = useCallback(
    (feature: keyof Omit<DailyUsage, "date">): boolean => {
      const limit = getLimit(feature);
      return usage[feature] < limit;
    },
    [usage, getLimit]
  );

  const getRemainingUses = useCallback(
    (feature: keyof Omit<DailyUsage, "date">): number => {
      const limit = getLimit(feature);
      return Math.max(0, limit - usage[feature]);
    },
    [usage, getLimit]
  );

  const incrementUsage = useCallback(
    (feature: keyof Omit<DailyUsage, "date">) => {
      if (!publicKey) return;

      const storageKey = getStorageKey(publicKey.toString());
      const newUsage = {
        ...usage,
        [feature]: usage[feature] + 1,
        date: getTodayString(),
      };

      localStorage.setItem(storageKey, JSON.stringify(newUsage));
      setUsage(newUsage);
    },
    [publicKey, usage]
  );

  const clearHistory = useCallback(() => {
    if (!publicKey) return;

    const chatKey = getChatHistoryKey(publicKey.toString());
    localStorage.removeItem(chatKey);
    
    // Optionally reset usage too
    const storageKey = getStorageKey(publicKey.toString());
    const newUsage = getDefaultUsage();
    localStorage.setItem(storageKey, JSON.stringify(newUsage));
    setUsage(newUsage);
  }, [publicKey]);

  return {
    usage,
    canUse,
    getRemainingUses,
    incrementUsage,
    clearHistory,
  };
};

// Chat history hook
interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export const useChatHistory = () => {
  const { publicKey } = useWallet();
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    if (!publicKey) {
      setMessages([]);
      return;
    }

    const chatKey = getChatHistoryKey(publicKey.toString());
    const stored = localStorage.getItem(chatKey);
    
    if (stored) {
      setMessages(JSON.parse(stored));
    }
  }, [publicKey]);

  const addMessage = useCallback(
    (role: "user" | "assistant", content: string) => {
      if (!publicKey) return;

      const newMessage: ChatMessage = {
        role,
        content,
        timestamp: Date.now(),
      };

      const newMessages = [...messages, newMessage];
      
      // Keep only last 50 messages
      const trimmedMessages = newMessages.slice(-50);
      
      const chatKey = getChatHistoryKey(publicKey.toString());
      localStorage.setItem(chatKey, JSON.stringify(trimmedMessages));
      setMessages(trimmedMessages);
    },
    [publicKey, messages]
  );

  const clearMessages = useCallback(() => {
    if (!publicKey) return;
    
    const chatKey = getChatHistoryKey(publicKey.toString());
    localStorage.removeItem(chatKey);
    setMessages([]);
  }, [publicKey]);

  return {
    messages,
    addMessage,
    clearMessages,
  };
};
