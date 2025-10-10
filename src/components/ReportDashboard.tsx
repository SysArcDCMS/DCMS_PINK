'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Calendar, TrendingDown, AlertTriangle, BarChart3, Users, Clock, FileText, Printer, Download, Package, DollarSign, Calendar as CalendarIcon, Eye } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { format, startOfMonth, endOfMonth, subMonths, parseISO } from 'date-fns';
// import { useReactToPrint } from 'react-to-print'; // Install with: npm install react-to-print

interface AppointmentStats {
  total: number;
  completed: number;
  cancelled: number;
  booked: number;
  cancellationRate: number;
  noShowCount: number;
  noShowRate: number;
}

interface CancellationBreakdown {
  reason: string;
  count: number;
  percentage: number;
}

interface MonthlyTrend {
  month: string;
  completed: number;
  cancelled: number;
  noShow: number;
  cancellationRate: number;
}

interface PatientStats {
  totalPatients: number;
  newPatients: number;
  returningPatients: number;
  averageAge: number;
  appointmentsPerPatient: number;
}

interface InventoryStats {
  totalItems: number;
  lowStockItems: number;
  outOfStockItems: number;
  totalValue: number;
  itemsByCategory: { category: string; count: number }[];
}

interface BillingStats {
  totalBilled: number;
  totalPaid: number;
  outstanding: number;
  billCount: number;
  averageBillAmount: number;
  paymentMethods: { method: string; count: number; amount: number }[];
}

interface ReportData {
  patients?: any[];
  appointments?: any[];
  inventory?: any[];
  bills?: any[];
}

interface ReportConfig {
  module: 'patient' | 'appointment' | 'inventory' | 'billing';
  dateRange: string;
  startDate: string;
  endDate: string;
  filters: {
    status?: string;
    category?: string;
    paymentStatus?: string;
  };
}

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6'];

const CANCELLATION_REASON_LABELS = {
  'no-show': 'No-show',
  'patient-cancelled': 'Patient cancelled',
  'clinic-cancelled': 'Clinic cancelled', 
  'emergency': 'Emergency',
  'other': 'Other'
};

