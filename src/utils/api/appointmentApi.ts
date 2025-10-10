import { API_ENDPOINTS, API_HEADERS } from './constants';

export interface Appointment {
  id: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  reason: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  date?: string;
  time?: string;
  dentistId?: string;
  dentistName?: string;
  needsStaffConfirmation?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AppointmentNote {
  id: string;
  appointmentId: string;
  content: string;
  authorEmail: string;
  authorRole: string;
  createdAt: string;
}

export interface CreateAppointmentData {
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  reason: string;
}

export interface UpdateAppointmentData {
  status?: Appointment['status'];
  date?: string;
  time?: string;
  dentistId?: string;
  dentistName?: string;
  needsStaffConfirmation?: boolean;
}

export const appointmentApi = {
  async fetchAll(userEmail?: string, role?: string): Promise<Appointment[]> {
    const params = new URLSearchParams();
    if (userEmail && role) {
      params.append('userEmail', userEmail);
      params.append('role', role);
    }

    const url = params.toString() 
      ? `${API_ENDPOINTS.APPOINTMENTS}?${params.toString()}`
      : API_ENDPOINTS.APPOINTMENTS;

    const response = await fetch(url, {
      method: 'GET',
      headers: API_HEADERS
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to fetch appointments');
    }

    const data = await response.json();
    return data.appointments;
  },

  async create(appointmentData: CreateAppointmentData): Promise<Appointment> {
    const response = await fetch(API_ENDPOINTS.APPOINTMENTS, {
      method: 'POST',
      headers: API_HEADERS,
      body: JSON.stringify(appointmentData)
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to create appointment');
    }

    const data = await response.json();
    return data.appointment;
  },

  async update(id: string, updates: UpdateAppointmentData): Promise<Appointment> {
    const response = await fetch(API_ENDPOINTS.APPOINTMENT_UPDATE(id), {
      method: 'PUT',
      headers: API_HEADERS,
      body: JSON.stringify(updates)
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to update appointment');
    }

    const data = await response.json();
    return data.appointment;
  },

  async fetchNotes(appointmentId: string): Promise<AppointmentNote[]> {
    const response = await fetch(API_ENDPOINTS.APPOINTMENT_NOTES(appointmentId), {
      method: 'GET',
      headers: API_HEADERS
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to fetch notes');
    }

    const data = await response.json();
    return data.notes;
  },

  async createNote(appointmentId: string, content: string, authorEmail: string, authorRole: string): Promise<AppointmentNote> {
    const response = await fetch(API_ENDPOINTS.APPOINTMENT_NOTES(appointmentId), {
      method: 'POST',
      headers: API_HEADERS,
      body: JSON.stringify({
        content,
        authorEmail,
        authorRole
      })
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to create note');
    }

    const data = await response.json();
    return data.note;
  }
};