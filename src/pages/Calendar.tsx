import { useState, useRef } from 'react';
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
  startOfDay,
} from 'date-fns';
import AppLayout from '@/components/layout/AppLayout';
import { useCalendarItems, CalendarItem } from '@/hooks/useCalendarItems';
import { usePipelineStages } from '@/hooks/usePipelineStages';
import { useDeals } from '@/hooks/useDeals';
import { useContacts } from '@/hooks/useContacts';
import { useInteractions } from '@/hooks/useInteractions';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, ExternalLink, User, Briefcase, GripVertical, Check, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const MAX_VISIBLE_EVENTS = 3;

export default function CalendarPage() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedItem, setSelectedItem] = useState<CalendarItem | null>(null);
  const [dropTargetDate, setDropTargetDate] = useState<string | null>(null);
  const dragItemRef = useRef<CalendarItem | null>(null);

  const { data: itemsByDate, isLoading } = useCalendarItems(currentDate);
  const { stages } = usePipelineStages();
  const { updateDeal } = useDeals();
  const { updateContact } = useContacts();
  const { createInteraction } = useInteractions();
  const { workspaceId } = useAuth();

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

  const getItemsForDate = (date: Date): CalendarItem[] => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return itemsByDate?.[dateStr] || [];
  };

  const today = startOfDay(new Date());
  
  const getEventClassName = (item: CalendarItem, date: Date) => {
    const itemDate = startOfDay(date);
    const isPast = isBefore(itemDate, today);
    const isContact = item.type === 'contact';

    // Color coding: blue=past/completed, green=upcoming, red=overdue
    if (isPast && !isToday(date)) {
      // Overdue (red) - still has an action date in the past
      return isContact 
        ? 'bg-red-500/20 text-red-700 border-red-500/30' 
        : 'bg-red-500/20 text-red-700 border-red-500/30';
    }
    if (isToday(date)) {
      return 'bg-green-500/20 text-green-700 border-green-500/30';
    }
    // Future = upcoming (green)
    return 'bg-green-500/10 text-green-700 border-green-500/20';
  };

  const stageLabel = (stage?: string) => {
    if (!stage) return 'N/A';
    return stages.find((s) => s.value === stage)?.label || stage;
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, item: CalendarItem) => {
    dragItemRef.current = item;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', item.id);
    // Add a slight delay to allow the drag image to render
    (e.target as HTMLElement).style.opacity = '0.5';
  };

  const handleDragEnd = (e: React.DragEvent) => {
    (e.target as HTMLElement).style.opacity = '1';
    setDropTargetDate(null);
    dragItemRef.current = null;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e: React.DragEvent, dateStr: string) => {
    e.preventDefault();
    setDropTargetDate(dateStr);
  };

  const handleDragLeave = (e: React.DragEvent, dateStr: string) => {
    const relatedTarget = e.relatedTarget as HTMLElement;
    const currentTarget = e.currentTarget as HTMLElement;
    if (!currentTarget.contains(relatedTarget)) {
      if (dropTargetDate === dateStr) {
        setDropTargetDate(null);
      }
    }
  };

  const handleDrop = (e: React.DragEvent, dateStr: string) => {
    e.preventDefault();
    setDropTargetDate(null);
    const item = dragItemRef.current;
    if (!item) return;

    // Don't update if dropped on same date
    if (item.next_action_date === dateStr) return;

    if (item.type === 'deal') {
      updateDeal({ id: item.id, next_action_date: dateStr });
      toast.success(`Deal moved to ${format(new Date(dateStr), 'MMM d, yyyy')}`);
    } else {
      updateContact.mutate({ id: item.id, next_action_date: dateStr });
      toast.success(`Contact moved to ${format(new Date(dateStr), 'MMM d, yyyy')}`);
    }
    dragItemRef.current = null;
  };

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

        {/* Legend */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-blue-500/50" />
            <span className="text-muted-foreground">Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-green-500/50" />
            <span className="text-muted-foreground">Upcoming</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-red-500/50" />
            <span className="text-muted-foreground">Overdue</span>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <GripVertical className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">Drag to reschedule</span>
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
                    const dateStr = format(date, 'yyyy-MM-dd');
                    const items = getItemsForDate(date);
                    const visibleItems = items.slice(0, MAX_VISIBLE_EVENTS);
                    const hiddenCount = items.length - MAX_VISIBLE_EVENTS;
                    const isCurrentMonth = isSameMonth(date, currentDate);
                    const isDropTarget = dropTargetDate === dateStr;

                    return (
                      <div
                        key={dayIndex}
                        className={cn(
                          'min-h-[120px] border-r last:border-r-0 p-1 transition-colors',
                          !isCurrentMonth && 'bg-muted/30',
                          isToday(date) && 'bg-primary/5',
                          isDropTarget && 'bg-primary/10 ring-2 ring-inset ring-primary/40'
                        )}
                        onDragOver={handleDragOver}
                        onDragEnter={(e) => handleDragEnter(e, dateStr)}
                        onDragLeave={(e) => handleDragLeave(e, dateStr)}
                        onDrop={(e) => handleDrop(e, dateStr)}
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
                          {visibleItems.map((item) => (
                            <button
                              key={`${item.type}-${item.id}`}
                              draggable
                              onDragStart={(e) => handleDragStart(e, item)}
                              onDragEnd={handleDragEnd}
                              onClick={() => setSelectedItem(item)}
                              className={cn(
                                'w-full truncate rounded border px-1.5 py-0.5 text-left text-xs font-medium transition-colors hover:opacity-80 flex items-center gap-1 cursor-grab active:cursor-grabbing',
                                getEventClassName(item, date),
                                selectedItem?.id === item.id && selectedItem?.type === item.type && 'ring-2 ring-primary ring-offset-1'
                              )}
                            >
                              {item.type === 'contact' ? (
                                <User className="h-3 w-3 shrink-0" />
                              ) : (
                                <Briefcase className="h-3 w-3 shrink-0" />
                              )}
                              <span className="truncate">{item.name}</span>
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

        {/* Selected Item Panel */}
        {selectedItem && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  {selectedItem.type === 'contact' ? (
                    <User className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <Briefcase className="h-5 w-5 text-primary" />
                  )}
                  Selected {selectedItem.type === 'contact' ? 'Contact' : 'Deal'} Action
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedItem(null)}
                >
                  Close
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {selectedItem.type === 'contact' ? 'Contact' : 'Deal'}
                    </p>
                    <p className="font-medium">{selectedItem.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Account</p>
                    <p className="font-medium">{selectedItem.account_name}</p>
                  </div>
                  {selectedItem.type === 'deal' && selectedItem.stage && (
                    <div>
                      <p className="text-sm text-muted-foreground">Stage</p>
                      <Badge variant="outline">{stageLabel(selectedItem.stage)}</Badge>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">Next Action</p>
                    <p className="font-medium">{selectedItem.next_action || 'No action set'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="font-medium">
                      {format(new Date(selectedItem.next_action_date), 'MMMM d, yyyy')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Type</p>
                    <Badge variant={selectedItem.type === 'contact' ? 'secondary' : 'default'}>
                      {selectedItem.type === 'contact' ? 'Contact' : 'Deal'}
                    </Badge>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button onClick={() => navigate(selectedItem.type === 'contact' ? `/contacts/${selectedItem.id}` : `/deals/${selectedItem.id}`)}>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View {selectedItem.type === 'contact' ? 'Contact' : 'Deal'}
                  </Button>
                  <Button
                    variant="default"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => {
                      if (selectedItem.type === 'deal') {
                        createInteraction({
                          deal_id: selectedItem.id,
                          contact_id: null,
                          type: 'follow_up',
                          summary: selectedItem.next_action || 'Completed action',
                          occurred_at: new Date(selectedItem.next_action_date).toISOString(),
                          objections: null,
                          commitments: null,
                          next_action: null,
                          next_action_date: null,
                          external_ref: null,
                        });
                        updateDeal({ id: selectedItem.id, next_action_date: null, next_action: null });
                      } else {
                        updateContact.mutate({ id: selectedItem.id, next_action_date: null, next_action: null });
                      }
                      toast.success('Marked as completed');
                      setSelectedItem(null);
                    }}
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Completed
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      if (selectedItem.type === 'deal') {
                        updateDeal({ id: selectedItem.id, next_action_date: null, next_action: null });
                      } else {
                        updateContact.mutate({ id: selectedItem.id, next_action_date: null, next_action: null });
                      }
                      toast.success('Action removed');
                      setSelectedItem(null);
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
