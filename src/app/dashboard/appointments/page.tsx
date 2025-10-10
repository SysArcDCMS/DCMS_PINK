'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Badge } from '../../../components/ui/badge';
import { Input } from '../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { BookingForm } from '../../../components/BookingForm';
import GenerateBillDialog from '../../../components/GenerateBillDialog';
import ViewBillDialog from '../../../components/ViewBillDialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../../../components/ui/alert-dialog';
import { Calendar, Clock, Users, UserPlus, RefreshCw, XCircle, AlertCircle, CheckCircle, User, Phone, Mail, FileText, CalendarDays, Timer, UserCheck, Receipt, Check, X, Edit, Search, ChevronLeft, ChevronRight, Eye, BarChart3 } from 'lucide-react';
import { format, isWithinInterval } from 'date-fns';
import { toast } from 'sonner';
import { useAppointments } from '../../../utils/swrCache';
import CancelAppointmentDialog from '../../../components/CancelAppointmentDialog';
import RescheduleAppointmentDialog from '../../../components/RescheduleAppointmentDialog';

import DateRangeDialog, { DateRange } from '../../../components/DateRangeDialog';
import SearchAndPagination from '../../../components/SearchAndPagination';

import { Appointment } from '../../../types';

interface AppointmentsResponse {
  appointments: Appointment[];
}

// Response interface
interface AppointmentsResponse {
  appointments: Appointment[];
}

