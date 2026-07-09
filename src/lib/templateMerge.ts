import { format } from 'date-fns';

interface MergeContext {
  contact?: {
    name?: string | null;
  } | null;
  account?: {
    name?: string | null;
  } | null;
  deal?: {
    stage?: string | null;
    deal_type?: string | null;
    deal_size_range?: string | null;
    next_action_date?: string | null;
  } | null;
  currentUser?: {
    full_name?: string | null;
  } | null;
}

const STAGE_LABELS: Record<string, string> = {
  signal_target: 'Signal Target',
  contacted: 'Contacted',
  discovery: 'Discovery',
  sow: 'SOW',
  under_contract: 'Under Contract',
  closed: 'Closed',
};

const DEAL_TYPE_LABELS: Record<string, string> = {
  single_site: 'Single-Site',
  portfolio: 'Portfolio',
  design_led: 'Design-Led',
  retrofit: 'Retrofit',
};

const SIZE_LABELS: Record<string, string> = {
  '0-50k': '$0 - $50K',
  '50k-150k': '$50K - $150K',
  '150k-500k': '$150K - $500K',
  '500k-1m': '$500K - $1M',
  '1m+': '$1M+',
};

export function mergeTemplate(template: string | null | undefined, context: MergeContext): string {
  if (!template) return '';

  const contactName = context.contact?.name || '';
  const nameParts = contactName.split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  const accountName = context.account?.name || '';
  const stageLabel = context.deal?.stage ? STAGE_LABELS[context.deal.stage] || context.deal.stage : '';
  const dealTypeLabel = context.deal?.deal_type ? DEAL_TYPE_LABELS[context.deal.deal_type] || context.deal.deal_type : '';
  const sizeLabel = context.deal?.deal_size_range ? SIZE_LABELS[context.deal.deal_size_range] || context.deal.deal_size_range : '';
  
  let nextActionDate = '';
  if (context.deal?.next_action_date) {
    try {
      nextActionDate = format(new Date(context.deal.next_action_date), 'MMM d, yyyy');
    } catch {
      nextActionDate = context.deal.next_action_date;
    }
  }

  const yourName = context.currentUser?.full_name || '';

  const replacements: Record<string, string> = {
    '{{FirstName}}': firstName,
    '{{LastName}}': lastName,
    '{{ContactName}}': contactName,
    '{{Account}}': accountName,
    '{{AccountName}}': accountName,
    '{{DealStage}}': stageLabel,
    '{{DealType}}': dealTypeLabel,
    '{{DealSizeRange}}': sizeLabel,
    '{{NextActionDate}}': nextActionDate,
    '{{YourName}}': yourName,
  };

  let result = template;
  for (const [variable, value] of Object.entries(replacements)) {
    result = result.replace(new RegExp(variable.replace(/[{}]/g, '\\$&'), 'g'), value);
  }

  return result;
}

export function getAvailableTemplates() {
  return [
    { value: 'first_message_email_template', label: 'First Email' },
    { value: 'first_message_linkedin_template', label: 'First LinkedIn' },
    { value: 'followup_day3_template', label: 'Day 3 Follow-Up' },
    { value: 'followup_day10_template', label: 'Day 10 Follow-Up' },
    { value: 'followup_day21_template', label: 'Day 21 Follow-Up' },
    { value: 'expansion_seed', label: 'Expansion Seed' },
  ];
}
