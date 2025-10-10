'use client';

import React, { useState } from 'react';
import { Button } from './ui/button';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';

import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { CalendarIcon, ChevronDown } from 'lucide-react';
import { format, addDays, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addWeeks, subWeeks, addMonths, subMonths, parse } from 'date-fns';

export interface DateRange {
  from: Date;
  to: Date;
  preset?: string;
}

interface DateRangeDialogProps {
  value?: DateRange;
  onChange: (range: DateRange) => void;
  trigger?: React.ReactNode;
  className?: string;
}

export default function DateRangeDialog({ value, onChange, trigger, className }: DateRangeDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [fromDate, setFromDate] = useState<Date>(value?.from || new Date());
  const [toDate, setToDate] = useState<Date>(value?.to || new Date());
  const [fromInput, setFromInput] = useState<string>(format(value?.from || new Date(), 'yyyy-MM-dd'));
  const [toInput, setToInput] = useState<string>(format(value?.to || new Date(), 'yyyy-MM-dd'));


  // Sync with external value changes
  React.useEffect(() => {
    if (value?.from) {
      setFromDate(value.from);
      setFromInput(format(value.from, 'yyyy-MM-dd'));
    }
    if (value?.to) {
      setToDate(value.to);
      setToInput(format(value.to, 'yyyy-MM-dd'));
    }
  }, [value]);

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
    }
  ];

  const handlePresetSelect = (preset: typeof presets[0]) => {
    if (preset.range) {
      setFromDate(preset.range.from);
      setToDate(preset.range.to);
      setFromInput(format(preset.range.from, 'yyyy-MM-dd'));
      setToInput(format(preset.range.to, 'yyyy-MM-dd'));
    }
  };

  const handleFromInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFromInput(e.target.value);
    try {
      const date = parse(e.target.value, 'yyyy-MM-dd', new Date());
      if (!isNaN(date.getTime())) {
        setFromDate(date);
      }
    } catch {
      // Invalid date, keep the current date
    }
  };

  const handleToInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setToInput(e.target.value);
    try {
      const date = parse(e.target.value, 'yyyy-MM-dd', new Date());
      if (!isNaN(date.getTime())) {
        setToDate(date);
      }
    } catch {
      // Invalid date, keep the current date
    }
  };



  const handleApply = () => {
    // Ensure toDate is not before fromDate
    const finalFromDate = fromDate;
    const finalToDate = toDate < fromDate ? fromDate : toDate;
    
    onChange({
      from: finalFromDate,
      to: finalToDate,
      preset: 'custom'
    });
    setIsOpen(false);
  };

  const handlePresetApply = (preset: typeof presets[0]) => {
    if (preset.range) {
      onChange({
        from: preset.range.from,
        to: preset.range.to,
        preset: preset.value
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

  const defaultTrigger = (
    <Button
      variant="outline_pink"
      className={`justify-start text-left font-normal min-w-64 h-10 bg-input-background border-border hover:bg-accent/50 bg-CustomPink3 ${className}`}
    >
      <CalendarIcon className="mr-2 h-4 w-4 text-CustomPink1" />
      <span className="flex-1 text-sm">{getDisplayText()}</span>
      <ChevronDown className="ml-2 h-4 w-4 text-muted-foreground" />
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl p-0 overflow-hidden border shadow-lg bg-CustomPink3">
        <div className="p-6">
          <DialogHeader>
            <DialogTitle className='font-bold text-CustomPink1'>Custom Date Range</DialogTitle>
            <DialogDescription>
              Enter specific dates or use the calendar picker
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex gap-8 mt-6">
            {/* Custom Date Range Section */}
            <div className="flex-1 space-y-6">
              <div className="space-y-6">
                {/* From Date */}
                <div className="space-y-2">
                  <Label htmlFor="from-date" className="text-sm font-bold text-CustomPink1">From Date</Label>
                  <Input
                    id="from-date"
                    type="date"
                    value={fromInput}
                    onChange={handleFromInputChange}
                    className="bg-input-background border-border focus:ring-2 focus:ring-primary/20 h-10 font-bold text-CustomPink1"
                    data-slot="input"
                  />
                </div>

                {/* To Date */}
                <div className="space-y-2">
                  <Label htmlFor="to-date" className="text-sm font-bold text-CustomPink1">To Date</Label>
                  <Input
                    id="to-date"
                    type="date"
                    value={toInput}
                    onChange={handleToInputChange}
                    className="bg-input-background border-border focus:ring-2 focus:ring-primary/20 h-10 font-bold text-CustomPink1"
                    data-slot="input"
                  />
                </div>
              </div>

              {/* Apply Button */}
              <div className="flex justify-end pt-4 border-t">
                <Button onClick={handleApply} className="px-8 py-2 bg-primary hover:bg-primary/90">
                  Apply Date Range
                </Button>
              </div>
            </div>

            {/* Separator */}
            <Separator orientation="vertical" className="h-auto" />

            {/* Quick Presets */}
            <div className="w-80 space-y-4">
              <h3 className="text-lg font-bold text-CustomPink1">Quick Presets</h3>
              <ScrollArea className="h-96 pr-2">
                <div className="space-y-1">
                  {presets.map((preset) => (
                    <Button
                      key={preset.value}
                      variant="ghost_pink"
                      size="sm"
                      className="w-full justify-start text-sm h-auto py-3 px-3 hover:bg-accent/80 transition-colors rounded-lg border border-transparent hover:border-border/50 font-bold text-CustomPink1"
                      onClick={() => handlePresetApply(preset)}
                    >
                      <div className="text-left w-full">
                        <div className="font-bold text-CustomPink1">{preset.label}</div>
                        <div className="text-xs text-muted-foreground mt-0.5 text-CustomPink2">
                          {preset.range && (
                            format(preset.range.from, 'yyyy-MM-dd') === format(preset.range.to, 'yyyy-MM-dd')
                              ? format(preset.range.from, 'MMM d, yyyy')
                              : `${format(preset.range.from, 'MMM d')} – ${format(preset.range.to, 'MMM d, yyyy')}`
                          )}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}