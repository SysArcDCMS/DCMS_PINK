'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../contexts/AuthContext';
import { Button } from '../../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/tabs';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../../../components/ui/dialog';
import { Badge } from '../../../../components/ui/badge';
import { ArrowLeft, Calendar, BarChart3, AlertTriangle, Users, FileText, Printer, Download, Eye } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, subWeeks, subMonths, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { Appointment } from '../../../../types';

interface AppointmentSummaryData {
  total: number;
  booked: number;
  completed: number;
  cancelled: number;
  noShow: number;
}

interface CancellationData {
  reason: string;
  count: number;
  percentage: number;
}

interface ServiceUtilizationData {
  service: string;
  count: number;
  percentage: number;
}

interface ReportFilters {
  startDate: string;
  endDate: string;
  service?: string;
  cancellationReason?: string;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const CANCELLATION_REASON_LABELS = {
  'no-show': 'No-show',
  'patient-cancelled': 'Patient cancelled',
  'clinic-cancelled': 'Clinic cancelled',
  'stock-shortage': 'Stock shortage',
  'emergency': 'Emergency',
  'other': 'Other'
};

export default function AppointmentsReportPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('summary');
  const [loading, setLoading] = useState(false);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<any[]>([]);
  
  // Summary Report Data
  const [summaryData, setSummaryData] = useState<AppointmentSummaryData>({
    total: 0,
    booked: 0,
    completed: 0,
    cancelled: 0,
    noShow: 0
  });
  
  // Cancellation Report Data
  const [cancellationData, setCancellationData] = useState<CancellationData[]>([]);
  
  // Service Utilization Data
  const [utilizationData, setUtilizationData] = useState<ServiceUtilizationData[]>([]);
  
  // Filters
  const [summaryFilters, setSummaryFilters] = useState<ReportFilters>({
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });
  
  const [cancellationFilters, setCancellationFilters] = useState<ReportFilters>({
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });
  
  const [utilizationFilters, setUtilizationFilters] = useState<ReportFilters>({
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });
  
  const printComponentRef = useRef<HTMLDivElement>(null);

  const canViewReports = user?.role === 'admin' || user?.role === 'staff' || user?.role === 'dentist';

  useEffect(() => {
    if (!canViewReports) {
      router.push('/dashboard');
      return;
    }
    
    fetchData();
  }, []);

