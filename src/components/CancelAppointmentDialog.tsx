'use client';

import React, { useState } from 'react';
import { Button } from './ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { X, Clock, User, Stethoscope, AlertTriangle, FileText, Package } from 'lucide-react';
import { Appointment } from '../types';

interface CancelAppointmentDialogProps {
  appointment: Appointment | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (appointmentId: string, reason: string, notes?: string) => void;
  isLoading: boolean;
}

const cancellationReasons = [
  { value: 'no-show', label: 'No-show', icon: Clock, description: 'Patient did not show up for appointment' },
  { value: 'patient-cancelled', label: 'Patient Cancelled', icon: User, description: 'Patient requested cancellation' },
  { value: 'clinic-cancelled', label: 'Clinic Cancelled', icon: Stethoscope, description: 'Clinic cancelled due to operational reasons' },
  { value: 'stock-shortage', label: 'Stock Shortage', icon: Package, description: 'Required materials or supplies unavailable' },
  { value: 'emergency', label: 'Emergency', icon: AlertTriangle, description: 'Emergency situation requiring cancellation' },
  { value: 'other', label: 'Other', icon: FileText, description: 'Other reasons not listed above' }
];

export default function CancelAppointmentDialog({
  appointment,
  isOpen,
  onClose,
  onConfirm,
  isLoading
}: CancelAppointmentDialogProps) {
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const handleCancel = () => {
    setSelectedReason('');
    setNotes('');
    onClose();
  };

  const handleConfirm = () => {
    if (!appointment || !selectedReason) return;
    onConfirm(appointment.id, selectedReason, notes || undefined);
    setSelectedReason('');
    setNotes('');
  };

  const formatDate = (date: string) => {
    try {
      return new Date(date).toLocaleDateString('en-US', { 
        weekday: 'long',
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch {
      return date;
    }
  };

  const formatTime = (time: string) => {
    try {
      const [hours, minutes] = time.split(':');
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes));
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } catch {
      return time;
    }
  };

  const selectedReasonInfo = cancellationReasons.find(r => r.value === selectedReason);

  if (!appointment) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-red-600">
            <X className="h-5 w-5" />
            Cancel Appointment
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              {/* Appointment Details */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">{appointment.patientName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-gray-500" />
                  <span>{appointment.service}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span>{formatDate(appointment.date)} at {formatTime(appointment.time)}</span>
                </div>
              </div>

              {/* Cancellation Reason Selection */}
              <div className="space-y-2">
                <Label className="text-red-600">Cancellation Reason *</Label>
                <Select value={selectedReason} onValueChange={setSelectedReason}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a reason for cancellation" />
                  </SelectTrigger>
                  <SelectContent>
                    {cancellationReasons.map((reason) => {
                      const Icon = reason.icon;
                      return (
                        <SelectItem key={reason.value} value={reason.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            <div>
                              <div className="font-medium">{reason.label}</div>
                              <div className="text-xs text-gray-500">{reason.description}</div>
                            </div>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Additional Notes */}
              <div className="space-y-2">
                <Label>Additional Notes (Optional)</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any additional notes about the cancellation..."
                  rows={3}
                />
              </div>

              {/* Warning Message */}
              <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                  <div className="text-red-700">
                    <p className="font-medium">Warning</p>
                    <p className="text-sm">This action cannot be undone. The appointment will be permanently cancelled.</p>
                  </div>
                </div>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel 
            onClick={handleCancel}
            disabled={isLoading}
          >
            Keep Appointment
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!selectedReason || isLoading}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-500"
          >
            {isLoading ? 'Cancelling...' : 'Cancel Appointment'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}