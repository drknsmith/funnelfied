import { useState, useCallback, useMemo } from 'react';
import { DealWithRelations } from '@/hooks/useDeals';
import { useToast } from '@/hooks/use-toast';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface DealContext {
  deal_name: string | null;
  account_name: string;
  stage: string;
  deal_type: string | null;
  playbook_name: string | null;
  contact_name: string | null;
  deal_size: string | null;
  probability: number | null;
  next_action: string | null;
  next_action_date: string | null;
  internal_notes: string | null;
}

interface ScribeContext {
  userName: string | null;
  userRole: string | null;
  currentPage: string;
  pageType: string;
  deal?: DealWithRelations | null;
  workspaceId?: string | null;
}

interface FullContext {
  user_name: string | null;
  user_role: string | null;
  current_page: string;
  page_type: string;
  workspace_id?: string | null;
  deal?: DealContext | null;
}

export function useScribeChat(context: ScribeContext) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const buildDealContext = useCallback((deal?: DealWithRelations | null): DealContext | null => {
    if (!deal) return null;
    
    return {
      deal_name: deal.deal_name,
      account_name: deal.accounts?.name || 'Unknown',
      stage: deal.stage,
      deal_type: deal.deal_type,
      playbook_name: deal.playbooks?.name || null,
      contact_name: deal.contacts?.name || null,
      deal_size: deal.deal_size_range,
      probability: deal.probability,
      next_action: deal.next_action,
      next_action_date: deal.next_action_date,
      internal_notes: deal.internal_notes,
    };
  }, []);

  const fullContext = useMemo((): FullContext => {
    return {
      user_name: context.userName,
      user_role: context.userRole,
      current_page: context.currentPage,
      page_type: context.pageType,
      workspace_id: context.workspaceId,
      deal: buildDealContext(context.deal),
    };
  }, [context, buildDealContext]);

  const sendMessage = useCallback(async (content: string) => {
    const userMessage: ChatMessage = { role: 'user', content };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    let assistantContent = '';

    const updateAssistant = (chunk: string) => {
      assistantContent += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant') {
          return prev.map((m, i) => 
            i === prev.length - 1 ? { ...m, content: assistantContent } : m
          );
        }
        return [...prev, { role: 'assistant', content: assistantContent }];
      });
    };

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scribe-chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: [...messages, userMessage],
            context: fullContext,
          }),
        }
      );

      if (!response.ok || !response.body) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to connect to Scribe');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const chunk = parsed.choices?.[0]?.delta?.content;
            if (chunk) updateAssistant(chunk);
          } catch {
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }
    } catch (error) {
      console.error('Scribe chat error:', error);
      toast({
        variant: 'destructive',
        title: 'Scribe Error',
        description: error instanceof Error ? error.message : 'Failed to get response',
      });
      // Remove the pending assistant message if there was an error
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant' && last.content === '') {
          return prev.slice(0, -1);
        }
        return prev;
      });
    } finally {
      setIsLoading(false);
    }
  }, [messages, fullContext, toast]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
    setMessages,
  };
}