  // Auto-generate reports when data or filters change
  useEffect(() => {
    if (appointments.length > 0) {
      generateSummaryReport();
      generateCancellationReport();
      generateUtilizationReport();
    }
  }, [appointments, summaryFilters, cancellationFilters, utilizationFilters]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch appointments and services separately
      const [appointmentsResponse, servicesResponse] = await Promise.all([
        fetch('/api/appointments/reports'),
        fetch('/api/services')
      ]);
      
      if (appointmentsResponse.ok && servicesResponse.ok) {
        const appointmentsData = await appointmentsResponse.json();
        const servicesData = await servicesResponse.json();
        
        setAppointments(appointmentsData.appointments || []);
        setServices(servicesData.services || []);
      } else {
        throw new Error('Failed to fetch data');
      }
      
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  const generateSummaryReport = () => {
    const filtered = filterAppointmentsByDate(appointments, summaryFilters.startDate, summaryFilters.endDate);
    
    // Filter by service if specified - check serviceDetails array
    const serviceFiltered = summaryFilters.service && summaryFilters.service !== 'all' 
      ? filtered.filter(apt => 
          apt.serviceDetails && apt.serviceDetails.some(service => service.name === summaryFilters.service)
        )
      : filtered;

    const summary: AppointmentSummaryData = {
      total: serviceFiltered.length,
      booked: serviceFiltered.filter(apt => apt.status === 'booked').length,
      completed: serviceFiltered.filter(apt => apt.status === 'completed').length,
      cancelled: serviceFiltered.filter(apt => apt.status === 'cancelled').length,
      noShow: serviceFiltered.filter(apt => apt.status === 'cancelled' && apt.cancellationReason === 'no-show').length
    };

    setSummaryData(summary);
  };

  const generateCancellationReport = () => {
    const filtered = filterAppointmentsByDate(appointments, cancellationFilters.startDate, cancellationFilters.endDate);
    const cancelled = filtered.filter(apt => apt.status === 'cancelled');
    
    // Filter by reason if specified
    const reasonFiltered = cancellationFilters.cancellationReason && cancellationFilters.cancellationReason !== 'all'
      ? cancelled.filter(apt => apt.cancellationReason === cancellationFilters.cancellationReason)
      : cancelled;

    const reasonCounts: { [key: string]: number } = {};
    reasonFiltered.forEach(apt => {
      const reason = apt.cancellationReason || 'other';
      reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
    });

    const cancellationReport: CancellationData[] = Object.entries(reasonCounts).map(([reason, count]) => ({
      reason: CANCELLATION_REASON_LABELS[reason as keyof typeof CANCELLATION_REASON_LABELS] || reason,
      count,
      percentage: reasonFiltered.length > 0 ? (count / reasonFiltered.length) * 100 : 0
    }));

    setCancellationData(cancellationReport);
  };

   const generateUtilizationReport = () => {
    const filtered = filterAppointmentsByDate(appointments, utilizationFilters.startDate, utilizationFilters.endDate);
    
    // Filter by service if specified - check serviceDetails array
    const serviceFiltered = utilizationFilters.service && utilizationFilters.service !== 'all'
      ? filtered.filter(apt => 
          apt.serviceDetails?.some(service => service.name === utilizationFilters.service)
        )
      : filtered;

    const serviceCounts: { [key: string]: number } = {};
    serviceFiltered.forEach(apt => {
      if (apt.serviceDetails && apt.serviceDetails.length > 0) {
        // Count each service in serviceDetails array
        apt.serviceDetails.forEach(service => {
		  if (!utilizationFilters.service || service.name === utilizationFilters.service) {
            const serviceName = service.name || 'Unknown';
            serviceCounts[serviceName] = (serviceCounts[serviceName] || 0) + 1;
		  }
        });
      } else {
        // Fallback to legacy service field
        const service = apt.service || 'Unknown';
        serviceCounts[service] = (serviceCounts[service] || 0) + 1;
      }
    });

    const totalServiceInstances = Object.values(serviceCounts).reduce((sum, count) => sum + count, 0);
    const utilizationReport: ServiceUtilizationData[] = Object.entries(serviceCounts).map(([service, count]) => ({
      service,
      count,
      percentage: totalServiceInstances > 0 ? (count / totalServiceInstances) * 100 : 0
    })).sort((a, b) => b.count - a.count);

    setUtilizationData(utilizationReport);
  };

  const filterAppointmentsByDate = (appointments: Appointment[], startDate: string, endDate: string) => {
    return appointments.filter(apt => {
      if (!apt.date) return false;
      try {
        const aptDate = parseISO(apt.date);
        const start = parseISO(startDate);
        const end = parseISO(endDate + 'T23:59:59');
        return aptDate >= start && aptDate <= end;
      } catch {
        return false;
      }
    });
  };

  const handleDateRangePreset = (preset: string, setFilters: React.Dispatch<React.SetStateAction<ReportFilters>>) => {
    const now = new Date();
    let startDate: Date, endDate: Date;

    switch (preset) {
      case 'today':
        startDate = endDate = now;
        break;
      case 'yesterday':
        startDate = endDate = subDays(now, 1);
        break;
      case 'this-week':
        startDate = startOfWeek(now);
        endDate = endOfWeek(now);
        break;
      case 'last-week':
        startDate = startOfWeek(subWeeks(now, 1));
        endDate = endOfWeek(subWeeks(now, 1));
        break;
      case 'this-month':
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
      case 'last-month':
        startDate = startOfMonth(subMonths(now, 1));
        endDate = endOfMonth(subMonths(now, 1));
        break;
      default:
        return;
    }

    setFilters(prev => ({
      ...prev,
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd')
    }));
  };

  const handlePrint = () => {
    if (printComponentRef.current) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Appointments Report - ${format(new Date(), 'yyyy-MM-dd')}</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #ccc; padding-bottom: 20px; }
                .report-section { margin-bottom: 30px; }
                .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
                .stat-card { border: 1px solid #ddd; padding: 15px; border-radius: 8px; text-align: center; }
                .stat-number { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
                .stat-label { font-size: 14px; color: #666; }
                .chart-placeholder { border: 1px solid #ddd; padding: 20px; text-align: center; margin: 20px 0; }
                h1 { color: #1f2937; margin-bottom: 5px; }
                h2 { color: #374151; margin-bottom: 15px; }
                h3 { color: #4b5563; margin-bottom: 10px; }
              </style>
            </head>
            <body>
              ${printComponentRef.current.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      }
    }
  };

  if (!canViewReports) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-CustomPink1">Appointment Reports</h1>
            <p className="text-gray-600">Detailed analytics and insights</p>
          </div>
        </div>
        <Button
          onClick={() => setShowPrintDialog(true)}
          className="flex items-center gap-2"
        >
          <FileText className="h-4 w-4" />
          Generate Report
        </Button>
      </div>

      {/* Report Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="summary" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Summary Report
          </TabsTrigger>
          <TabsTrigger value="cancellation" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Cancellation Report
          </TabsTrigger>
          <TabsTrigger value="utilization" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Service Utilization
          </TabsTrigger>
        </TabsList>

        {/* Summary Report */}
        <TabsContent value="summary" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Appointment Summary Report</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={summaryFilters.startDate}
                    onChange={(e) => setSummaryFilters(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={summaryFilters.endDate}
                    onChange={(e) => setSummaryFilters(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Service (Optional)</Label>
                  <Select value={summaryFilters.service || 'all'} onValueChange={(value) => setSummaryFilters(prev => ({ ...prev, service: value === 'all' ? undefined : value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="All services" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Services</SelectItem>
                      {services.map(service => (
                        <SelectItem key={service.id} value={service.name}>
                          {service.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Quick Date Presets */}
              <div className="flex flex-wrap gap-2">
                <span className="text-sm text-gray-600 mr-2">Quick select:</span>
                {['today', 'yesterday', 'this-week', 'last-week', 'this-month', 'last-month'].map(preset => (
                  <Button
                    key={preset}
                    variant="outline"
                    size="sm"
                    onClick={() => handleDateRangePreset(preset, setSummaryFilters)}
                  >
                    {preset.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Button>
                ))}
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-CustomPink1">{summaryData.total}</div>
                    <div className="text-sm text-gray-600">Total</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-orange-600">{summaryData.booked}</div>
                    <div className="text-sm text-gray-600">Booked</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{summaryData.completed}</div>
                    <div className="text-sm text-gray-600">Completed</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-red-600">{summaryData.cancelled}</div>
                    <div className="text-sm text-gray-600">Cancelled</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">{summaryData.noShow}</div>
                    <div className="text-sm text-gray-600">No-show</div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cancellation Report */}
        <TabsContent value="cancellation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>No-show & Cancellation Report</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={cancellationFilters.startDate}
                    onChange={(e) => setCancellationFilters(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={cancellationFilters.endDate}
                    onChange={(e) => setCancellationFilters(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Reason Filter (Optional)</Label>
                  <Select value={cancellationFilters.cancellationReason || 'all'} onValueChange={(value) => setCancellationFilters(prev => ({ ...prev, cancellationReason: value === 'all' ? undefined : value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="All reasons" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Reasons</SelectItem>
                      {Object.entries(CANCELLATION_REASON_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Quick Date Presets */}
              <div className="flex flex-wrap gap-2">
                <span className="text-sm text-gray-600 mr-2">Quick select:</span>
                {['today', 'yesterday', 'this-week', 'last-week', 'this-month', 'last-month'].map(preset => (
                  <Button
                    key={preset}
                    variant="outline"
                    size="sm"
                    onClick={() => handleDateRangePreset(preset, setCancellationFilters)}
                  >
                    {preset.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Button>
                ))}
              </div>

              {/* Cancellation Chart */}
              {cancellationData.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Cancellation Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={cancellationData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="reason" angle={-45} textAnchor="end" height={80} fontSize={12} />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="count" fill="#ef4444" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Cancellation Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={cancellationData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ reason, percentage }) => `${reason} (${percentage.toFixed(1)}%)`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="count"
                          >
                            {cancellationData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="text-center py-12">
                  <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No cancellation data available for the selected criteria</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Service Utilization Report */}
        <TabsContent value="utilization" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Service Utilization Report</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={utilizationFilters.startDate}
                    onChange={(e) => setUtilizationFilters(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={utilizationFilters.endDate}
                    onChange={(e) => setUtilizationFilters(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Service (Optional)</Label>
                  <Select value={utilizationFilters.service || 'all'} onValueChange={(value) => setUtilizationFilters(prev => ({ ...prev, service: value === 'all' ? undefined : value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="All services" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Services</SelectItem>
                      {services.map(service => (
                        <SelectItem key={service.id} value={service.name}>
                          {service.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Quick Date Presets */}
              <div className="flex flex-wrap gap-2">
                <span className="text-sm text-gray-600 mr-2">Quick select:</span>
                {['today', 'yesterday', 'this-week', 'last-week', 'this-month', 'last-month'].map(preset => (
                  <Button
                    key={preset}
                    variant="outline"
                    size="sm"
                    onClick={() => handleDateRangePreset(preset, setUtilizationFilters)}
                  >
                    {preset.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Button>
                ))}
              </div>

              {/* Utilization Chart */}
              {utilizationData.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Appointments per Service</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={utilizationData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="service" type="category" width={150} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              ) : (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No utilization data available for the selected criteria</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Print Preview Dialog */}
      <Dialog open={showPrintDialog} onOpenChange={setShowPrintDialog}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Print Preview - Appointments Report
            </DialogTitle>
            <DialogDescription>
              Review your report before printing or saving as PDF
            </DialogDescription>
          </DialogHeader>

          {/* Print Component */}
          <div ref={printComponentRef} className="print-content">
            <div className="p-8 bg-white">
              {/* Header */}
              <div className="header">
                <h1>Go-Goyagoy Dental Clinic</h1>
                <h2>Appointment Reports</h2>
                <p>Generated on {format(new Date(), 'MMMM dd, yyyy')}</p>
              </div>

              {/* Summary Report */}
              {activeTab === 'summary' && (
                <div className="report-section">
                  <h3>Appointment Summary Report</h3>
                  <p>Period: {format(parseISO(summaryFilters.startDate), 'MMM dd, yyyy')} - {format(parseISO(summaryFilters.endDate), 'MMM dd, yyyy')}</p>
                  
                  <div className="stats-grid">
                    <div className="stat-card">
                      <div className="stat-number">{summaryData.total}</div>
                      <div className="stat-label">Total Appointments</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-number">{summaryData.booked}</div>
                      <div className="stat-label">Booked</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-number">{summaryData.completed}</div>
                      <div className="stat-label">Completed</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-number">{summaryData.cancelled}</div>
                      <div className="stat-label">Cancelled</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-number">{summaryData.noShow}</div>
                      <div className="stat-label">No-show</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Cancellation Report */}
              {activeTab === 'cancellation' && (
                <div className="report-section">
                  <h3>No-show & Cancellation Report</h3>
                  <p>Period: {format(parseISO(cancellationFilters.startDate), 'MMM dd, yyyy')} - {format(parseISO(cancellationFilters.endDate), 'MMM dd, yyyy')}</p>
                  
                  {cancellationData.length > 0 ? (
                    <table style={{ width: '100%', borderCollapse: 'collapse', margin: '20px 0' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #ccc' }}>
                          <th style={{ padding: '10px', textAlign: 'left' }}>Reason</th>
                          <th style={{ padding: '10px', textAlign: 'center' }}>Count</th>
                          <th style={{ padding: '10px', textAlign: 'center' }}>Percentage</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cancellationData.map((item, index) => (
                          <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '10px' }}>{item.reason}</td>
                            <td style={{ padding: '10px', textAlign: 'center' }}>{item.count}</td>
                            <td style={{ padding: '10px', textAlign: 'center' }}>{item.percentage.toFixed(1)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p>No cancellation data available for the selected period.</p>
                  )}
                </div>
              )}

              {/* Utilization Report */}
              {activeTab === 'utilization' && (
                <div className="report-section">
                  <h3>Service Utilization Report</h3>
                  <p>Period: {format(parseISO(utilizationFilters.startDate), 'MMM dd, yyyy')} - {format(parseISO(utilizationFilters.endDate), 'MMM dd, yyyy')}</p>
                  
                  {utilizationData.length > 0 ? (
                    <table style={{ width: '100%', borderCollapse: 'collapse', margin: '20px 0' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #ccc' }}>
                          <th style={{ padding: '10px', textAlign: 'left' }}>Service</th>
                          <th style={{ padding: '10px', textAlign: 'center' }}>Appointments</th>
                          <th style={{ padding: '10px', textAlign: 'center' }}>Percentage</th>
                        </tr>
                      </thead>
                      <tbody>
                        {utilizationData.map((item, index) => (
                          <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '10px' }}>{item.service}</td>
                            <td style={{ padding: '10px', textAlign: 'center' }}>{item.count}</td>
                            <td style={{ padding: '10px', textAlign: 'center' }}>{item.percentage.toFixed(1)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p>No utilization data available for the selected period.</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowPrintDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handlePrint} className="flex items-center gap-2">
              <Printer className="h-4 w-4" />
              Print Report
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}