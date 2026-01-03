import { useState, useRef, useEffect, useCallback } from 'react';
import { DealWithRelations } from '@/hooks/useDeals';
import { useScribeChat, ChatMessage } from '@/hooks/useScribeChat';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { 
  X, Send, Bot, User, Loader2, Trash2, Copy, Pencil, Mic, MicOff, Check 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import scribeIcon from '@/assets/scribe-icon.png';

export interface ScribeContext {
  userName: string | null;
  userRole: string | null;
  currentPage: string;
  pageType: 'dashboard' | 'deal' | 'account' | 'contact' | 'calendar' | 'playbook' | 'asset' | 'interactions' | 'admin' | 'other';
  deal?: DealWithRelations | null;
  workspaceId?: string | null;
}

interface ScribeChatPanelProps {
  context: ScribeContext;
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessageBubbleProps {
  message: ChatMessage;
  index: number;
  onEdit?: (index: number, content: string) => void;
  isUser: boolean;
}

function ChatMessageBubble({ message, index, onEdit, isUser }: ChatMessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: 'Copied to clipboard' });
    } catch {
      toast({ title: 'Failed to copy', variant: 'destructive' });
    }
  };

  return (
    <div className={cn('group flex gap-3', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/80 border border-border">
          <img src={scribeIcon} alt="Scribe" className="h-5 w-5 object-contain" />
        </div>
      )}
      <div className="flex flex-col max-w-[80%]">
        <div
          className={cn(
            'rounded-lg px-4 py-2 text-sm',
            isUser
              ? 'bg-primary text-primary-foreground'
              : 'bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm text-foreground border border-border/50'
          )}
        >
          <div className="whitespace-pre-wrap">{message.content}</div>
        </div>
        <div className={cn(
          'flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity',
          isUser ? 'justify-end' : 'justify-start'
        )}>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={copyToClipboard}
          >
            {copied ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
            {copied ? 'Copied' : 'Copy'}
          </Button>
          {isUser && onEdit && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => onEdit(index, message.content)}
            >
              <Pencil className="h-3 w-3 mr-1" />
              Edit
            </Button>
          )}
        </div>
      </div>
      {isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
          <User className="h-4 w-4" />
        </div>
      )}
    </div>
  );
}

function getPageDisplayName(pageType: string, currentPage: string): string {
  switch (pageType) {
    case 'dashboard': return 'Dashboard';
    case 'deal': return 'Deal Details';
    case 'account': return 'Account Details';
    case 'contact': return 'Contact Details';
    case 'calendar': return 'Calendar';
    case 'playbook': return 'Playbook';
    case 'asset': return 'Asset';
    case 'interactions': return 'Interactions';
    case 'admin': return 'Admin';
    default: return 'Funnelfied';
  }
}

// Voice recognition types
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: Event) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
}

