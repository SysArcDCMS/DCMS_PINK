'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/dialog';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { 
  Heart, 
  AlertTriangle, 
  Pill, 
  Edit3, 
  Calendar,
  User,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  FileText,
  Download
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { toast } from 'sonner';
import { MedicalRecord, CorrectionRequest } from '../../../types';

interface CorrectionRequestFormData {
  field: string;
  currentValue: string;
  suggestedValue: string;
  reason: string;
}

interface FileData {
  id: string;
  fileName: string;
  originalFileName: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  webViewLink: string;
  webContentLink: string;
  recordId: string;
  recordType: string;
  description?: string;
}

export default function MedicalRecordsPage() {
  const { user } = useAuth();
  const [medicalInfo, setMedicalInfo] = useState<MedicalRecord[]>([]);
  const [allergies, setAllergies] = useState<MedicalRecord[]>([]);
  const [medications, setMedications] = useState<MedicalRecord[]>([]);
  const [correctionRequests, setCorrectionRequests] = useState<CorrectionRequest[]>([]);
  const [recordFiles, setRecordFiles] = useState<Record<string, FileData[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);

  // Correction request form state
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [correctionFormData, setCorrectionFormData] = useState<CorrectionRequestFormData>({
    field: '',
    currentValue: '',
    suggestedValue: '',
    reason: ''
  });

  useEffect(() => {
    if (user?.email) {
      fetchMedicalRecords();
      fetchCorrectionRequests();
    }
  }, [user]);

  useEffect(() => {
    console.log('[Medical Records] useEffect - Medical records updated:', {
      medicalInfoCount: medicalInfo.length,
      allergiesCount: allergies.length,
      medicationsCount: medications.length,
      user: user?.email
    });
    
    if (medicalInfo.length > 0 || allergies.length > 0 || medications.length > 0) {
      console.log('[Medical Records] useEffect - Triggering fetchFilesForRecords');
      fetchFilesForRecords();
    } else {
      console.log('[Medical Records] useEffect - No records yet, skipping file fetch');
    }
  }, [medicalInfo, allergies, medications]);

  const fetchMedicalRecords = async (): Promise<void> => {
    if (!user?.email) {
      console.log('[Medical Records] fetchMedicalRecords - No user email');
      return;
    }

    try {
      console.log('[Medical Records] fetchMedicalRecords - Starting fetch for:', user.email);
      setIsLoading(true);
      
      const url = `/api/medical-records?patientEmail=${encodeURIComponent(user.email)}`;
      console.log('[Medical Records] fetchMedicalRecords - Request URL:', url);
      
      const response = await fetch(url);
      const data = await response.json();

      console.log('[Medical Records] fetchMedicalRecords - Response status:', response.status);
      console.log('[Medical Records] fetchMedicalRecords - Response data:', data);

      if (response.ok) {
        console.log('[Medical Records] fetchMedicalRecords - Medical Info:', data.medicalInfo?.length || 0, 'records');
        console.log('[Medical Records] fetchMedicalRecords - Allergies:', data.allergies?.length || 0, 'records');
        console.log('[Medical Records] fetchMedicalRecords - Medications:', data.medications?.length || 0, 'records');
        
        setMedicalInfo(data.medicalInfo || []);
        setAllergies(data.allergies || []);
        setMedications(data.medications || []);
      } else {
        console.error('[Medical Records] fetchMedicalRecords - Error:', data.error);
        toast.error(data.error || 'Failed to fetch medical records');
      }
    } catch (error) {
      console.error('[Medical Records] fetchMedicalRecords - Exception:', error);
      toast.error('Failed to fetch medical records');
    } finally {
      setIsLoading(false);
      console.log('[Medical Records] fetchMedicalRecords - Completed');
    }
  };

  const fetchCorrectionRequests = async (): Promise<void> => {
    if (!user?.email) return;

    try {
      const response = await fetch(`/api/correction-requests?patientEmail=${encodeURIComponent(user.email)}`);
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

  const fetchFilesForRecords = async (): Promise<void> => {
    if (!user?.email) {
      console.log('[Medical Records] fetchFilesForRecords - No user email, skipping');
      return;
    }

    try {
      console.log('[Medical Records] fetchFilesForRecords - Starting fetch for:', user.email);
      setIsLoadingFiles(true);
      
      const url = `/api/files?patientEmail=${encodeURIComponent(user.email)}`;
      console.log('[Medical Records] fetchFilesForRecords - Request URL:', url);
      
      const response = await fetch(url);
      const data = await response.json();

      console.log('[Medical Records] fetchFilesForRecords - Response status:', response.status);
      console.log('[Medical Records] fetchFilesForRecords - Response data:', data);

      if (response.ok && data.files) {
        console.log('[Medical Records] fetchFilesForRecords - Total files received:', data.files.length);
        
        // Group files by recordId
        const filesByRecord: Record<string, FileData[]> = {};
        data.files.forEach((file: FileData) => {
          console.log('[Medical Records] fetchFilesForRecords - Processing file:', {
            id: file.id,
            originalFileName: file.originalFileName,
            recordId: file.recordId,
            recordType: file.recordType
          });
          
          if (file.recordId) {
            if (!filesByRecord[file.recordId]) {
              filesByRecord[file.recordId] = [];
            }
            filesByRecord[file.recordId].push(file);
          } else {
            console.warn('[Medical Records] fetchFilesForRecords - File without recordId:', file);
          }
        });
        
        console.log('[Medical Records] fetchFilesForRecords - Files grouped by recordId:', filesByRecord);
        console.log('[Medical Records] fetchFilesForRecords - Number of records with files:', Object.keys(filesByRecord).length);
        
        setRecordFiles(filesByRecord);
      } else {
        console.error('[Medical Records] fetchFilesForRecords - Failed to fetch files:', data.error);
        console.error('[Medical Records] fetchFilesForRecords - Full response:', data);
      }
    } catch (error) {
      console.error('[Medical Records] fetchFilesForRecords - Error:', error);
    } finally {
      setIsLoadingFiles(false);
      console.log('[Medical Records] fetchFilesForRecords - Completed');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    return <FileText className="w-4 h-4" />;
  };

  const renderFilesList = (recordId: string) => {
    console.log('[Medical Records] renderFilesList - Called for recordId:', recordId);
    console.log('[Medical Records] renderFilesList - recordFiles state:', recordFiles);
    console.log('[Medical Records] renderFilesList - files for this record:', recordFiles[recordId]);
    
    const files = recordFiles[recordId];
    if (!files || files.length === 0) {
      console.log('[Medical Records] renderFilesList - No files for recordId:', recordId);
      return null;
    }

    console.log('[Medical Records] renderFilesList - Rendering', files.length, 'files for recordId:', recordId);

    return (
      <div className="mt-4 border-t pt-4">
        <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Attached Files ({files.length})
        </h4>
        <div className="space-y-2">
          {files.map((file) => (
            <div 
              key={file.id} 
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {getFileIcon(file.fileType)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.originalFileName}</p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(file.fileSize)} • {new Date(file.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                >
                  <a 
                    href={file.webViewLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1"
                  >
                    <Download className="w-4 h-4" />
                    View
                  </a>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const handleRequestCorrection = (record: MedicalRecord): void => {
    setSelectedRecord(record);
    setCorrectionFormData({
      field: '',
      currentValue: '',
      suggestedValue: '',
      reason: ''
    });
  };

  const submitCorrectionRequest = async (): Promise<void> => {
    if (!selectedRecord || !user) return;

    try {
      setIsSubmitting(true);

      const requestData = {
        recordId: selectedRecord.id,
        recordType: selectedRecord.type,
        patientId: user.id,
        patientEmail: user.email,
        patientName: user.name || `${user.first_name} ${user.last_name}`.trim(),
        originalRecord: selectedRecord,
        suggestedChanges: [{
          field: correctionFormData.field,
          currentValue: correctionFormData.currentValue,
          suggestedValue: correctionFormData.suggestedValue,
          reason: correctionFormData.reason
        }]
      };

      const response = await fetch('/api/correction-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Correction request submitted successfully');
        setSelectedRecord(null);
        setCorrectionFormData({
          field: '',
          currentValue: '',
          suggestedValue: '',
          reason: ''
        });
        fetchCorrectionRequests();
      } else {
        toast.error(data.error || 'Failed to submit correction request');
      }
    } catch (error) {
      console.error('Error submitting correction request:', error);
      toast.error('Failed to submit correction request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFieldOptions = (record: MedicalRecord): { label: string; value: string; currentValue: string }[] => {
    switch (record.type) {
      case 'medical_info':
        return [
          { label: 'Title', value: 'title', currentValue: (record as any).title || '' },
          { label: 'Description', value: 'description', currentValue: (record as any).description || '' },
          { label: 'Date Recorded', value: 'dateRecorded', currentValue: (record as any).dateRecorded || '' }
        ];
      case 'allergy':
        return [
          { label: 'Allergen', value: 'allergen', currentValue: (record as any).allergen || '' },
          { label: 'Severity', value: 'severity', currentValue: (record as any).severity || '' },
          { label: 'Reaction', value: 'reaction', currentValue: (record as any).reaction || '' },
          { label: 'Date Recorded', value: 'dateRecorded', currentValue: (record as any).dateRecorded || '' }
        ];
      case 'medication':
        return [
          { label: 'Medication Name', value: 'medicationName', currentValue: (record as any).medicationName || '' },
          { label: 'Dosage', value: 'dosage', currentValue: (record as any).dosage || '' },
          { label: 'Frequency', value: 'frequency', currentValue: (record as any).frequency || '' },
          { label: 'Start Date', value: 'startDate', currentValue: (record as any).startDate || '' },
          { label: 'End Date', value: 'endDate', currentValue: (record as any).endDate || '' },
          { label: 'Prescribed By', value: 'prescribedBy', currentValue: (record as any).prescribedBy || '' },
          { label: 'Notes', value: 'notes', currentValue: (record as any).notes || '' }
        ];
      default:
        return [];
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'denied':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Denied</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (!user || user.role !== 'patient') {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">
          <p>Access denied. This page is only available to patients.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className='text-2xl font-bold text-CustomPink1'>Medical Records</h1>
          <p className="text-gray-600">
            View your medical information, allergies, and medications. You can request corrections if you notice any inaccuracies.
          </p>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="medical-info" className="w-full">
          <TabsList className="grid w-full grid-cols-3 rounded-lg border-1 border-CustomPink1 bg-CustomPink3">
            <TabsTrigger value="medical-info" className="flex items-center gap-2 font-bold text-CustomPink1">
              <Heart className="w-4 h-4" />
              Medical Info ({medicalInfo.length})
            </TabsTrigger>
            <TabsTrigger value="allergies" className="flex items-center gap-2 font-bold text-CustomPink1">
              <AlertTriangle className="w-4 h-4" />
              Allergies ({allergies.length})
            </TabsTrigger>
            <TabsTrigger value="medications" className="flex items-center gap-2 font-bold text-CustomPink1">
              <Pill className="w-4 h-4" />
              Medications ({medications.length})
            </TabsTrigger>
          </TabsList>

          {/* Medical Info Tab */}
          <TabsContent value="medical-info" className="mt-6 rounded-lg border-1 border-CustomPink1 bg-CustomPink3">
            <div className="space-y-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : medicalInfo.length > 0 ? (
                medicalInfo.map((info) => (
                  <Card key={info.id}>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="text-lg font-bold text-CustomPink1">{(info as any).title}</CardTitle>
                      <Button
                        variant="outline_pink"
                        size="sm"
                        onClick={() => handleRequestCorrection(info)}
                      >
                        <Edit3 className="w-4 h-4 mr-1" />
                        Request Correction
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 mb-4">{(info as any).description}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1 font-bold text-black-700">
                          <Calendar className="w-4 h-4 font-bold text-CustomPink1" />
                          <span className="font-bold text-CustomPink1">Recorded: </span>{new Date((info as any).dateRecorded).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1 font-bold text-black-700">
                          <User className="w-4 h-4 font-bold text-CustomPink1"/>
                          <span className="font-bold text-CustomPink1">By: </span>{(info as any).staffName}
                        </div>
                      </div>
                      {renderFilesList(info.id)}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="text-center py-8">
                    <Heart className="w-12 h-12 mx-auto font-bold text-CustomPink1 mb-4" />
                    <p className="text-gray-500">No medical information recorded yet.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Allergies Tab */}
          <TabsContent value="allergies" className="mt-6 rounded-lg border-1 border-CustomPink1 bg-CustomPink3">
            <div className="space-y-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : allergies.length > 0 ? (
                allergies.map((allergy) => (
                  <Card key={allergy.id}>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-lg font-bold text-CustomPink1">{(allergy as any).allergen}</CardTitle>
                        <Badge variant={
                          (allergy as any).severity === 'severe' ? 'destructive' : 
                          (allergy as any).severity === 'moderate' ? 'secondary' : 'outline'
                        }>
                          {(allergy as any).severity}
                        </Badge>
                      </div>
                      <Button
                        variant="outline_pink"
                        size="sm"
                        onClick={() => handleRequestCorrection(allergy)}
                      >
                        <Edit3 className="w-4 h-4 mr-1" />
                        Request Correction
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-4 font-bold text-CustomPink1">
                        <strong>Reaction:</strong> {(allergy as any).reaction}
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1 font-bold text-black-700">
                          <Calendar className="w-4 h-4 font-bold text-CustomPink1" />
                          <span className="font-bold text-CustomPink1">Recorded: </span>{new Date((allergy as any).dateRecorded).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1 font-bold text-black-700">
                          <User className="w-4 h-4 font-bold text-CustomPink1"/>
                          <span className="font-bold text-CustomPink1">By: </span>{(allergy as any).staffName}
                        </div>
                      </div>
                      {renderFilesList(allergy.id)}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="text-center py-8">
                    <AlertTriangle className="w-12 h-12 mx-auto font-bold text-CustomPink1 mb-4" />
                    <p className="text-gray-500">No allergies recorded.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Medications Tab */}
          <TabsContent value="medications" className="mt-6 rounded-lg border-1 border-CustomPink1 bg-CustomPink3">
            <div className="space-y-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : medications.length > 0 ? (
                medications.map((medication) => (
                  <Card key={medication.id}>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="text-lg font-bold text-CustomPink1">{(medication as any).medicationName}</CardTitle>
                      <Button
                        variant="outline_pink"
                        size="sm"
                        onClick={() => handleRequestCorrection(medication)}
                      >
                        <Edit3 className="w-4 h-4 mr-1" />
                        Request Correction
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
                        </div>
                      </div>
                      {(medication as any).notes && (
                        <p className="text-gray-700 mb-4">
                          <strong>Notes:</strong> {(medication as any).notes}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          Recorded by: {(medication as any).staffName}
                        </div>
                      </div>
                      {renderFilesList(medication.id)}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="text-center py-8">
                    <Pill className="w-12 h-12 mx-auto mb-4 font-bold text-CustomPink1" />
                    <p className="text-gray-500">No medications recorded.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Correction Requests Section */}
        <div className="mt-8 rounded-lg border-1 border-CustomPink1 bg-CustomPink3">
          <Card>
            <CardHeader>
              <CardTitle className='font-bold text-CustomPink1'>My Correction Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {correctionRequests.length > 0 ? (
                <div className="space-y-4">
                  {correctionRequests.map((request) => (
                    <div key={request.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p><strong>Record:</strong> {request.recordType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                          <p className="text-sm text-gray-600">
                            Requested: {new Date(request.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        {getStatusBadge(request.status)}
                      </div>
                      
                      <div className="mt-3">
                        {request.suggestedChanges.map((change, index) => (
                          <div key={index} className="bg-gray-50 rounded p-3 mb-2">
                            <p><strong>Field:</strong> {change.field}</p>
                            <p><strong>Current:</strong> {change.currentValue}</p>
                            <p><strong>Suggested:</strong> {change.suggestedValue}</p>
                            <p><strong>Reason:</strong> {change.reason}</p>
                          </div>
                        ))}
                      </div>

                      {request.status === 'denied' && request.reviewNotes && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                          <p><strong>Denial Reason:</strong> {request.reviewNotes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No correction requests submitted.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Correction Request Modal */}
        <Dialog open={selectedRecord !== null} onOpenChange={() => setSelectedRecord(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className='font-bold text-CustomPink1'>Request Correction</DialogTitle>
            </DialogHeader>
            
            {selectedRecord && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="field" className='font-bold text-CustomPink1'>Field to Correct</Label>
                  <Select
                    value={correctionFormData.field}
                    onValueChange={(value) => {
                      const fieldOption = getFieldOptions(selectedRecord).find(opt => opt.value === value);
                      setCorrectionFormData({
                        ...correctionFormData,
                        field: value,
                        currentValue: fieldOption?.currentValue || ''
                      });
                    }}
                  >
                    <SelectTrigger className='rounded-lg border-1 border-CustomPink1 bg-CustomPink3'>
                      <SelectValue placeholder="Select field to correct" />
                    </SelectTrigger>
                    <SelectContent className='rounded-lg border-1 border-CustomPink1 bg-CustomPink3'>
                      {getFieldOptions(selectedRecord).map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {correctionFormData.field && (
                  <>
                    <div>
                      <Label htmlFor="currentValue" className='font-bold text-CustomPink1'>Current Value</Label>
                      <Input
                        className='rounded-lg border-1 border-CustomPink1 bg-CustomPink3'
                        id="currentValue"
                        value={correctionFormData.currentValue}
                        readOnly
                      />
                    </div>

                    <div>
                      <Label htmlFor="suggestedValue" className='font-bold text-CustomPink1'>Suggested Correction</Label>
                      <Input
                        className='rounded-lg border-1 border-CustomPink1 bg-CustomPink3'
                        id="suggestedValue"
                        value={correctionFormData.suggestedValue}
                        onChange={(e) => setCorrectionFormData({
                          ...correctionFormData,
                          suggestedValue: e.target.value
                        })}
                        placeholder="Enter the correct value"
                      />
                    </div>

                    <div>
                      <Label htmlFor="reason" className='font-bold text-CustomPink1'>Reason for Correction</Label>
                      <Textarea
                        className='rounded-lg border-1 border-CustomPink1 bg-CustomPink3'
                        id="reason"
                        value={correctionFormData.reason}
                        onChange={(e) => setCorrectionFormData({
                          ...correctionFormData,
                          reason: e.target.value
                        })}
                        placeholder="Please explain why this correction is needed"
                        rows={3}
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button variant="outline_pink" onClick={() => setSelectedRecord(null)}>
                        Cancel
                      </Button>
                      <Button 
                        onClick={submitCorrectionRequest}
                        disabled={!correctionFormData.suggestedValue || !correctionFormData.reason || isSubmitting}
                      >
                        {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Submit Request
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}