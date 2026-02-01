import { useState, useEffect, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { z } from "zod";
import { USAGE_LIMITS, FREE_TRIAL_DURATION_MS } from "@/lib/constants";
import { UserTier } from "./useWaldogeBalance";

// Zod schemas for localStorage validation
const DailyUsageSchema = z.object({
  chat: z.number().int().min(0).max(10000),
  raidGenerator: z.number().int().min(0).max(10000),
  memeGenerator: z.number().int().min(0).max(10000),
  nftCreator: z.number().int().min(0).max(10000),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

// Schema for free trial tracking
const FreeTrialSchema = z.object({
  startTime: z.number().int().min(0),
  used: z.boolean(),
});

type DailyUsage = z.infer<typeof DailyUsageSchema>;

type FreeTrial = z.infer<typeof FreeTrialSchema>;

interface UsageTrackingState {
  usage: DailyUsage;
  canUse: (feature: keyof Omit<DailyUsage, "date">) => boolean;
  getRemainingUses: (feature: keyof Omit<DailyUsage, "date">) => number;
  incrementUsage: (feature: keyof Omit<DailyUsage, "date">) => void;
  clearHistory: () => void;
  isInFreeTrial: boolean;
  freeTrialTimeRemaining: number;
}

const getStorageKey = (walletAddress: string) => `waldoge_usage_${walletAddress}`;
const getChatHistoryKey = (walletAddress: string) => `waldoge_chat_${walletAddress}`;
const getFreeTrialKey = (walletAddress: string) => `waldoge_trial_${walletAddress}`;

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

/**
 * Safely parse and validate free trial from localStorage
 */
const safeParseFreeTrial = (data: string | null): FreeTrial | null => {
  if (!data) return null;
  
  try {
    const parsed = JSON.parse(data);
    const validated = FreeTrialSchema.safeParse(parsed);
    
    if (validated.success) {
      return validated.data;
    }
    return null;
  } catch {
    return null;
  }
};

export const useUsageTracking = (tier: UserTier): UsageTrackingState => {
  const { publicKey } = useWallet();
  const [usage, setUsage] = useState<DailyUsage>(getDefaultUsage());
  const [freeTrial, setFreeTrial] = useState<FreeTrial | null>(null);
  const [freeTrialTimeRemaining, setFreeTrialTimeRemaining] = useState(0);

  // Load usage and free trial from localStorage
  useEffect(() => {
    if (!publicKey) {
      setUsage(getDefaultUsage());
      setFreeTrial(null);
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

    // Load free trial data
    const trialKey = getFreeTrialKey(publicKey.toString());
    const storedTrial = localStorage.getItem(trialKey);
    const parsedTrial = safeParseFreeTrial(storedTrial);
    
    if (parsedTrial) {
      setFreeTrial(parsedTrial);
    }
  }, [publicKey]);

  // Start free trial when tier is "preview" (no tokens) and no trial started yet
  useEffect(() => {
    if (!publicKey || tier !== "preview") return;
    
    const trialKey = getFreeTrialKey(publicKey.toString());
    const storedTrial = localStorage.getItem(trialKey);
    
    if (!storedTrial) {
      const newTrial: FreeTrial = {
        startTime: Date.now(),
        used: true,
      };
      localStorage.setItem(trialKey, JSON.stringify(newTrial));
      setFreeTrial(newTrial);
    }
  }, [publicKey, tier]);

  // Update free trial time remaining
  useEffect(() => {
    if (!freeTrial) {
      setFreeTrialTimeRemaining(0);
      return;
    }

    const updateRemaining = () => {
      const elapsed = Date.now() - freeTrial.startTime;
      const remaining = Math.max(0, FREE_TRIAL_DURATION_MS - elapsed);
      setFreeTrialTimeRemaining(remaining);
    };

    updateRemaining();
    const interval = setInterval(updateRemaining, 1000);
    return () => clearInterval(interval);
  }, [freeTrial]);

  // Check if user is currently in an active free trial
  const isInFreeTrial = Boolean(
    tier === "preview" && 
    freeTrial && 
    freeTrialTimeRemaining > 0
  );

  const getLimit = useCallback(
    (feature: keyof Omit<DailyUsage, "date">): number => {
      // Free trial limits (excludes NFT)
      if (isInFreeTrial && feature !== "nftCreator") {
        return USAGE_LIMITS.FREE_TRIAL[feature];
      }
      
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
    [tier, isInFreeTrial]
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
    isInFreeTrial,
    freeTrialTimeRemaining,
  };
};

// Chat history hook
const ChatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().max(50000),
  timestamp: z.number().int().min(0),
  image: z.string().optional(),
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
