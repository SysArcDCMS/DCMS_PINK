'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { usePatients } from '../../../contexts/PatientContext';
import { useAppointments } from '../../../contexts/AppointmentContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { WalkInPatient } from '../../../components/WalkInPatient';
import { User, Mail, Phone, Calendar, Search, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { projectId, publicAnonKey } from '../../../utils/supabase/info';
import { Patient } from '../../../utils/api/patientApi';

// Patient interface is now provided by PatientContext

interface PatientAppointment {
  id: string;
  status: string;
  createdAt: string;
  appointmentDate?: string;
}

export default function PatientsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { 
    patients, 
    isLoading: patientsLoading, 
    searchTerm, 
    setSearchTerm, 
    filteredPatients, 
    refreshPatients 
  } = usePatients();
  const { refreshAppointments } = useAppointments();
  const [appointments, setAppointments] = useState<PatientAppointment[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);

  const canViewPatients = user?.role === 'staff' || user?.role === 'dentist' || user?.role === 'admin';
  const canAddWalkInPatients = user?.role === 'staff' || user?.role === 'admin';

  const fetchAppointments = async () => {
    if (!canViewPatients) return;

    try {
      setAppointmentsLoading(true);
      // Fetch appointments for additional context
      const appointmentResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-c89a26e4/appointments`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });

      if (appointmentResponse.ok) {
        const appointmentData = await appointmentResponse.json();
        setAppointments(appointmentData.appointments || []);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setAppointmentsLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [canViewPatients]);

  const handleWalkInPatientSuccess = (newPatient: Patient) => {
    refreshPatients();
    refreshAppointments();
    fetchAppointments();

    // Redirect to patient detail page
    if (newPatient && newPatient.id) {
      router.push(`/dashboard/patients/${newPatient.id}`);
    }
  };

  const handleRefresh = () => {
    refreshPatients();
    refreshAppointments();
    fetchAppointments();
  };

  const handlePatientClick = (patient: Patient) => {
    router.push(`/dashboard/patients/${patient.id}`);
  };

  const getPatientDisplayName = (patient: Patient): string => {
    return patient.name || 
           `${patient.first_name || ''} ${patient.last_name || ''}`.trim() || 
           patient.email;
  };

  const getPatientAppointmentCount = (patientEmail: string) => {
    return appointments.filter((apt: any) => apt.patientEmail === patientEmail).length;
  };

  const getPatientLatestAppointment = (patientEmail: string) => {
    const patientAppointments = appointments.filter((apt: any) => apt.patientEmail === patientEmail);
    
    if (patientAppointments.length === 0) return null;
    
    return patientAppointments.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];
  };

  // filteredPatients is now provided by the PatientContext
  console.log(filteredPatients);
  if (!canViewPatients) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-CustomPink1">Access denied. Only staff, dentists, and administrators can view patient records.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (patientsLoading || appointmentsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-CustomPink1">Patient Records</h1>
          <p className="text-CustomPink1 mt-1">Manage patient information and appointment history</p>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={handleRefresh} variant="outline_pink" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          
          {canAddWalkInPatients && (
            <WalkInPatient 
              staffEmail={user?.email || ''}
              onSuccess={handleWalkInPatientSuccess}
            />
          )}
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md bg-CustomPink3 rounded-lg border-1 border-CustomPink1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-CustomPink1" />
          <Input
            placeholder="Search patients by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 text-CustomPink1"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className='bg-CustomPink3 rounded-lg border-1 border-CustomPink1'>
          <CardContent className="flex items-center p-6">
            <User className="h-8 w-8 text-CustomPink1" />
            <div className="ml-4">
              <p className="text-sm font-medium text-CustomPink1">Total Patients</p>
              <p className="text-2xl font-bold text-CustomPink1">{patients.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className='bg-CustomPink3 rounded-lg border-1 border-CustomPink1'>
          <CardContent className="flex items-center p-6">
            <Calendar className="h-8 w-8 text-CustomPink1" />
            <div className="ml-4">
              <p className="text-sm font-medium text-CustomPink1">Walk-in Patients</p>
              <p className="text-2xl font-bold text-CustomPink1">{patients.filter(p => p.isWalkIn).length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className='bg-CustomPink3 rounded-lg border-1 border-CustomPink1'>
          <CardContent className="flex items-center p-6">
            <Mail className="h-8 w-8 text-CustomPink1" />
            <div className="ml-4">
              <p className="text-sm font-medium text-CustomPink1">Registered Patients</p>
              <p className="text-2xl font-bold text-CustomPink1">{patients.filter(p => !p.isWalkIn).length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Patients Table */}
      <Card className='bg-CustomPink3 rounded-lg border-1 border-CustomPink1'>
        <CardHeader>
          <CardTitle className='font-bold text-CustomPink1'>Patient List</CardTitle>
          <p className="text-sm text-gray-600">Click on a patient to view details and manage appointments</p>
        </CardHeader>
        <CardContent>
          {filteredPatients.length === 0 ? (
            <div className="text-center py-12">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchTerm ? 'No patients found matching your search' : 'No patients found'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='font-bold text-CustomPink1'>Patient</TableHead>
                  <TableHead className='font-bold text-CustomPink1'>Contact</TableHead>
                  <TableHead className='font-bold text-CustomPink1'>Type</TableHead>
                  <TableHead className='font-bold text-CustomPink1'>Registered</TableHead>
                  <TableHead className='font-bold text-CustomPink1'>Latest Appointment</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPatients.map((patient: Patient) => {
                  const latestAppointment = getPatientLatestAppointment(patient.email);
                  return (
                    <TableRow 
                      key={patient.id}
                      className="cursor-pointer hover:bg-CustomPink1 transition-colors"
                      onClick={() => handlePatientClick(patient)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <User className="h-8 w-8 bg-gray-100 rounded-full p-2 font-bold text-CustomPink1" />
                          <div>
                            <p className="font-medium">{getPatientDisplayName(patient)}</p>
                            <p className="text-sm text-gray-500">{patient.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-3 w-3 text-gray-400" />
                            {patient.email}
                          </div>
                          {patient.phone && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-3 w-3 text-gray-400" />
                              {patient.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-1">
                          <Badge variant={patient.isWalkIn ? "outline" : "default"}>
                            {patient.isWalkIn ? 'Walk-in' : 'Registered'}
                          </Badge>
                          {patient.canLogin ? (
                            <Badge variant="secondary" className="text-xs">Can Login</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">No Login</Badge>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          {patient.createdAt ? format(new Date(patient.createdAt), 'MMM dd, yyyy') : 'Unknown'}
                        </div>
                        {patient.createdBy && (
                          <div className="text-xs text-gray-500">by {patient.createdBy}</div>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        {latestAppointment ? (
                          <div className="text-sm">
                            <div>
                              {latestAppointment.createdAt 
                                ? format(new Date(latestAppointment.createdAt), 'MMM dd, yyyy')
                                : 'Unknown date'
                              }
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {latestAppointment.status}
                            </Badge>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">No appointments</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="mt-8 p-4 bg-CustomPink3 rounded-lg border-1 border-CustomPink1">
        <h3 className="font-medium text-CustomPink1 mb-2">Patient Management Notes</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Click on any patient to view details and manage appointments</li>
          <li>• Walk-in patients without scheduled appointments can be scheduled directly</li>
          <li>• Walk-in patients are recorded but cannot login until they register themselves</li>
          <li>• Staff can view all patient information for appointment scheduling</li>
        </ul>
      </div>
    </div>
  );
}