import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateLead } from '@/hooks/useLeads';

const FACILITY_TYPES = ['Multifamily', 'Boutique Studio', 'Gym', 'Country Club'];
const PLAYBOOK_OPTIONS = ['PB2', 'PB3', 'PB4'];

const formSchema = z.object({
  company: z.string().min(1, 'Company is required'),
  project_name: z.string().min(1, 'Project name is required'),
  location: z.string().min(1, 'Location is required'),
  facility_type: z.string().optional(),
  signal_reason: z.string().optional(),
  estimated_timeline: z.string().optional(),
  recommended_playbook: z.string().optional(),
  contact_notes: z.string().optional(),
  first_touch_email: z.string().optional(),
  linkedin_dm: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface LeadFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (leadId: string) => void;
}

export function LeadFormDialog({ open, onOpenChange, onSuccess }: LeadFormDialogProps) {
  const createLead = useCreateLead();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      company: '',
      project_name: '',
      location: '',
      facility_type: '',
      signal_reason: '',
      estimated_timeline: '',
      recommended_playbook: '',
      contact_notes: '',
      first_touch_email: '',
      linkedin_dm: '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      const result = await createLead.mutateAsync({
        company: values.company,
        project_name: values.project_name,
        location: values.location,
        facility_type: values.facility_type || null,
        signal_reason: values.signal_reason || null,
        estimated_timeline: values.estimated_timeline || null,
        recommended_playbook: values.recommended_playbook || null,
        contact_notes: values.contact_notes || null,
        first_touch_email: values.first_touch_email || null,
        linkedin_dm: values.linkedin_dm || null,
        status: 'New',
      });
      form.reset();
      onOpenChange(false);
      onSuccess?.(result.id);
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Lead</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company *</FormLabel>
                    <FormControl>
                      <Input placeholder="Company name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="project_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Project name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location *</FormLabel>
                    <FormControl>
                      <Input placeholder="City, State" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="facility_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Facility Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {FACILITY_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
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
                name="estimated_timeline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estimated Timeline</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Q2 2026" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="recommended_playbook"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recommended Playbook</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select playbook" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PLAYBOOK_OPTIONS.map((pb) => (
                          <SelectItem key={pb} value={pb}>
                            {pb}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="signal_reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Signal Reason</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Why this lead looks promising..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contact_notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Notes about contacts/stakeholders..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="first_touch_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First-touch Email Draft</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Email draft..."
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="linkedin_dm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>LinkedIn DM Draft</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="LinkedIn message draft..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createLead.isPending}>
                {createLead.isPending ? 'Creating...' : 'Create Lead'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