export function ReportsDashboard() {
  const [activeTab, setActiveTab] = useState('patient');
  const [timeRange, setTimeRange] = useState('current-month');
  const [appointmentStats, setAppointmentStats] = useState<AppointmentStats | null>(null);
  const [patientStats, setPatientStats] = useState<PatientStats | null>(null);
  const [inventoryStats, setInventoryStats] = useState<InventoryStats | null>(null);
  const [billingStats, setBillingStats] = useState<BillingStats | null>(null);
  const [cancellationBreakdown, setCancellationBreakdown] = useState<CancellationBreakdown[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrend[]>([]);
  const [reportData, setReportData] = useState<ReportData>({});
  const [loading, setLoading] = useState(true);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    module: 'appointment',
    dateRange: 'current-month',
    startDate: '',
    endDate: '',
    filters: {}
  });
  
  const printComponentRef = useRef<HTMLDivElement>(null);

  const getDateRange = (range: string) => {
    const now = new Date();
    switch (range) {
      case 'current-month':
        return {
          start: startOfMonth(now),
          end: endOfMonth(now)
        };
      case 'last-month':
        const lastMonth = subMonths(now, 1);
        return {
          start: startOfMonth(lastMonth),
          end: endOfMonth(lastMonth)
        };
      case 'last-3-months':
        return {
          start: startOfMonth(subMonths(now, 2)),
          end: endOfMonth(now)
        };
      case 'last-6-months':
        return {
          start: startOfMonth(subMonths(now, 5)),
          end: endOfMonth(now)
        };
      default:
        return {
          start: startOfMonth(now),
          end: endOfMonth(now)
        };
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Fetch appointments
      const appointmentsResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-c89a26e4/appointments`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });
      
      // Fetch billing data
      const billingResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-c89a26e4/billing`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });
      
      // Fetch inventory data
      const inventoryResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-c89a26e4/inventory`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });

      const appointments = appointmentsResponse.ok ? (await appointmentsResponse.json()).appointments || [] : [];
      const bills = billingResponse.ok ? (await billingResponse.json()).bills || [] : [];
      const inventory = inventoryResponse.ok ? (await inventoryResponse.json()).items || [] : [];

      setReportData({ appointments, bills, inventory });

      const { start, end } = getDateRange(timeRange);
      
      // Calculate appointment stats
      const filteredAppointments = appointments.filter((apt: any) => {
        if (!apt.appointmentDate) return false;
        const aptDate = parseISO(apt.appointmentDate);
        return aptDate >= start && aptDate <= end;
      });

      const appointmentStatsCalc: AppointmentStats = {
        total: filteredAppointments.length,
        completed: filteredAppointments.filter((apt: any) => apt.status === 'completed').length,
        cancelled: filteredAppointments.filter((apt: any) => apt.status === 'cancelled').length,
        booked: filteredAppointments.filter((apt: any) => apt.status === 'booked').length,
        cancellationRate: 0,
        noShowCount: 0,
        noShowRate: 0
      };

      appointmentStatsCalc.cancellationRate = appointmentStatsCalc.total > 0 ? (appointmentStatsCalc.cancelled / appointmentStatsCalc.total) * 100 : 0;
      appointmentStatsCalc.noShowCount = filteredAppointments.filter((apt: any) => 
        apt.status === 'cancelled' && apt.cancellationReason === 'no-show'
      ).length;
      appointmentStatsCalc.noShowRate = appointmentStatsCalc.total > 0 ? (appointmentStatsCalc.noShowCount / appointmentStatsCalc.total) * 100 : 0;

      setAppointmentStats(appointmentStatsCalc);

      // Calculate patient stats
      const uniquePatients = new Set(appointments.map((apt: any) => apt.patientId).filter(Boolean));
      const patientStatsCalc: PatientStats = {
        totalPatients: uniquePatients.size,
        newPatients: 0, // Would need patient creation dates
        returningPatients: 0,
        averageAge: 0,
        appointmentsPerPatient: uniquePatients.size > 0 ? appointments.length / uniquePatients.size : 0
      };
      setPatientStats(patientStatsCalc);

      // Calculate inventory stats
      const categoryCount: { [key: string]: number } = {};
      inventory.forEach((item: any) => {
        categoryCount[item.category] = (categoryCount[item.category] || 0) + 1;
      });

      const inventoryStatsCalc: InventoryStats = {
        totalItems: inventory.length,
        lowStockItems: inventory.filter((item: any) => item.quantity <= (item.minThreshold || 5)).length,
        outOfStockItems: inventory.filter((item: any) => item.quantity === 0).length,
        totalValue: inventory.reduce((sum: number, item: any) => sum + (item.quantity * (item.unitCost || 0)), 0),
        itemsByCategory: Object.entries(categoryCount).map(([category, count]) => ({ category, count }))
      };
      setInventoryStats(inventoryStatsCalc);

      // Calculate billing stats
      const filteredBills = bills.filter((bill: any) => {
        if (!bill.createdAt) return false;
        const billDate = parseISO(bill.createdAt);
        return billDate >= start && billDate <= end;
      });

      const paymentMethodCounts: { [key: string]: { count: number; amount: number } } = {};
      filteredBills.forEach((bill: any) => {
        const method = bill.paymentMethod || 'Not specified';
        if (!paymentMethodCounts[method]) {
          paymentMethodCounts[method] = { count: 0, amount: 0 };
        }
        paymentMethodCounts[method].count += 1;
        paymentMethodCounts[method].amount += bill.totalAmount || 0;
      });

      const billingStatsCalc: BillingStats = {
        totalBilled: filteredBills.reduce((sum: number, bill: any) => sum + (bill.totalAmount || 0), 0),
        totalPaid: filteredBills.reduce((sum: number, bill: any) => sum + (bill.paidAmount || 0), 0),
        outstanding: filteredBills.reduce((sum: number, bill: any) => sum + (bill.outstandingBalance || 0), 0),
        billCount: filteredBills.length,
        averageBillAmount: filteredBills.length > 0 ? filteredBills.reduce((sum: number, bill: any) => sum + (bill.totalAmount || 0), 0) / filteredBills.length : 0,
        paymentMethods: Object.entries(paymentMethodCounts).map(([method, data]) => ({ method, count: data.count, amount: data.amount }))
      };
      setBillingStats(billingStatsCalc);

    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    // Simple print fallback - can be enhanced with react-to-print library
    if (printComponentRef.current) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${reportConfig.module.charAt(0).toUpperCase() + reportConfig.module.slice(1)} Report - ${format(new Date(), 'yyyy-MM-dd')}</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .grid { display: grid; }
                .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
                .gap-4 { gap: 1rem; }
                .mb-6 { margin-bottom: 1.5rem; }
                .mb-4 { margin-bottom: 1rem; }
                .p-4 { padding: 1rem; }
                .rounded { border-radius: 0.375rem; }
                .bg-gray-50 { background-color: #f9fafb; }
                .text-2xl { font-size: 1.5rem; }
                .text-lg { font-size: 1.125rem; }
                .text-sm { font-size: 0.875rem; }
                .font-bold { font-weight: bold; }
                .font-semibold { font-weight: 600; }
                .text-green-600 { color: #059669; }
                .text-red-600 { color: #dc2626; }
                .text-orange-600 { color: #ea580c; }
                .text-gray-600 { color: #4b5563; }
                .text-CustomPink1 { color: #111827; }
                .text-gray-700 { color: #374151; }
                .text-center { text-align: center; }
                .border-b { border-bottom: 1px solid #e5e7eb; }
                .pb-4 { padding-bottom: 1rem; }
                .mt-2 { margin-top: 0.5rem; }
                .space-y-6 > * + * { margin-top: 1.5rem; }
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

  const generateReport = () => {
    setReportConfig({
      ...reportConfig,
      module: activeTab as any,
      dateRange: timeRange
    });
    setShowPrintDialog(true);
  };

  useEffect(() => {
    fetchAllData();
  }, [timeRange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading reports...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-CustomPink1">Reports Dashboard</h1>
          <p className="text-gray-600">Comprehensive reporting for all modules</p>
        </div>
        <div className="flex gap-4 items-center">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current-month">Current Month</SelectItem>
              <SelectItem value="last-month">Last Month</SelectItem>
              <SelectItem value="last-3-months">Last 3 Months</SelectItem>
              <SelectItem value="last-6-months">Last 6 Months</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={generateReport} className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Tabs for different modules */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="appointment" className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            Appointments
          </TabsTrigger>
          <TabsTrigger value="patient" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Patients
          </TabsTrigger>
          <TabsTrigger value="inventory" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Inventory
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Billing
          </TabsTrigger>
        </TabsList>

        {/* Appointment Reports */}
        <TabsContent value="appointment" className="space-y-6">
          <AppointmentReports 
            stats={appointmentStats}
            cancellationBreakdown={cancellationBreakdown}
            monthlyTrends={monthlyTrends}
            timeRange={timeRange}
          />
        </TabsContent>

        {/* Patient Reports */}
        <TabsContent value="patient" className="space-y-6">
          <PatientReports 
            stats={patientStats}
            appointments={reportData.appointments || []}
          />
        </TabsContent>

        {/* Inventory Reports */}
        <TabsContent value="inventory" className="space-y-6">
          <InventoryReports 
            stats={inventoryStats}
            inventory={reportData.inventory || []}
          />
        </TabsContent>

        {/* Billing Reports */}
        <TabsContent value="billing" className="space-y-6">
          <BillingReports 
            stats={billingStats}
            bills={reportData.bills || []}
          />
        </TabsContent>
      </Tabs>

      {/* Print Preview Dialog */}
      <PrintPreviewDialog 
        isOpen={showPrintDialog}
        onOpenChange={setShowPrintDialog}
        onPrint={handlePrint}
        reportConfig={reportConfig}
        printComponentRef={printComponentRef}
        appointmentStats={appointmentStats}
        patientStats={patientStats}
        inventoryStats={inventoryStats}
        billingStats={billingStats}
        reportData={reportData}
      />
    </div>
  );
}

// Individual Report Components
function AppointmentReports({ stats, cancellationBreakdown, monthlyTrends, timeRange }: {
  stats: AppointmentStats | null;
  cancellationBreakdown: CancellationBreakdown[];
  monthlyTrends: MonthlyTrend[];
  timeRange: string;
}) {
  return (
    <>
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
            <div className="flex gap-2 mt-2">
              <Badge variant="outline" className="bg-green-50 text-green-700">
                Completed: {stats?.completed || 0}
              </Badge>
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                Booked: {stats?.booked || 0}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cancellation Rate</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.cancellationRate.toFixed(1) || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.cancelled || 0} cancelled appointments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">No-show Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats?.noShowRate.toFixed(1) || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.noShowCount || 0} no-show appointments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats?.total ? 
                ((stats.completed / stats.total) * 100).toFixed(1) : 
                0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Successfully completed visits
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Cancellation Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cancellationBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={cancellationBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="reason" angle={-45} textAnchor="end" height={80} fontSize={12} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>No cancellation data available</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Cancellation Reasons
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cancellationBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={cancellationBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ reason, percentage }) => `${reason} (${percentage.toFixed(1)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {cancellationBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <div className="text-center">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>No cancellation data available</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function PatientReports({ stats, appointments }: { stats: PatientStats | null; appointments: any[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.totalPatients || 0}</div>
          <p className="text-xs text-muted-foreground">Unique patients registered</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">New Patients</CardTitle>
          <Users className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.newPatients || 0}</div>
          <p className="text-xs text-muted-foreground">First-time patients</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Returning Patients</CardTitle>
          <Users className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.returningPatients || 0}</div>
          <p className="text-xs text-muted-foreground">Repeat visits</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Appointments</CardTitle>
          <BarChart3 className="h-4 w-4 text-purple-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.appointmentsPerPatient.toFixed(1) || 0}</div>
          <p className="text-xs text-muted-foreground">Per patient</p>
        </CardContent>
      </Card>
    </div>
  );
}

function InventoryReports({ stats, inventory }: { stats: InventoryStats | null; inventory: any[] }) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalItems || 0}</div>
            <p className="text-xs text-muted-foreground">Items in inventory</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats?.lowStockItems || 0}</div>
            <p className="text-xs text-muted-foreground">Items below threshold</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats?.outOfStockItems || 0}</div>
            <p className="text-xs text-muted-foreground">Items unavailable</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₱{stats?.totalValue.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">Inventory worth</p>
          </CardContent>
        </Card>
      </div>

      {stats?.itemsByCategory.length ? (
        <Card>
          <CardHeader>
            <CardTitle>Items by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.itemsByCategory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      ) : null}
    </>
  );
}

