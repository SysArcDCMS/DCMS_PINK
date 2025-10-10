import { API_ENDPOINTS, API_HEADERS } from './constants';
import { User } from '../../types/index';

export interface Patient extends User {
  role: 'patient';
  createdBy?: string;
}

export interface CreateWalkInPatientData {
  name: string;
  phone: string;
  email: string;
  staffEmail: string;
}

export const patientApi = {
  async fetchAll(): Promise<Patient[]> {
    const response = await fetch('/api/patients', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to fetch patients');
    }

    const data = await response.json();
    return data.patients || [];
  },

  async createWalkIn(data: CreateWalkInPatientData): Promise<Patient> {
    const response = await fetch('/api/patients/walk-in', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create walk-in patient');
    }

    const responseData = await response.json();
    return responseData.patient;
  },

  async updateProfile(email: string, updates: Partial<Patient>): Promise<Patient> {
    const response = await fetch(`/api/patients/${encodeURIComponent(email)}/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to update patient profile');
    }

    const data = await response.json();
    return data.user;
  }
};