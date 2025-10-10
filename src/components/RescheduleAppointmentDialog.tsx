'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Calendar, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { CalendarPopover } from './CalendarPopover';
import { TimeSlotGrid } from './TimeSlotGrid';
import { useAvailableSlots, SlotRequest } from '../utils/slotCache';
import { Appointment } from '../types';
import { toast } from 'sonner';

interface RescheduleAppointmentDialogProps {
  appointment: Appointment | null;
  isOpen: boolean;
  onClose: () => void;
  onReschedule: () => void;
  isLoading?: boolean;
}

export const RescheduleAppointmentDialog: React.FC<RescheduleAppointmentDialogProps> = ({
  appointment,
  isOpen,
  onClose,
  onReschedule,
  isLoading = false
}) => {
  const [newDate, setNewDate] = useState<Date | undefined>(undefined);
  const [newTimeSlot, setNewTimeSlot] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get service details for duration calculation
  const serviceDetails = appointment?.serviceDetails?.[0];
  const serviceDuration = serviceDetails?.duration || 60;
  const bufferTime = serviceDetails?.buffer || 15;

  // Create request object for slot caching
  const slotRequest: SlotRequest | null = newDate ? {
    date: newDate,
    serviceDuration,
    bufferTime
  } : null;

  // Use the available slots hook
  const {
    data: availableSlots = [],
    error: slotsError,
    isLoading: loadingSlots,
    mutate: mutateSlots,
  } = useAvailableSlots(slotRequest);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setNewDate(undefined);
      setNewTimeSlot('');
    }
  }, [isOpen]);

  const handleDateChange = useCallback((date: Date | undefined) => {
    setNewDate(date);
    setNewTimeSlot(''); // Reset time slot when date changes
  }, []);

  const handleTimeSlotChange = useCallback((timeSlot: string) => {
    setNewTimeSlot(timeSlot);
  }, []);

  const handleSubmit = async () => {
    if (!appointment || !newDate || !newTimeSlot) {
      toast.error('Please select both date and time');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/appointments/${appointment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: format(newDate, 'yyyy-MM-dd'),
          time: newTimeSlot.split('-')[0], // Start time only
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reschedule appointment');
      }

      // Invalidate slots cache since appointment was updated
      mutateSlots();
      
      toast.success('Appointment rescheduled successfully');
      onReschedule();
      onClose();
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to reschedule appointment';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setNewDate(undefined);
    setNewTimeSlot('');
    onClose();
  };

  const formatCurrentDateTime = () => {
    if (!appointment?.date || !appointment?.time) return 'Not set';
    try {
      const currentDate = format(new Date(appointment.date), 'EEEE, MMM dd, yyyy');
      const [hours, minutes] = appointment.time.split(':');
      const hourNum = parseInt(hours);
      const ampm = hourNum >= 12 ? 'PM' : 'AM';
      const displayHour = hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum;
      const currentTime = `${displayHour}:${minutes} ${ampm}`;
      return `${currentDate} at ${currentTime}`;
    } catch {
      return 'Invalid date/time';
    }
  };

  if (!appointment) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] rounded-lg border-1 border-CustomPink1 bg-CustomPink3">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-bold text-CustomPink1">
            <Calendar className="h-5 w-5" />
            Reschedule Appointment
          </DialogTitle>
          <DialogDescription>
            Update the date and time for this appointment
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Current Appointment Info */}
          <div className="bg-muted/50 p-4 rounded-lg ">
            <h4 className="font-medium mb-2 font-bold text-CustomPink1">Current Appointment</h4>
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-bold text-CustomPink1">Patient:</span>
                <span className="font-bold">{appointment.patientName}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-CustomPink1">Service:</span>
                <span className="font-bold">{serviceDetails?.name || appointment.service}</span>
              </div>
              <div className="flex items-center gap-2 font-bold text-CustomPink1">
                <Clock className="h-4 w-4" />
                <span>{formatCurrentDateTime()}</span>
              </div>
            </div>
          </div>

          {/* New Date Selection */}
          <div className="space-y-2">
            <Label className="font-bold text-CustomPink1">New Date *</Label>
            <CalendarPopover
              className='rounded-lg border-1 border-CustomPink1 bg-CustomPink3'
              date={newDate}
              onSelect={handleDateChange}
              placeholder="Select new date"
              disabled={isSubmitting || isLoading}
            />
          </div>

          {/* New Time Slot Selection */}
          <div className="space-y-2">
            <Label className="font-bold text-CustomPink1">Available Time Slots *</Label>
            {newDate ? (
              <TimeSlotGrid
                slots={availableSlots}
                selectedSlot={newTimeSlot}
                onSlotSelect={handleTimeSlotChange}
                loading={loadingSlots}
                error={slotsError ? 'Failed to load available slots' : undefined}
                disabled={isSubmitting || isLoading}
              />
            ) : (
              <div className="p-4 text-center text-muted-foreground bg-muted/30 rounded-md">
                <Clock className="h-4 w-4 mx-auto mb-2" />
                <p className="text-sm">Please select a date first to view available time slots</p>
              </div>
            )}
          </div>

          {/* Warning Message */}
          {newDate && newTimeSlot && (
            <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-md">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-800">
                <p className="font-medium">Confirmation Required</p>
                <p>
                  The appointment will be moved to{' '}
                  <strong>{format(newDate, 'EEEE, MMM dd, yyyy')}</strong> at{' '}
                  <strong>
                    {(() => {
                      try {
                        const [startTime] = newTimeSlot.split('-');
                        const [hours, minutes] = startTime.split(':');
                        const hourNum = parseInt(hours);
                        const minuteNum = parseInt(minutes);
                        const ampm = hourNum >= 12 ? 'PM' : 'AM';
                        const displayHour = hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum;
                        return `${displayHour}:${minutes} ${ampm}`;
                      } catch {
                        return newTimeSlot.split('-')[0] || newTimeSlot;
                      }
                    })()}
                  </strong>
                  . This action cannot be undone.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline_pink"
            onClick={handleCancel}
            disabled={isSubmitting || isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              isLoading ||
              !newDate ||
              !newTimeSlot ||
              loadingSlots
            }
          >
            {isSubmitting ? 'Rescheduling...' : 'Reschedule Appointment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RescheduleAppointmentDialog;