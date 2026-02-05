import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays } from 'date-fns';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { CalendarMonthView } from '@/components/social-media/CalendarMonthView';
import { CalendarWeekView } from '@/components/social-media/CalendarWeekView';
import { CalendarDayView } from '@/components/social-media/CalendarDayView';
import { CalendarFilters } from '@/components/social-media/CalendarFilters';
import { CalendarLegend } from '@/components/social-media/CalendarLegend';
import { ContentDrawer } from '@/components/social-media/ContentDrawer';
import { useSMCalendarData } from '@/hooks/useSMCalendarData';
import { useSMCampaigns } from '@/hooks/useSMCampaigns';
import type { SMPlatform, SlotStatus } from '@/lib/socialMediaConstants';

type ViewMode = 'month' | 'week' | 'day';

export default function ContentCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [selectedPlatforms, setSelectedPlatforms] = useState<SMPlatform[]>([]);
  const [selectedCampaignIds, setSelectedCampaignIds] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<SlotStatus[]>([]);
  
  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<SMPlatform | null>(null);

  const { campaigns } = useSMCampaigns();

  // Calculate date range based on view mode
  const dateRange = useMemo(() => {
    if (viewMode === 'month') {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      return {
        start: format(startOfWeek(monthStart), 'yyyy-MM-dd'),
        end: format(endOfWeek(monthEnd), 'yyyy-MM-dd'),
      };
    } else if (viewMode === 'week') {
      const weekStart = startOfWeek(currentDate);
      const weekEnd = endOfWeek(currentDate);
      return {
        start: format(weekStart, 'yyyy-MM-dd'),
        end: format(weekEnd, 'yyyy-MM-dd'),
      };
    } else {
      return {
        start: format(currentDate, 'yyyy-MM-dd'),
        end: format(currentDate, 'yyyy-MM-dd'),
      };
    }
  }, [currentDate, viewMode]);

  const { data: calendarData, isLoading } = useSMCalendarData(dateRange);

  // Navigation handlers
  const goToPrevious = () => {
    if (viewMode === 'month') {
      setCurrentDate(subMonths(currentDate, 1));
    } else if (viewMode === 'week') {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(subDays(currentDate, 1));
    }
  };

  const goToNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(addMonths(currentDate, 1));
    } else if (viewMode === 'week') {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(addDays(currentDate, 1));
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleDayClick = (date: string, platform?: SMPlatform) => {
    setSelectedDate(date);
    setSelectedPlatform(platform || null);
    setDrawerOpen(true);
  };

  // Get header text based on view mode
  const getHeaderText = () => {
    if (viewMode === 'month') {
      return format(currentDate, 'MMMM yyyy');
    } else if (viewMode === 'week') {
      const weekStart = startOfWeek(currentDate);
      const weekEnd = endOfWeek(currentDate);
      return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
    } else {
      return format(currentDate, 'EEEE, MMMM d, yyyy');
    }
  };

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goToPrevious}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={goToNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={goToToday} className="ml-2">
            Today
          </Button>
          <h2 className="text-xl font-semibold ml-4">{getHeaderText()}</h2>
        </div>

        <div className="flex items-center gap-4">
          <ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && setViewMode(v as ViewMode)}>
            <ToggleGroupItem value="month" aria-label="Month view">
              Month
            </ToggleGroupItem>
            <ToggleGroupItem value="week" aria-label="Week view">
              Week
            </ToggleGroupItem>
            <ToggleGroupItem value="day" aria-label="Day view">
              Day
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      {/* Filters */}
      <CalendarFilters
        campaigns={campaigns}
        selectedPlatforms={selectedPlatforms}
        onPlatformsChange={setSelectedPlatforms}
        selectedCampaignIds={selectedCampaignIds}
        onCampaignsChange={setSelectedCampaignIds}
        selectedStatuses={selectedStatuses}
        onStatusesChange={setSelectedStatuses}
      />

      {/* Legend */}
      <CalendarLegend campaigns={campaigns} />

      {/* Calendar Views */}
      {viewMode === 'month' && (
        <CalendarMonthView
          currentDate={currentDate}
          calendarData={calendarData?.calendarData || {}}
          onDayClick={handleDayClick}
          selectedPlatforms={selectedPlatforms}
          selectedCampaignIds={selectedCampaignIds}
          isLoading={isLoading}
        />
      )}

      {viewMode === 'week' && (
        <CalendarWeekView
          currentDate={currentDate}
          calendarData={calendarData?.calendarData || {}}
          contentByDate={calendarData?.contentByDate || {}}
          onCellClick={handleDayClick}
          selectedPlatforms={selectedPlatforms}
          selectedCampaignIds={selectedCampaignIds}
          isLoading={isLoading}
        />
      )}

      {viewMode === 'day' && (
        <CalendarDayView
          currentDate={currentDate}
          calendarData={calendarData?.calendarData || {}}
          contentByDate={calendarData?.contentByDate || {}}
          onAddContent={(platform) => handleDayClick(format(currentDate, 'yyyy-MM-dd'), platform)}
          selectedPlatforms={selectedPlatforms}
          isLoading={isLoading}
        />
      )}

      {/* Content Drawer */}
      <ContentDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        selectedDate={selectedDate}
        selectedPlatform={selectedPlatform}
        campaigns={campaigns}
        contentItems={selectedDate ? calendarData?.contentByDate?.[selectedDate] || [] : []}
      />
    </div>
  );
}
