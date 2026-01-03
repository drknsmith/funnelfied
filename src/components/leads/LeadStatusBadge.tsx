import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface LeadStatusBadgeProps {
  status: string;
  className?: string;
}

const statusStyles: Record<string, string> = {
  New: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  Reviewing: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  Converted: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  Disqualified: 'bg-muted text-muted-foreground',
};

export function LeadStatusBadge({ status, className }: LeadStatusBadgeProps) {
  return (
    <Badge
      variant="secondary"
      className={cn(statusStyles[status] || statusStyles.New, className)}
    >
      {status}
    </Badge>
  );
}
