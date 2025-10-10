'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../../../contexts/AuthContext';
import { Button } from '../../../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../../components/ui/card';
import { Separator } from '../../../../../components/ui/separator';
import { Badge } from '../../../../../components/ui/badge';
import { ArrowLeft, Save, Clock, FileText, AlertCircle } from 'lucide-react';
import { ToothChart } from '../../../../../components/ToothChart';
import { usePatientToothChart } from '../../../../../hooks/usePatientToothChart';
import { toast } from 'sonner';
import { FDI_TEETH_DATA } from '../../../../../data/fdiTeethData';

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
  address?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  medicalHistory?: string;
  role: string;
}

export default function PatientToothChartPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const patientId = params.id as string;

  const [patient, setPatient] = useState<Patient | null>(null);
  const [isLoadingPatient, setIsLoadingPatient] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const {
    toothChart,
    isLoading: isLoadingToothChart,
    saveToothChart,
    markTeethAsMissing,
    unmarkTeethAsMissing
  } = usePatientToothChart(patient?.email || null);

  // Fetch patient details
  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const response = await fetch(`/api/patients/${patientId}?userEmail=${user?.email}&userRole=${user?.role}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch patient');
        }
        
        const data = await response.json();
        setPatient(data.patient);
      } catch (error) {
        console.error('Error fetching patient:', error);
        toast.error('Failed to load patient information');
        router.push('/dashboard/patients');
      } finally {
        setIsLoadingPatient(false);
      }
    };

    if (patientId && user?.email) {
      fetchPatient();
    }
  }, [patientId, user?.email, user?.role, router]);

  // Handle marking teeth as missing
  const handleToothMissingToggle = async (fdi: string) => {
    if (!toothChart) return;

    try {
      const isMissing = toothChart.missingTeeth.includes(fdi);
      
      if (isMissing) {
        const updatedChart = unmarkTeethAsMissing([fdi]);
        if (updatedChart) {
          await saveToothChart(updatedChart);
          toast.success(`Tooth ${fdi} restored to normal`);
        }
      } else {
        const updatedChart = markTeethAsMissing([fdi]);
        if (updatedChart) {
          await saveToothChart(updatedChart);
          toast.success(`Tooth ${fdi} marked as missing`);
        }
      }
    } catch (error) {
      console.error('Error updating tooth status:', error);
      toast.error('Failed to update tooth status');
    }
  };

  // Handle saving tooth chart
  const handleSaveToothChart = async () => {
    if (!toothChart) return;

    setIsSaving(true);
    try {
      await saveToothChart(toothChart);
      toast.success('Tooth chart saved successfully');
    } catch (error) {
      console.error('Error saving tooth chart:', error);
      toast.error('Failed to save tooth chart');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoadingPatient) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">Patient not found</p>
              <p className="text-muted-foreground">The requested patient could not be found.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/patients/${patientId}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Patient
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Dental Chart</h1>
            <p className="text-muted-foreground">
              {patient.first_name} {patient.last_name}
            </p>
          </div>
        </div>
        <Button
          onClick={handleSaveToothChart}
          disabled={isSaving || !toothChart}
        >
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Chart'}
        </Button>
      </div>

      {/* Tooth Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Interactive Tooth Chart</CardTitle>
          <CardDescription>
            View and manage the patient's dental chart. Click on teeth to mark as missing/extracted.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingToothChart ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Loading tooth chart...</p>
              </div>
            </div>
          ) : (
            <ToothChart
              mode="edit"
              selectedTeeth={[]}
              treatedTeeth={toothChart?.treatedTeeth || []}
              missingTeeth={toothChart?.missingTeeth || []}
              disabledTeeth={toothChart?.disabledTeeth || []}
              treatments={toothChart?.treatments || []}
              onToothClick={handleToothMissingToggle}
              className="border border-gray-200 rounded-lg p-4"
              showTooltip={true}
            />
          )}
        </CardContent>
      </Card>

      {/* Treatment History */}
      {toothChart?.treatments && toothChart.treatments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Treatment History
            </CardTitle>
            <CardDescription>
              Previous dental treatments recorded for this patient.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {toothChart.treatments.map((treatment, index) => (
                <div key={treatment.id || index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <Badge variant="outline">{treatment.service_name}</Badge>
                        <span className="text-sm text-muted-foreground flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {treatment.date}
                        </span>
                      </div>
                      <p className="text-sm font-medium mb-2">{treatment.detail}</p>
                      {treatment.teeth_fdi && treatment.teeth_fdi.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {treatment.teeth_fdi.map((fdi) => {
                            const toothData = FDI_TEETH_DATA[fdi];
                            return (
                              <Badge key={fdi} variant="secondary" className="text-xs">
                                #{fdi} - {toothData?.shortName || `Tooth ${fdi}`}
                              </Badge>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chart Summary */}
      {toothChart && (
        <Card>
          <CardHeader>
            <CardTitle>Chart Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {32 - (toothChart.missingTeeth?.length || 0)}
                </div>
                <div className="text-sm text-muted-foreground">Present Teeth</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {toothChart.missingTeeth?.length || 0}
                </div>
                <div className="text-sm text-muted-foreground">Missing Teeth</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-600">
                  {toothChart.treatedTeeth?.length || 0}
                </div>
                <div className="text-sm text-muted-foreground">Treated Teeth</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-CustomPink1">
                  {toothChart.treatments?.length || 0}
                </div>
                <div className="text-sm text-muted-foreground">Total Treatments</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}