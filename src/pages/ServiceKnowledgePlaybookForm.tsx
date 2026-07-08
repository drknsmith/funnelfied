import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Save, X } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';

import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type SKForm = {
  opp_programming: string;
  opp_design: string;
  opp_policy: string;
  eng_one_time: string;
  eng_retainer: string;
  eng_phased: string;
  dtype_new_construction: string;
  dtype_retrofit: string;
  design_details: string;
  programming_details: string;
  policy_details: string;
};

const EMPTY: SKForm = {
  opp_programming: '',
  opp_design: '',
  opp_policy: '',
  eng_one_time: '',
  eng_retainer: '',
  eng_phased: '',
  dtype_new_construction: '',
  dtype_retrofit: '',
  design_details: '',
  programming_details: '',
  policy_details: '',
};

export default function ServiceKnowledgePlaybookForm() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile } = useAuth();
  const workspaceId = profile?.workspace_id;
  const queryClient = useQueryClient();

  const { data: existing, isLoading } = useQuery({
    queryKey: ['service-knowledge-playbook', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return null;
      const { data, error } = await supabase
        .from('playbooks')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('kind', 'service_knowledge')
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!workspaceId,
  });

  const [form, setForm] = useState<SKForm>(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existing) {
      setForm({
        opp_programming: (existing as any).opp_programming || '',
        opp_design: (existing as any).opp_design || '',
        opp_policy: (existing as any).opp_policy || '',
        eng_one_time: (existing as any).eng_one_time || '',
        eng_retainer: (existing as any).eng_retainer || '',
        eng_phased: (existing as any).eng_phased || '',
        dtype_new_construction: (existing as any).dtype_new_construction || '',
        dtype_retrofit: (existing as any).dtype_retrofit || '',
        design_details: (existing as any).design_details || '',
        programming_details: (existing as any).programming_details || '',
        policy_details: (existing as any).policy_details || '',
      });
    }
  }, [existing]);

  const update = (patch: Partial<SKForm>) => setForm((f) => ({ ...f, ...patch }));

  const handleSave = async () => {
    if (!workspaceId) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const payload: any = {
        ...form,
        workspace_id: workspaceId,
        kind: 'service_knowledge',
        status: 'active',
        updated_by: user?.id,
      };
      if (existing?.id) {
        const { error } = await supabase.from('playbooks').update(payload).eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('playbooks').insert({
          ...payload,
          name: 'Service Knowledge Playbook',
          owner_user_id: user?.id,
          created_by: user?.id,
        });
        if (error) throw error;
      }
      await queryClient.invalidateQueries({ queryKey: ['service-knowledge-playbook', workspaceId] });
      await queryClient.invalidateQueries({ queryKey: ['playbooks'] });
      toast({ title: 'Playbook saved' });
      navigate('/playbooks');
    } catch (err: any) {
      toast({ title: err.message || 'Failed to save', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-6 flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </AppLayout>
    );
  }

  const TextareaBox = ({
    label,
    value,
    onChange,
  }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
  }) => (
    <div className="flex-1 min-w-[200px] space-y-2">
      <Label>{label}</Label>
      <Textarea
        rows={4}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={label}
        className="resize-y min-h-[100px]"
      />
    </div>
  );

  return (
    <AppLayout>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">Service Knowledge Playbook</h1>
          <Button variant="ghost" onClick={() => navigate('/playbooks')}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>1. Opportunity Type</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <TextareaBox label="Programming" value={form.opp_programming} onChange={(v) => update({ opp_programming: v })} />
                <TextareaBox label="Design" value={form.opp_design} onChange={(v) => update({ opp_design: v })} />
                <TextareaBox label="Policy" value={form.opp_policy} onChange={(v) => update({ opp_policy: v })} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>2. Engagement Type</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <TextareaBox label="One-time" value={form.eng_one_time} onChange={(v) => update({ eng_one_time: v })} />
                <TextareaBox label="Retainer" value={form.eng_retainer} onChange={(v) => update({ eng_retainer: v })} />
                <TextareaBox label="Phased" value={form.eng_phased} onChange={(v) => update({ eng_phased: v })} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>3. Design Type</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <TextareaBox label="New Construction" value={form.dtype_new_construction} onChange={(v) => update({ dtype_new_construction: v })} />
                <TextareaBox label="Retrofit" value={form.dtype_retrofit} onChange={(v) => update({ dtype_retrofit: v })} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>4. Design Details</CardTitle></CardHeader>
            <CardContent>
              <Textarea rows={6} value={form.design_details} onChange={(e) => update({ design_details: e.target.value })} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>5. Programming Details</CardTitle></CardHeader>
            <CardContent>
              <Textarea rows={6} value={form.programming_details} onChange={(e) => update({ programming_details: e.target.value })} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>6. Policy Details</CardTitle></CardHeader>
            <CardContent>
              <Textarea rows={6} value={form.policy_details} onChange={(e) => update({ policy_details: e.target.value })} />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => navigate('/playbooks')}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              Save Playbook
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}