import { FC, useState, useRef, useEffect, useCallback, ChangeEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Send, Loader2, Trash2, Lock, Sparkles, StopCircle, ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { UserTier } from "@/hooks/useWaldogeBalance";
import { useChatHistory } from "@/hooks/useUsageTracking";
import { useStreamingChat, ChatMessage } from "@/hooks/useStreamingChat";
import { QUICK_ACTIONS, EXAMPLE_CHATS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import waldogeMascot from "@/assets/waldoge-mascot.png";

interface ChatTabProps {
  tier: UserTier;
  canUse: boolean;
  remainingUses: number;
  onUse: () => void;
}

export const ChatTab: FC<ChatTabProps> = ({
  tier,
  canUse,
  remainingUses,
  onUse,
}) => {
  const { messages, addMessage, updateLastMessage, clearMessages } = useChatHistory();
  const { streamChat, cancelStream } = useStreamingChat();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chaosMode, setChaosMode] = useState(false);
  const [attachedImage, setAttachedImage] = useState<{ file: File; preview: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const assistantContentRef = useRef("");

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleImageSelect = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return;
    }

    const preview = URL.createObjectURL(file);
    setAttachedImage({ file, preview });

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const removeAttachedImage = useCallback(() => {
    if (attachedImage) {
      URL.revokeObjectURL(attachedImage.preview);
      setAttachedImage(null);
    }
  }, [attachedImage]);

  const handleSend = useCallback(async (messageContent?: string) => {
    const content = messageContent || input.trim();
    if (!content && !attachedImage) return;

    // Convert image to base64 if attached
    let imageData: string | undefined;
    if (attachedImage) {
      const reader = new FileReader();
      imageData = await new Promise((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(attachedImage.file);
      });
    }

    setInput("");
    const imagePreview = attachedImage?.preview;
    removeAttachedImage();
    
    // Add user message with image preview for display
    addMessage("user", content, imagePreview);
    onUse();
    setIsLoading(true);
    assistantContentRef.current = "";

    // Build messages array for API (convert to format expected by the AI)
    const apiMessages: ChatMessage[] = [
      ...messages.map(m => ({ role: m.role, content: m.content })),
      { role: "user" as const, content },
    ];

    // Add empty assistant message that will be updated
    addMessage("assistant", "");

    await streamChat({
      messages: apiMessages,
      chaosMode,
      imageData,
      onDelta: (chunk) => {
        assistantContentRef.current += chunk;
        updateLastMessage(assistantContentRef.current);
      },
      onDone: () => {
        setIsLoading(false);
      },
      onError: (errorMessage) => {
        updateLastMessage(errorMessage);
        setIsLoading(false);
      },
    });
  }, [input, attachedImage, messages, chaosMode, addMessage, updateLastMessage, onUse, streamChat, removeAttachedImage]);

  const handleCancel = useCallback(() => {
    cancelStream();
    setIsLoading(false);
  }, [cancelStream]);

  const isLocked = false; // Token gate removed - chat is now open to all

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] max-h-[700px]">
      {/* Header with controls */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-4">
          <h2 className="font-display text-xl font-semibold flex items-center gap-2">
            <span className="text-2xl">🐕</span>
            Chat with WALDOGE
          </h2>
          
          {tier === "chaos" && (
            <div className="flex items-center gap-2">
              <Switch
                id="chaos-mode"
                checked={chaosMode}
                onCheckedChange={setChaosMode}
              />
              <Label
                htmlFor="chaos-mode"
                className={cn(
                  "text-sm font-medium cursor-pointer",
                  chaosMode && "text-gradient-chaos"
                )}
              >
                <Sparkles className="w-4 h-4 inline mr-1" />
                Chaos Mode
              </Label>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {!isLocked && (
            <span className="text-xs text-muted-foreground">
              {remainingUses} messages left today
            </span>
          )}
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearMessages}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar glass-card p-4 mb-4 space-y-4">
        {isLocked ? (
          // Show example chats for locked users
          <div className="space-y-6">
            <div className="text-center py-4">
              <Lock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">
                {tier === "none"
                  ? "Connect your wallet to chat with WALDOGE"
                  : "Hold WALDOGE tokens to unlock chat"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Here's a preview of what WALDOGE can do:
              </p>
            </div>

            {EXAMPLE_CHATS.map((example, index) => (
              <div key={index} className="space-y-3 opacity-70">
                <div className="chat-bubble-user p-3 max-w-[80%] ml-auto">
                  <p className="text-sm">{example.user}</p>
                </div>
                <div className="chat-bubble-ai p-3 max-w-[80%] flex gap-3">
                  <span className="text-xl flex-shrink-0">🐕</span>
                  <p className="text-sm whitespace-pre-wrap">{example.ai}</p>
                </div>
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          // Empty state with quick actions
          <div className="flex flex-col items-center justify-center h-full text-center">
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 3 }}
              className="mb-4"
            >
              <img 
                src={waldogeMascot} 
                alt="WALDOGE" 
                className="w-24 h-24 object-contain drop-shadow-[0_0_20px_hsl(45,95%,55%,0.3)]"
              />
            </motion.div>
            <h3 className="font-display text-lg font-semibold mb-2">
              Hey there, space explorer!
            </h3>
            <p className="text-muted-foreground text-sm mb-6 max-w-md">
              I'm WALDOGE, your cosmic companion. Ask me anything or use the quick actions below!
            </p>
            
            <div className="flex flex-wrap gap-2 justify-center max-w-lg">
              {QUICK_ACTIONS.map((action) => (
                <Button
                  key={action.label}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSend(action.prompt)}
                  disabled={!canUse}
                  className="text-xs"
                >
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          // Chat messages
          <AnimatePresence mode="popLayout">
            {messages.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={cn(
                  "flex gap-3",
                  message.role === "user" && "justify-end"
                )}
              >
                {message.role === "assistant" && (
                  <span className="text-xl flex-shrink-0">🐕</span>
                )}
                <div
                  className={cn(
                    "p-3 max-w-[80%]",
                    message.role === "user" ? "chat-bubble-user" : "chat-bubble-ai"
                  )}
                >
                  {message.role === "assistant" ? (
                    <div className="prose prose-sm prose-invert max-w-none text-foreground">
                      <ReactMarkdown>{message.content || "..."}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  )}
                </div>
              </motion.div>
            ))}

            {isLoading && messages[messages.length - 1]?.content === "" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3"
              >
                <span className="text-xl">🐕</span>
                <div className="chat-bubble-ai p-3">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="relative">
        {/* Image preview */}
        {attachedImage && (
          <div className="absolute -top-16 left-2 z-10">
            <div className="relative">
              <img
                src={attachedImage.preview}
                alt="Attached"
                className="h-14 w-14 object-cover rounded-lg border border-border"
              />
              <Button
                size="icon"
                variant="destructive"
                className="absolute -top-2 -right-2 h-5 w-5"
                onClick={removeAttachedImage}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
        )}

        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
        />

        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder={
            isLocked
              ? "Connect wallet & hold WALDOGE to chat..."
              : chaosMode
              ? "Unleash chaos upon the cosmos... 🌌"
              : "Ask WALDOGE anything..."
          }
          disabled={isLocked || isLoading}
          className="pr-24 resize-none bg-card border-border focus:border-primary/50"
          rows={2}
        />
        
        <div className="absolute right-2 bottom-2 flex gap-1">
          {!isLoading && (
            <Button
              size="icon"
              variant="ghost"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLocked || !!attachedImage}
              className="text-muted-foreground hover:text-foreground"
            >
              <ImagePlus className="w-4 h-4" />
            </Button>
          )}
          
          {isLoading ? (
            <Button
              size="icon"
              onClick={handleCancel}
              variant="destructive"
            >
              <StopCircle className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              size="icon"
              onClick={() => handleSend()}
              disabled={(!input.trim() && !attachedImage) || isLocked || !canUse}
            >
              <Send className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Quick actions bar */}
      {!isLocked && messages.length > 0 && (
        <div className="flex gap-2 mt-3 flex-wrap">
          {QUICK_ACTIONS.slice(0, 3).map((action) => (
            <Button
              key={action.label}
              variant="ghost"
              size="sm"
              onClick={() => handleSend(action.prompt)}
              disabled={!canUse || isLoading}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};
