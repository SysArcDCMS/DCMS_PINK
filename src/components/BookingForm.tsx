'use client';

import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from './ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar as CalendarIcon, Plus, CheckCircle, Search, UserCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/components/ui/utils';
import { ServiceCatalogItem } from '@/types';
import { formatTimeSlotForDisplay } from '@/utils/timeUtils';
import { CalendarPopover } from './CalendarPopover';
import { TimeSlotGrid } from './TimeSlotGrid';
import { useServices } from '@/contexts/ServiceContext';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';

import { toast } from 'sonner';

interface Patient {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
}

interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
  conflictReason?: string;
}

interface BookingFormProps {
  userEmail?: string;
  userName?: string;
  userPhone?: string;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
  asDialog?: boolean;
  bookingMode?: 'patient' | 'staff'; // 'patient' = booking for self, 'staff' = booking for others
}

function BookingFormContent({ userEmail, userName, userPhone, onSuccess, onDialogClose, bookingMode }: BookingFormProps & { onDialogClose?: () => void }) {
  const { servicesCatalog, fetchServicesCatalog, isLoading: servicesLoading } = useServices();
  
  // Determine if patient is booking for themselves
  const isPatientMode = bookingMode === 'patient';
  const isStaffMode = bookingMode === 'staff';
  
  const [formData, setFormData] = useState({
    name: userName || '',
    email: userEmail || '',
    phone: userPhone || '',
    service: '',
    date: undefined as Date | undefined,
    timeSlot: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceCatalogItem | null>(null);
  
  // Patient search state for staff mode
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showPatientSearch, setShowPatientSearch] = useState(false);

  // Fetch services for booking (bypass role check)
  useEffect(() => {
    fetchServicesCatalog(false, true); // false = exclude inactive, true = for booking
  }, []);

  // Fetch patients for staff mode
  useEffect(() => {
    if (isStaffMode) {
      fetchPatients();
    }
  }, [isStaffMode]);

  const fetchPatients = async () => {
    setLoadingPatients(true);
    try {
      const response = await fetch('/api/patients');
      if (response.ok) {
        const data = await response.json();
        setPatients(data.patients || []);
      } else {
        console.error('Failed to fetch patients');
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoadingPatients(false);
    }
  };

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    setFormData(prev => ({
      ...prev,
      name: `${patient.first_name} ${patient.last_name}`,
      email: patient.email,
      phone: patient.phone || ''
    }));
    setShowPatientSearch(false);
    setSearchQuery('');
  };

  // Filter patients based on search query
  const filteredPatients = patients.filter(patient => {
    const query = searchQuery.toLowerCase();
    const fullName = `${patient.first_name} ${patient.last_name}`.toLowerCase();
    return fullName.includes(query) || patient.email.toLowerCase().includes(query);
  });

  // Fetch available slots when service and date are selected
  useEffect(() => {
    if (selectedService && formData.date) {
      fetchAvailableSlots();
    } else {
      setAvailableSlots([]);
    }
  }, [selectedService, formData.date]);

  const fetchAvailableSlots = async () => {
    if (!selectedService || !formData.date) return;

    setLoadingSlots(true);
    try {
      const response = await fetch('/api/appointments/available-slots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          date: format(formData.date, 'yyyy-MM-dd'),
          serviceDuration: selectedService.estimated_duration,
          bufferTime: selectedService.buffer_time
        })
      });

      if (response.ok) {
        const data = await response.json();
        setAvailableSlots(data.slots || []);
      } else {
        console.error('Failed to fetch available slots');
        setAvailableSlots([]);
      }
    } catch (error) {
      console.error('Error fetching available slots:', error);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleServiceChange = (serviceName: string) => {
    const service = servicesCatalog.find(s => s.name === serviceName);
    setSelectedService(service || null);
    setFormData(prev => ({ 
      ...prev, 
      service: serviceName,
      timeSlot: '' // Reset time slot when service changes
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate patient selection in staff mode
    if (isStaffMode && !selectedPatient) {
      toast.error('Patient Required', {
        description: 'Please select a patient to book an appointment for.'
      });
      return;
    }
    
    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      // Check if email already has an active booking first (single booking per email validation)
      const checkResponse = await fetch('/api/appointments/check-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: formData.email })
      });

      if (checkResponse.ok) {
        const checkData = await checkResponse.json();
        if (checkData.hasExistingBooking) {
          const errorMsg = 'You already have an existing appointment. Please call us at (555) 123-DENTAL to modify or schedule additional appointments.';
          setSubmitMessage(errorMsg);
          toast.error('Existing Appointment Found', {
            description: errorMsg
          });
          setIsSubmitting(false);
          return;
        }
      } else {
        // If email check fails, still proceed but log the error
        console.warn('Email check failed, proceeding with booking');
      }

      // Prepare appointment data (updated to match HomeBookingForm logic)
      const appointmentData = {
        patientName: formData.name,
        patientEmail: formData.email,
        patientPhone: formData.phone || '',
        reason: formData.service || 'General appointment',
        requestedDate: formData.date ? format(formData.date, 'yyyy-MM-dd') : '',
        requestedTimeSlot: formData.timeSlot,
        date: formData.date ? format(formData.date, 'yyyy-MM-dd') : '',
        time: formData.timeSlot.split('-')[0], // Start time only
        serviceDuration: selectedService?.estimated_duration || 60,
        bufferTime: selectedService?.buffer_time || 15,
        serviceDetails: selectedService ? [{
          id: selectedService.id,
          name: selectedService.name,
          description: selectedService.description,
          base_price: selectedService.base_price,
          duration: selectedService.estimated_duration,
          buffer: selectedService.buffer_time,
          isInitial: true, // First service is always initial
          pricing_model: selectedService.pricing_model || 'Per Session',
          tooth_chart_use: selectedService.tooth_chart_use || 'not needed'
        }] : [],
        type: userEmail ? 'logged_in_booking_request' : 'home_booking_request'
      };

      // Proceed with booking
      const response = await fetch('/api/appointments/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(appointmentData)
      });

      if (response.ok) {
        setIsSubmitting(false);
        setShowSuccess(true);
        toast.success('Appointment Booked', {
          description: 'Your appointment has been successfully scheduled.'
        });
        
        // Reset form and close after success
        setTimeout(() => {
          setShowSuccess(false);
          setFormData({
            name: userName || '',
            email: userEmail || '',
            phone: userPhone || '',
            service: '',
            date: undefined,
            timeSlot: '',
            message: ''
          });
          setSelectedService(null);
          setSelectedPatient(null);
          onSuccess?.();
          onDialogClose?.();
        }, 2000);
      } else {
        const errorData = await response.json();
        const errorMsg = `Error: ${errorData.error || 'Failed to submit booking request'}`;
        setSubmitMessage(errorMsg);
        toast.error('Booking Failed', {
          description: errorData.error || 'Please try again or call us directly.'
        });
      }
    } catch (error) {
      const errorMsg = 'Network error. Please try again.';
      setSubmitMessage(errorMsg);
      toast.error('Network Error', {
        description: 'Please check your connection and try again.'
      });
      console.error('Booking error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  // Show success screen
  if (showSuccess) {
    return (
      <div className="w-full max-w-md mx-auto">
        <Card className="border-green-200 bg-green-50 shadow-lg">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-3 text-green-800">Appointment Booked!</h3>
            <p className="text-green-700 mb-4">
              Your appointment has been successfully scheduled. We'll send you a reminder closer to your appointment date.
            </p>
            <p className="text-sm text-green-600">
              Need to make changes? Call us at <strong>(555) 123-DENTAL</strong>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto bg-CustomPink2">
      <CardHeader>
        <CardTitle className='text-CustomPink1'><strong>Book an Appointment</strong></CardTitle>
        <p className="text-sm text-gray-600">
          Select your preferred service, date, and time slot
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Staff Mode: Searchable Patient Selector */}
          {isStaffMode && (
            <div className="space-y-2">
              <Label className='text-CustomPink1'><strong>Select Patient *</strong></Label>
              
              {/* Show selected patient or search button */}
              {selectedPatient ? (
                <div className="flex items-center justify-between p-3 border rounded-lg bg-green-50 border-green-200">
                  <div className="flex items-center gap-2">
                    <UserCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-800">
                        {selectedPatient.first_name} {selectedPatient.last_name}
                      </p>
                      <p className="text-sm text-green-600">{selectedPatient.email}</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedPatient(null);
                      setFormData(prev => ({ ...prev, name: '', email: '', phone: '' }));
                    }}
                  >
                    Change
                  </Button>
                </div>
              ) : (
                <Popover open={showPatientSearch} onOpenChange={setShowPatientSearch}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between"
                    >
                      <span className="text-muted-foreground">
                        Search by name or email...
                      </span>
                      <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0" align="start">
                    <Command>
                      <CommandInput
                        placeholder="Search patients..."
                        value={searchQuery}
                        onValueChange={setSearchQuery}
                      />
                      <CommandList>
                        {loadingPatients ? (
                          <div className="py-6 text-center text-sm">Loading patients...</div>
                        ) : filteredPatients.length === 0 ? (
                          <CommandEmpty>No patients found.</CommandEmpty>
                        ) : (
                          <CommandGroup>
                            {filteredPatients.map((patient) => (
                              <CommandItem
                                key={patient.id}
                                value={`${patient.first_name} ${patient.last_name} ${patient.email}`}
                                onSelect={() => handlePatientSelect(patient)}
                              >
                                <UserCircle className="mr-2 h-4 w-4" />
                                <div className="flex flex-col">
                                  <span>{patient.first_name} {patient.last_name}</span>
                                  <span className="text-xs text-muted-foreground">{patient.email}</span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        )}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              )}
              
              <p className="text-xs text-muted-foreground">
                Search for an existing patient to book an appointment
              </p>
            </div>
          )}
          
          {/* Show info note in patient mode */}
          {isPatientMode && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Booking for:</strong> {userName || userEmail}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="service" className='text-CustomPink1'><strong>Service Needed *</strong></Label>
            <Select value={formData.service} onValueChange={handleServiceChange} disabled={servicesLoading} required>
              <SelectTrigger>
                <SelectValue placeholder={servicesLoading ? "Loading services..." : "Select a service"} />
              </SelectTrigger>
              <SelectContent>
                {servicesCatalog
                  .filter(service => service.is_active !== false)
                  .map((service) => (
                    <SelectItem key={service.id} value={service.name}>
                      {service.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className='text-CustomPink1'><strong>Preferred Date *</strong></Label>
            <CalendarPopover
              date={formData.date}
              onSelect={(date) => setFormData(prev => ({ ...prev, date, timeSlot: '' }))}
              placeholder="Pick date"
              disabled={false}
            />
          </div>

          <div className="space-y-2 font">
            <Label htmlFor="timeSlot" className='text-CustomPink1'><strong>Available Time Slots *</strong></Label>
            <TimeSlotGrid
              slots={availableSlots}
              selectedSlot={formData.timeSlot}
              onSlotSelect={(timeSlot) => setFormData(prev => ({ ...prev, timeSlot }))}
              loading={loadingSlots}
              error={
                !selectedService || !formData.date 
                  ? "Please select a service and date first to see available time slots."
                  : availableSlots.length === 0 && !loadingSlots
                  ? "No available slots for this date. Please try another date or call us directly."
                  : undefined
              }
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Additional Information</Label>
            <Textarea
              id="message"
              name="message"
              placeholder="Any additional details about your concern..."
              value={formData.message}
              onChange={handleChange}
              rows={3}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting || !formData.service || !formData.date || !formData.timeSlot || (isStaffMode && !selectedPatient)}
          >
            {isSubmitting ? 'Submitting...' : 'Book Appointment'}
          </Button>

          {submitMessage && (
            <div className={`text-sm p-3 rounded ${
              submitMessage.includes('successfully') 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {submitMessage}
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

export function BookingForm({ userEmail, userName, userPhone, onSuccess, trigger, asDialog = true, bookingMode }: BookingFormProps) {
  const [isOpen, setIsOpen] = useState(false);

  // If not used as dialog (for homepage), render the form directly
  if (!asDialog) {
    return (
      <BookingFormContent
        userEmail={userEmail}
        userName={userName}
        userPhone={userPhone}
        onSuccess={onSuccess}
        bookingMode={bookingMode}
      />
    );
  }

  // Default trigger button if none provided
  const defaultTrigger = (
    <Button className="flex items-center gap-2">
      <Plus className="h-4 w-4" />
      {userEmail ? 'Book Appointment' : 'Book for Patient'}
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-md bg-CustomPink3">
        <DialogHeader>
          <DialogTitle className='text-CustomPink1'>Book an Appointment</DialogTitle>
          <DialogDescription>
            Fill out this form to request an appointment. Our staff will contact you to confirm the date and time.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[80vh] overflow-y-auto">
          <BookingFormContent
            userEmail={userEmail}
            userName={userName}
            userPhone={userPhone}
            onSuccess={onSuccess}
            onDialogClose={() => setIsOpen(false)}
            bookingMode={bookingMode}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
