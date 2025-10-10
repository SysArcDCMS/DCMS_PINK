'use client';

import React from 'react';
import { cn } from './ui/utils';
import { TimeSlot } from '../utils/slotCache';
import { Clock, CheckCircle2 } from 'lucide-react';

interface TimeSlotGridProps {
  slots: TimeSlot[];
  selectedSlot: string;
  onSlotSelect: (slot: string) => void;
  loading?: boolean;
  error?: string;
  disabled?: boolean;
  className?: string;
}

const formatTimeSlot = (startTime: string, endTime: string): string => {
  const formatTime = (time: string) => {
    const [hour, minute] = time.split(':');
    const hourNum = parseInt(hour);
    const ampm = hourNum >= 12 ? 'PM' : 'AM';
    const displayHour = hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum;
    return `${displayHour}:${minute} ${ampm}`;
  };

  return `${formatTime(startTime)} - ${formatTime(endTime)}`;
};

export const TimeSlotGrid: React.FC<TimeSlotGridProps> = ({
  slots,
  selectedSlot,
  onSlotSelect,
  loading = false,
  error,
  disabled = false,
  className
}) => {
  if (loading) {
    return (
      <div className={cn("p-4 text-center", className)}>
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Clock className="h-4 w-4 animate-pulse" />
          <span>Loading available time slots...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("p-4 text-center text-red-600 bg-red-50 rounded-md", className)}>
        <p className="text-sm">{error}</p>
        <p className="text-xs mt-1"><strong>Please try again or call us at (02)8671 9697 or 0962 850 1012</strong></p>
      </div>
    );
  }

  if (!slots || slots.length === 0) {
    return (
      <div className={cn("p-4 text-center text-orange-600 bg-orange-50 rounded-md", className)}>
        <p className="text-sm">No available slots for this date.</p>
        <p className="text-xs mt-1">Please try another date or call us directly at <strong>(02)8671 9697 or 0962 850 1012</strong></p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="h-4 w-4" />
        <span>Available time slots ({slots.length})</span>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {slots.map((slot) => {
          const slotValue = `${slot.startTime}-${slot.endTime}`;
          const isSelected = selectedSlot === slotValue;
          
          return (
            <button
              key={slotValue}
              type="button"
              onClick={() => !disabled && onSlotSelect(slotValue)}
              disabled={disabled}
              className={cn(
                "relative p-3 rounded-lg border-CustomPink1 border-2 transition-all duration-200 text-sm font-medium",
                "hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/20",
                disabled && "opacity-50 cursor-not-allowed",
                !disabled && "hover:shadow-md hover:border-CustomPink1 hover:bg-CustomPink2",
                isSelected
                  ? "border-CustomPink1 bg-CustomPink1 text-black shadow-md"
                  : "border-CustomPink1 bg-card"
              )}
            >
              <div className="flex flex-col items-center gap-1">
                <span className={cn(
                  "font-medium",
                  isSelected ? "text-white" : "text-foreground"
                )}>
                  {formatTimeSlot(slot.startTime, slot.endTime)}
                </span>
                
                {isSelected && (
                  <CheckCircle2 className="h-3 w-3 text-white" />
                )}
              </div>
              
              {/* Selection indicator */}
              {isSelected && (
                <div className="absolute inset-0 rounded-lg ring-2 ring-CustomPink1 ring-offset-1"/>
              )}
            </button>
          );
        })}
      </div>
      
      <div className="text-xs text-muted-foreground text-center">
        <p><strong>Select your preferred time slot</strong></p>
      </div>
    </div>
  );
};