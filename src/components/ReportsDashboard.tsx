'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Calendar, TrendingDown, AlertTriangle, BarChart3, Users, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { format, startOfMonth, endOfMonth, subMonths, parseISO } from 'date-fns';

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

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6'];

const CANCELLATION_REASON_LABELS = {
  'no-show': 'No-show',
  'patient-cancelled': 'Patient cancelled',
  'clinic-cancelled': 'Clinic cancelled', 
  'emergency': 'Emergency',
  'other': 'Other'
};

export function ReportsDashboard() {
  const [timeRange, setTimeRange] = useState('current-month');
  const [appointmentStats, setAppointmentStats] = useState<AppointmentStats | null>(null);
  const [cancellationBreakdown, setCancellationBreakdown] = useState<CancellationBreakdown[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrend[]>([]);
  const [loading, setLoading] = useState(true);

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

  const fetchAppointmentData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-c89a26e4/appointments`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const appointments = data.appointments || [];
        
        const { start, end } = getDateRange(timeRange);
        
        // Filter appointments by date range
        const filteredAppointments = appointments.filter((apt: any) => {
          if (!apt.appointmentDate) return false;
          const aptDate = parseISO(apt.appointmentDate);
          return aptDate >= start && aptDate <= end;
        });

        // Calculate overall stats
        const stats: AppointmentStats = {
          total: filteredAppointments.length,
          completed: filteredAppointments.filter((apt: any) => apt.status === 'completed').length,
          cancelled: filteredAppointments.filter((apt: any) => apt.status === 'cancelled').length,
          booked: filteredAppointments.filter((apt: any) => apt.status === 'booked').length,
          cancellationRate: 0,
          noShowCount: 0,
          noShowRate: 0
        };

        stats.cancellationRate = stats.total > 0 ? (stats.cancelled / stats.total) * 100 : 0;
        stats.noShowCount = filteredAppointments.filter((apt: any) => 
          apt.status === 'cancelled' && apt.cancellationReason === 'no-show'
        ).length;
        stats.noShowRate = stats.total > 0 ? (stats.noShowCount / stats.total) * 100 : 0;

        setAppointmentStats(stats);

        // Calculate cancellation breakdown
        const cancelledAppointments = filteredAppointments.filter((apt: any) => apt.status === 'cancelled');
        const reasonCounts: { [key: string]: number } = {};
        
        cancelledAppointments.forEach((apt: any) => {
          const reason = apt.cancellationReason || 'other';
          reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
        });

        const breakdown: CancellationBreakdown[] = Object.entries(reasonCounts).map(([reason, count]) => ({
          reason: CANCELLATION_REASON_LABELS[reason as keyof typeof CANCELLATION_REASON_LABELS] || reason,
          count,
          percentage: cancelledAppointments.length > 0 ? (count / cancelledAppointments.length) * 100 : 0
        }));

        setCancellationBreakdown(breakdown);

        // Calculate monthly trends (for line chart)
        if (timeRange === 'last-3-months' || timeRange === 'last-6-months') {
          const monthsCount = timeRange === 'last-6-months' ? 6 : 3;
          const trends: MonthlyTrend[] = [];
          
          for (let i = monthsCount - 1; i >= 0; i--) {
            const monthDate = subMonths(new Date(), i);
            const monthStart = startOfMonth(monthDate);
            const monthEnd = endOfMonth(monthDate);
            
            const monthAppointments = appointments.filter((apt: any) => {
              if (!apt.appointmentDate) return false;
              const aptDate = parseISO(apt.appointmentDate);
              return aptDate >= monthStart && aptDate <= monthEnd;
            });

            const completed = monthAppointments.filter((apt: any) => apt.status === 'completed').length;
            const cancelled = monthAppointments.filter((apt: any) => apt.status === 'cancelled').length;
            const noShow = monthAppointments.filter((apt: any) => 
              apt.status === 'cancelled' && apt.cancellationReason === 'no-show'
            ).length;
            const total = monthAppointments.length;
            
            trends.push({
              month: format(monthDate, 'MMM yyyy'),
              completed,
              cancelled,
              noShow,
              cancellationRate: total > 0 ? (cancelled / total) * 100 : 0
            });
          }
          
          setMonthlyTrends(trends);
        }
      }
    } catch (error) {
      console.error('Error fetching appointment data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointmentData();
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
          <p className="text-gray-600">Appointment analytics and insights</p>
        </div>
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
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Appointments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{appointmentStats?.total || 0}</div>
            <div className="flex gap-2 mt-2">
              <Badge variant="outline" className="bg-green-50 text-green-700">
                Completed: {appointmentStats?.completed || 0}
              </Badge>
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                Booked: {appointmentStats?.booked || 0}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Cancellation Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cancellation Rate</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {appointmentStats?.cancellationRate.toFixed(1) || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {appointmentStats?.cancelled || 0} cancelled appointments
            </p>
          </CardContent>
        </Card>

        {/* No-show KPI */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">No-show Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {appointmentStats?.noShowRate.toFixed(1) || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {appointmentStats?.noShowCount || 0} no-show appointments
            </p>
            <div className="mt-2">
              {(appointmentStats?.noShowRate || 0) > 15 ? (
                <Badge variant="destructive" className="text-xs">
                  High no-show rate
                </Badge>
              ) : (appointmentStats?.noShowRate || 0) > 8 ? (
                <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700">
                  Moderate no-show rate
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                  Low no-show rate
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Completion Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {appointmentStats?.total ? 
                ((appointmentStats.completed / appointmentStats.total) * 100).toFixed(1) : 
                0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Successfully completed visits
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cancellation Breakdown Chart */}
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
                  <XAxis 
                    dataKey="reason" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    fontSize={12}
                  />
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

        {/* Cancellation Reasons Pie Chart */}
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

      {/* Monthly Trends Chart (only for 3+ months) */}
      {(timeRange === 'last-3-months' || timeRange === 'last-6-months') && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5" />
              Monthly Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="completed" 
                  stroke="#22c55e" 
                  strokeWidth={2}
                  name="Completed"
                />
                <Line 
                  type="monotone" 
                  dataKey="cancelled" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  name="Cancelled"
                />
                <Line 
                  type="monotone" 
                  dataKey="noShow" 
                  stroke="#f97316" 
                  strokeWidth={2}
                  name="No-show"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Summary Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Summary Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {appointmentStats?.total ? 
                  ((appointmentStats.completed / appointmentStats.total) * 100).toFixed(0) : 
                  0}%
              </div>
              <div className="text-sm text-green-700">Success Rate</div>
              <div className="text-xs text-gray-600 mt-1">
                Appointments completed successfully
              </div>
            </div>
            
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {appointmentStats?.noShowRate.toFixed(0) || 0}%
              </div>
              <div className="text-sm text-orange-700">No-show Impact</div>
              <div className="text-xs text-gray-600 mt-1">
                Patient no-show rate
              </div>
            </div>
            
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-CustomPink1">
                {appointmentStats?.total || 0}
              </div>
              <div className="text-sm text-blue-700">Total Volume</div>
              <div className="text-xs text-gray-600 mt-1">
                Appointments in period
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}