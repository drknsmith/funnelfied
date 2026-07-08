import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, X } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { usePlaybooks, usePlaybook } from '@/hooks/usePlaybooks';

const OPPORTUNITY_TYPES = [
  { value: 'programming', label: 'Programming' },
  { value: 'design', label: 'Design' },
  { value: 'policy', label: 'Policy' },
];

const ENGAGEMENT_TYPES = [
  { value: 'one_time', label: 'One-time' },
  { value: 'retainer', label: 'Retainer' },
  { value: 'phased', label: 'Phased' },
];

const DESIGN_TYPES = [
  { value: 'new_construction', label: 'New Construction' },
  { value: 'retrofit', label: 'Retrofit' },
];

interface BoxProps {
  label: string;
  selected: boolean;
  onClick: () => void;
}

function SelectableBox({ label, selected, onClick }: BoxProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex-1 min-w-[140px] rounded-lg border-2 px-4 py-6 text-center text-sm font-medium transition-colors',
        selected
          ? 'border-primary bg-primary/10 text-foreground'
          : 'border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground'
      )}
    >
      {label}
    </button>
  );
}

export default function ServiceKnowledgePlaybookForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEditing = !!id;

  const { playbook, isLoading: isLoadingPlaybook } = usePlaybook(id);
  const { createPlaybook, updatePlaybook } = usePlaybooks();

  const [name, setName] = useState('');
  const [opportunityTypes, setOpportunityTypes] = useState<string[]>([]);
  const [engagementType, setEngagementType] = useState<string>('');
  const [designType, setDesignType] = useState<string>('');
  const [designDetails, setDesignDetails] = useState('');
  const [programmingDetails, setProgrammingDetails] = useState('');
  const [policyDetails, setPolicyDetails] = useState('');

  useEffect(() => {
    if (playbook && isEditing) {
      setName(playbook.name || '');
      setOpportunityTypes(playbook.opportunity_types || []);
      setEngagementType(playbook.engagement_type || '');
      setDesignType(playbook.design_type || '');
      setDesignDetails(playbook.design_details || '');
      setProgrammingDetails(playbook.programming_details || '');
      setPolicyDetails(playbook.policy_details || '');
    }
  }, [playbook, isEditing]);

  const toggleOpportunity = (v: string) => {
    setOpportunityTypes((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]
    );
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast({ title: 'Name is required', variant: 'destructive' });
      return;
    }
    const payload: any = {
      name,
      status: 'active',
      kind: 'service_knowledge',
      opportunity_types: opportunityTypes,
      engagement_type: engagementType || null,
      design_type: designType || null,
      design_details: designDetails,
      programming_details: programmingDetails,
      policy_details: policyDetails,
    };
    try {
      if (isEditing && id) {
        await updatePlaybook.mutateAsync({ id, ...payload });
        toast({ title: 'Playbook updated' });
      } else {
        await createPlaybook.mutateAsync(payload);
        toast({ title: 'Playbook created' });
      }
      navigate('/playbooks');
    } catch (err: any) {
      toast({ title: err.message || 'Failed to save', variant: 'destructive' });
    }
  };

  if (isEditing && isLoadingPlaybook) {
    return (
      <AppLayout>
        <div className="p-6 flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">
            {isEditing ? 'Edit Service Knowledge Playbook' : 'New Service Knowledge Playbook'}
          </h1>
          <Button variant="ghost" onClick={() => navigate('/playbooks')}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Name</CardTitle>
            </CardHeader>
            <CardContent>
              <Label htmlFor="name" className="sr-only">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Programming — Retainer Retrofit"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>1. Opportunity Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {OPPORTUNITY_TYPES.map((o) => (
                  <SelectableBox
                    key={o.value}
                    label={o.label}
                    selected={opportunityTypes.includes(o.value)}
                    onClick={() => toggleOpportunity(o.value)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. Engagement Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {ENGAGEMENT_TYPES.map((o) => (
                  <SelectableBox
                    key={o.value}
                    label={o.label}
                    selected={engagementType === o.value}
                    onClick={() => setEngagementType(o.value)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3. Design Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {DESIGN_TYPES.map((o) => (
                  <SelectableBox
                    key={o.value}
                    label={o.label}
                    selected={designType === o.value}
                    onClick={() => setDesignType(o.value)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>4. Design Details</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={designDetails}
                onChange={(e) => setDesignDetails(e.target.value)}
                rows={6}
                placeholder="Describe the design scope, deliverables, and considerations..."
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>5. Programming Details</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={programmingDetails}
                onChange={(e) => setProgrammingDetails(e.target.value)}
                rows={6}
                placeholder="Describe programming scope, activities, and outcomes..."
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>6. Policy Details</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={policyDetails}
                onChange={(e) => setPolicyDetails(e.target.value)}
                rows={6}
                placeholder="Describe policy scope, guidelines, and considerations..."
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => navigate('/playbooks')}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createPlaybook.isPending || updatePlaybook.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {isEditing ? 'Save Changes' : 'Create Playbook'}
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}