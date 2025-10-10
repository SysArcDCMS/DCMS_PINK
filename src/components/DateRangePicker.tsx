'use client';

import React, { useState } from 'react';
import { Button } from './ui/button';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Card, CardContent } from './ui/card';
import { CalendarIcon, ChevronDown } from 'lucide-react';
import { format, addDays, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addWeeks, subWeeks, addMonths, subMonths } from 'date-fns';
import type { DateRange as ReactDayPickerDateRange } from 'react-day-picker';

export interface DateRange {
  from: Date;
  to: Date;
  preset?: string;
}

interface DateRangePickerProps {
  value?: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}

export default function DateRangePicker({ value, onChange, className }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customRange, setCustomRange] = useState<ReactDayPickerDateRange | undefined>();

  const today = new Date();
  const yesterday = subDays(today, 1);
  const tomorrow = addDays(today, 1);

  const presets = [
    {
      label: 'Today',
      value: 'today',
      range: { from: today, to: today }
    },
    {
      label: 'Yesterday', 
      value: 'yesterday',
      range: { from: yesterday, to: yesterday }
    },
    {
      label: 'Tomorrow',
      value: 'tomorrow', 
      range: { from: tomorrow, to: tomorrow }
    },
    {
      label: 'This Week',
      value: 'this-week',
      range: { from: startOfWeek(today, { weekStartsOn: 0 }), to: endOfWeek(today, { weekStartsOn: 0 }) }
    },
    {
      label: 'Last Week',
      value: 'last-week',
      range: { from: startOfWeek(subWeeks(today, 1), { weekStartsOn: 0 }), to: endOfWeek(subWeeks(today, 1), { weekStartsOn: 0 }) }
    },
    {
      label: 'Next Week',
      value: 'next-week',
      range: { from: startOfWeek(addWeeks(today, 1), { weekStartsOn: 0 }), to: endOfWeek(addWeeks(today, 1), { weekStartsOn: 0 }) }
    },
    {
      label: 'This Month',
      value: 'this-month',
      range: { from: startOfMonth(today), to: endOfMonth(today) }
    },
    {
      label: 'Last Month',
      value: 'last-month', 
      range: { from: startOfMonth(subMonths(today, 1)), to: endOfMonth(subMonths(today, 1)) }
    },
    {
      label: 'Next Month',
      value: 'next-month',
      range: { from: startOfMonth(addMonths(today, 1)), to: endOfMonth(addMonths(today, 1)) }
    },
    {
      label: 'Last 7 Days',
      value: 'last-7-days',
      range: { from: subDays(today, 6), to: today }
    },
    {
      label: 'Last 14 Days', 
      value: 'last-14-days',
      range: { from: subDays(today, 13), to: today }
    },
    {
      label: 'Last 30 Days',
      value: 'last-30-days',
      range: { from: subDays(today, 29), to: today }
    },
    {
      label: 'Custom Range',
      value: 'custom',
      range: null
    }
  ];

  const handlePresetSelect = (presetValue: string) => {
    const preset = presets.find(p => p.value === presetValue);
    if (!preset) return;

    if (preset.value === 'custom') {
      // Initialize custom range with current values
      const initialRange = {
        from: value?.from || today,
        to: value?.to || today
      };
      setCustomRange(initialRange);
      
      // Update the current preset to custom
      onChange({
        from: initialRange.from,
        to: initialRange.to,
        preset: 'custom'
      });
      return;
    }

    if (preset.range) {
      setCustomRange(undefined); // Clear custom range when selecting preset
      onChange({
        from: preset.range.from,
        to: preset.range.to,
        preset: preset.value
      });
      setIsOpen(false);
    }
  };

  const handleCustomRangeSelect = (range: ReactDayPickerDateRange | undefined) => {
    setCustomRange(range);

    if (range?.from && range?.to) {
      onChange({
        from: range.from,
        to: range.to,
        preset: 'custom'
      });
      setIsOpen(false);
    }
  };

  const getDisplayText = (): string => {
    if (!value || !value.from) return 'Select date range';

    const { from, to, preset } = value;

    // Format single day
    if (format(from, 'yyyy-MM-dd') === format(to, 'yyyy-MM-dd')) {
      switch (preset) {
        case 'today':
          return `Today (${format(from, 'MMM d, yyyy')})`;
        case 'yesterday':
          return `Yesterday (${format(from, 'MMM d, yyyy')})`;
        case 'tomorrow':
          return `Tomorrow (${format(from, 'MMM d, yyyy')})`;
        default:
          return format(from, 'MMM d, yyyy');
      }
    }

    // Format date ranges
    switch (preset) {
      case 'this-week':
        return `This Week (${format(from, 'MMM d')} – ${format(to, 'MMM d, yyyy')})`;
      case 'last-week':
        return `Last Week (${format(from, 'MMM d')} – ${format(to, 'MMM d, yyyy')})`;
      case 'next-week':
        return `Next Week (${format(from, 'MMM d')} – ${format(to, 'MMM d, yyyy')})`;
      case 'this-month':
        return `This Month (${format(from, 'MMMM yyyy')})`;
      case 'last-month':
        return `Last Month (${format(from, 'MMMM yyyy')})`;
      case 'next-month':
        return `Next Month (${format(from, 'MMMM yyyy')})`;
      case 'last-7-days':
        return `Last 7 Days (${format(from, 'MMM d')} – ${format(to, 'MMM d, yyyy')})`;
      case 'last-14-days':
        return `Last 14 Days (${format(from, 'MMM d')} – ${format(to, 'MMM d, yyyy')})`;
      case 'last-30-days':
        return `Last 30 Days (${format(from, 'MMM d')} – ${format(to, 'MMM d, yyyy')})`;
      case 'custom':
        return `Custom Range (${format(from, 'MMM d')} – ${format(to, 'MMM d, yyyy')})`;
      default:
        return `${format(from, 'MMM d')} – ${format(to, 'MMM d, yyyy')}`;
    }
  };

  const currentPreset = value?.preset || 'today';
  const isCustomSelected = currentPreset === 'custom';

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={`justify-start text-left font-normal ${className}`}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {getDisplayText()}
          <ChevronDown className="ml-auto h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex">
          {/* Presets sidebar */}
          <Card className="w-48 border-r rounded-r-none">
            <CardContent className="p-3">
              <div className="space-y-1">
                {presets.map((preset) => (
                  <Button
                    key={preset.value}
                    variant={currentPreset === preset.value ? "default" : "ghost"}
                    size="sm"
                    className="w-full justify-start text-sm"
                    onClick={() => handlePresetSelect(preset.value)}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Calendar for custom range */}
          {isCustomSelected && (
            <div className="p-3">
              <Calendar
                mode="range"
                selected={customRange}
                onSelect={handleCustomRangeSelect}
                numberOfMonths={2}
                className="rounded-md border-0"
              />
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}