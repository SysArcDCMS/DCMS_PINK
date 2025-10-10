'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { patientApi, Patient } from '../utils/api/patientApi';

interface PatientContextType {
  patients: Patient[];
  isLoading: boolean;
  error: string | null;
  searchTerm: string;
  filteredPatients: Patient[];
  setSearchTerm: (term: string) => void;
  fetchPatients: () => Promise<void>;
  createWalkInPatient: (data: {
    name: string;
    phone: string;
    email: string;
  }) => Promise<{ success: boolean; error?: string; patient?: Patient }>;
  getPatientByEmail: (email: string) => Patient | null;
  getPatientById: (id: string) => Patient | null;
  updatePatientProfile: (patientEmail: string, updates: Partial<Patient>) => Promise<{ success: boolean; error?: string }>;
  clearError: () => void;
  refreshPatients: () => Promise<void>;
}

const PatientContext = createContext<PatientContextType | undefined>(undefined);

export function PatientProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPatients = patients.filter(patient => {
    const searchLower = searchTerm.toLowerCase();
    
    // Safely get patient name from first_name + last_name or fallback to name field
    const patientFullName = patient.name || 
      `${patient.first_name || ''} ${patient.last_name || ''}`.trim() || 
      patient.email;
    
    return (
      patientFullName.toLowerCase().includes(searchLower) ||
      patient.email.toLowerCase().includes(searchLower) ||
      (patient.first_name && patient.first_name.toLowerCase().includes(searchLower)) ||
      (patient.last_name && patient.last_name.toLowerCase().includes(searchLower)) ||
      (patient.phone && patient.phone.toLowerCase().includes(searchLower))
    );
  });

  const fetchPatients = async (): Promise<void> => {
    if (!user || user.role === 'patient') return;

    setIsLoading(true);
    setError(null);

    try {
      const patientData = await patientApi.fetchAll();
      setPatients(patientData);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to fetch patients';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const createWalkInPatient = async (data: {
    name: string;
    phone: string;
    email: string;
  }): Promise<{ success: boolean; error?: string; patient?: Patient }> => {
    if (!user || user.role === 'patient') {
      return { success: false, error: 'Unauthorized' };
    }

    setIsLoading(true);
    setError(null);

    try {
      const newPatient = await patientApi.createWalkIn({
        ...data,
        staffEmail: user.email
      });
      
      setPatients(prev => [...prev, newPatient]);
      return { success: true, patient: newPatient };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Network error. Please try again.';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };

  const updatePatientProfile = async (
    patientEmail: string, 
    updates: Partial<Patient>
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user || (user.role === 'patient' && user.email !== patientEmail)) {
      return { success: false, error: 'Unauthorized' };
    }

    setIsLoading(true);
    setError(null);

    try {
      const updatedPatient = await patientApi.updateProfile(patientEmail, updates);
      
      setPatients(prev => 
        prev.map(patient => 
          patient.email === patientEmail 
            ? { ...patient, ...updatedPatient }
            : patient
        )
      );

      return { success: true };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Network error. Please try again.';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };

  const getPatientByEmail = useCallback((email: string): Patient | null => {
    return patients.find(patient => patient.email === email) || null;
  }, [patients]);

  const getPatientById = useCallback((id: string): Patient | null => {
    return patients.find(patient => patient.id === id) || null;
  }, [patients]);

  const clearError = () => setError(null);
  const refreshPatients = () => fetchPatients();

  useEffect(() => {
    if (user && user.role !== 'patient') {
      fetchPatients();
    }
  }, [user]);

  const value = {
    patients,
    isLoading,
    error,
    searchTerm,
    filteredPatients,
    setSearchTerm,
    fetchPatients,
    createWalkInPatient,
    getPatientByEmail,
    getPatientById,
    updatePatientProfile,
    clearError,
    refreshPatients
  };

  return (
    <PatientContext.Provider value={value}>
      {children}
    </PatientContext.Provider>
  );
}

export function usePatients() {
  const context = useContext(PatientContext);
  if (context === undefined) {
    throw new Error('usePatients must be used within a PatientProvider');
  }
  return context;
}