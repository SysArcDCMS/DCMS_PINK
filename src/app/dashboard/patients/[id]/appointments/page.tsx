'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../components/ui/card';
import { Badge } from '../../../../../components/ui/badge';
import { Button } from '../../../../../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../../components/ui/tabs';
import { ArrowLeft, Calendar, Clock, User, MapPin, FileText, Download } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../../../../../contexts/AuthContext';
import { usePatients } from '../../../../../contexts/PatientContext';
import { useAppointments } from '../../../../../contexts/AppointmentContext';
import { useServices } from '../../../../../contexts/ServiceContext';

export default function PatientAppointmentsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { getPatientById } = usePatients();
  const { getAppointmentsByPatient } = useAppointments();
  
  const [patient, setPatient] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [serviceHistory, setServiceHistory] = useState<any[]>([]); // TODO: Implement service history from billing records
  const [isLoading, setIsLoading] = useState(true);

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
        
        // Get appointments for this patient
        const patientAppointments = getAppointmentsByPatient(foundPatient.email);
        setAppointments(patientAppointments);
        
        // TODO: Get service history from billing records
        // Service history should be fetched from billing/completed appointments
        setServiceHistory([]);
      } else {
        router.push('/dashboard/patients');
      }
    }
    setIsLoading(false);
  }, [params.id, canViewPatients, router]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'default';
      case 'completed':
        return 'secondary';
      case 'pending':
        return 'outline';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getServiceStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'in-progress':
        return 'secondary';
      case 'planned':
        return 'outline';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  if (!canViewPatients) {
    return null;
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
          onClick={() => router.push(`/dashboard/patients/${patient.id}`)}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Patient Details
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-CustomPink1">Appointment & Service History</h1>
          <p className="text-gray-600 mt-1">
            Complete medical record for {patient.name}
          </p>
        </div>
      </div>

      {/* Patient Summary */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <User className="h-12 w-12 bg-gray-100 rounded-full p-3 text-gray-600" />
            <div>
              <h2 className="text-xl font-semibold">{patient.name}</h2>
              <p className="text-gray-600">{patient.email}</p>
              {patient.phone && <p className="text-gray-600">{patient.phone}</p>}
              <div className="flex gap-2 mt-2">
                <Badge variant={patient.isWalkIn ? "outline" : "default"}>
                  {patient.isWalkIn ? 'Walk-in' : 'Registered'} Patient
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for different histories */}
      <Tabs defaultValue="appointments" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="appointments">Appointment History</TabsTrigger>
          <TabsTrigger value="services">Service History</TabsTrigger>
        </TabsList>

        {/* Appointments Tab */}
        <TabsContent value="appointments">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Appointment History ({appointments.length})
                </CardTitle>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {appointments.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No appointments found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {appointments.map((appointment) => (
                    <div key={appointment.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Badge variant={getStatusColor(appointment.status)}>
                            {appointment.status}
                          </Badge>
                          {appointment.date && appointment.time && (
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(appointment.date), 'MMM dd, yyyy')}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {appointment.time}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {appointment.id.slice(-6)}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p><strong>Reason:</strong> {appointment.reason}</p>
                          {appointment.dentistName && (
                            <p><strong>Dentist:</strong> {appointment.dentistName}</p>
                          )}
                        </div>
                        <div>
                          <p><strong>Created:</strong> {format(new Date(appointment.createdAt), 'MMM dd, yyyy HH:mm')}</p>
                          {appointment.updatedAt !== appointment.createdAt && (
                            <p><strong>Updated:</strong> {format(new Date(appointment.updatedAt), 'MMM dd, yyyy HH:mm')}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Service History ({serviceHistory.length})
                </CardTitle>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {serviceHistory.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No services recorded</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {serviceHistory.map((service) => (
                    <div key={service.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Badge variant={getServiceStatusColor(service.status)}>
                            {service.status}
                          </Badge>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(service.date), 'MMM dd, yyyy')}
                            </div>
                          </div>
                        </div>
                        <div className="text-lg font-semibold text-green-600">
                          ${service.cost}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <h4 className="font-semibold text-base mb-1">{service.serviceName}</h4>
                          <p><strong>Performed by:</strong> {service.performedByName}</p>
                          {service.appointmentId && (
                            <p><strong>Appointment ID:</strong> {service.appointmentId.slice(-6)}</p>
                          )}
                        </div>
                        <div>
                          {service.notes && (
                            <div>
                              <p><strong>Notes:</strong></p>
                              <p className="text-gray-600 mt-1">{service.notes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-CustomPink1">{appointments.length}</div>
            <p className="text-sm text-gray-600">Total Appointments</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-green-600">{serviceHistory.length}</div>
            <p className="text-sm text-gray-600">Services Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-purple-600">
              ${serviceHistory.reduce((total, service) => total + service.cost, 0)}
            </div>
            <p className="text-sm text-gray-600">Total Amount</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}