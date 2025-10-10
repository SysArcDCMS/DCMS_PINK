'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { User, Mail, Phone, Calendar, Clock, X, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { useAppointments } from '../contexts/AppointmentContext';
import { toast } from 'sonner';

interface Patient {
  id: string;
  name: string;
  email: string;
  phone?: string;
  isWalkIn: boolean;
  canLogin: boolean;
  createdAt: string;
  createdBy?: string;
}

interface PatientDetailViewProps {
  patient: Patient;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

const DENTISTS = [
  'Dr. Sarah Johnson',
  'Dr. Michael Chen', 
  'Dr. Emily Rodriguez',
  'Dr. David Kim'
];

const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
];

export function PatientDetailView({ patient, isOpen, onClose, onRefresh }: PatientDetailViewProps) {
  const { getAppointmentsByPatient, createAppointment, updateAppointment } = useAppointments();
  const [patientAppointments, setPatientAppointments] = useState<any[]>([]);
  const [showScheduling, setShowScheduling] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [schedulingData, setSchedulingData] = useState({
    appointmentDate: '',
    appointmentTime: '',
    dentistName: '',
    reason: 'Follow-up appointment'
  });

  useEffect(() => {
    if (isOpen && patient) {
      const appointments = getAppointmentsByPatient(patient.email);
      setPatientAppointments(appointments);
      
      // Set default date to today for scheduling
      const today = new Date().toISOString().split('T')[0];
      setSchedulingData(prev => ({
        ...prev,
        appointmentDate: today
      }));
    }
  }, [isOpen, patient, getAppointmentsByPatient]);

  const hasScheduledAppointment = patientAppointments.some(apt => 
    apt.date && apt.time && apt.status !== 'cancelled'
  );

  const handleScheduleAppointment = async () => {
    if (!schedulingData.appointmentDate || !schedulingData.appointmentTime || !schedulingData.dentistName) {
      toast.error('Please fill in all appointment details');
      return;
    }

    setIsSubmitting(true);
    try {
      // Check if patient already has a pending appointment
      const existingPendingAppointment = patientAppointments.find(apt => 
        apt.status === 'pending' && (!apt.date || !apt.time)
      );

      let result;
      
      if (existingPendingAppointment) {
        // Update existing pending appointment with scheduling details
        result = await updateAppointment(existingPendingAppointment.id, {
          date: schedulingData.appointmentDate,
          time: schedulingData.appointmentTime,
          dentistName: schedulingData.dentistName,
          status: 'pending'
        });
      } else {
        // Create new appointment
        const appointmentResult = await createAppointment({
          patientName: patient.name,
          patientEmail: patient.email,
          patientPhone: patient.phone || '',
          reason: schedulingData.reason
        });

        if (appointmentResult.success && appointmentResult.appointment) {
          // Update the new appointment with scheduling details
          result = await updateAppointment(appointmentResult.appointment.id, {
            date: schedulingData.appointmentDate,
            time: schedulingData.appointmentTime,
            dentistName: schedulingData.dentistName,
            status: 'pending'
          });
        } else {
          throw new Error(appointmentResult.error || 'Failed to create appointment');
        }
      }

      if (result && result.success) {
        toast.success('Appointment scheduled successfully');
        setShowScheduling(false);
        setSchedulingData({
          appointmentDate: '',
          appointmentTime: '',
          dentistName: '',
          reason: 'Follow-up appointment'
        });
        onRefresh();
        
        // Refresh appointments for this patient
        const updatedAppointments = getAppointmentsByPatient(patient.email);
        setPatientAppointments(updatedAppointments);
      } else {
        toast.error(result?.error || 'Failed to schedule appointment');
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
      console.error('Appointment scheduling error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Patient Details
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Patient Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Patient Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Full Name</Label>
                  <p className="text-base">{patient.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Patient Type</Label>
                  <div className="flex gap-2">
                    <Badge variant={patient.isWalkIn ? "outline" : "default"}>
                      {patient.isWalkIn ? 'Walk-in' : 'Registered'}
                    </Badge>
                    <Badge variant={patient.canLogin ? "secondary" : "outline"} className="text-xs">
                      {patient.canLogin ? 'Can Login' : 'No Login'}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Email</Label>
                    <p className="text-sm">{patient.email}</p>
                  </div>
                </div>
                {patient.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Phone</Label>
                      <p className="text-sm">{patient.phone}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <div>
                  <Label className="text-sm font-medium text-gray-600">Registered</Label>
                  <p className="text-sm">
                    {format(new Date(patient.createdAt), 'MMM dd, yyyy')}
                    {patient.createdBy && <span className="text-gray-500"> by {patient.createdBy}</span>}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Appointment History */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Appointment History</CardTitle>
                {patient.isWalkIn && !hasScheduledAppointment && (
                  <Button 
                    onClick={() => setShowScheduling(true)}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Schedule Appointment
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {patientAppointments.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No appointments found</p>
                  {patient.isWalkIn && (
                    <Button 
                      onClick={() => setShowScheduling(true)}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Schedule First Appointment
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {patientAppointments.map((appointment, index) => (
                    <div key={appointment.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {appointment.status}
                          </Badge>
                          {appointment.date && appointment.time && (
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(appointment.date), 'MMM dd, yyyy')}
                              <Clock className="h-3 w-3 ml-2" />
                              {appointment.time}
                            </div>
                          )}
                        </div>
                        {!appointment.date && !appointment.time && patient.isWalkIn && (
                          <Button 
                            onClick={() => setShowScheduling(true)}
                            size="sm"
                            variant="outline"
                            className="text-xs"
                          >
                            Schedule
                          </Button>
                        )}
                      </div>
                      <div className="text-sm space-y-1">
                        <div><strong>Reason:</strong> {appointment.reason}</div>
                        {appointment.dentistName && (
                          <div><strong>Dentist:</strong> {appointment.dentistName}</div>
                        )}
                        <div className="text-gray-500">
                          Created: {format(new Date(appointment.createdAt), 'MMM dd, yyyy HH:mm')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Scheduling Dialog */}
          {showScheduling && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Schedule Appointment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reason">Reason for Visit</Label>
                  <Input
                    id="reason"
                    value={schedulingData.reason}
                    onChange={(e) => setSchedulingData(prev => ({
                      ...prev,
                      reason: e.target.value
                    }))}
                    placeholder="Enter reason for appointment"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Appointment Date</Label>
                  <Input
                    id="date"
                    type="date"
                    min={today}
                    value={schedulingData.appointmentDate}
                    onChange={(e) => setSchedulingData(prev => ({
                      ...prev,
                      appointmentDate: e.target.value
                    }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="time">Appointment Time</Label>
                  <Select
                    value={schedulingData.appointmentTime}
                    onValueChange={(value) => setSchedulingData(prev => ({
                      ...prev,
                      appointmentTime: value
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_SLOTS.map(time => (
                        <SelectItem key={time} value={time}>{time}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dentist">Dentist</Label>
                  <Select
                    value={schedulingData.dentistName}
                    onValueChange={(value) => setSchedulingData(prev => ({
                      ...prev,
                      dentistName: value
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select dentist" />
                    </SelectTrigger>
                    <SelectContent>
                      {DENTISTS.map(dentist => (
                        <SelectItem key={dentist} value={dentist}>{dentist}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={handleScheduleAppointment}
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    {isSubmitting ? 'Scheduling...' : 'Schedule Appointment'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowScheduling(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}