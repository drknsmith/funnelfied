import { Instagram, Linkedin, Facebook, Youtube, Users } from 'lucide-react';

export const SM_PLATFORMS = [
  { value: 'instagram', label: 'Instagram', icon: Instagram, color: '#E4405F' },
  { value: 'fanbase', label: 'Fanbase', icon: Users, color: '#8B5CF6' },
  { value: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: '#0A66C2' },
  { value: 'facebook', label: 'Facebook', icon: Facebook, color: '#1877F2' },
  { value: 'youtube', label: 'YouTube', icon: Youtube, color: '#FF0000' },
] as const;

export const PLATFORM_ORDER = ['instagram', 'fanbase', 'linkedin', 'facebook', 'youtube'] as const;

export type SMPlatform = typeof PLATFORM_ORDER[number];

export const CONTENT_STATUSES = ['idea', 'draft', 'ready', 'published', 'skipped'] as const;
export type ContentStatus = typeof CONTENT_STATUSES[number];

export const SLOT_STATUSES = ['planned', 'ready', 'published', 'skipped'] as const;
export type SlotStatus = typeof SLOT_STATUSES[number];

export const RECURRENCE_FREQUENCIES = ['weekly', 'biweekly', 'custom'] as const;
export type RecurrenceFrequency = typeof RECURRENCE_FREQUENCIES[number];

export interface RecurrenceRule {
  frequency: RecurrenceFrequency;
  day_of_week: number; // 0-6, Sunday-Saturday
  custom_days?: number[]; // For custom frequency
}

export const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
] as const;

export function getPlatformConfig(platform: string) {
  return SM_PLATFORMS.find(p => p.value === platform);
}
