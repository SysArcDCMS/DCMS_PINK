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
import { ArrowLeft, Receipt, BarChart3, TrendingUp, Users, FileText, Printer, Download, Eye, DollarSign, createLucideIcon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, subWeeks, subMonths, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { Bill } from '../../../../types';

interface BillingStatusData {
  status: string;
  count: number;
  amount: number;
  percentage: number;
}

interface RevenueData {
  date: string;
  revenue: number;
  discounts: number;
  net: number;
}

interface OutstandingBalanceData {
  patientId: string;
  patientName: string;
  patientEmail: string;
  totalOutstanding: number;
  billsCount: number;
  oldestBillDate: string;
}

interface ReportFilters {
  startDate: string;
  endDate: string;
  status?: string;
  patient?: string;
  location?: string;
}

const PesoSign = createLucideIcon("PesoSign", [
  ["path", { d: "M6 4v16", key: "stem" }],
  // P bowl
  ["path", { d: "M6 4h6a5 5 0 0 1 0 10H6", key: "bowl" }],
  // Upper horizontal stroke (slightly higher)
  ["path", { d: "M4 7h14", key: "bar1" }],
  // Lower horizontal stroke (slightly higher)
  ["path", { d: "M4 11h14", key: "bar2" }],
]);

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const STATUS_LABELS = {
  'pending': 'Pending',
  'partial': 'Partial',
  'paid': 'Paid',
  'discounted': 'Discounted'
};

export default function BillingReportPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('status');
  const [loading, setLoading] = useState(false);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [bills, setBills] = useState<Bill[]>([]);
  
  // Billing Status Report Data
  const [statusData, setStatusData] = useState<BillingStatusData[]>([]);
  
  // Revenue Report Data
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  
  // Outstanding Balance Data
  const [outstandingData, setOutstandingData] = useState<OutstandingBalanceData[]>([]);
  
  // Filters
  const [statusFilters, setStatusFilters] = useState<ReportFilters>({
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });
  
  const [revenueFilters, setRevenueFilters] = useState<ReportFilters>({
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });
  
  const [outstandingFilters, setOutstandingFilters] = useState<ReportFilters>({
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
    if (bills.length > 0) {
      generateStatusReport();
      generateRevenueReport();
      generateOutstandingReport();
    }
  }, [bills, statusFilters, revenueFilters, outstandingFilters]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/billing');
      
      if (response.ok) {
        const data = await response.json();
        setBills(data.bills || []);
      } else {
        throw new Error('Failed to fetch billing data');
      }
      
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  const generateStatusReport = () => {
    const filtered = filterBillsByDate(bills, statusFilters.startDate, statusFilters.endDate);
    
    // Filter by status if specified
    const statusFiltered = statusFilters.status && statusFilters.status !== 'all' 
      ? filtered.filter(bill => bill.status === statusFilters.status)
      : filtered;

    const statusCounts: { [key: string]: { count: number, amount: number } } = {};
    let totalAmount = 0;

    statusFiltered.forEach(bill => {
      const status = bill.status;
      if (!statusCounts[status]) {
        statusCounts[status] = { count: 0, amount: 0 };
      }
      statusCounts[status].count += 1;
      statusCounts[status].amount += bill.totalAmount;
      totalAmount += bill.totalAmount;
    });

    const statusReport: BillingStatusData[] = Object.entries(statusCounts).map(([status, data]) => ({
      status: STATUS_LABELS[status as keyof typeof STATUS_LABELS] || status,
      count: data.count,
      amount: data.amount,
      percentage: totalAmount > 0 ? (data.amount / totalAmount) * 100 : 0
    }));

    setStatusData(statusReport);
  };

  const generateRevenueReport = () => {
    const filtered = filterBillsByDate(bills, revenueFilters.startDate, revenueFilters.endDate);
    
    // Group bills by date
    const dailyRevenue: { [key: string]: { revenue: number, discounts: number } } = {};
    
    filtered.forEach(bill => {
      const date = format(parseISO(bill.createdAt), 'yyyy-MM-dd');
      if (!dailyRevenue[date]) {
        dailyRevenue[date] = { revenue: 0, discounts: 0 };
      }
      
      dailyRevenue[date].revenue += bill.paidAmount;
      // For now, treating the difference between total and paid as discount
      // This could be enhanced with actual discount tracking
      if (bill.status === 'paid' && bill.totalAmount > bill.paidAmount) {
        dailyRevenue[date].discounts += (bill.totalAmount - bill.paidAmount);
      }
    });

    const revenueReport: RevenueData[] = Object.entries(dailyRevenue)
      .map(([date, data]) => ({
        date: format(parseISO(date), 'MMM dd'),
        revenue: data.revenue,
        discounts: data.discounts,
        net: data.revenue - data.discounts
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    setRevenueData(revenueReport);
  };

  const generateOutstandingReport = () => {
    const filtered = filterBillsByDate(bills, outstandingFilters.startDate, outstandingFilters.endDate);
    
    // Filter for bills with outstanding balances
    const outstandingBills = filtered.filter(bill => bill.outstandingBalance > 0);
    
    // Filter by patient if specified
    const patientFiltered = outstandingFilters.patient && outstandingFilters.patient !== 'all'
      ? outstandingBills.filter(bill => bill.patientName.toLowerCase().includes(outstandingFilters.patient!.toLowerCase()))
      : outstandingBills;

    // Group by patient
    const patientOutstanding: { [key: string]: { 
      patientName: string, 
      patientEmail: string, 
      totalOutstanding: number, 
      billsCount: number, 
      oldestBillDate: string 
    } } = {};

    patientFiltered.forEach(bill => {
      const patientId = bill.patientId;
      if (!patientOutstanding[patientId]) {
        patientOutstanding[patientId] = {
          patientName: bill.patientName,
          patientEmail: bill.patientEmail || '',
          totalOutstanding: 0,
          billsCount: 0,
          oldestBillDate: bill.createdAt
        };
      }
      
      patientOutstanding[patientId].totalOutstanding += bill.outstandingBalance;
      patientOutstanding[patientId].billsCount += 1;
      
      // Update oldest bill date
      if (parseISO(bill.createdAt) < parseISO(patientOutstanding[patientId].oldestBillDate)) {
        patientOutstanding[patientId].oldestBillDate = bill.createdAt;
      }
    });

    const outstandingReport: OutstandingBalanceData[] = Object.entries(patientOutstanding)
      .map(([patientId, data]) => ({
        patientId,
        ...data
      }))
      .sort((a, b) => b.totalOutstanding - a.totalOutstanding);

    setOutstandingData(outstandingReport);
  };

  const filterBillsByDate = (bills: Bill[], startDate: string, endDate: string) => {
    return bills.filter(bill => {
      if (!bill.createdAt) return false;
      try {
        const billDate = parseISO(bill.createdAt);
        const start = parseISO(startDate);
        const end = parseISO(endDate + 'T23:59:59');
        return billDate >= start && billDate <= end;
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const handlePrint = () => {
    if (printComponentRef.current) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Billing Report - ${format(new Date(), 'yyyy-MM-dd')}</title>
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
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th, td { padding: 10px; text-align: left; border-bottom: 1px solid #eee; }
                th { border-bottom: 2px solid #ccc; font-weight: bold; }
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
            <h1 className="text-3xl font-bold text-CustomPink1">Billing Reports</h1>
            <p className="text-gray-600">Financial analytics and insights</p>
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
          <TabsTrigger value="status" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Billing Status
          </TabsTrigger>
          <TabsTrigger value="revenue" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Revenue Report
          </TabsTrigger>
          <TabsTrigger value="outstanding" className="flex items-center gap-2">
            <PesoSign className="h-4 w-4" />
            Outstanding Balance
          </TabsTrigger>
        </TabsList>

        {/* Billing Status Report */}
        <TabsContent value="status" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Billing Status Report</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={statusFilters.startDate}
                    onChange={(e) => setStatusFilters(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={statusFilters.endDate}
                    onChange={(e) => setStatusFilters(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Status (Optional)</Label>
                  <Select value={statusFilters.status || 'all'} onValueChange={(value) => setStatusFilters(prev => ({ ...prev, status: value === 'all' ? undefined : value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="partial">Partial</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
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
                    onClick={() => handleDateRangePreset(preset, setStatusFilters)}
                  >
                    {preset.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Button>
                ))}
              </div>

              {/* Status Charts */}
              {statusData.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Bills by Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={statusData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="status" />
                          <YAxis />
                          <Tooltip formatter={(value, name) => name === 'amount' ? formatCurrency(Number(value)) : value} />
                          <Bar dataKey="count" fill="#3b82f6" name="Count" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Revenue by Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={statusData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ status, percentage }) => `${status} (${percentage.toFixed(1)}%)`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="amount"
                          >
                            {statusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No billing data available for the selected criteria</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Revenue Report */}
        <TabsContent value="revenue" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Report</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={revenueFilters.startDate}
                    onChange={(e) => setRevenueFilters(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={revenueFilters.endDate}
                    onChange={(e) => setRevenueFilters(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Branch/Location (Optional)</Label>
                  <Select value={revenueFilters.location || 'all'} onValueChange={(value) => setRevenueFilters(prev => ({ ...prev, location: value === 'all' ? undefined : value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="All locations" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Locations</SelectItem>
                      <SelectItem value="main">Main Clinic</SelectItem>
                      <SelectItem value="branch1">Branch 1</SelectItem>
                      <SelectItem value="branch2">Branch 2</SelectItem>
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
                    onClick={() => handleDateRangePreset(preset, setRevenueFilters)}
                  >
                    {preset.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Button>
                ))}
              </div>

              {/* Revenue Chart */}
              {revenueData.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Daily Revenue Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <AreaChart data={revenueData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis tickFormatter={(value) => `₱${value.toLocaleString()}`} />
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                        <Area type="monotone" dataKey="revenue" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.8} name="Revenue" />
                        <Area type="monotone" dataKey="discounts" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.8} name="Discounts" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              ) : (
                <div className="text-center py-12">
                  <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No revenue data available for the selected criteria</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Outstanding Balance Report */}
        <TabsContent value="outstanding" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Outstanding Balance Report</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={outstandingFilters.startDate}
                    onChange={(e) => setOutstandingFilters(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={outstandingFilters.endDate}
                    onChange={(e) => setOutstandingFilters(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Patient (Optional)</Label>
                  <Input
                    placeholder="Search patient name..."
                    value={outstandingFilters.patient || ''}
                    onChange={(e) => setOutstandingFilters(prev => ({ ...prev, patient: e.target.value }))}
                  />
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
                    onClick={() => handleDateRangePreset(preset, setOutstandingFilters)}
                  >
                    {preset.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Button>
                ))}
              </div>

              {/* Outstanding Balance Table */}
              {outstandingData.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Patients with Outstanding Balances</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b-2 border-gray-200">
                            <th className="text-left p-3">Patient Name</th>
                            <th className="text-left p-3">Email</th>
                            <th className="text-center p-3">Outstanding Balance</th>
                            <th className="text-center p-3">Bills Count</th>
                            <th className="text-center p-3">Oldest Bill</th>
                          </tr>
                        </thead>
                        <tbody>
                          {outstandingData.map((patient, index) => (
                            <tr key={patient.patientId} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="p-3 font-medium">{patient.patientName}</td>
                              <td className="p-3 text-gray-600">{patient.patientEmail}</td>
                              <td className="p-3 text-center font-bold text-red-600">
                                {formatCurrency(patient.totalOutstanding)}
                              </td>
                              <td className="p-3 text-center">
                                <Badge variant="outline">{patient.billsCount}</Badge>
                              </td>
                              <td className="p-3 text-center text-sm text-gray-500">
                                {format(parseISO(patient.oldestBillDate), 'MMM dd, yyyy')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="text-center py-12">
                  <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No outstanding balances found for the selected criteria</p>
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
              Print Preview - Billing Report
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
                <h2>Billing Reports</h2>
                <p>Generated on {format(new Date(), 'MMMM dd, yyyy')}</p>
              </div>

              {/* Billing Status Report */}
              {activeTab === 'status' && (
                <div className="report-section">
                  <h3>Billing Status Report</h3>
                  <p>Period: {format(parseISO(statusFilters.startDate), 'MMM dd, yyyy')} - {format(parseISO(statusFilters.endDate), 'MMM dd, yyyy')}</p>
                  
                  {statusData.length > 0 ? (
                    <table>
                      <thead>
                        <tr>
                          <th>Status</th>
                          <th>Count</th>
                          <th>Amount</th>
                          <th>Percentage</th>
                        </tr>
                      </thead>
                      <tbody>
                        {statusData.map((item, index) => (
                          <tr key={index}>
                            <td>{item.status}</td>
                            <td>{item.count}</td>
                            <td>{formatCurrency(item.amount)}</td>
                            <td>{item.percentage.toFixed(1)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p>No billing status data available for the selected period.</p>
                  )}
                </div>
              )}

              {/* Revenue Report */}
              {activeTab === 'revenue' && (
                <div className="report-section">
                  <h3>Revenue Report</h3>
                  <p>Period: {format(parseISO(revenueFilters.startDate), 'MMM dd, yyyy')} - {format(parseISO(revenueFilters.endDate), 'MMM dd, yyyy')}</p>
                  
                  {revenueData.length > 0 ? (
                    <table>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Revenue</th>
                          <th>Discounts</th>
                          <th>Net Income</th>
                        </tr>
                      </thead>
                      <tbody>
                        {revenueData.map((item, index) => (
                          <tr key={index}>
                            <td>{item.date}</td>
                            <td>{formatCurrency(item.revenue)}</td>
                            <td>{formatCurrency(item.discounts)}</td>
                            <td>{formatCurrency(item.net)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p>No revenue data available for the selected period.</p>
                  )}
                </div>
              )}

              {/* Outstanding Balance Report */}
              {activeTab === 'outstanding' && (
                <div className="report-section">
                  <h3>Outstanding Balance Report</h3>
                  <p>Period: {format(parseISO(outstandingFilters.startDate), 'MMM dd, yyyy')} - {format(parseISO(outstandingFilters.endDate), 'MMM dd, yyyy')}</p>
                  
                  {outstandingData.length > 0 ? (
                    <table>
                      <thead>
                        <tr>
                          <th>Patient Name</th>
                          <th>Email</th>
                          <th>Outstanding Balance</th>
                          <th>Bills Count</th>
                          <th>Oldest Bill</th>
                        </tr>
                      </thead>
                      <tbody>
                        {outstandingData.map((item, index) => (
                          <tr key={index}>
                            <td>{item.patientName}</td>
                            <td>{item.patientEmail}</td>
                            <td>{formatCurrency(item.totalOutstanding)}</td>
                            <td>{item.billsCount}</td>
                            <td>{format(parseISO(item.oldestBillDate), 'MMM dd, yyyy')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p>No outstanding balance data available for the selected period.</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Print Actions */}
          <div className="flex gap-3 pt-4">
            <Button onClick={handlePrint} className="flex items-center gap-2">
              <Printer className="h-4 w-4" />
              Print Report
            </Button>
            <Button variant="outline" onClick={() => setShowPrintDialog(false)}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}