'use client';

import React from 'react';
import { Button } from './ui/button';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { format, startOfDay, isAfter, isSameDay } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from './ui/utils';

interface CalendarPopoverProps {
  date: Date | undefined;
  onSelect: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const CalendarPopover: React.FC<CalendarPopoverProps> = ({
  date,
  onSelect,
  placeholder = "Pick date",
  disabled = false,
  className
}) => {
  const [open, setOpen] = React.useState(false);
  
  // Use proper date-fns function to get start of today
  const today = startOfDay(new Date());

  const handleDateSelect = (selectedDate: Date | undefined) => {
    onSelect(selectedDate);
    setOpen(false); // Close popover when date is selected
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "EEEE, MMM dd, yyyy") : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-CustomPink3 border-CustomPink1 border-2" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleDateSelect}
          disabled={(date) => {
            // Disable past dates (only allow current and future dates)
            const dateToCheck = startOfDay(date);
            const currentDate = startOfDay(new Date());
            
            // Allow today and future dates only
            return dateToCheck < currentDate;
          }}
          initialFocus
          weekStartsOn={0} // Start week on Sunday for proper alignment (0 = Sunday, 1 = Monday)
          showOutsideDays={false}
          className="rounded-md border"
          fixedWeeks={false}
        />
      </PopoverContent>
    </Popover>
  );
};