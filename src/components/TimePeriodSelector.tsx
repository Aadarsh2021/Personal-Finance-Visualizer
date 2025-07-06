'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, ChevronDownIcon } from 'lucide-react';
import { format, subMonths, subYears, startOfMonth, endOfMonth } from 'date-fns';
import { cn } from '@/lib/utils';

export type TimePeriod = '1m' | '3m' | '1y' | 'custom';

export interface TimeRange {
  start: Date;
  end: Date;
  period: TimePeriod;
}

interface TimePeriodSelectorProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
  className?: string;
}

const TIME_PERIODS = [
  { value: '1m', label: '1 Month' },
  { value: '3m', label: '3 Months' },
  { value: '1y', label: '1 Year' },
  { value: 'custom', label: 'Custom Range' },
] as const;

export function TimePeriodSelector({ value, onChange, className }: TimePeriodSelectorProps) {
  const [isCustomOpen, setIsCustomOpen] = useState(false);

  const handlePeriodChange = (period: TimePeriod) => {
    const now = new Date();
    let start: Date;
    let end: Date = now; // Use current date instead of end of month

    switch (period) {
      case '1m':
        start = startOfMonth(subMonths(now, 1));
        break;
      case '3m':
        start = startOfMonth(subMonths(now, 3));
        break;
      case '1y':
        start = startOfMonth(subYears(now, 1));
        break;
      case 'custom':
        // Keep current custom range or set default
        if (value.period === 'custom') {
          start = value.start;
          end = value.end;
        } else {
          start = startOfMonth(subMonths(now, 1));
          end = now;
        }
        setIsCustomOpen(true);
        break;
      default:
        start = startOfMonth(subMonths(now, 1));
    }

    onChange({ start, end, period });
  };

  const handleCustomDateChange = (date: Date | undefined, isStart: boolean) => {
    if (!date) return;

    // Prevent selecting future dates
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    if (date > today) {
      return; // Don't allow future dates
    }

    const newRange = {
      start: isStart ? date : value.start,
      end: isStart ? value.end : date,
      period: 'custom' as TimePeriod,
    };

    // Ensure start is before end
    if (newRange.start > newRange.end) {
      if (isStart) {
        newRange.end = newRange.start;
      } else {
        newRange.start = newRange.end;
      }
    }

    onChange(newRange);
  };

  const getDisplayText = () => {
    if (value.period === 'custom') {
      return `${format(value.start, 'MMM d')} - ${format(value.end, 'MMM d, yyyy')}`;
    }
    const period = TIME_PERIODS.find(p => p.value === value.period);
    return period?.label || '1 Month';
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="justify-between min-w-[180px]">
            <span className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              {getDisplayText()}
            </span>
            <ChevronDownIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-3 border-b">
            <div className="grid grid-cols-2 gap-2">
              {TIME_PERIODS.map((period) => (
                <Button
                  key={period.value}
                  variant={value.period === period.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePeriodChange(period.value as TimePeriod)}
                  className="justify-start"
                >
                  {period.label}
                </Button>
              ))}
            </div>
          </div>
                     {value.period === 'custom' && (
             <div className="p-3">
               <div className="space-y-3">
                 <div>
                   <label className="text-sm font-medium">Start Date</label>
                   <Calendar
                     mode="single"
                     selected={value.start}
                     onSelect={(date) => handleCustomDateChange(date, true)}
                     className="rounded-md border"
                     disabled={(date) => date > new Date()}
                   />
                 </div>
                 <div>
                   <label className="text-sm font-medium">End Date</label>
                   <Calendar
                     mode="single"
                     selected={value.end}
                     onSelect={(date) => handleCustomDateChange(date, false)}
                     className="rounded-md border"
                     disabled={(date) => date > new Date()}
                   />
                 </div>
                 <div className="text-xs text-muted-foreground text-center">
                   Future dates are disabled as transactions can only be recorded for past dates
                 </div>
               </div>
             </div>
           )}
        </PopoverContent>
      </Popover>
    </div>
  );
} 