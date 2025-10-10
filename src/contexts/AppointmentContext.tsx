'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { appointmentApi, Appointment, AppointmentNote, CreateAppointmentData, UpdateAppointmentData } from '../utils/api/appointmentApi';

interface AppointmentContextType {
  appointments: Appointment[];
  isLoading: boolean;
  error: string | null;
  searchTerm: string;
  statusFilter: string;
  filteredAppointments: Appointment[];
  setSearchTerm: (term: string) => void;
  setStatusFilter: (status: string) => void;
  fetchAppointments: () => Promise<void>;
  createAppointment: (data: CreateAppointmentData) => Promise<{ success: boolean; error?: string; appointment?: Appointment }>;
  updateAppointment: (id: string, updates: UpdateAppointmentData) => Promise<{ success: boolean; error?: string }>;
  getAppointmentById: (id: string) => Appointment | null;
  getAppointmentsByPatient: (patientEmail: string) => Appointment[];
  fetchAppointmentNotes: (appointmentId: string) => Promise<AppointmentNote[]>;
  createAppointmentNote: (appointmentId: string, content: string) => Promise<{ success: boolean; error?: string }>;
  clearError: () => void;
  refreshAppointments: () => Promise<void>;
}

const AppointmentContext = createContext<AppointmentContextType | undefined>(undefined);

export function AppointmentProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch = searchTerm === '' || 
      appointment.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.patientEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.reason.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || appointment.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const fetchAppointments = async (): Promise<void> => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const appointmentData = await appointmentApi.fetchAll(user.email, user.role);
      setAppointments(appointmentData);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to fetch appointments';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const createAppointment = async (data: CreateAppointmentData): Promise<{ success: boolean; error?: string; appointment?: Appointment }> => {
    setIsLoading(true);
    setError(null);

    try {
      const newAppointment = await appointmentApi.create(data);
      setAppointments(prev => [...prev, newAppointment]);
      return { success: true, appointment: newAppointment };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Network error. Please try again.';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };

  const updateAppointment = async (id: string, updates: UpdateAppointmentData): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    setError(null);

    try {
      const updatedAppointment = await appointmentApi.update(id, updates);
      
      setAppointments(prev => 
        prev.map(appointment => 
          appointment.id === id 
            ? { ...appointment, ...updatedAppointment }
            : appointment
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

  const fetchAppointmentNotes = async (appointmentId: string): Promise<AppointmentNote[]> => {
    try {
      return await appointmentApi.fetchNotes(appointmentId);
    } catch (error) {
      console.error('Failed to fetch appointment notes:', error);
      return [];
    }
  };

  const createAppointmentNote = async (appointmentId: string, content: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'User not authenticated' };

    try {
      await appointmentApi.createNote(appointmentId, content, user.email, user.role);
      return { success: true };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to create note';
      return { success: false, error: errorMsg };
    }
  };

  const getAppointmentById = useCallback((id: string): Appointment | null => {
    return appointments.find(appointment => appointment.id === id) || null;
  }, [appointments]);

  const getAppointmentsByPatient = useCallback((patientEmail: string): Appointment[] => {
    return appointments.filter(appointment => appointment.patientEmail === patientEmail);
  }, [appointments]);

  const clearError = () => setError(null);
  const refreshAppointments = () => fetchAppointments();

  useEffect(() => {
    if (user) {
      fetchAppointments();
    }
  }, [user]);

  const value = {
    appointments,
    isLoading,
    error,
    searchTerm,
    statusFilter,
    filteredAppointments,
    setSearchTerm,
    setStatusFilter,
    fetchAppointments,
    createAppointment,
    updateAppointment,
    getAppointmentById,
    getAppointmentsByPatient,
    fetchAppointmentNotes,
    createAppointmentNote,
    clearError,
    refreshAppointments
  };

  return (
    <AppointmentContext.Provider value={value}>
      {children}
    </AppointmentContext.Provider>
  );
}

export function useAppointments() {
  const context = useContext(AppointmentContext);
  if (context === undefined) {
    throw new Error('useAppointments must be used within an AppointmentProvider');
  }
  return context;
}