import type { Quote, QuoteContractorItem } from '@/hooks/useQuotes';

export const PHASES = [
  { key: 'phase_consultation_hours', label: 'Initial Consultation' },
  { key: 'phase_concept_hours', label: 'Concept & Space Planning' },
  { key: 'phase_revisions_hours', label: 'Revisions' },
  { key: 'phase_sourcing_hours', label: 'Sourcing & Procurement' },
  { key: 'phase_pm_hours', label: 'Project Management' },
  { key: 'phase_handoff_hours', label: 'Walkthrough & Handoff' },
] as const;

export type PhaseKey = (typeof PHASES)[number]['key'];

export function laborSubtotal(quote: Quote): number {
  const rate = Number(quote.hourly_rate) || 0;
  return PHASES.reduce((sum, p) => sum + (Number(quote[p.key]) || 0) * rate, 0);
}

export function contractorClientPrice(item: QuoteContractorItem): number {
  const fee = Number(item.flat_fee) || 0;
  const markup = Number(item.markup_percentage) || 0;
  return fee * (1 + markup / 100);
}

export function contractorSubtotal(items: QuoteContractorItem[]): number {
  return items.reduce((s, i) => s + contractorClientPrice(i), 0);
}

export function discountAmount(quote: Quote): number {
  const labor = laborSubtotal(quote);
  const val = Number(quote.discount_value) || 0;
  if (quote.discount_type === 'percentage') return Math.min(labor, labor * (val / 100));
  if (quote.discount_type === 'flat') return Math.min(labor, val);
  return 0;
}

export function grandTotal(quote: Quote, items: QuoteContractorItem[]): number {
  return laborSubtotal(quote) - discountAmount(quote) + contractorSubtotal(items);
}

export const formatMoney = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

export const SERVICE_CATEGORY_LABELS: Record<string, string> = {
  programming: 'Programming',
  design: 'Design',
  policy: 'Policy',
};

export const ENGAGEMENT_TYPES = [
  { value: 'one_time', label: 'One-time' },
  { value: 'retainer', label: 'Retainer' },
  { value: 'phased', label: 'Phased' },
];

export const CONTRACTOR_TYPE_LABELS: Record<string, string> = {
  fitness_equipment: 'Fitness Equipment',
  interior_design: 'Interior Design',
  architecture: 'Architecture',
  graphic_design: 'Graphic Design',
  other: 'Other',
};

export const SERVICE_DETAIL_FIELDS: Record<
  string,
  { key: string; label: string; type: 'text' | 'textarea' | 'number' | 'select'; options?: { value: string; label: string }[] }[]
> = {
  programming: [
    { key: 'target_population', label: 'Target population type and approximate size', type: 'text' },
    { key: 'programming_gaps', label: 'Current programming gaps / pain points', type: 'textarea' },
    { key: 'desired_outcome', label: 'Desired outcome metric', type: 'text' },
    { key: 'staff_training_needs', label: 'Staff training needs', type: 'textarea' },
    { key: 'facility_constraints', label: 'Existing equipment / facility constraints', type: 'textarea' },
  ],
  design: [
    {
      key: 'construction_type',
      label: 'Design Type',
      type: 'select',
      options: [
        { value: 'new_construction', label: 'New Construction' },
        { value: 'retrofit', label: 'Retrofit' },
      ],
    },
    { key: 'square_footage', label: 'Square Footage', type: 'number' },
    { key: 'unit_count', label: 'Unit Count', type: 'number' },
    { key: 'occupancy_targets', label: 'Occupancy / capacity targets', type: 'text' },
    { key: 'compliance_drivers', label: 'Compliance drivers (ADA, local code, licensing)', type: 'textarea' },
    { key: 'construction_timeline', label: 'Construction timeline dependencies', type: 'textarea' },
  ],
  policy: [
    { key: 'property_type', label: 'Property type and unit count', type: 'text' },
    { key: 'policy_status', label: 'Current policy status (none / informal / expired)', type: 'text' },
    { key: 'staff_sop_count', label: 'Staff count needing SOP training', type: 'number' },
    { key: 'funding_source', label: 'Funding source status (grant pending / secured / none)', type: 'text' },
    { key: 'notes', label: 'Additional notes', type: 'textarea' },
  ],
};