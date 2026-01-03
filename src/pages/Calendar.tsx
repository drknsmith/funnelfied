import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
  isBefore,
} from 'date-fns';
import AppLayout from '@/components/layout/AppLayout';
import { useCalendarDeals, CalendarDeal } from '@/hooks/useCalendarDeals';
import { DEAL_STAGES } from '@/hooks/useDeals';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

const MAX_VISIBLE_EVENTS = 3;

export default function CalendarPage() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDeal, setSelectedDeal] = useState<CalendarDeal | null>(null);

  const { data: dealsByDate, isLoading } = useCalendarDeals(currentDate);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const goToPreviousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  const generateCalendarDays = () => {
    const days: Date[] = [];
    let day = calendarStart;
    while (day <= calendarEnd) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  };

  const days = generateCalendarDays();
  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const getDealsForDate = (date: Date): CalendarDeal[] => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return dealsByDate?.[dateStr] || [];
  };

  const getEventClassName = (deal: CalendarDeal, date: Date) => {
    const isPast = isBefore(date, new Date()) && !isToday(date);
    if (isPast) return 'bg-destructive/20 text-destructive border-destructive/30';
    if (isToday(date)) return 'bg-warning/20 text-warning-foreground border-warning/30';
    return 'bg-primary/10 text-primary border-primary/20';
  };

  const stageLabel = (stage: string) => 
    DEAL_STAGES.find((s) => s.value === stage)?.label || stage;

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CalendarIcon className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Calendar</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
            <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[140px] text-center font-medium">
              {format(currentDate, 'MMMM yyyy')}
            </span>
            <Button variant="outline" size="icon" onClick={goToNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        <Card>
          <CardContent className="p-0">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 border-b bg-muted/50">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div
                  key={day}
                  className="py-3 text-center text-sm font-medium text-muted-foreground"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Weeks */}
            {isLoading ? (
              <div className="p-8">
                <Skeleton className="h-96 w-full" />
              </div>
            ) : (
              weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="grid grid-cols-7 border-b last:border-b-0">
                  {week.map((date, dayIndex) => {
                    const deals = getDealsForDate(date);
                    const visibleDeals = deals.slice(0, MAX_VISIBLE_EVENTS);
                    const hiddenCount = deals.length - MAX_VISIBLE_EVENTS;
                    const isCurrentMonth = isSameMonth(date, currentDate);

                    return (
                      <div
                        key={dayIndex}
                        className={cn(
                          'min-h-[120px] border-r last:border-r-0 p-1',
                          !isCurrentMonth && 'bg-muted/30',
                          isToday(date) && 'bg-primary/5'
                        )}
                      >
                        {/* Date Number */}
                        <div
                          className={cn(
                            'flex h-7 w-7 items-center justify-center rounded-full text-sm',
                            isToday(date) && 'bg-primary text-primary-foreground font-bold',
                            !isCurrentMonth && 'text-muted-foreground'
                          )}
                        >
                          {format(date, 'd')}
                        </div>

                        {/* Events */}
                        <div className="mt-1 space-y-1">
                          {visibleDeals.map((deal) => (
                            <button
                              key={deal.id}
                              onClick={() => setSelectedDeal(deal)}
                              className={cn(
                                'w-full truncate rounded border px-1.5 py-0.5 text-left text-xs font-medium transition-colors hover:opacity-80',
                                getEventClassName(deal, date),
                                selectedDeal?.id === deal.id && 'ring-2 ring-primary ring-offset-1'
                              )}
                            >
                              {deal.deal_name || deal.account_name}
                            </button>
                          ))}
                          {hiddenCount > 0 && (
                            <div className="px-1.5 text-xs text-muted-foreground">
                              +{hiddenCount} more
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Selected Deal Panel */}
        {selectedDeal && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Selected Action</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedDeal(null)}
                >
                  Close
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Deal</p>
                    <p className="font-medium">
                      {selectedDeal.deal_name || selectedDeal.account_name}
                    </p>
                  </div>
                  {selectedDeal.deal_name && (
                    <div>
                      <p className="text-sm text-muted-foreground">Account</p>
                      <p className="font-medium">{selectedDeal.account_name}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">Stage</p>
                    <Badge variant="outline">{stageLabel(selectedDeal.stage)}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Next Action</p>
                    <p className="font-medium">{selectedDeal.next_action || 'No action set'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="font-medium">
                      {format(new Date(selectedDeal.next_action_date), 'MMMM d, yyyy')}
                    </p>
                  </div>
                </div>
                <Button onClick={() => navigate(`/deals/${selectedDeal.id}`)}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View Deal
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
