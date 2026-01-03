import { useState, useRef, useEffect } from 'react';
import { DealWithRelations } from '@/hooks/useDeals';
import { useScribeChat, ChatMessage } from '@/hooks/useScribeChat';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { X, Send, Bot, User, Loader2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ScribeContext {
  userName: string | null;
  userRole: string | null;
  currentPage: string;
  pageType: 'dashboard' | 'deal' | 'account' | 'contact' | 'calendar' | 'playbook' | 'asset' | 'interactions' | 'admin' | 'other';
  deal?: DealWithRelations | null;
}

interface ScribeChatPanelProps {
  context: ScribeContext;
  isOpen: boolean;
  onClose: () => void;
}

function ChatMessageBubble({ message }: { message: ChatMessage }) {
  const isAssistant = message.role === 'assistant';

  return (
    <div className={cn('flex gap-3', isAssistant ? 'justify-start' : 'justify-end')}>
      {isAssistant && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Bot className="h-4 w-4" />
        </div>
      )}
      <div
        className={cn(
          'max-w-[80%] rounded-lg px-4 py-2 text-sm',
          isAssistant
            ? 'bg-muted text-foreground'
            : 'bg-primary text-primary-foreground'
        )}
      >
        <div className="whitespace-pre-wrap">{message.content}</div>
      </div>
      {!isAssistant && (
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

export function ScribeChatPanel({ context, isOpen, onClose }: ScribeChatPanelProps) {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { messages, isLoading, sendMessage, clearMessages } = useScribeChat(context);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage(input.trim());
    setInput('');
  };

  if (!isOpen) return null;

  const pageDisplay = context.deal 
    ? (context.deal.deal_name || context.deal.accounts?.name || 'Deal')
    : getPageDisplayName(context.pageType, context.currentPage);

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md border-l bg-background/95 backdrop-blur-sm shadow-xl flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <div>
            <h3 className="font-semibold">Scribe</h3>
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
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.length === 0 && (
            <Card className="p-4 text-center text-sm text-muted-foreground">
              <Bot className="mx-auto mb-2 h-8 w-8 text-primary/50" />
              <p className="font-medium">I am Scribe, your AI assistant.</p>
              <p className="mt-1">
                {context.pageType === 'deal' 
                  ? 'Ask me about this deal, draft messages, or get guidance on next steps.'
                  : 'Ask me about deals, playbooks, or get CRM guidance.'}
              </p>
            </Card>
          )}
          {messages.map((message, index) => (
            <ChatMessageBubble key={index} message={message} />
          ))}
          {isLoading && messages[messages.length - 1]?.role === 'user' && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Bot className="h-4 w-4" />
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
      <form onSubmit={handleSubmit} className="border-t p-4">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Scribe..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={!input.trim() || isLoading}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