export function ScribeChatPanel({ context, isOpen, onClose }: ScribeChatPanelProps) {
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [snapPoint, setSnapPoint] = useState<number | string | null>(0.85);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const { messages, isLoading, sendMessage, clearMessages, setMessages } = useScribeChat(context);

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [input]);

  const handleSubmit = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage(input.trim());
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [input, isLoading, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (isMobile) {
      // Mobile: Enter adds newline, button submits
      return;
    } else {
      // Desktop: Enter submits, Shift+Enter adds newline
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    }
  };

  const handleEditMessage = (index: number, content: string) => {
    setInput(content);
    setMessages(prev => prev.slice(0, index));
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const startVoiceInput = () => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognitionAPI) {
      toast({
        title: 'Voice input not supported',
        description: 'Your browser does not support voice input.',
        variant: 'destructive',
      });
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      setInput(prev => prev + (prev ? ' ' : '') + transcript);
    };

    recognition.onend = () => {
      setIsRecording(false);
      recognitionRef.current = null;
    };

    recognition.onerror = () => {
      setIsRecording(false);
      recognitionRef.current = null;
      toast({
        title: 'Voice input error',
        description: 'Failed to capture voice. Please try again.',
        variant: 'destructive',
      });
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  };

  const stopVoiceInput = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  if (!isOpen) return null;

  const pageDisplay = context.deal 
    ? (context.deal.deal_name || context.deal.accounts?.name || 'Deal')
    : getPageDisplayName(context.pageType, context.currentPage);

  const chatContent = (
    <>
      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.length === 0 && (
            <Card className="p-4 text-center text-sm text-muted-foreground bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-border/50">
              <img src={scribeIcon} alt="Scribe" className="mx-auto mb-2 h-10 w-10 object-contain" />
              <p className="font-medium">I'm Scribe, your AI CRM Copilot.</p>
              <p className="mt-1">
                {context.pageType === 'deal' 
                  ? 'Ask me about this deal, draft messages, or get guidance on next steps.'
                  : 'Ask me about your deals, accounts, contacts, or get CRM guidance.'}
              </p>
            </Card>
          )}
          {messages.map((message, index) => (
            <ChatMessageBubble 
              key={index} 
              message={message} 
              index={index}
              isUser={message.role === 'user'}
              onEdit={message.role === 'user' ? handleEditMessage : undefined}
            />
          ))}
          {isLoading && messages[messages.length - 1]?.role === 'user' && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/80 border border-border">
                <img src={scribeIcon} alt="Scribe" className="h-5 w-5 object-contain" />
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Thinking...
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t border-border/50 p-4 bg-white/30 dark:bg-gray-900/30 backdrop-blur-sm">
        <div className="flex gap-2 items-end">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isMobile ? "Ask Scribe... (Enter for new line)" : "Ask Scribe... (Shift+Enter for new line)"}
            disabled={isLoading}
            className="flex-1 min-h-[40px] max-h-[120px] resize-none bg-white/50 dark:bg-gray-800/50"
            rows={1}
          />
          <div className="flex flex-col gap-1">
            <Button
              type="button"
              size="icon"
              variant={isRecording ? "destructive" : "outline"}
              onClick={isRecording ? stopVoiceInput : startVoiceInput}
              className={cn(
                "h-9 w-9 shrink-0",
                isRecording && "animate-pulse"
              )}
            >
              {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
            <Button 
              type="submit" 
              size="icon" 
              disabled={!input.trim() || isLoading}
              className="h-9 w-9 shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </form>
    </>
  );

  // Mobile: Use Drawer with snap points
  if (isMobile) {
    return (
      <Drawer
        open={isOpen}
        onOpenChange={(open) => !open && onClose()}
        snapPoints={[0.30, 0.85]}
        activeSnapPoint={snapPoint}
        setActiveSnapPoint={setSnapPoint}
        modal={true}
      >
        <DrawerContent className="h-[85vh] bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border-t border-white/20">
          <DrawerHeader className="border-b border-border/50 pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img src={scribeIcon} alt="Scribe" className="h-6 w-6 object-contain" />
                <div>
                  <DrawerTitle className="text-base">Scribe</DrawerTitle>
                  <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                    {pageDisplay}
                    {context.userName && ` • ${context.userName}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearMessages}
                  disabled={messages.length === 0}
                  title="Clear conversation"
                  className="h-8 w-8"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DrawerHeader>
          <div className="flex flex-col flex-1 overflow-hidden">
            {chatContent}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: Half-screen panel with frosted glass
  return (
    <div 
      className={cn(
        "fixed inset-y-0 right-0 z-50 w-1/2 max-w-2xl min-w-[400px]",
        "bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl",
        "border-l border-white/20 shadow-2xl",
        "flex flex-col",
        "transform transition-transform duration-300 ease-out",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/50 px-4 py-3 bg-white/30 dark:bg-gray-900/30 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <img src={scribeIcon} alt="Scribe" className="h-6 w-6 object-contain" />
          <div>
            <h3 className="font-semibold">Scribe</h3>
            <p className="text-xs text-muted-foreground truncate max-w-[250px]">
              {pageDisplay}
              {context.userName && ` • ${context.userName}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={clearMessages}
            disabled={messages.length === 0}
            title="Clear conversation"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {chatContent}
    </div>
  );
}
