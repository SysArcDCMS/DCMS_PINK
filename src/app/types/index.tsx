export interface Address {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'dentist' | 'patient' | 'staff';
  phone?: string;
  birthdate?: string;
  address?: Address;
  canLogin: boolean;
  isWalkIn?: boolean;
  createdAt?: string;
  createdBy?: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  dentistId: string;
  dentistName: string;
  date: string;
  time: string;
  service: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
  isAnonymous: boolean;
}

export interface PatientRecord {
  id: string;
  patientId: string;
  appointmentId: string;
  date: string;
  treatment: string;
  diagnosis: string;
  notes: string;
  cost: number;
  dentistId: string;
  dentistName: string;
}

export interface Service {
  id: string;
  name: string;
  duration: number; // in minutes
  price: number;
  description: string;
}

export interface ServiceCatalogItem {
  id: string;
  name: string;
  base_price: number;
  has_treatment_detail: boolean;
}

export interface TimeSlot {
  time: string;
  available: boolean;
}