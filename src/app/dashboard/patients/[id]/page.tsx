'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { Button } from '../../../../components/ui/button';
import { Separator } from '../../../../components/ui/separator';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { Textarea } from '../../../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/tabs';
import { User, Mail, Phone, Calendar, Clock, ArrowLeft, Plus, History, FileText, Heart, AlertTriangle, Pill, Bell, Edit3, Check, X, Loader2, Download, Smile, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../../../../contexts/AuthContext';
import { usePatients } from '../../../../contexts/PatientContext';
import { useAppointments } from '../../../../contexts/AppointmentContext';
import { useServices } from '../../../../contexts/ServiceContext';
import { toast } from 'sonner';
import { MedicalRecord, MedicalInfo, Allergy, Medication, CorrectionRequest, NotificationItem } from '../../../../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../../components/ui/dialog';
import FileUpload, { FileUploadRef } from '../../../../components/FileUpload';
import { MedicalFile } from '../../../../types';
import { projectId, publicAnonKey } from '../../../../utils/supabase/info';

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

export default function PatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { getPatientById } = usePatients();
  const { getAppointmentsByPatient, createAppointment, updateAppointment, refreshAppointments } = useAppointments();
  
  const [patient, setPatient] = useState<any>(null);
  const [patientAppointments, setPatientAppointments] = useState<any[]>([]);
  const [serviceHistory, setServiceHistory] = useState<any[]>([]);
  const [serviceHistoryLoading, setServiceHistoryLoading] = useState(false);
  const [serviceHistoryError, setServiceHistoryError] = useState<string | null>(null);
  const [medicalHistory, setMedicalHistory] = useState<any>(null);
  const [showScheduling, setShowScheduling] = useState(false);
  const [showMedicalEdit, setShowMedicalEdit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [schedulingData, setSchedulingData] = useState({
    appointmentDate: '',
    appointmentTime: '',
    dentistName: '',
    reason: 'Follow-up appointment'
  });
  const [medicalData, setMedicalData] = useState<{
    allergies: string[];
    medications: string[];
    medicalConditions: string[];
    emergencyContact: {
      name: string;
      phone: string;
      relationship: string;
    };
    insuranceInfo: {
      provider: string;
      policyNumber: string;
      groupNumber?: string;
    };
    notes: string;
  }>({
    allergies: [],
    medications: [],
    medicalConditions: [],
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    },
    insuranceInfo: {
      provider: '',
      policyNumber: '',
      groupNumber: ''
    },
    notes: ''
  });

  // Medical Records State
  const [medicalInfo, setMedicalInfo] = useState<MedicalInfo[]>([]);
  const [allergies, setAllergies] = useState<Allergy[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [correctionRequests, setCorrectionRequests] = useState<CorrectionRequest[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAddRecord, setShowAddRecord] = useState(false);
  
  // Patient Files State
  const [patientFiles, setPatientFiles] = useState<MedicalFile[]>([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [showEditRecord, setShowEditRecord] = useState(false);
  const [showReviewRequest, setShowReviewRequest] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<CorrectionRequest | null>(null);
  const [activeRecordType, setActiveRecordType] = useState<'medical_info' | 'allergy' | 'medication'>('medical_info');
  const [recordFormData, setRecordFormData] = useState<any>({});
  const [recordFiles, setRecordFiles] = useState<MedicalFile[]>([]);
  const [reviewFiles, setReviewFiles] = useState<MedicalFile[]>([]);
  
  // Refs for FileUpload components
  const recordFileUploadRef = useRef<FileUploadRef>(null);
  const reviewFileUploadRef = useRef<FileUploadRef>(null);

  const canViewPatients = user?.role === 'staff' || user?.role === 'dentist' || user?.role === 'admin';

  useEffect(() => {
    if (!canViewPatients) {
      router.push('/dashboard/patients');
      return;
    }

    const patientId = params.id as string;
    if (patientId) {
      const foundPatient = getPatientById(patientId);
      if (foundPatient) {
        setPatient(foundPatient);
        const appointments = getAppointmentsByPatient(foundPatient.email);
        setPatientAppointments(appointments);
        
        // Fetch service history for staff/dentist/admin
        fetchServiceHistory(foundPatient.email);
        
        // TODO: Load medical history from medical records API
        setMedicalHistory(null);
        
        // Set default date to today for scheduling
        const today = new Date().toISOString().split('T')[0];
        setSchedulingData(prev => ({
          ...prev,
          appointmentDate: today
        }));

        // Fetch medical records
        fetchMedicalRecords(foundPatient.email);
        
        // Fetch patient files
        fetchPatientFiles(foundPatient.id);
        
        // Fetch notifications for staff
        if (canViewPatients) {
          fetchNotifications();
          fetchCorrectionRequests();
        }
      } else {
        toast.error('Patient not found');
        router.push('/dashboard/patients');
      }
    }
    setIsLoading(false);
  }, [params.id, canViewPatients, router]);

  const hasScheduledAppointment = patientAppointments.some(apt => 
    apt.date && apt.time && apt.status !== 'cancelled'
  );

  const handleScheduleAppointment = async () => {
    if (!patient) return;
    
    if (!schedulingData.appointmentDate || !schedulingData.appointmentTime || !schedulingData.dentistName) {
      toast.error('Please fill in all appointment details');
      return;
    }

    // Check for appointment conflicts (same date, time, and dentist)
    const conflictingAppointment = patientAppointments.find(apt => 
      apt.date === schedulingData.appointmentDate && 
      apt.time === schedulingData.appointmentTime && 
      apt.dentistName === schedulingData.dentistName &&
      apt.status !== 'cancelled'
    );

    if (conflictingAppointment) {
      toast.error('Appointment Conflict', {
        description: `An appointment already exists on ${schedulingData.appointmentDate} at ${schedulingData.appointmentTime} with ${schedulingData.dentistName}`
      });
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
          status: 'confirmed'
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
            status: 'confirmed'
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
        
        // Refresh appointments data
        await refreshAppointments();
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

  // Medical Records Functions
  const fetchMedicalRecords = async (patientEmail: string): Promise<void> => {
    try {
      const response: Response = await fetch(`/api/medical-records?patientEmail=${encodeURIComponent(patientEmail)}`);
      const data = await response.json();
      
      if (response.ok) {
        // Fetch files for each record
        const allRecords = [...(data.medicalInfo || []), ...(data.allergies || []), ...(data.medications || [])];
        
        for (const record of allRecords) {
          try {
            const filesResponse: Response = await fetch(`/api/files?recordId=${record.id}`);
            const filesData = await filesResponse.json();
            
            if (filesResponse.ok) {
              record.files = filesData.files || [];
            }
          } catch (error) {
            console.error(`Error fetching files for record ${record.id}:`, error);
            record.files = [];
          }
        }
        
        setMedicalInfo(data.medicalInfo || []);
        setAllergies(data.allergies || []);
        setMedications(data.medications || []);
      } else {
        console.error('Failed to fetch medical records:', data.error);
      }
    } catch (error) {
      console.error('Error fetching medical records:', error);
    }
  };

  const fetchPatientFiles = async (patientId: string): Promise<void> => {
    try {
      setFilesLoading(true);
      const response: Response = await fetch(`/api/files?patientId=${encodeURIComponent(patientId)}`);
      const data = await response.json();
      
      if (response.ok) {
        setPatientFiles(data.files || []);
      } else {
        console.error('Failed to fetch patient files:', data.error);
        setPatientFiles([]);
      }
    } catch (error) {
      console.error('Error fetching patient files:', error);
      setPatientFiles([]);
    } finally {
      setFilesLoading(false);
    }
  };

  const fetchNotifications = async (): Promise<void> => {
    try {
      const response: Response = await fetch('/api/notifications');
      const data = await response.json();
      
      if (response.ok) {
        setNotifications(data.notifications || []);
      } else {
        console.error('Failed to fetch notifications:', data.error);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const fetchCorrectionRequests = async (): Promise<void> => {
    try {
      const response: Response = await fetch('/api/correction-requests');
      const data = await response.json();
      
      if (response.ok) {
        setCorrectionRequests(data.requests || []);
      } else {
        console.error('Failed to fetch correction requests:', data.error);
      }
    } catch (error) {
      console.error('Error fetching correction requests:', error);
    }
  };

  const fetchServiceHistory = async (patientEmail: string): Promise<void> => {
    if (!user || !canViewPatients) return;
    
    try {
      setServiceHistoryLoading(true);
      setServiceHistoryError(null);

      const params = new URLSearchParams({
        userEmail: user.email,
        userRole: user.role,
      });

      const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-c89a26e4/patients/${encodeURIComponent(patientEmail)}/service-history?${params}`;
      const response = await fetch(serverUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch service history');
      }

      const data = await response.json();
      
      if (data.success) {
        setServiceHistory(data.serviceHistory || []);
      } else {
        throw new Error(data.error || 'Failed to fetch service history');
      }
    } catch (error) {
      console.error('Error fetching service history:', error);
      setServiceHistoryError(error instanceof Error ? error.message : 'Failed to fetch service history');
    } finally {
      setServiceHistoryLoading(false);
    }
  };

  const handleAddRecord = async (): Promise<void> => {
    if (!patient || !user) return;

    try {
      setIsSubmitting(true);
      
      // First, create the medical record to get the real recordId
      const recordData = {
        patientId: patient.id,
        patientEmail: patient.email,
        type: activeRecordType,
        staffId: user.id,
        staffEmail: user.email,
        staffName: user.name || `${user.first_name} ${user.last_name}`.trim(),
        dateRecorded: new Date().toISOString(),
        ...recordFormData
      };

      const response: Response = await fetch('/api/medical-records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(recordData),
      });

      const data = await response.json();
      console.log('[Patient Detail] Medical record POST response:', { status: response.status, data });

      if (response.ok) {
        const newRecordId = data.record?.id;
        
        // Upload any pending files with the real recordId
        if (recordFileUploadRef.current && recordFileUploadRef.current.hasPendingFiles() && newRecordId) {
          console.log('[Patient Detail] Uploading pending files with recordId:', newRecordId);
          
          // Temporarily store the old recordId
          const tempRecordId = 'temp';
          
          // Upload pending files (they will use 'temp' recordId initially)
          const uploadedFiles = await recordFileUploadRef.current.uploadPendingFiles();
          
          // Update all uploaded files with the real recordId
          for (const file of uploadedFiles) {
            try {
              const updateResponse = await fetch('/api/files', {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  fileId: file.id,
                  recordId: newRecordId,
                }),
              });

              if (updateResponse.ok) {
                console.log('[Patient Detail] Successfully updated pending file:', file.id);
              } else {
                console.error('[Patient Detail] Failed to update pending file:', file.id);
              }
            } catch (error) {
              console.error('[Patient Detail] Error updating pending file:', file.id, error);
            }
          }
        }
        
        // Update any already-uploaded files with the new recordId (from temp recordId)
        if (recordFiles.length > 0 && newRecordId) {
          console.log('[Patient Detail] Updating existing files with new recordId:', newRecordId);
          
          for (const file of recordFiles) {
            try {
              const updateResponse = await fetch('/api/files', {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  fileId: file.id,
                  recordId: newRecordId,
                }),
              });

              if (updateResponse.ok) {
                console.log('[Patient Detail] Successfully updated file:', file.id);
              } else {
                console.error('[Patient Detail] Failed to update file:', file.id);
              }
            } catch (error) {
              console.error('[Patient Detail] Error updating file:', file.id, error);
            }
          }
        }
        
        toast.success('Medical record added successfully');
        setShowAddRecord(false);
        setRecordFormData({});
        setRecordFiles([]);
        fetchMedicalRecords(patient.email);
        fetchPatientFiles(patient.id);
      } else {
        toast.error(data.error || 'Failed to add medical record');
      }
    } catch (error) {
      console.error('Error adding medical record:', error);
      toast.error('Failed to add medical record');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditRecord = async (): Promise<void> => {
    if (!selectedRecord || !user) return;

    try {
      setIsSubmitting(true);
      
      const updates = {
        ...recordFormData,
        staffId: user.id,
        staffEmail: user.email,
        staffName: user.name || `${user.first_name} ${user.last_name}`.trim(),
      };

      const response: Response = await fetch(`/api/medical-records/${selectedRecord.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Medical record updated successfully');
        setShowEditRecord(false);
        setSelectedRecord(null);
        setRecordFormData({});
        setRecordFiles([]); // Reset files
        if (patient) {
          fetchMedicalRecords(patient.email);
        }
      } else {
        toast.error(data.error || 'Failed to update medical record');
      }
    } catch (error) {
      console.error('Error updating medical record:', error);
      toast.error('Failed to update medical record');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReviewRequest = async (action: 'approve' | 'deny', reviewNotes?: string): Promise<void> => {
    if (!selectedRequest || !user) return;

    try {
      setIsSubmitting(true);
      
      const reviewData = {
        action,
        reviewNotes: reviewNotes || '',
        reviewedBy: user.name || `${user.first_name} ${user.last_name}`.trim(),
      };

      const response: Response = await fetch(`/api/correction-requests/${selectedRequest.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reviewData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`Correction request ${action}d successfully`);
        setShowReviewRequest(false);
        setSelectedRequest(null);
        fetchCorrectionRequests();
        if (patient) {
          fetchMedicalRecords(patient.email);
        }
      } else {
        toast.error(data.error || `Failed to ${action} correction request`);
      }
    } catch (error) {
      console.error(`Error ${action}ing correction request:`, error);
      toast.error(`Failed to ${action} correction request`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRecordForm = () => {
    switch (activeRecordType) {
      case 'medical_info':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={recordFormData.title || ''}
                onChange={(e) => setRecordFormData({...recordFormData, title: e.target.value})}
                placeholder="Enter medical condition or information title"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={recordFormData.description || ''}
                onChange={(e) => setRecordFormData({...recordFormData, description: e.target.value})}
                placeholder="Enter detailed description"
                rows={3}
              />
            </div>
          </div>
        );
      case 'allergy':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="allergen">Allergen</Label>
              <Input
                id="allergen"
                value={recordFormData.allergen || ''}
                onChange={(e) => setRecordFormData({...recordFormData, allergen: e.target.value})}
                placeholder="Enter allergen name"
              />
            </div>
            <div>
              <Label htmlFor="severity">Severity</Label>
              <Select 
                value={recordFormData.severity || ''} 
                onValueChange={(value) => setRecordFormData({...recordFormData, severity: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mild">Mild</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="severe">Severe</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="reaction">Reaction</Label>
              <Textarea
                id="reaction"
                value={recordFormData.reaction || ''}
                onChange={(e) => setRecordFormData({...recordFormData, reaction: e.target.value})}
                placeholder="Describe the allergic reaction"
                rows={3}
              />
            </div>
          </div>
        );
      case 'medication':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="medicationName">Medication Name</Label>
              <Input
                id="medicationName"
                value={recordFormData.medicationName || ''}
                onChange={(e) => setRecordFormData({...recordFormData, medicationName: e.target.value})}
                placeholder="Enter medication name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dosage">Dosage</Label>
                <Input
                  id="dosage"
                  value={recordFormData.dosage || ''}
                  onChange={(e) => setRecordFormData({...recordFormData, dosage: e.target.value})}
                  placeholder="e.g., 500mg"
                />
              </div>
              <div>
                <Label htmlFor="frequency">Frequency</Label>
                <Input
                  id="frequency"
                  value={recordFormData.frequency || ''}
                  onChange={(e) => setRecordFormData({...recordFormData, frequency: e.target.value})}
                  placeholder="e.g., Twice daily"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={recordFormData.startDate || ''}
                  onChange={(e) => setRecordFormData({...recordFormData, startDate: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date (Optional)</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={recordFormData.endDate || ''}
                  onChange={(e) => setRecordFormData({...recordFormData, endDate: e.target.value})}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="prescribedBy">Prescribed By</Label>
              <Input
                id="prescribedBy"
                value={recordFormData.prescribedBy || ''}
                onChange={(e) => setRecordFormData({...recordFormData, prescribedBy: e.target.value})}
                placeholder="Enter prescribing doctor's name"
              />
            </div>
            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={recordFormData.notes || ''}
                onChange={(e) => setRecordFormData({...recordFormData, notes: e.target.value})}
                placeholder="Additional notes about the medication"
                rows={2}
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const getRecordFormWithFiles = () => {
    if (!patient || !user) return null;
    
    // Check if required field has value based on record type
    const hasRequiredField = () => {
      switch (activeRecordType) {
        case 'medical_info':
          return !!recordFormData.title;
        case 'allergy':
          return !!recordFormData.allergen;
        case 'medication':
          return !!recordFormData.medicationName;
        default:
          return true;
      }
    };

    const isUploadDisabled = !hasRequiredField();
    
    return (
      <div className="space-y-6">
        {getRecordForm()}
        
        <div>
          <Label>Supporting Files (Optional)</Label>
          {isUploadDisabled && (
            <p className="text-sm text-amber-600 mt-1">
              {activeRecordType === 'medical_info' && 'Please enter a title before uploading files'}
              {activeRecordType === 'allergy' && 'Please enter an allergen before uploading files'}
              {activeRecordType === 'medication' && 'Please enter a medication name before uploading files'}
            </p>
          )}
          <div className="mt-2">
            <FileUpload
              ref={recordFileUploadRef}
              recordId={selectedRecord?.id || 'temp'}
              recordType={activeRecordType}
              patientId={patient.id}
              patientEmail={patient.email}
              uploadedBy={user.id}
              uploadedByName={user.name || `${user.first_name} ${user.last_name}`.trim()}
              files={recordFiles}
              onFilesChange={(files) => {
                setRecordFiles(files);
                // Refresh patient files list
                fetchPatientFiles(patient.id);
              }}
              maxFiles={3}
              disabled={isUploadDisabled}
              autoUpload={false}
            />
          </div>
        </div>
      </div>
    );
  };

  const today = new Date().toISOString().split('T')[0];

  if (!canViewPatients) {
    return null; // Will redirect in useEffect
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-500">Patient not found</p>
            <Button onClick={() => router.push('/dashboard/patients')} className="mt-4">
              Back to Patients
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => router.push('/dashboard/patients')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Patients
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-CustomPink1">Patient Details</h1>
          <p className="text-gray-600 mt-1">Manage patient information and appointments</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Notifications Bell */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowNotifications(true)}
              className="relative flex items-center gap-2"
            >
              <Bell className="h-4 w-4" />
              {notifications.filter(n => !n.isRead).length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {notifications.filter(n => !n.isRead).length}
                </span>
              )}
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={() => router.push(`/dashboard/patients/${patient.id}/appointments`)}
              className="flex items-center gap-2"
            >
              <History className="h-4 w-4" />
              View Full History
            </Button>
            
            <Button
              variant="outline"
              onClick={() => router.push(`/dashboard/patients/${patient.id}/tooth-chart`)}
              className="flex items-center gap-2"
            >
              <Smile className="h-4 w-4" />
              Dental Chart
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs for different sections */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="medical-info" className="flex items-center gap-1">
            <Heart className="w-3 h-3" />
            Medical Info
          </TabsTrigger>
          <TabsTrigger value="allergies" className="flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            Allergies
          </TabsTrigger>
          <TabsTrigger value="medications" className="flex items-center gap-1">
            <Pill className="w-3 h-3" />
            Medications
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-1">
            <FileText className="w-3 h-3" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="services">Service History</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Patient Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Patient Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Registered</Label>
                    <p className="text-sm">{patient.createdAt ? new Date(patient.createdAt).toLocaleDateString() : 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Created By</Label>
                    <p className="text-sm">{patient.createdBy || 'Self-registered'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-CustomPink1">
                  {patientAppointments.length}
                </div>
                <p className="text-sm text-gray-600">Total Appointments</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {patientAppointments.filter(apt => apt.status === 'completed').length}
                </div>
                <p className="text-sm text-gray-600">Completed</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {serviceHistory.length}
                </div>
                <p className="text-sm text-gray-600">Services Completed</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Appointments Tab */}
        <TabsContent value="appointments" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Recent Appointments</CardTitle>
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
                  {patientAppointments.slice(0, 5).map((appointment) => (
                    <div key={appointment.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {appointment.status}
                          </Badge>
                          <span className="text-sm text-gray-600">
                            {appointment.date ? new Date(appointment.date).toLocaleDateString() : 'No date set'}
                          </span>
                          {appointment.time && (
                            <span className="text-sm text-gray-600">
                              at {appointment.time}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {appointment.dentistName || 'No dentist assigned'}
                        </div>
                      </div>
                      <div>
                        <p className="font-medium">{appointment.service}</p>
                        {appointment.reason && (
                          <p className="text-sm text-gray-600">{appointment.reason}</p>
                        )}
                      </div>
                    </div>
                  ))}
                  {patientAppointments.length > 5 && (
                    <div className="text-center pt-4">
                      <Button 
                        variant="outline" 
                        onClick={() => router.push(`/dashboard/patients/${patient.id}/appointments`)}
                      >
                        View All Appointments
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Medical Info Tab */}
        <TabsContent value="medical-info" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Medical Information ({medicalInfo.length})
              </CardTitle>
              <Button onClick={() => {
                setActiveRecordType('medical_info');
                setRecordFormData({});
                setRecordFiles([]);
                setShowAddRecord(true);
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Medical Info
              </Button>
            </CardHeader>
            <CardContent>
              {medicalInfo.length === 0 ? (
                <div className="text-center py-8">
                  <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No medical information recorded</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {medicalInfo.map((info) => (
                    <div key={info.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg">{(info as any).title}</h4>
                          <p className="text-gray-700 mt-2">{(info as any).description}</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedRecord(info);
                            setRecordFormData({
                              title: (info as any).title,
                              description: (info as any).description
                            });
                            setRecordFiles((info as any).files || []);
                            setShowEditRecord(true);
                          }}
                        >
                          <Edit3 className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Recorded: {new Date((info as any).dateRecorded).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          By: {(info as any).staffName}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Allergies Tab */}
        <TabsContent value="allergies" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Allergies ({allergies.length})
              </CardTitle>
              <Button onClick={() => {
                setActiveRecordType('allergy');
                setRecordFormData({});
                setRecordFiles([]);
                setShowAddRecord(true);
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Allergy
              </Button>
            </CardHeader>
            <CardContent>
              {allergies.length === 0 ? (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No allergies recorded</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {allergies.map((allergy) => (
                    <div key={allergy.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold text-lg">{(allergy as any).allergen}</h4>
                            <Badge variant={
                              (allergy as any).severity === 'severe' ? 'destructive' : 
                              (allergy as any).severity === 'moderate' ? 'secondary' : 'outline'
                            }>
                              {(allergy as any).severity}
                            </Badge>
                          </div>
                          <p className="text-gray-700">
                            <strong>Reaction:</strong> {(allergy as any).reaction}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedRecord(allergy);
                            setRecordFormData({
                              allergen: (allergy as any).allergen,
                              severity: (allergy as any).severity,
                              reaction: (allergy as any).reaction
                            });
                            setRecordFiles((allergy as any).files || []);
                            setShowEditRecord(true);
                          }}
                        >
                          <Edit3 className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Recorded: {new Date((allergy as any).dateRecorded).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          By: {(allergy as any).staffName}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Medications Tab */}
        <TabsContent value="medications" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Pill className="h-5 w-5" />
                Medications ({medications.length})
              </CardTitle>
              <Button onClick={() => {
                setActiveRecordType('medication');
                setRecordFormData({});
                setRecordFiles([]);
                setShowAddRecord(true);
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Medication
              </Button>
            </CardHeader>
            <CardContent>
              {medications.length === 0 ? (
                <div className="text-center py-8">
                  <Pill className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No medications recorded</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {medications.map((medication) => (
                    <div key={medication.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg">{(medication as any).medicationName}</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                            <div>
                              <p><strong>Dosage:</strong> {(medication as any).dosage}</p>
                              <p><strong>Frequency:</strong> {(medication as any).frequency}</p>
                              <p><strong>Prescribed By:</strong> {(medication as any).prescribedBy}</p>
                            </div>
                            <div>
                              <p><strong>Start Date:</strong> {new Date((medication as any).startDate).toLocaleDateString()}</p>
                              {(medication as any).endDate && (
                                <p><strong>End Date:</strong> {new Date((medication as any).endDate).toLocaleDateString()}</p>
                              )}
                              {(medication as any).notes && (
                                <p><strong>Notes:</strong> {(medication as any).notes}</p>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedRecord(medication);
                            setRecordFormData({
                              medicationName: (medication as any).medicationName,
                              dosage: (medication as any).dosage,
                              frequency: (medication as any).frequency,
                              startDate: (medication as any).startDate,
                              endDate: (medication as any).endDate,
                              prescribedBy: (medication as any).prescribedBy,
                              notes: (medication as any).notes
                            });
                            setRecordFiles((medication as any).files || []);
                            setShowEditRecord(true);
                          }}
                        >
                          <Edit3 className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Recorded: {new Date((medication as any).dateRecorded).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          By: {(medication as any).staffName}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Patient Documents ({patientFiles.length})
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => patient && fetchPatientFiles(patient.id)}
                  disabled={filesLoading}
                >
                  {filesLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {filesLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 text-gray-400 mx-auto mb-4 animate-spin" />
                  <p className="text-gray-500">Loading documents...</p>
                </div>
              ) : patientFiles.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No documents uploaded yet</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {(() => {
                    // Group files by record type
                    const groupedFiles = {
                      medical_info: patientFiles.filter(f => f.recordType === 'medical_info'),
                      allergy: patientFiles.filter(f => f.recordType === 'allergy'),
                      medication: patientFiles.filter(f => f.recordType === 'medication'),
                      correction_request: patientFiles.filter(f => f.recordType === 'correction_request')
                    };

                    return Object.entries(groupedFiles).map(([recordType, files]) => {
                      if (files.length === 0) return null;
                      
                      const typeLabels = {
                        medical_info: 'Medical Information',
                        allergy: 'Allergies',
                        medication: 'Medications',
                        correction_request: 'Correction Requests'
                      };

                      return (
                        <div key={recordType}>
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            {recordType === 'medical_info' && <Heart className="w-4 h-4" />}
                            {recordType === 'allergy' && <AlertTriangle className="w-4 h-4" />}
                            {recordType === 'medication' && <Pill className="w-4 h-4" />}
                            {recordType === 'correction_request' && <FileText className="w-4 h-4" />}
                            {typeLabels[recordType as keyof typeof typeLabels]} ({files.length})
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {files.map((file) => {
                              // Find the associated medical record to get the title
                              let recordTitle = 'Untitled Record';
                              
                              if (recordType === 'medical_info') {
                                const record = medicalInfo.find(r => r.id === file.recordId);
                                // Debug: Log to see what's happening
                                if (!record) {
                                  console.log(`[Documents Tab] Medical record not found for file:`, {
                                    fileId: file.id,
                                    fileRecordId: file.recordId,
                                    availableRecordIds: medicalInfo.map(r => r.id)
                                  });
                                } else if (!record.title) {
                                  console.log(`[Documents Tab] Medical record found but title is empty:`, {
                                    recordId: record.id,
                                    record: record
                                  });
                                }
                                recordTitle = record?.title || 'Untitled Medical Info';
                              } else if (recordType === 'allergy') {
                                const record = allergies.find(r => r.id === file.recordId);
                                recordTitle = record?.allergen || 'Unknown Allergen';
                              } else if (recordType === 'medication') {
                                const record = medications.find(r => r.id === file.recordId);
                                recordTitle = record?.medicationName || 'Unknown Medication';
                              }
                              
                              return (
                              <div key={file.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                                <div className="space-y-2">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium truncate" title={recordTitle}>
                                        {recordTitle}
                                      </p>
                                      <p className="text-sm text-gray-500 truncate" title={file.originalFileName}>
                                        {file.originalFileName}
                                      </p>
                                      <p className="text-xs text-gray-400 mt-1">
                                        {(file.fileSize / 1024).toFixed(1)} KB
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    <p>Uploaded: {new Date(file.uploadedAt).toLocaleDateString()}</p>
                                    {file.modifiedTime && file.modifiedTime !== file.uploadedAt && (
                                      <p>Modified: {new Date(file.modifiedTime).toLocaleDateString()}</p>
                                    )}
                                    <p>By: {file.uploadedByName}</p>
                                    {file.description && file.description !== file.originalFileName && (
                                      <p className="mt-1 italic">{file.description}</p>
                                    )}
                                  </div>
                                  <div className="flex gap-2 pt-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="flex-1"
                                      onClick={() => {
                                        const link = document.createElement('a');
                                        link.href = `/api/files/${file.id}`;
                                        link.download = file.originalFileName;
                                        document.body.appendChild(link);
                                        link.click();
                                        document.body.removeChild(link);
                                      }}
                                    >
                                      <Download className="w-4 h-4 mr-1" />
                                      Download
                                    </Button>
                                    {file.webViewLink && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => window.open(file.webViewLink, '_blank')}
                                        title="View in Google Drive"
                                      >
                                        <FileText className="w-4 h-4" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Service History Tab */}
        <TabsContent value="services" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <History className="h-5 w-5" />
                Service History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {serviceHistoryLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading service history...</p>
                </div>
              ) : serviceHistoryError ? (
                <div className="text-center py-8">
                  <div className="text-red-600 mb-4">
                    <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                    <p>{serviceHistoryError}</p>
                  </div>
                </div>
              ) : serviceHistory.length === 0 ? (
                <div className="text-center py-8">
                  <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No completed services found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {serviceHistory.map((service, index) => (
                    <div
                      key={`${service.serviceName}-${service.date}-${index}`}
                      className="border rounded-lg p-4 bg-gray-50"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <div>
                            <p className="font-medium">{service.serviceName}</p>
                            <p className="text-sm text-gray-600">
                              {format(new Date(service.date), 'MMM dd, yyyy')}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Completed
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Dentist: {service.dentist}</span>
                      </div>

                      {service.treatmentDetails && service.treatmentDetails.length > 0 && (
                        <div className="mt-3 p-3 bg-white rounded border">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Treatment Details:</h4>
                          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                            {service.treatmentDetails.map((detail: string, idx: number) => (
                              <li key={idx}>{detail}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {service.notes && (
                        <div className="mt-3 p-3 bg-white rounded border">
                          <h4 className="text-sm font-medium text-gray-700 mb-1">Notes:</h4>
                          <p className="text-sm text-gray-600">{service.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Scheduling Modal */}
      {showScheduling && (
        <Dialog open={showScheduling} onOpenChange={setShowScheduling}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Schedule Appointment for {patient.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="appointmentDate">Date</Label>
                <Input
                  id="appointmentDate"
                  type="date"
                  value={schedulingData.appointmentDate}
                  onChange={(e) => setSchedulingData({...schedulingData, appointmentDate: e.target.value})}
                  min={today}
                />
              </div>
              <div>
                <Label htmlFor="appointmentTime">Time</Label>
                <Select value={schedulingData.appointmentTime} onValueChange={(value) => setSchedulingData({...schedulingData, appointmentTime: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map((time) => (
                      <SelectItem key={time} value={time}>{time}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="dentistName">Dentist</Label>
                <Select value={schedulingData.dentistName} onValueChange={(value) => setSchedulingData({...schedulingData, dentistName: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select dentist" />
                  </SelectTrigger>
                  <SelectContent>
                    {DENTISTS.map((dentist) => (
                      <SelectItem key={dentist} value={dentist}>{dentist}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="reason">Reason</Label>
                <Input
                  id="reason"
                  value={schedulingData.reason}
                  onChange={(e) => setSchedulingData({...schedulingData, reason: e.target.value})}
                  placeholder="Appointment reason"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowScheduling(false)}>
                  Cancel
                </Button>
                <Button onClick={handleScheduleAppointment} disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Schedule Appointment
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Notifications Modal */}
      <Dialog open={showNotifications} onOpenChange={setShowNotifications}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Notifications</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {notifications.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No notifications</p>
            ) : (
              notifications.map((notification) => (
                <div key={notification.id} className={`border rounded-lg p-4 ${!notification.isRead ? 'bg-blue-50 border-blue-200' : ''}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-semibold">{notification.title}</h4>
                      <p className="text-gray-700 mt-1">{notification.message}</p>
                    </div>
                    {!notification.isRead && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          const response: Response = await fetch(`/api/notifications/${notification.id}/read`, { method: 'PUT' });
                          fetchNotifications();
                        }}
                      >
                        Mark as Read
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                  {notification.type === 'correction_request' && notification.data && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => {
                        setSelectedRequest(notification.data);
                        setShowReviewRequest(true);
                        setShowNotifications(false);
                      }}
                    >
                      Review Request
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Medical Record Modal */}
      <Dialog open={showAddRecord || showEditRecord} onOpenChange={(open) => {
        if (!open) {
          setShowAddRecord(false);
          setShowEditRecord(false);
          setSelectedRecord(null);
          setRecordFormData({});
          setRecordFiles([]);
          // Clear pending files when closing
          if (recordFileUploadRef.current) {
            recordFileUploadRef.current.clearPendingFiles();
          }
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto overflow-x-hidden">
          <DialogHeader>
            <DialogTitle>
              {showEditRecord ? 'Edit' : 'Add'} {activeRecordType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 overflow-hidden">
            {getRecordFormWithFiles()}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setShowAddRecord(false);
                setShowEditRecord(false);
                setSelectedRecord(null);
                setRecordFormData({});
                setRecordFiles([]);
                // Clear pending files when canceling
                if (recordFileUploadRef.current) {
                  recordFileUploadRef.current.clearPendingFiles();
                }
              }}>
                Cancel
              </Button>
              <Button 
                onClick={showEditRecord ? handleEditRecord : handleAddRecord}
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {showEditRecord ? 'Update' : 'Add'} {activeRecordType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Review Correction Request Modal */}
      <Dialog open={showReviewRequest} onOpenChange={(open) => {
        if (!open) {
          setReviewFiles([]);
        }
        setShowReviewRequest(open);
      }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto overflow-x-hidden">
          <DialogHeader>
            <DialogTitle>Review Correction Request</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div>
                <p><strong>Patient:</strong> {selectedRequest.patientName}</p>
                <p><strong>Record Type:</strong> {selectedRequest.recordType.replace('_', ' ')}</p>
                <p><strong>Submitted:</strong> {new Date(selectedRequest.createdAt).toLocaleString()}</p>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="font-semibold mb-2">Suggested Changes:</h4>
                <div className="space-y-2">
                  {selectedRequest.suggestedChanges.map((change, index) => (
                    <div key={index} className="border rounded p-3 bg-gray-50">
                      <p><strong>Field:</strong> {change.field}</p>
                      <p><strong>Current:</strong> {change.currentValue}</p>
                      <p><strong>Suggested:</strong> {change.suggestedValue}</p>
                      <p><strong>Reason:</strong> {change.reason}</p>
                    </div>
                  ))}
                </div>
              </div>

              {user && (
                <div>
                  <Label>Review Files (Optional)</Label>
                  <div className="mt-2">
                    <FileUpload
                      ref={reviewFileUploadRef}
                      recordId={selectedRequest.id}
                      recordType="correction_request"
                      patientId={selectedRequest.patientId}
                      patientEmail={selectedRequest.patientEmail}
                      uploadedBy={user.id}
                      uploadedByName={user.name || `${user.first_name} ${user.last_name}`.trim()}
                      files={reviewFiles}
                      onFilesChange={(files) => {
                        setReviewFiles(files);
                        // Refresh patient files list
                        if (patient) fetchPatientFiles(patient.id);
                      }}
                      maxFiles={3}
                      autoUpload={true}
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleReviewRequest('deny', 'Request denied after review')}
                  disabled={isSubmitting}
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  <X className="w-4 h-4 mr-1" />
                  Deny
                </Button>
                <Button
                  onClick={() => handleReviewRequest('approve', 'Request approved and changes applied')}
                  disabled={isSubmitting}
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  <Check className="w-4 h-4 mr-1" />
                  Approve
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}