"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Alert, AlertDescription } from "./ui/alert";
import { CheckCircle, AlertTriangle, Info } from "lucide-react";
import { ServiceCatalogItem } from "@/types";
import { format } from "date-fns";
import { CalendarPopover } from "./CalendarPopover";
import { TimeSlotSelector } from "./TimeSlotSelector";
import { TimeSlotGrid } from "./TimeSlotGrid";
import { ToastNotification } from "./ToastNotification";
import {
  useAvailableSlots,
  SlotRequest,
} from "../utils/slotCache";
import { useServices } from "@/contexts/ServiceContext";

interface HomeBookingFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
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

export const HomeBookingForm: React.FC<
  HomeBookingFormProps
> = ({ isOpen, onClose, onSuccess }) => {
  const { servicesCatalog, fetchServicesCatalog, isLoading: servicesLoading } = useServices();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    service: "",
    date: undefined as Date | undefined,
    timeSlot: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedService, setSelectedService] =
    useState<ServiceCatalogItem | null>(null);
  const [emailError, setEmailError] = useState("");
  const [validationMessage, setValidationMessage] = useState("");
  const [validationResult, setValidationResult] = useState<PatientValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Fetch services for booking (bypass role check)
  useEffect(() => {
    fetchServicesCatalog(false, true); // false = exclude inactive, true = for booking
  }, []);

  // Create request object for slot caching
  const slotRequest: SlotRequest | null =
    selectedService && formData.date
      ? {
          date: formData.date,
          serviceDuration: selectedService.estimated_duration,
          bufferTime: selectedService.buffer_time,
        }
      : null;

  // Use the new caching utility
  const {
    data: availableSlots = [],
    error: slotsError,
    isLoading: loadingSlots,
    mutate: mutateSlots,
  } = useAvailableSlots(slotRequest);

  // Email validation function - stricter validation for common providers
  const validateEmail = useCallback(
    (email: string): boolean => {
      if (!email) return false;

      // Basic email format check
      const emailRegex =
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(email)) return false;

      // Check for common email providers (case insensitive)
      const commonProviders = [
        "gmail.com",
        "googlemail.com",
        "yahoo.com",
        "yahoo.co.uk",
        "yahoo.ca",
        "outlook.com",
        "live.com",
        "hotmail.com",
        "msn.com",
        "icloud.com",
        "me.com",
        "mac.com",
        "protonmail.com",
        "proton.me",
        "aol.com",
        "yandex.com",
        "yandex.ru",
        "mail.com",
        "zoho.com",
      ];

      const domain = email.split("@")[1]?.toLowerCase();
      return commonProviders.includes(domain);
    },
    [],
  );

  // Validate patient data when email is entered (without creating user)
  const validatePatient = useCallback(async (email: string, firstName?: string, lastName?: string, phone?: string) => {
    if (!email || !validateEmail(email)) return;

    setIsValidating(true);
    setValidationMessage("");
    setValidationResult(null);

    try {
      const response = await fetch('/api/patients/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email, 
          firstName: firstName || formData.firstName, 
          lastName: lastName || formData.lastName, 
          phone: phone || formData.phone 
        }),
      });

      if (response.ok) {
        const result: PatientValidationResult = await response.json();
        setValidationResult(result);

        if (!result.canBook) {
          if (result.hasOutstandingBalance) {
            setValidationMessage(
              `You have an outstanding balance of ₱${result.outstandingAmount?.toLocaleString()}. Please settle your previous bill before booking a new appointment.`
            );
          } else if (result.existingUser?.canLogin) {
            setValidationMessage(
              "This email is already registered. Please log in to continue."
            );
          }
        } else if (result.shouldUseExistingData && result.existingUser) {
          setValidationMessage(
            "We found an existing patient record for this email. Booking will proceed under that record."
          );
          // Update form with existing data
          setFormData(prev => ({
            ...prev,
            firstName: result.existingUser!.first_name,
            lastName: result.existingUser!.last_name,
            phone: result.existingUser!.phone || ""
          }));
        }
      }
    } catch (error) {
      console.error('Patient validation error:', error);
    } finally {
      setIsValidating(false);
    }
  }, [formData.firstName, formData.lastName, formData.phone, validateEmail]);

  // Handle email input changes with validation
  const handleEmailChange = useCallback(
    (value: string) => {
      setFormData((prev) => ({ ...prev, email: value }));

      // Real-time email validation
      if (value && !validateEmail(value)) {
        setEmailError(
          "Please enter a valid email from a common provider (Gmail, Yahoo, Outlook, etc.)",
        );
        setValidationMessage("");
        setValidationResult(null);
      } else {
        setEmailError("");
        if (value) {
          // Debounce validation
          const timeoutId = setTimeout(() => {
            validatePatient(value);
          }, 500);
          return () => clearTimeout(timeoutId);
        }
      }
    },
    [validateEmail, validatePatient],
  );

  // Handle service selection
  const handleServiceChange = useCallback(
    (serviceName: string) => {
      const service = servicesCatalog.find(
        (s) => s.name === serviceName,
      );
      setSelectedService(service || null);
      setFormData((prev) => ({
        ...prev,
        service: serviceName,
        timeSlot: "", // Reset time slot when service changes
      }));
    },
    [servicesCatalog],
  );

  // Handle date selection
  const handleDateChange = useCallback(
    (date: Date | undefined) => {
      setFormData((prev) => ({
        ...prev,
        date,
        timeSlot: "", // Reset time slot when date changes
      }));
    },
    [],
  );

  // Handle time slot selection
  const handleTimeSlotChange = useCallback(
    (timeSlot: string) => {
      setFormData((prev) => ({ ...prev, timeSlot }));
    },
    [],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate email before submitting
    if (!validateEmail(formData.email)) {
      setEmailError(
        "Please enter a valid email from a common provider (Gmail, Yahoo, Outlook, etc.)",
      );
      ToastNotification.error(
        "Invalid Email",
        "Please enter a valid email address from a common provider.",
      );
      return;
    }

    // Check if patient can book
    if (validationResult && !validationResult.canBook) {
      ToastNotification.error(
        "Booking Not Allowed",
        validationMessage || "Unable to proceed with booking.",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // Check if email already has an active booking first (single booking per email validation)
      const checkResponse = await fetch(
        "/api/appointments/check-email",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: formData.email }),
        },
      );

      if (checkResponse.ok) {
        const checkData = await checkResponse.json();
        if (checkData.hasExistingBooking) {
          setIsSubmitting(false);
          ToastNotification.warning(
            "Existing Appointment Found",
            "You already have an existing appointment. Please call us at (555) 123-DENTAL to modify or schedule additional appointments.",
            6000,
          );
          return;
        }
      } else {
        // If email check fails, still proceed but log the error
        console.warn(
          "Email check failed, proceeding with booking",
        );
      }

      // Prepare appointment data (no dentist assignment - handled by staff)
      const appointmentData = {
        patientName: `${formData.firstName} ${formData.lastName}`,
        patientEmail: formData.email,
        patientPhone: formData.phone || "",
        reason: formData.service || "General appointment",
        requestedDate: formData.date
          ? format(formData.date, "yyyy-MM-dd")
          : "",
        requestedTimeSlot: formData.timeSlot,
        date: formData.date
          ? format(formData.date, "yyyy-MM-dd")
          : "",
        time: formData.timeSlot.split("-")[0], // Start time only
        serviceDuration:
          selectedService?.estimated_duration || 60,
        bufferTime: selectedService?.buffer_time || 15,
        serviceDetails: selectedService
          ? [
              {
                id: selectedService.id,
                name: selectedService.name,
                description: selectedService.description,
                base_price: selectedService.base_price,
                duration: selectedService.estimated_duration,
                buffer: selectedService.buffer_time,
                isInitial: true, // First service is always initial
                pricing_model: selectedService.pricing_model || 'Per Session',
                tooth_chart_use: selectedService.tooth_chart_use || 'not needed',
              },
            ]
          : [],
        type: "home_booking_request", // Flag for server to skip dentist assignment
        // Include existing user ID if found
        existingUserId: validationResult?.existingUser?.id,
      };
      console.log(appointmentData);
      // Submit booking through our API
      const response = await fetch("/api/appointments/book", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(appointmentData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to submit appointment",
        );
      }

      setIsSubmitting(false);
      setShowSuccess(true);

      // Show success toast
      ToastNotification.success(
        "Appointment Booked!",
        "Your appointment has been successfully scheduled. We'll send you a reminder closer to your appointment date.",
        4000,
      );

      // Invalidate slots cache since a new appointment was created
      mutateSlots();

      // Reset form and close after success
      setTimeout(() => {
        setShowSuccess(false);
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          service: "",
          date: undefined,
          timeSlot: "",
        });
        setSelectedService(null);
        setEmailError("");
        setValidationMessage("");
        setValidationResult(null);
        onSuccess();
      }, 3000);
    } catch (error) {
      console.error("Error submitting appointment:", error);
      setIsSubmitting(false);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unknown error occurred";

      // Show nice error notification instead of alert
      ToastNotification.error(
        "Booking Failed",
        `${errorMessage}. Please try again or call us directly at (555) 123-DENTAL.`,
        6000,
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
            <h3 className="text-xl font-semibold mb-3 text-green-800">
              Appointment Booked!
            </h3>
            <p className="text-green-700 mb-4">
              Your appointment has been successfully scheduled.
              We'll send you a reminder closer to your
              appointment date.
            </p>
            <p className="text-sm text-green-600">
              Need to make changes? Call us at{" "}
              <strong>(02)8671 9697 or 0962 850 1012</strong>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      <Card className="shadow-lg border-0 bg-CustomPink2 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="text-center">
            <CardTitle className="text-2xl">
              Book Your Appointment
            </CardTitle>
            <CardDescription className="text-lg">
              Fill out the form below and your appointment will
              be confirmed instantly
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">
                  First Name <span className="text-red-500">*</span>
                </Label>
                <Input
                className= "bg-CustomPink3 border-CustomPink1 border-2"
                  id="firstName"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      firstName: e.target.value,
                    }))
                  }
                  disabled={isSubmitting || (validationResult?.shouldUseExistingData)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">
                  Last Name <span className="text-red-500">*</span>
                </Label>
                <Input
                className= "bg-CustomPink3 border-CustomPink1 border-2"
                  id="lastName"
                  placeholder="Smith"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      lastName: e.target.value,
                    }))
                  }
                  disabled={isSubmitting || (validationResult?.shouldUseExistingData)}
                  required
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                className= "bg-CustomPink3 border-CustomPink1 border-2"
                id="email"
                type="email"
                placeholder="john@gmail.com"
                value={formData.email}
                onChange={(e) => handleEmailChange(e.target.value)}
                disabled={isSubmitting}
                required
              />
              {emailError && (
                <p className="text-sm text-red-600 mt-1">
                  {emailError}
                </p>
              )}
              {isValidating && (
                <p className="text-sm text-CustomPink1 mt-1">
                  Validating patient information...
                </p>
              )}
            </div>

            {/* Phone Field */}
            <div className="space-y-2">
              <Label htmlFor="phone">
                Phone Number (Optional)
              </Label>
              <Input
                className= "bg-CustomPink3 border-CustomPink1 border-2"
                id="phone"
                type="tel"
                placeholder="(555) 123-4567"
                value={formData.phone}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    phone: e.target.value,
                  }))
                }
                disabled={isSubmitting || (validationResult?.shouldUseExistingData)}
              />
            </div>

            {/* Validation Messages */}
            {validationMessage && (
              <Alert className={`${
                validationResult?.canBook === false 
                  ? "border-red-200 bg-red-50" 
                  : validationResult?.shouldUseExistingData
                  ? "border-blue-200 bg-blue-50"
                  : "border-yellow-200 bg-yellow-50"
              }`}>
                {validationResult?.canBook === false ? (
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                ) : (
                  <Info className="h-4 w-4 text-CustomPink1" />
                )}
                <AlertDescription className={
                  validationResult?.canBook === false 
                    ? "text-red-700" 
                    : "text-blue-700"
                }>
                  {validationMessage}
                </AlertDescription>
              </Alert>
            )}

            {/* Service Selection */}
            <div className="space-y-2">
              <Label htmlFor="service">
                Service Needed <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.service}
                onValueChange={handleServiceChange}
                disabled={isSubmitting || servicesLoading}
                required
              >
                <SelectTrigger className = "bg-CustomPink3 border-CustomPink1 border-2">
                  <SelectValue placeholder={servicesLoading ? "Loading services..." : "Select a service"} />
                </SelectTrigger>
                <SelectContent 
                className = "bg-CustomPink3 border-CustomPink1 border-2">
                  {servicesCatalog
                    .filter(service => service.is_active !== false)
                    .map((service) => (
                      <SelectItem
                        key={service.id}
                        value={service.name}
                      >
                        {service.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Selection - Only enabled if service is selected */}
            <div className="space-y-2">
              <Label>
                Preferred Date <span className="text-red-500">*</span>
              </Label>
              <CalendarPopover
                date={formData.date}
                onSelect={handleDateChange}
                className = "bg-CustomPink3 border-CustomPink1 border-2"
                placeholder="Pick date"
                disabled={isSubmitting || !formData.service}
              />
              {!formData.service && (
                <p className="text-sm text-gray-500">
                  Please select a service first to choose a date
                </p>
              )}
            </div>

            {/* Time Slot Selection */}
            <div className="space-y-2">
              <Label htmlFor="timeSlot">
                Available Time Slots <span className="text-red-500">*</span>
              </Label>
              <TimeSlotGrid
                slots={availableSlots}
                selectedSlot={formData.timeSlot}
                onSlotSelect={handleTimeSlotChange}
                loading={loadingSlots}
                error={
                  slotsError
                    ? "Failed to load available slots"
                    : undefined
                }
                disabled={isSubmitting}
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full text-lg py-3"
              variant="outline_pink"
              size="lg"
              disabled={
                isSubmitting ||
                !formData.firstName ||
                !formData.lastName ||
                !formData.email ||
                !formData.service ||
                !formData.date ||
                !formData.timeSlot ||
                emailError !== "" ||
                isValidating ||
                (validationResult?.canBook === false)
              }
            >
              {isSubmitting ? "Booking..." : "Book Appointment"}
            </Button>

            {/* Contact Info */}
            <div className="text-center text-sm text-gray-600 mt-4">
              <p>
                Or call us directly at{" "}
                <strong>(02)8671 9697 or 0962 850 1012</strong>
              </p>
              <p>
                We're available Mon-Sat 9AM-5PM, Sun by Appointment
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
