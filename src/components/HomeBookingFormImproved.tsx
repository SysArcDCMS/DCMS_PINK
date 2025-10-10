'use client';

import React, { useState, useCallback } from 'react';
import useSWR from 'swr';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { CheckCircle } from 'lucide-react';
import { ServiceCatalogItem } from '@/types';
import { mockServicesCatalog } from '@/data/mockData';
import { format } from 'date-fns';
import { CalendarPopover } from './CalendarPopover';
import { TimeSlotSelector } from './TimeSlotSelector';
import { ToastNotification } from './ToastNotification';

interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
  conflictReason?: string;
}

interface HomeBookingFormImprovedProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// SWR fetcher function for available slots
const fetchAvailableSlots = async ([url, requestBody]: [string, string]) => {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: requestBody
  });

  if (!response.ok) {
    throw new Error('Failed to fetch available slots');
  }

  const data = await response.json();
  return data.slots || [];
};

export const HomeBookingFormImproved: React.FC<HomeBookingFormImprovedProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess 
}) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    contact: '', // email or phone
    contactType: 'email' as 'email' | 'phone',
    service: '',
    date: undefined as Date | undefined,
    timeSlot: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceCatalogItem | null>(null);
  const [emailError, setEmailError] = useState('');

  // Create SWR key for fetching slots
  const slotsKey = selectedService && formData.date 
    ? [
        '/api/appointments/available-slots',
        JSON.stringify({
          date: format(formData.date, 'yyyy-MM-dd'),
          serviceDuration: selectedService.estimated_duration,
          bufferTime: selectedService.buffer_time
        })
      ]
    : null;

  // Use SWR for caching available slots
  const { 
    data: availableSlots = [], 
    error: slotsError, 
    isLoading: loadingSlots,
    mutate: mutateSlots
  } = useSWR<TimeSlot[]>(
    slotsKey,
    fetchAvailableSlots,
    {
      dedupingInterval: 5 * 60 * 1000, // 5 minutes deduping
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      errorRetryCount: 2,
      errorRetryInterval: 1000
    }
  );

  // Email validation function - stricter validation for common providers
  const validateEmail = useCallback((email: string): boolean => {
    if (!email) return false;
    
    // Basic email format check
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) return false;
    
    // Check for common email providers (case insensitive)
    const commonProviders = [
      'gmail.com', 'googlemail.com',
      'yahoo.com', 'yahoo.co.uk', 'yahoo.ca',
      'outlook.com', 'live.com', 'hotmail.com', 'msn.com',
      'icloud.com', 'me.com', 'mac.com',
      'protonmail.com', 'proton.me',
      'aol.com',
      'yandex.com', 'yandex.ru',
      'mail.com',
      'zoho.com'
    ];
    
    const domain = email.split('@')[1]?.toLowerCase();
    return commonProviders.includes(domain);
  }, []);

  // Handle contact input changes with validation
  const handleContactChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, contact: value }));
    
    // Real-time email validation
    if (formData.contactType === 'email') {
      if (value && !validateEmail(value)) {
        setEmailError('Please enter a valid email from a common provider (Gmail, Yahoo, Outlook, etc.)');
      } else {
        setEmailError('');
      }
    }
  }, [formData.contactType, validateEmail]);

  // Handle contact type switching
  const handleContactTypeChange = useCallback((type: 'email' | 'phone') => {
    setFormData(prev => ({ ...prev, contactType: type, contact: '' }));
    setEmailError(''); // Clear any validation errors when switching types
  }, []);

  // Handle service selection
  const handleServiceChange = useCallback((serviceName: string) => {
    const service = mockServicesCatalog.find(s => s.name === serviceName);
    setSelectedService(service || null);
    setFormData(prev => ({ 
      ...prev, 
      service: serviceName,
      timeSlot: '' // Reset time slot when service changes
    }));
  }, []);

  // Handle date selection
  const handleDateChange = useCallback((date: Date | undefined) => {
    setFormData(prev => ({ 
      ...prev, 
      date, 
      timeSlot: '' // Reset time slot when date changes
    }));
  }, []);

  // Handle time slot selection
  const handleTimeSlotChange = useCallback((timeSlot: string) => {
    setFormData(prev => ({ ...prev, timeSlot }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate email before submitting
    if (formData.contactType === 'email' && !validateEmail(formData.contact)) {
      setEmailError('Please enter a valid email from a common provider (Gmail, Yahoo, Outlook, etc.)');
      ToastNotification.error('Invalid Email', 'Please enter a valid email address from a common provider.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Check if email already has an active booking first (single booking per email validation)
      if (formData.contactType === 'email') {
        const checkResponse = await fetch('/api/appointments/check-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email: formData.contact })
        });
        
        if (checkResponse.ok) {
          const checkData = await checkResponse.json();
          if (checkData.hasExistingBooking) {
            setIsSubmitting(false);
            ToastNotification.warning(
              'Existing Appointment Found',
              'You already have an existing appointment. Please call us at (555) 123-DENTAL to modify or schedule additional appointments.',
              6000
            );
            return;
          }
        } else {
          // If email check fails, still proceed but log the error
          console.warn('Email check failed, proceeding with booking');
        }
      }

      // Prepare appointment data (no dentist assignment - handled by staff)
      const appointmentData = {
        patientName: `${formData.firstName} ${formData.lastName}`,
        patientEmail: formData.contactType === 'email' ? formData.contact : '',
        patientPhone: formData.contactType === 'phone' ? formData.contact : '',
        reason: formData.service || 'General appointment',
        requestedDate: formData.date ? format(formData.date, 'yyyy-MM-dd') : '',
        requestedTimeSlot: formData.timeSlot,
        date: formData.date ? format(formData.date, 'yyyy-MM-dd') : '',
        time: formData.timeSlot.split('-')[0], // Start time only
        serviceDuration: selectedService?.estimated_duration || 60,
        bufferTime: selectedService?.buffer_time || 15,
        serviceDetails: selectedService ? {
          id: selectedService.id,
          name: selectedService.name,
          description: selectedService.description,
          duration: selectedService.estimated_duration,
          buffer: selectedService.buffer_time
        } : null,
        type: 'home_booking_request' // Flag for server to skip dentist assignment
      };

      // Submit booking through our API
      const response = await fetch('/api/appointments/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(appointmentData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit appointment');
      }

      setIsSubmitting(false);
      setShowSuccess(true);
      
      // Show success toast
      ToastNotification.success(
        'Appointment Booked!',
        'Your appointment has been successfully scheduled. We\'ll send you a reminder closer to your appointment date.',
        4000
      );
      
      // Invalidate slots cache since a new appointment was created
      if (slotsKey) {
        mutateSlots();
      }
      
      // Reset form and close after success
      setTimeout(() => {
        setShowSuccess(false);
        setFormData({
          firstName: '',
          lastName: '',
          contact: '',
          contactType: 'email',
          service: '',
          date: undefined,
          timeSlot: ''
        });
        setSelectedService(null);
        setEmailError('');
        onSuccess();
      }, 3000);
    } catch (error) {
      console.error('Error submitting appointment:', error);
      setIsSubmitting(false);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      ToastNotification.error(
        'Booking Failed',
        `${errorMessage}. Please try again or call us directly at (555) 123-DENTAL.`,
        6000
      );
    }
  };

  // Success message (updated to reflect auto-booking)
  if (showSuccess) {
    return (
      <div className="w-full max-w-lg mx-auto">
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
    <div className="w-full max-w-lg mx-auto">
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="text-center">
            <CardTitle className="text-2xl">Book Your Appointment</CardTitle>
            <CardDescription className="text-lg">Fill out the form below and your appointment will be confirmed instantly</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  placeholder="Smith"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  required
                />
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-2">
              <Label htmlFor="contact">Contact Information</Label>
              <div className="flex space-x-2">
                <Select 
                  value={formData.contactType} 
                  onValueChange={handleContactTypeChange}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="phone">Phone</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  className="flex-1"
                  placeholder={formData.contactType === 'email' ? 'john@gmail.com' : '(555) 123-4567'}
                  type={formData.contactType === 'email' ? 'email' : 'tel'}
                  value={formData.contact}
                  onChange={(e) => handleContactChange(e.target.value)}
                  required
                />
              </div>
              {emailError && (
                <p className="text-sm text-red-600 mt-1">{emailError}</p>
              )}
            </div>

            {/* Service Selection */}
            <div className="space-y-2">
              <Label htmlFor="service">Service Needed *</Label>
              <Select value={formData.service} onValueChange={handleServiceChange} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a service" />
                </SelectTrigger>
                <SelectContent>
                  {mockServicesCatalog.map((service) => (
                    <SelectItem key={service.id} value={service.name}>
                      {service.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Selection */}
            <div className="space-y-2">
              <Label>Preferred Date *</Label>
              <CalendarPopover
                date={formData.date}
                onSelect={handleDateChange}
                placeholder="Pick date"
              />
            </div>

            {/* Time Slot Selection */}
            <div className="space-y-2">
              <Label htmlFor="timeSlot">Available Time Slots *</Label>
              <TimeSlotSelector
                slots={availableSlots}
                selectedSlot={formData.timeSlot}
                onSlotSelect={handleTimeSlotChange}
                loading={loadingSlots}
                error={slotsError ? 'Failed to load available slots. Please try again.' : undefined}
                showServiceAndDate={true}
                serviceName={formData.service}
                date={formData.date}
                placeholder="Select an available time slot"
              />
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full text-lg py-3" 
              size="lg" 
              disabled={isSubmitting || !formData.service || !formData.date || !formData.timeSlot || emailError !== ''}
            >
              {isSubmitting ? 'Booking...' : 'Book Appointment'}
            </Button>
            
            {/* Contact Info */}
            <div className="text-center text-sm text-gray-600 mt-4">
              <p>Or call us directly at <strong>(02)8671 9697 or 0962 850 1012</strong></p>
              <p>We're available Mon-Sat 9AM-5PM, Sun by Appointment</p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};