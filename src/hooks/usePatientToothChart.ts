import { useState, useEffect, useCallback } from 'react';
import { ToothTreatment } from '../types/tooth';

export interface PatientToothChart {
  id?: string;
  patientId: string;
  missingTeeth: string[];
  disabledTeeth: string[];
  treatedTeeth: string[];
  treatments: ToothTreatment[];
  lastUpdated: string;
}

export function usePatientToothChart(patientId: string | null) {
  const [toothChart, setToothChart] = useState<PatientToothChart | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch patient tooth chart
  const fetchToothChart = useCallback(async () => {
    if (!patientId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/patients/${patientId}/tooth-chart`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch tooth chart');
      }
      
      const data = await response.json();
      setToothChart(data.toothChart);
    } catch (error) {
      console.error('Error fetching patient tooth chart:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
      
      // Create default tooth chart if none exists
      const defaultToothChart: PatientToothChart = {
        patientId,
        missingTeeth: [],
        disabledTeeth: [],
        treatedTeeth: [],
        treatments: [],
        lastUpdated: new Date().toISOString()
      };
      setToothChart(defaultToothChart);
    } finally {
      setIsLoading(false);
    }
  }, [patientId]);

  // Save patient tooth chart
  const saveToothChart = useCallback(async (updatedToothChart: PatientToothChart) => {
    if (!patientId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/patients/${patientId}/tooth-chart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          toothChart: {
            ...updatedToothChart,
            lastUpdated: new Date().toISOString()
          }
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save tooth chart');
      }
      
      const data = await response.json();
      setToothChart(data.toothChart);
      return data.toothChart;
    } catch (error) {
      console.error('Error saving patient tooth chart:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [patientId]);

  // Update treatments for a specific tooth
  const updateToothTreatment = useCallback((toothTreatment: ToothTreatment) => {
    if (!toothChart) return;
    
    const updatedTreatments = [...toothChart.treatments];
    const existingIndex = updatedTreatments.findIndex(t => t.id === toothTreatment.id);
    
    if (existingIndex >= 0) {
      updatedTreatments[existingIndex] = toothTreatment;
    } else {
      updatedTreatments.push(toothTreatment);
    }

    // Update treated teeth based on the treatments
    const treatedTeeth = [...new Set(updatedTreatments.flatMap(t => t.teeth_fdi))];
    
    const updatedToothChart: PatientToothChart = {
      ...toothChart,
      treatments: updatedTreatments,
      treatedTeeth,
      lastUpdated: new Date().toISOString()
    };
    
    setToothChart(updatedToothChart);
    return updatedToothChart;
  }, [toothChart]);

  // Mark teeth as missing/extracted
  const markTeethAsMissing = useCallback((teethFdi: string[]) => {
    if (!toothChart) return;
    
    const updatedMissingTeeth = [...new Set([...toothChart.missingTeeth, ...teethFdi])];
    
    const updatedToothChart: PatientToothChart = {
      ...toothChart,
      missingTeeth: updatedMissingTeeth,
      lastUpdated: new Date().toISOString()
    };
    
    setToothChart(updatedToothChart);
    return updatedToothChart;
  }, [toothChart]);

  // Remove teeth from missing list
  const unmarkTeethAsMissing = useCallback((teethFdi: string[]) => {
    if (!toothChart) return;
    
    const updatedMissingTeeth = toothChart.missingTeeth.filter(fdi => !teethFdi.includes(fdi));
    
    const updatedToothChart: PatientToothChart = {
      ...toothChart,
      missingTeeth: updatedMissingTeeth,
      lastUpdated: new Date().toISOString()
    };
    
    setToothChart(updatedToothChart);
    return updatedToothChart;
  }, [toothChart]);

  // Initialize on mount
  useEffect(() => {
    fetchToothChart();
  }, [fetchToothChart]);

  return {
    toothChart,
    treatments: toothChart?.treatments || [],
    isLoading,
    error,
    fetchToothChart,
    saveToothChart,
    updateToothTreatment,
    markTeethAsMissing,
    unmarkTeethAsMissing
  };
}