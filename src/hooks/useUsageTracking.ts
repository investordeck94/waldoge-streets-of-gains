import { useState, useEffect, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { z } from "zod";
import { USAGE_LIMITS } from "@/lib/constants";
import { UserTier } from "./useWaldogeBalance";

// Zod schemas for localStorage validation
const DailyUsageSchema = z.object({
  chat: z.number().int().min(0).max(10000),
  raidGenerator: z.number().int().min(0).max(10000),
  memeGenerator: z.number().int().min(0).max(10000),
  nftCreator: z.number().int().min(0).max(10000),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

type DailyUsage = z.infer<typeof DailyUsageSchema>;

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

/**
 * Safely parse and validate JSON from localStorage
 */
const safeParseUsage = (data: string | null): DailyUsage | null => {
  if (!data) return null;
  
  try {
    const parsed = JSON.parse(data);
    const validated = DailyUsageSchema.safeParse(parsed);
    
    if (validated.success) {
      return validated.data;
    }
    console.warn("Invalid usage data in localStorage, resetting");
    return null;
  } catch (error) {
    console.warn("Failed to parse usage data from localStorage, resetting");
    return null;
  }
};

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
    const parsed = safeParseUsage(storedUsage);

    if (parsed) {
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
const ChatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().max(50000),
  timestamp: z.number().int().min(0),
});

const ChatHistorySchema = z.array(ChatMessageSchema).max(100);

type ChatMessage = z.infer<typeof ChatMessageSchema>;

/**
 * Safely parse and validate chat history from localStorage
 */
const safeParseChatHistory = (data: string | null): ChatMessage[] => {
  if (!data) return [];
  
  try {
    const parsed = JSON.parse(data);
    const validated = ChatHistorySchema.safeParse(parsed);
    
    if (validated.success) {
      return validated.data;
    }
    console.warn("Invalid chat history in localStorage, resetting");
    return [];
  } catch (error) {
    console.warn("Failed to parse chat history from localStorage, resetting");
    return [];
  }
};

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
    setMessages(safeParseChatHistory(stored));
  }, [publicKey]);

  const addMessage = useCallback(
    (role: "user" | "assistant", content: string) => {
      if (!publicKey) return;

      const newMessage: ChatMessage = {
        role,
        content,
        timestamp: Date.now(),
      };

      setMessages(prev => {
        const newMessages = [...prev, newMessage].slice(-50);
        const chatKey = getChatHistoryKey(publicKey.toString());
        localStorage.setItem(chatKey, JSON.stringify(newMessages));
        return newMessages;
      });
    },
    [publicKey]
  );

  const updateLastMessage = useCallback(
    (content: string) => {
      if (!publicKey) return;

      setMessages(prev => {
        if (prev.length === 0) return prev;
        
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          content,
        };
        
        const chatKey = getChatHistoryKey(publicKey.toString());
        localStorage.setItem(chatKey, JSON.stringify(updated));
        return updated;
      });
    },
    [publicKey]
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
    updateLastMessage,
    clearMessages,
  };
};
