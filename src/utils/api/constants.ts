import { projectId, publicAnonKey } from '../supabase/info';

export const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-c89a26e4`;

export const API_ENDPOINTS = {
  PATIENTS: `${API_BASE_URL}/patients`,
  WALK_IN_PATIENT: `${API_BASE_URL}/walk-in-patient`,
  APPOINTMENTS: `${API_BASE_URL}/appointments`,
  PROFILE: (email: string) => `${API_BASE_URL}/profile/${email}`,
  APPOINTMENT_NOTES: (id: string) => `${API_BASE_URL}/appointments/${id}/notes`,
  APPOINTMENT_UPDATE: (id: string) => `${API_BASE_URL}/appointments/${id}`,
} as const;

export const API_HEADERS = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${publicAnonKey}`
} as const;