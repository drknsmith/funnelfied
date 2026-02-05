import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PlatformStripes } from './PlatformStripes';
import { PLATFORM_ORDER, type SMPlatform } from '@/lib/socialMediaConstants';
import type { CalendarDayData } from '@/hooks/useSMCalendarData';

interface CalendarMonthViewProps {
  currentDate: Date;
  calendarData: Record<string, CalendarDayData>;
  onDayClick: (date: string, platform?: SMPlatform) => void;
  selectedPlatforms: SMPlatform[];
  selectedCampaignIds: string[];
  isLoading?: boolean;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function CalendarMonthView({
  currentDate,
  calendarData,
  onDayClick,
  selectedPlatforms,
  selectedCampaignIds,
  isLoading,
}: CalendarMonthViewProps) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 bg-muted">
        {WEEKDAYS.map((day) => (
          <div key={day} className="px-2 py-2 text-center text-sm font-medium text-muted-foreground border-b">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const dayData = calendarData[dateStr];
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isDayToday = isToday(day);

          return (
            <div
              key={dateStr}
              className={cn(
                'min-h-[120px] border-b border-r p-2 cursor-pointer transition-colors hover:bg-muted/50',
                !isCurrentMonth && 'bg-muted/30 text-muted-foreground',
                isDayToday && 'bg-primary/5'
              )}
              onClick={() => onDayClick(dateStr)}
            >
              {/* Date number */}
              <div className={cn(
                'text-sm font-medium mb-2',
                isDayToday && 'text-primary font-bold'
              )}>
                {format(day, 'd')}
              </div>

              {/* Platform stripes */}
              <PlatformStripes
                dayData={dayData}
                selectedPlatforms={selectedPlatforms}
                selectedCampaignIds={selectedCampaignIds}
                onStripeClick={(platform) => {
                  onDayClick(dateStr, platform);
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
