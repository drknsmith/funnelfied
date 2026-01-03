import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import { DEAL_STAGES, DEAL_SIZES, DEAL_TYPES, DealWithRelations } from '@/hooks/useDeals';
import { useAccounts } from '@/hooks/useAccounts';
import { useContacts } from '@/hooks/useContacts';

const formSchema = z.object({
  deal_name: z.string().optional(),
  account_id: z.string().min(1, 'Account is required'),
  primary_contact_id: z.string().optional(),
  stage: z.string().min(1, 'Stage is required'),
  deal_type: z.string().optional(),
  deal_size_range: z.string().optional(),
  probability: z.coerce.number().min(0).max(100).optional(),
  next_action: z.string().optional(),
  next_action_date: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface DealFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deal?: DealWithRelations | null;
  onSubmit: (data: FormData) => void;
  isLoading?: boolean;
}

export default function DealFormDialog({
  open,
  onOpenChange,
  deal,
  onSubmit,
  isLoading,
}: DealFormDialogProps) {
  const { accounts } = useAccounts();
  const { contacts } = useContacts();
  const isEditing = !!deal;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      deal_name: '',
      account_id: '',
      primary_contact_id: '',
      stage: 'signal_target',
      deal_type: '',
      deal_size_range: '',
      probability: 0,
      next_action: '',
      next_action_date: '',
    },
  });

  const selectedAccountId = form.watch('account_id');
  const accountContacts = contacts.filter((c) => c.account_id === selectedAccountId);

  useEffect(() => {
    if (deal) {
      form.reset({
        deal_name: deal.deal_name || '',
        account_id: deal.account_id,
        primary_contact_id: deal.primary_contact_id || '',
        stage: deal.stage,
        deal_type: deal.deal_type || '',
        deal_size_range: deal.deal_size_range || '',
        probability: deal.probability || 0,
        next_action: deal.next_action || '',
        next_action_date: deal.next_action_date || '',
      });
    } else {
      form.reset({
        deal_name: '',
        account_id: '',
        primary_contact_id: '',
        stage: 'signal_target',
        deal_type: '',
        deal_size_range: '',
        probability: 0,
        next_action: '',
        next_action_date: '',
      });
    }
  }, [deal, form]);

  const handleSubmit = (data: FormData) => {
    onSubmit({
      ...data,
      deal_name: data.deal_name || null,
      primary_contact_id: data.primary_contact_id || null,
      deal_type: data.deal_type || null,
      deal_size_range: data.deal_size_range || null,
      next_action: data.next_action || null,
      next_action_date: data.next_action_date || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Deal' : 'Create Deal'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="deal_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deal Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter deal name (optional)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="account_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select account" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name}
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
              name="primary_contact_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Primary Contact</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select contact (optional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {accountContacts.map((contact) => (
                        <SelectItem key={contact.id} value={contact.id}>
                          {contact.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="stage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stage *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select stage" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DEAL_STAGES.map((stage) => (
                          <SelectItem key={stage.value} value={stage.value}>
                            {stage.label}
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
                name="deal_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deal Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DEAL_TYPES.map((type) => (
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="deal_size_range"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deal Size</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DEAL_SIZES.map((size) => (
                          <SelectItem key={size.value} value={size.value}>
                            {size.label}
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
                name="probability"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Probability (%)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" max="100" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="next_action"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Next Action</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="What's the next step?"
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

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : isEditing ? 'Update Deal' : 'Create Deal'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
