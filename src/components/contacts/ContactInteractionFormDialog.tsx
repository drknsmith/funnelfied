import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Sparkles, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { INTERACTION_TYPES } from '@/hooks/useInteractions';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const formSchema = z.object({
  type: z.string().min(1, 'Type is required'),
  occurred_at: z.string().min(1, 'Date is required'),
  summary: z.string().optional(),
  objections: z.string().optional(),
  commitments: z.string().optional(),
  next_action: z.string().optional(),
  next_action_date: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface ContactContext {
  contact_name: string;
  account_name: string;
  title?: string;
}

interface ContactInteractionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactId: string;
  onSubmit: (data: FormData & { contact_id: string }) => void;
  isLoading?: boolean;
  contactContext?: ContactContext;
}

export default function ContactInteractionFormDialog({
  open,
  onOpenChange,
  contactId,
  onSubmit,
  isLoading,
  contactContext,
}: ContactInteractionFormDialogProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: '',
      occurred_at: new Date().toISOString().slice(0, 16),
      summary: '',
      objections: '',
      commitments: '',
      next_action: '',
      next_action_date: '',
    },
  });

  const handleSubmit = (data: FormData) => {
    onSubmit({
      ...data,
      contact_id: contactId,
    });
    form.reset();
    onOpenChange(false);
  };

  const handleAIAnalysis = async () => {
    const rawText = form.getValues('summary');
    if (!rawText || rawText.trim().length < 20) {
      toast({
        title: 'Not enough text',
        description: 'Please enter at least a few sentences of notes to analyze.',
        variant: 'destructive',
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('interaction-assist', {
        body: {
          raw_text: rawText,
          deal_context: contactContext
            ? {
                deal_name: contactContext.contact_name,
                account_name: contactContext.account_name,
                stage: contactContext.title || 'Contact',
              }
            : {
                deal_name: 'Unknown',
                account_name: 'Unknown',
                stage: 'Contact',
              },
        },
      });
      if (error) throw new Error(error.message || 'Failed to analyze notes');

      if (data.summary) form.setValue('summary', data.summary);
      if (data.objections) form.setValue('objections', data.objections);
      if (data.commitments) form.setValue('commitments', data.commitments);
      if (data.next_action) form.setValue('next_action', data.next_action);
      if (data.next_action_date) form.setValue('next_action_date', data.next_action_date);

      toast({
        title: 'Notes analyzed',
        description: 'Fields have been populated with AI-extracted data. Review and edit as needed.',
      });
    } catch (error) {
      console.error('AI analysis error:', error);
      toast({
        title: 'Analysis failed',
        description: error instanceof Error ? error.message : 'Failed to analyze notes',
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log Contact Interaction</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {INTERACTION_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="occurred_at"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date & Time *</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="summary"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Notes / Summary</FormLabel>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleAIAnalysis}
                      disabled={isAnalyzing}
                      className="h-7 text-xs gap-1.5 text-primary hover:text-primary"
                    >
                      {isAnalyzing ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5" />
                      )}
                      {isAnalyzing ? 'Analyzing...' : 'Summarize with AI'}
                    </Button>
                  </div>
                  <FormControl>
                    <Textarea
                      placeholder="Paste meeting notes, email thread, or call summary here."
                      className="resize-none min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="objections"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Objections</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any objections or concerns raised?"
                      className="resize-none h-20"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="commitments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Commitments</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any commitments or agreements made?"
                      className="resize-none h-20"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="next_action"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Next Action</FormLabel>
                    <FormControl>
                      <Input placeholder="Follow-up action" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="next_action_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Next Action Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Log Interaction'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
