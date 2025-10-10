'use client';

import React, { useState, useCallback } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Alert, AlertDescription } from './ui/alert';
import { UserPlus, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { toast } from 'sonner';

interface WalkInPatientProps {
  staffEmail: string;
  onSuccess: (newPatient: any) => void;
}

interface PatientValidationResult {
  canBook: boolean;
  hasOutstandingBalance: boolean;
  outstandingAmount?: number;
  existingUser?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
    canLogin: boolean;
    registrationType: string;
  };
  message?: string;
  shouldUseExistingData?: boolean;
}

export function WalkInPatient({ staffEmail, onSuccess }: WalkInPatientProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [patientData, setPatientData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });
  const [emailError, setEmailError] = useState('');
  const [validationMessage, setValidationMessage] = useState('');
  const [validationResult, setValidationResult] = useState<PatientValidationResult | null>(null);

  // Email validation function - check for allowed domains
  const validateEmailDomain = useCallback((email: string): boolean => {
    if (!email) return false;

    // Basic email format check
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) return false;

    // Check for common allowed email providers (case insensitive)
    const allowedProviders = [
      'gmail.com',
      'googlemail.com',
      'yahoo.com',
      'yahoo.com.ph',
      'yahoo.com',
    ];

    const domain = email.split('@')[1]?.toLowerCase();
    return allowedProviders.includes(domain);
  }, []);

  // Validate patient data when email is entered (check if exists)
  const validatePatient = useCallback(async (email: string, firstName?: string, lastName?: string, phone?: string) => {
    if (!email || !validateEmailDomain(email)) return;

    setIsValidating(true);
    setValidationMessage('');
    setValidationResult(null);

    try {
      const response = await fetch('/api/patients/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email, 
          firstName: firstName || patientData.firstName, 
          lastName: lastName || patientData.lastName, 
          phone: phone || patientData.phone 
        }),
      });
      
      if (response.ok) {
        const result: PatientValidationResult = await response.json();
        setValidationResult(result);
        console.log(result);
        if (!result.canBook) {
          if (result.hasOutstandingBalance) {
            setValidationMessage(
              `This patient has an outstanding balance of ₱${result.outstandingAmount?.toLocaleString()}. Please settle the previous bill before creating new appointments.`
            );
          } else if (result.existingUser?.canLogin) {
            setValidationMessage(
              'This email is already registered with login access. Patient should use their account to book.'
            );
          } else {
            setValidationMessage(
              result.message || 'This patient cannot book at this time.'
            );
          }
        } else if (result.shouldUseExistingData && result.existingUser) {
          setValidationMessage(
            'An existing patient record found for this email. Walk-in will be associated with this patient.'
          );
          // Update form with existing data
          setPatientData(prev => ({
            ...prev,
            firstName: result.existingUser!.first_name,
            lastName: result.existingUser!.last_name,
            phone: result.existingUser!.phone || ''
          }));
        }
      }
    } catch (error) {
      console.error('Patient validation error:', error);
    } finally {
      setIsValidating(false);
    }
  }, [patientData.firstName, patientData.lastName, patientData.phone, validateEmailDomain]);

  // Handle email input changes with validation
  const handleEmailChange = useCallback((value: string) => {
    setPatientData(prev => ({ ...prev, email: value }));
    setEmailError('');
    setValidationMessage('');
    setValidationResult(null);

    if (value) {
      if (!validateEmailDomain(value)) {
        setEmailError('Please use a common email provider (Gmail, Yahoo, Outlook, etc.)');
      } else {
        // Validate patient only after a short delay to avoid too many API calls
        const timeoutId = setTimeout(() => {
          validatePatient(value);
        }, 500);
        return () => clearTimeout(timeoutId);
      }
    }
  }, [validateEmailDomain, validatePatient]);

  const handlePatientSubmit = async () => {
    // Validate required fields
    if (!patientData.firstName || !patientData.lastName || !patientData.email) {
      toast.error('Please fill in all required fields (First Name, Last Name, and Email)');
      return;
    }

    // Validate email domain
    if (!validateEmailDomain(patientData.email)) {
      toast.error('Please use a valid email from a common provider (Gmail, Yahoo, Outlook, etc.)');
      return;
    }

    // Check if patient can book
    if (validationResult && !validationResult.canBook) {
      toast.error('This patient cannot be added. Please resolve the validation issues first.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Create walk-in patient via API
      const response = await fetch('/api/patients/walk-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: patientData.firstName,
          lastName: patientData.lastName,
          email: patientData.email,
          phone: patientData.phone || null,
          staffEmail: staffEmail
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success('Walk-in patient added successfully');
        
        // Call success callback with patient data
        onSuccess(result.patient || result.user);
        
        // Reset form and close dialog
        resetForm();
        setIsOpen(false);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to add walk-in patient');
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
      console.error('Walk-in patient error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setPatientData({ firstName: '', lastName: '', email: '', phone: '' });
    setEmailError('');
    setValidationMessage('');
    setValidationResult(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Add Walk-in Patient
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-lg border-2 border-CustomPink1 bg-CustomPink3">
        <DialogHeader>
          <DialogTitle className='font-bold text-CustomPink1'>Add Walk-in Patient</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Note:</strong> Walk-in patients will be recorded in the system but cannot login until they register themselves with a password. You can schedule appointments for them on their patient detail page.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="firstName" className='font-bold text-CustomPink1'>First Name *</Label>
            <Input
              className='border-1 border-CustomPink1'
              id="firstName"
              value={patientData.firstName}
              onChange={(e) => setPatientData(prev => ({ ...prev, firstName: e.target.value }))}
              placeholder="Enter patient's first name"
              required
              disabled={validationResult?.shouldUseExistingData}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName" className='font-bold text-CustomPink1'>Last Name *</Label>
            <Input
              className='border-1 border-CustomPink1'
              id="lastName"
              value={patientData.lastName}
              onChange={(e) => setPatientData(prev => ({ ...prev, lastName: e.target.value }))}
              placeholder="Enter patient's last name"
              required
              disabled={validationResult?.shouldUseExistingData}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className='font-bold text-CustomPink1'>Email *</Label>
            <Input
              className='border-1 border-CustomPink1'
              id="email"
              type="email"
              value={patientData.email}
              onChange={(e) => handleEmailChange(e.target.value)}
              placeholder="Enter patient's email"
              required
            />
            {emailError && (
              <p className="text-sm text-destructive">{emailError}</p>
            )}
            {isValidating && (
              <p className="text-sm text-muted-foreground">Validating email...</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className='font-bold text-CustomPink1'>Phone Number</Label>
            <Input
              className='border-1 border-CustomPink1'
              id="phone"
              type="tel"
              value={patientData.phone}
              onChange={(e) => setPatientData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="Enter patient's phone"
              disabled={validationResult?.shouldUseExistingData}
            />
          </div>

          {/* Validation Messages */}
          {validationMessage && (
            <Alert variant={validationResult?.canBook ? 'default' : 'destructive'}>
              {validationResult?.canBook ? (
                validationResult?.shouldUseExistingData ? (
                  <Info className="h-4 w-4" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>{validationMessage}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button 
              onClick={handlePatientSubmit}
              disabled={isSubmitting || isValidating || (validationResult !== null && !validationResult.canBook) || !!emailError}
              className="flex-1"
            >
              {isSubmitting ? 'Adding Patient...' : 'Add Patient'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}