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
  first_name: string;
  last_name: string;
  name?: string; // computed field for backward compatibility
  role: 'admin' | 'dentist' | 'patient' | 'staff';
  phone?: string | null;
  birthdate?: string;
  address?: Address;
  canLogin: boolean;
  password?: string | null;
  registrationType?: 'anonymous' | 'registered';
  isWalkIn?: boolean;
  createdAt?: string;
  lastUpdatedAt?: string;
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
  reason?: string;
  serviceDetails?: {
    id: string;
    name: string;
    description: string;
    base_price: number;
    duration: number;
    buffer: number;
    pricing_model?: 'Per Tooth' | 'Per Tooth (Package)' | 'Per Session' | 'Per Film' | 'Per Treatment Package';
    tooth_chart_use?: 'required' | 'not needed' | 'optional';
    finalPrice?: number;
    treatments?: Treatment[];
    selectedTeeth?: string[];
    totalAmount?: number;
    isInitial?: boolean;
    notes?: string;
    showToothChart?: boolean; 

  }[];
  status: 'booked' | 'completed' | 'cancelled';
  cancellationReason?: 'no-show' | 'patient-cancelled' | 'clinic-cancelled' | 'stock-shortage' | 'emergency' | 'other';
  notes?: string;
  isAnonymous: boolean;
  has_bill?: boolean;
  billId?: string;
  completedServices?: ServiceInstance[];
  completionNotes?: string;
  completedAt?: string;
  completedBy?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  cancellationNotes?: string;
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
  description: string;
  base_price: number;
  estimated_duration: number; // in minutes - general time interval guide
  buffer_time: number; // in minutes - preparation/cleanup buffer time
  is_active: boolean; // service activation status
  pricing_model: 'Per Tooth' | 'Per Tooth (Package)' | 'Per Session' | 'Per Film' | 'Per Treatment Package';
  tooth_chart_use: 'required' | 'not needed' | 'optional';
}

export interface ServiceLog {
  id: string;
  serviceId: string;
  serviceName: string;
  action: 'add' | 'edit' | 'archive' | 'activate' | 'suggest';
  changedBy: string;
  changedByName: string;
  changes: string;
  timestamp: string;
}

export interface ServiceSuggestion {
  id: string;
  serviceId: string;
  serviceName: string;
  suggestion: string;
  suggestedBy: string;
  suggestedByName: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  createdAt: string;
}

export interface ServiceInstance {
  id: string;
  serviceId: string;
  serviceName: string;
  description: string;
  basePrice: number;
  finalPrice: number;
  treatmentDetail?: string;
  notes?: string;
  treatments?: Treatment[];
  totalAmount?: number;
}

export interface Treatment {
  id: string;
  detail: string;
  teeth_fdi?: string[];
  teeth_names?: string[];
  surfaces?: string[] | null;
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

export interface SmartTimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
  conflictReason?: string;
}

export interface SlotCalculationRequest {
  date: string; // YYYY-MM-DD format
  serviceDuration: number; // in minutes
  bufferTime: number; // in minutes
}

export interface SlotCalculationResponse {
  slots: SmartTimeSlot[];
  metadata: {
    date: string;
    serviceDuration: number;
    bufferTime: number;
    totalSlotTime: number;
    existingAppointments: number;
  };
}

export interface BillItem {
  id: string;
  serviceId?: string;
  serviceName: string;
  description?: string;
  quantity: number;
  quantityLabel?: string;
  unitPrice: number;
  subtotal: number;
  hasTeethSelected?: boolean;
  selectedTeeth?: string[];
}

export interface PaymentHistory {
  id: string;
  amount: number;
  paymentMethod: 'cash' | 'card' | 'gcash';
  paidAt: string;
  processedBy: string;
  notes?: string;
}

export interface Bill {
  id: string;
  appointmentId: string;
  patientId: string;
  patientName: string;
  patientEmail?: string;
  patientPhone?: string;
  items: BillItem[];
  totalAmount: number;
  paidAmount: number;
  outstandingBalance: number;
  paymentMethod?: 'cash' | 'card' | 'gcash';
  status: 'pending' | 'partial' | 'paid';
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  notes?: string;
  paymentHistory?: PaymentHistory[];
}

export interface BillingStats {
  totalBilledToday: number;
  paymentsReceivedToday: number;
  outstandingBalances: number;
}

// Medical Records Types
export interface MedicalInfo {
  id: string;
  patientId: string;
  patientEmail: string;
  type: 'medical_info';
  title: string;
  description: string;
  dateRecorded: string;
  staffId: string;
  staffEmail: string;
  staffName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  files?: MedicalFile[];
}

export interface Allergy {
  id: string;
  patientId: string;
  patientEmail: string;
  type: 'allergy';
  allergen: string;
  severity: 'mild' | 'moderate' | 'severe';
  reaction: string;
  dateRecorded: string;
  staffId: string;
  staffEmail: string;
  staffName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  files?: MedicalFile[];
}

export interface Medication {
  id: string;
  patientId: string;
  patientEmail: string;
  type: 'medication';
  medicationName: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate?: string;
  prescribedBy: string;
  notes?: string;
  staffId: string;
  staffEmail: string;
  staffName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  files?: MedicalFile[];
}

export type MedicalRecord = MedicalInfo | Allergy | Medication;

export interface CorrectionRequest {
  id: string;
  recordId: string;
  recordType: 'medical_info' | 'allergy' | 'medication';
  patientId: string;
  patientEmail: string;
  patientName: string;
  originalRecord: MedicalRecord;
  suggestedChanges: {
    field: string;
    currentValue: string;
    suggestedValue: string;
    reason: string;
  }[];
  status: 'pending' | 'approved' | 'denied';
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  reviewFiles?: MedicalFile[]; // Files attached by staff during review
  createdAt: string;
  updatedAt: string;
}

export interface NotificationItem {
  id: string;
  type: 'correction_request';
  title: string;
  message: string;
  data: any;
  isRead: boolean;
  createdAt: string;
}

// File Upload Types
export interface MedicalFile {
  id: string;
  recordId: string;
  recordType: 'medical_info' | 'allergy' | 'medication' | 'correction_request';
  patientId: string;
  patientEmail: string;
  fileName: string;
  originalFileName: string;
  fileSize: number;
  fileType: string;
  uploadedBy: string;
  uploadedByName: string;
  uploadedAt: string;
  description?: string;
  isActive: boolean;
  webViewLink?: string;
  modifiedTime?: string;
}

export interface FileUploadProgress {
  id: string;
  fileName: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}