export default function AppointmentsPage() {
  const router = useRouter();
  const { user } = useAuth();
  // Restore saved state from localStorage or use defaults
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('appointments-active-tab') || 'all';
    }
    return 'all';
  });
  
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isBillDialogOpen, setIsBillDialogOpen] = useState(false);
  const [isViewBillDialogOpen, setIsViewBillDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [confirmingCancel, setConfirmingCancel] = useState<Appointment | null>(null);
  const [reschedulingAppointment, setReschedulingAppointment] = useState<Appointment | null>(null);
  
  // Search and pagination state
  const [searchEmail, setSearchEmail] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  
  // Date range state - restore from localStorage or default to today
  const today = new Date();
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    if (typeof window !== 'undefined') {
      const savedRange = localStorage.getItem('appointments-date-range');
      if (savedRange) {
        try {
          const parsed = JSON.parse(savedRange);
          return {
            from: new Date(parsed.from),
            to: new Date(parsed.to),
            preset: parsed.preset
          };
        } catch {
          // If parsing fails, use default
        }
      }
    }
    return {
      from: today,
      to: today,
      preset: 'today'
    };
  });

  const canManageAppointments = user?.role === 'admin' || user?.role === 'staff';
  const isStaffOrAdmin = user?.role === 'staff' || user?.role === 'admin';
  const canBookForPatients = user?.role === 'staff' || user?.role === 'dentist' || user?.role === 'admin';
  const isPatient = user?.role === 'patient';

  // Save state to localStorage when activeTab changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('appointments-active-tab', activeTab);
    }
  }, [activeTab]);

  // Save state to localStorage when dateRange changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('appointments-date-range', JSON.stringify({
        from: dateRange.from.toISOString(),
        to: dateRange.to.toISOString(),
        preset: dateRange.preset
      }));
    }
  }, [dateRange]);

  // Use SWR for data fetching with caching - fetch all appointments, not just today
  const { data, error, isLoading, isValidating, mutate } = useAppointments(
    user?.email,
    user?.role,
    false // currentDateOnly = false to get all appointments
  );

  const allAppointments = data?.appointments || [];

  // Filter appointments by date range and search
  const filteredAppointments = useMemo(() => {
    let filtered = allAppointments.filter((appointment: Appointment) => {
      if (!appointment.date) return false;
      
      try {
        const appointmentDate = new Date(appointment.date);
        const withinDateRange = isWithinInterval(appointmentDate, {
          start: new Date(dateRange.from.setHours(0, 0, 0, 0)),
          end: new Date(dateRange.to.setHours(23, 59, 59, 999))
        });
        
        const matchesSearch = searchEmail === '' || 
          appointment.patientEmail?.toLowerCase().includes(searchEmail.toLowerCase());
        
        return withinDateRange && matchesSearch;
      } catch {
        return false;
      }
    });
    
    return filtered;
  }, [allAppointments, dateRange, searchEmail]);

  const filterAppointments = (status?: string): Appointment[] => {
    if (!status || status === 'all') return filteredAppointments;
    return filteredAppointments.filter((apt: Appointment) => apt.status === status);
  };

  const getStatusCount = (status: string): number => {
    if (status === 'all') return filteredAppointments.length;
    return filteredAppointments.filter((apt: Appointment) => apt.status === status).length;
  };

  // Pagination logic
  const paginatedAppointments = useMemo(() => {
    const statusFiltered = filterAppointments(activeTab);
    const startIndex = (currentPage - 1) * entriesPerPage;
    const endIndex = startIndex + entriesPerPage;
    return statusFiltered.slice(startIndex, endIndex);
  }, [activeTab, currentPage, entriesPerPage, filteredAppointments]);

  const totalPages = Math.ceil(filterAppointments(activeTab).length / entriesPerPage);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchEmail, dateRange, entriesPerPage]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return dateString;
    }
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return 'Not set';
    try {
      const [hours, minutes] = timeString.split(':');
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes));
      return format(date, 'h:mm a');
    } catch {
      return timeString;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'booked':
        return <Badge variant="default" className="bg-blue-100 text-blue-800 border-blue-200">Booked</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="default" className="bg-red-100 text-red-800 border-red-200">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };



  const handleRefresh = () => {
    mutate();
  };

  const handleGenerateBill = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsBillDialogOpen(true);
  };

  const handleViewBill = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsViewBillDialogOpen(true);
  };

  const handleBillGenerated = () => {
    handleRefresh();
  };

  const handleNavigateToComplete = (appointment: Appointment) => {
    if (!canManageAppointments) return;
    router.push(`/dashboard/appointments/complete/${appointment.id}`);
  };

  const handleCancelAppointment = async (appointmentId: string, reason: string, notes?: string) => {
    if (!canManageAppointments || isUpdating) return;

    setIsUpdating(appointmentId);
    setConfirmingCancel(null); // Close dialog
    try {
      const response = await fetch(`/api/appointments/${appointmentId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'cancelled',
          cancellationReason: reason,
          cancellationNotes: notes,
          cancelledBy: user?.email,
        }),
      });

      if (response.ok) {
        await mutate();
        toast.success('Appointment cancelled successfully');
      } else {
        const error = await response.json();
        toast.error(`Failed to cancel appointment: ${error.error}`);
      }
    } catch (error) {
      toast.error('Failed to cancel appointment - please try again');
    } finally {
      setIsUpdating(null);
    }
  };

  const handleRescheduleAppointment = () => {
    mutate(); // Refresh appointments data
    setReschedulingAppointment(null); // Close dialog
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">Failed to load appointments</p>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-start mb-8">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-CustomPink1">Appointments</h1>
            {isValidating && (
              <div className="flex items-center gap-2 text-sm text-CustomPink1">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Updating...</span>
              </div>
            )}
          </div>
          
          {/* Date Range Picker */}
          <div className="flex items-center gap-4 rounded-lg border-1 border-CustomPink1">
            <DateRangeDialog
              value={dateRange}
              onChange={setDateRange}
              className="w-auto text-CustomPink1"
            />
          </div>
          

        </div>
        
        <div className="flex gap-2">
          {canManageAppointments && (
            <Button 
              variant="outline_pink" 
              onClick={() => router.push('/dashboard/appointments/reports')} 
              className="flex items-center gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              Reports
            </Button>
          )}
          
          <Button 
            variant="outline_pink" 
            onClick={handleRefresh} 
            className="flex items-center gap-2"
            disabled={isValidating}
          >
            <RefreshCw className={`h-4 w-4 ${isValidating ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          {isPatient && (
            <BookingForm
              userEmail={user?.email}
              userName={user?.name}
              userPhone={user?.phone || undefined}
              onSuccess={handleRefresh}
              asDialog={true}
              bookingMode="patient"
            />
          )}
          
          {canBookForPatients && (
            <BookingForm 
              onSuccess={handleRefresh} 
              asDialog={true}
              bookingMode="staff"
            />
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className='bg-CustomPink2 rounded-lg border-1 border-CustomPink1'>
          <CardContent className="flex items-center p-6">
            <Calendar className="h-8 w-8 text-CustomPink1" />
            <div className="ml-4">
              <p className="text-sm font-medium text-CustomPink1">Total</p>
              <p className="text-2xl font-bold text-CustomPink1">{getStatusCount('all')}</p>
            </div>
            {isValidating && (
              <div className="ml-auto">
                <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse"></div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className='bg-CustomPink2 rounded-lg border-1 border-CustomPink1'>
          <CardContent className="flex items-center p-6">
            <Clock className="h-8 w-8 text-CustomPink1" />
            <div className="ml-4">
              <p className="text-sm font-medium text-CustomPink1">Booked</p>
              <p className="text-2xl font-bold text-CustomPink1">{getStatusCount('booked')}</p>
            </div>
            {isValidating && (
              <div className="ml-auto">
                <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse"></div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className='bg-CustomPink2 rounded-lg border-1 border-CustomPink1'>
          <CardContent className="flex items-center p-6">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-CustomPink1">Completed</p>
              <p className="text-2xl font-bold text-CustomPink1">{getStatusCount('completed')}</p>
            </div>
            {isValidating && (
              <div className="ml-auto">
                <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse"></div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className='bg-CustomPink2 rounded-lg border-1 border-CustomPink1'>
          <CardContent className="flex items-center p-6">
            <XCircle className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-CustomPink1">Cancelled</p>
              <p className="text-2xl font-bold text-CustomPink1">{getStatusCount('cancelled')}</p>
            </div>
            {isValidating && (
              <div className="ml-auto">
                <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse"></div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Search and Controls */}
      <SearchAndPagination
        className='font-bold text-CustomPink1'
        searchValue={searchEmail}
        onSearchChange={setSearchEmail}
        searchPlaceholder="Search by patient email..."
        currentPage={currentPage}
        totalPages={totalPages}
        entriesPerPage={entriesPerPage}
        onPageChange={setCurrentPage}
        onEntriesPerPageChange={setEntriesPerPage}
        totalEntries={filterAppointments(activeTab).length}
        startEntry={((currentPage - 1) * entriesPerPage) + 1}
        endEntry={Math.min(currentPage * entriesPerPage, filterAppointments(activeTab).length)}
      />

      {/* Appointments Table */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full h-11 grid-cols-4 bg-CustomPink2 rounded-lg border-1 border-CustomPink1">
          <TabsTrigger value="all" className='font-bold text-CustomPink1'>
            All <Badge variant="secondary" className="ml-1 font-bold text-CustomPink1 bg-CustomPink2">{getStatusCount('all')}</Badge>
          </TabsTrigger>
          <TabsTrigger value="booked" className='font-bold text-CustomPink1'>
            Booked <Badge variant="secondary" className="ml-1 font-bold text-CustomPink1 bg-CustomPink2">{getStatusCount('booked')}</Badge>
          </TabsTrigger>
          <TabsTrigger value="completed" className='font-bold text-CustomPink1'>
            Completed <Badge variant="secondary" className="ml-1 font-bold text-CustomPink1 bg-CustomPink2">{getStatusCount('completed')}</Badge>
          </TabsTrigger>
          <TabsTrigger value="cancelled" className='font-bold text-CustomPink1'>
            Cancelled <Badge variant="secondary" className="ml-1 font-bold text-CustomPink1 bg-CustomPink2">{getStatusCount('cancelled')}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <Card className='bg-CustomPink2 rounded-lg border-1 border-CustomPink1'>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-bold text-CustomPink1">
                <CalendarDays className="h-5 w-5" />
                {activeTab === 'all' ? 'All Appointments' : `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Appointments`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {paginatedAppointments.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-CustomPink1 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {searchEmail ? 
                      `No appointments found matching "${searchEmail}"` :
                      (activeTab === 'all' 
                        ? 'No appointments found for selected date range' 
                        : `No ${activeTab} appointments found for selected date range`
                      )
                    }
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>
                          <div className="flex items-center gap-2 font-bold text-CustomPink1">
                            <User className="h-4 w-4" />
                            Patient
                          </div>
                        </TableHead>
                        <TableHead>
                          <div className="flex items-center gap-2 font-bold text-CustomPink1">
                            <Mail className="h-4 w-4" />
                            Contact
                          </div>
                        </TableHead>
                        <TableHead>
                          <div className="flex items-center gap-2 font-bold text-CustomPink1">
                            <FileText className="h-4 w-4" />
                            Service
                          </div>
                        </TableHead>
                        <TableHead>
                          <div className="flex items-center gap-2 font-bold text-CustomPink1">
                            <Timer className="h-4 w-4" />
                            Time
                          </div>
                        </TableHead>
                        {!isPatient && (
                          <TableHead>
                            <div className="flex items-center gap-2 font-bold text-CustomPink1">
                              <UserCheck className="h-4 w-4" />
                              Dentist
                            </div>
                          </TableHead>
                        )}
                        <TableHead className=' font-bold text-CustomPink1'>Status</TableHead>
                        {canManageAppointments && <TableHead className=' font-bold text-CustomPink1'>Actions</TableHead>}
                      </TableRow>
                    </TableHeader>
                    
                    <TableBody>
                      {paginatedAppointments.map(appointment => (
                        <TableRow key={appointment.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{appointment.patientName}</p>
                              <p className="text-sm text-gray-500">
                                {appointment.isAnonymous ? 'Anonymous Booking' : 'Registered Patient'}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm">
                                <Mail className="h-3 w-3" />
                                <span className="truncate max-w-[150px]">{appointment.patientEmail}</span>
                              </div>
                              {appointment.patientPhone && (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Phone className="h-3 w-3" />
                                  <span>{appointment.patientPhone}</span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{appointment.serviceDetails?.[0]?.name || appointment.service}</p>
                              {appointment.notes && (
                                <p className="text-sm text-gray-500 truncate max-w-[200px]">
                                  {appointment.notes}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{formatTime(appointment.time)}</p>
                              <p className="text-sm text-gray-500">{formatDate(appointment.date)}</p>
                            </div>
                          </TableCell>
                          {!isPatient && (
                            <TableCell>
                              <p className="font-medium">
                                {appointment.dentistName || 'Not assigned'}
                              </p>
                            </TableCell>
                          )}
                          <TableCell>
                            {getStatusBadge(appointment.status)}
                          </TableCell>
                          {canManageAppointments && (
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {appointment.status === 'booked' && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleNavigateToComplete(appointment)}
                                      disabled={isUpdating === appointment.id}
                                      className="flex items-center gap-1 text-green-600 hover:text-green-700 hover:bg-green-50"
                                    >
                                      <Check className="h-3 w-3" />
                                      Complete
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setReschedulingAppointment(appointment)}
                                      disabled={isUpdating === appointment.id}
                                      className="flex items-center gap-1 text-CustomPink1 hover:text-blue-700 hover:bg-blue-50"
                                    >
                                      <Edit className="h-3 w-3" />
                                      Reschedule
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setConfirmingCancel(appointment)}
                                      disabled={isUpdating === appointment.id}
                                      className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <X className="h-3 w-3" />
                                      Cancel
                                    </Button>
                                  </>
                                )}
                                {appointment.status === 'completed' && (
                                  <>
                                    {appointment.has_bill && appointment.billId ? (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleViewBill(appointment)}
                                        className="flex items-center gap-1 text-CustomPink1 hover:text-blue-700 hover:bg-blue-50"
                                      >
                                        <Eye className="h-3 w-3" />
                                        View Bill
                                      </Button>
                                    ) : (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleGenerateBill(appointment)}
                                        className="flex items-center gap-1 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                                      >
                                        <Receipt className="h-3 w-3" />
                                        Generate Bill
                                      </Button>
                                    )}
                                  </>
                                )}
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Generate Bill Dialog */}
      <GenerateBillDialog
        appointment={selectedAppointment}
        isOpen={isBillDialogOpen}
        onOpenChange={setIsBillDialogOpen}
        onBillGenerated={handleBillGenerated}
      />

      {/* View Bill Dialog */}
      <ViewBillDialog
        appointment={selectedAppointment}
        isOpen={isViewBillDialogOpen}
        onOpenChange={setIsViewBillDialogOpen}
      />



      {/* Cancel Appointment Dialog */}
      <CancelAppointmentDialog
        appointment={confirmingCancel}
        isOpen={!!confirmingCancel}
        onClose={() => setConfirmingCancel(null)}
        onConfirm={handleCancelAppointment}
        isLoading={isUpdating === confirmingCancel?.id}
      />

      {/* Reschedule Appointment Dialog */}
      <RescheduleAppointmentDialog
        appointment={reschedulingAppointment}
        isOpen={!!reschedulingAppointment}
        onClose={() => setReschedulingAppointment(null)}
        onReschedule={handleRescheduleAppointment}
        isLoading={isUpdating === reschedulingAppointment?.id}
      />
    </div>
  );
}