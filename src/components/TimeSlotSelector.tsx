'use client';

import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { formatTimeSlotForDisplay } from '@/utils/timeUtils';
import { LoadingSpinner } from './LoadingSpinner';

interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
  conflictReason?: string;
}

interface TimeSlotSelectorProps {
  slots: TimeSlot[];
  selectedSlot: string;
  onSlotSelect: (slot: string) => void;
  loading?: boolean;
  disabled?: boolean;
  error?: string;
  placeholder?: string;
  showServiceAndDate?: boolean;
  serviceName?: string;
  date?: Date;
}

export const TimeSlotSelector: React.FC<TimeSlotSelectorProps> = ({
  slots,
  selectedSlot,
  onSlotSelect,
  loading = false,
  disabled = false,
  error,
  placeholder = "Select an available time slot",
  showServiceAndDate = false,
  serviceName,
  date
}) => {
  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-md text-sm text-gray-500">
        <LoadingSpinner size="sm" />
        Checking availability...
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="text-sm text-red-600 p-3 bg-red-50 rounded-md">
        {error}
      </div>
    );
  }

  // Show message when service and date aren't selected
  if (showServiceAndDate && (!serviceName || !date)) {
    return (
      <div className="text-sm text-gray-500 p-3 bg-gray-50 rounded-md">
        <strong>Please select a service and date first to see available time slots.</strong>
      </div>
    );
  }

  // Show no slots available
  if (slots.length === 0) {
    return (
      <div className="text-sm text-red-600 p-3 bg-red-50 rounded-md">
        No available slots for this date. Please try another date or call us directly at <strong>(555) 123-DENTAL</strong>.
      </div>
    );
  }

  return (
    <Select 
      value={selectedSlot} 
      onValueChange={onSlotSelect}
      disabled={disabled}
    >
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {slots.map((slot) => (
          <SelectItem 
            key={`${slot.startTime}-${slot.endTime}`} 
            value={`${slot.startTime}-${slot.endTime}`}
          >
            {formatTimeSlotForDisplay(`${slot.startTime}-${slot.endTime}`)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};