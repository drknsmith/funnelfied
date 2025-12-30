import { LucideIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  description: string;
  count: number;
  icon: LucideIcon;
  variant?: 'default' | 'warning' | 'danger' | 'success';
  isExpanded: boolean;
  onToggle: () => void;
  onViewAll: () => void;
  children?: React.ReactNode;
}

const variantStyles = {
  default: 'border-l-4 border-l-primary',
  warning: 'border-l-4 border-l-yellow-500',
  danger: 'border-l-4 border-l-destructive',
  success: 'border-l-4 border-l-green-500',
};

export default function MetricCard({
  title,
  description,
  count,
  icon: Icon,
  variant = 'default',
  isExpanded,
  onToggle,
  onViewAll,
  children,
}: MetricCardProps) {
  const hasContent = count > 0;
  const activeVariant = hasContent ? variant : 'default';

  return (
    <Card
      className={cn(
        'transition-all duration-200 cursor-pointer hover:shadow-md',
        hasContent && variantStyles[activeVariant]
      )}
      onClick={hasContent ? onToggle : undefined}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold">{count}</div>
          {hasContent && (
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
        <CardDescription>{description}</CardDescription>

        {isExpanded && hasContent && (
          <div className="mt-4 space-y-2">
            {children}
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-2"
              onClick={(e) => {
                e.stopPropagation();
                onViewAll();
              }}
            >
              View All
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