function BillingReports({ stats, bills }: { stats: BillingStats | null; bills: any[] }) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Billed</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₱{stats?.totalBilled.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">{stats?.billCount || 0} bills generated</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₱{stats?.totalPaid.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">Payments received</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">₱{stats?.outstanding.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">Pending payments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Bill</CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₱{stats?.averageBillAmount.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">Per appointment</p>
          </CardContent>
        </Card>
      </div>

      {stats?.paymentMethods.length ? (
        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.paymentMethods}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="method" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="amount" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      ) : null}
    </>
  );
}

// Print Preview Dialog Component
function PrintPreviewDialog({ 
  isOpen, 
  onOpenChange, 
  onPrint, 
  reportConfig, 
  printComponentRef, 
  appointmentStats,
  patientStats,
  inventoryStats,
  billingStats,
  reportData 
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onPrint: () => void;
  reportConfig: ReportConfig;
  printComponentRef: React.RefObject<HTMLDivElement | null>;
  appointmentStats: AppointmentStats | null;
  patientStats: PatientStats | null;
  inventoryStats: InventoryStats | null;
  billingStats: BillingStats | null;
  reportData: ReportData;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Print Preview - {reportConfig.module.charAt(0).toUpperCase() + reportConfig.module.slice(1)} Report
          </DialogTitle>
          <DialogDescription>
            Review your report before printing or saving as PDF
          </DialogDescription>
        </DialogHeader>

        {/* Print Component */}
        <div ref={printComponentRef} className="print-content">
          <div className="p-8 bg-white">
            {/* Header */}
            <div className="text-center mb-8 border-b pb-4">
              <h1 className="text-3xl font-bold text-CustomPink1">Go-Goyagoy Dental Clinic</h1>
              <h2 className="text-xl font-semibold text-gray-700 mt-2">
                {reportConfig.module.charAt(0).toUpperCase() + reportConfig.module.slice(1)} Report
              </h2>
              <p className="text-gray-600 mt-2">
                Generated on {format(new Date(), 'MMMM dd, yyyy')} • Period: {reportConfig.dateRange}
              </p>
            </div>

            {/* Report Content */}
            <div className="space-y-6">
              {reportConfig.module === 'appointment' && appointmentStats && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Appointment Statistics</h3>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-50 p-4 rounded">
                      <div className="text-2xl font-bold">{appointmentStats.total}</div>
                      <div className="text-sm text-gray-600">Total Appointments</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded">
                      <div className="text-2xl font-bold text-green-600">{appointmentStats.completed}</div>
                      <div className="text-sm text-gray-600">Completed</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded">
                      <div className="text-2xl font-bold text-red-600">{appointmentStats.cancelled}</div>
                      <div className="text-sm text-gray-600">Cancelled</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded">
                      <div className="text-2xl font-bold text-orange-600">{appointmentStats.noShowCount}</div>
                      <div className="text-sm text-gray-600">No-Shows</div>
                    </div>
                  </div>
                </div>
              )}

              {reportConfig.module === 'patient' && patientStats && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Patient Statistics</h3>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-50 p-4 rounded">
                      <div className="text-2xl font-bold">{patientStats.totalPatients}</div>
                      <div className="text-sm text-gray-600">Total Patients</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded">
                      <div className="text-2xl font-bold">{patientStats.appointmentsPerPatient.toFixed(1)}</div>
                      <div className="text-sm text-gray-600">Avg Appointments per Patient</div>
                    </div>
                  </div>
                </div>
              )}

              {reportConfig.module === 'inventory' && inventoryStats && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Inventory Statistics</h3>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-50 p-4 rounded">
                      <div className="text-2xl font-bold">{inventoryStats.totalItems}</div>
                      <div className="text-sm text-gray-600">Total Items</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded">
                      <div className="text-2xl font-bold text-green-600">₱{inventoryStats.totalValue.toLocaleString()}</div>
                      <div className="text-sm text-gray-600">Total Value</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded">
                      <div className="text-2xl font-bold text-orange-600">{inventoryStats.lowStockItems}</div>
                      <div className="text-sm text-gray-600">Low Stock Items</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded">
                      <div className="text-2xl font-bold text-red-600">{inventoryStats.outOfStockItems}</div>
                      <div className="text-sm text-gray-600">Out of Stock</div>
                    </div>
                  </div>
                </div>
              )}

              {reportConfig.module === 'billing' && billingStats && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Billing Statistics</h3>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-50 p-4 rounded">
                      <div className="text-2xl font-bold">₱{billingStats.totalBilled.toLocaleString()}</div>
                      <div className="text-sm text-gray-600">Total Billed</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded">
                      <div className="text-2xl font-bold text-green-600">₱{billingStats.totalPaid.toLocaleString()}</div>
                      <div className="text-sm text-gray-600">Total Paid</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded">
                      <div className="text-2xl font-bold text-orange-600">₱{billingStats.outstanding.toLocaleString()}</div>
                      <div className="text-sm text-gray-600">Outstanding</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded">
                      <div className="text-2xl font-bold">{billingStats.billCount}</div>
                      <div className="text-sm text-gray-600">Total Bills</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onPrint} className="flex items-center gap-2">
            <Printer className="h-4 w-4" />
            Print Report
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

