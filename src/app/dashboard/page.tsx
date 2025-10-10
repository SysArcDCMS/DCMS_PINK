'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { 
  Calendar, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  UserPlus,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { format, isToday, isTomorrow } from 'date-fns';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { DashboardStats } from '@/components/DashboardStats';


interface DashboardStats {
  totalAppointments: number;
  bookedAppointments: number;
  cancelledAppointments: number;
  completedAppointments: number;
  todayAppointments: number;
  tomorrowAppointments: number;
}

interface RecentAppointment {
  id: string;
  patientName: string;
  reason: string;
  status: string;
  appointmentDate?: string;
  appointmentTime?: string;
  createdAt: string;
}

// Fetcher function for SWR
const fetchDashboardData = async (url: string) => {
  const response = await fetch(url, {
    headers: {
      'Cache-Control': 'no-cache'
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch dashboard data');
  }

  return response.json();
};

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  // Create SWR key for current user
  const swrKey = user ? (() => {
    const params = new URLSearchParams();
    if (user.email) params.append('userEmail', user.email);
    if (user.role) params.append('role', user.role);
    // Add current date to filter only today's data
    params.append('currentDateOnly', 'true');
    return `/api/dashboard?${params}`;
  })() : null;

  // Use SWR for automatic caching and revalidation
  const { 
    data, 
    error, 
    isLoading,
    isValidating,
    mutate
  } = useSWR(swrKey, fetchDashboardData, {
    refreshInterval: 30000, // Refresh every 30 seconds
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 5000, // Dedupe requests within 5 seconds
  });

  console.log(data);
  // Calculate stats from data
  const stats: DashboardStats = React.useMemo(() => {
    if (!data?.appointments) {
      return {
        totalAppointments: 0,
        bookedAppointments: 0,
        cancelledAppointments: 0,
        completedAppointments: 0,
        todayAppointments: 0,
        tomorrowAppointments: 0
      };
    }

    const appointments = data.appointments;
    const today = new Date();

    // Filter for today's appointments only
    const todayAppointments = appointments.filter((apt: any) => 
      apt.date && isToday(new Date(apt.date))
    );

    return {
      totalAppointments: todayAppointments.length,
      bookedAppointments: todayAppointments.filter((apt: any) => apt.status === 'booked').length,
      cancelledAppointments: todayAppointments.filter((apt: any) => apt.status === 'cancelled').length,
      completedAppointments: todayAppointments.filter((apt: any) => apt.status === 'completed').length,
      todayAppointments: todayAppointments.length,
      tomorrowAppointments: appointments.filter((apt: any) => 
        apt.appointmentDate && isTomorrow(new Date(apt.appointmentDate))
      ).length
    };
  }, [data]);

  // Get recent appointments for today only
  const recentAppointments: RecentAppointment[] = React.useMemo(() => {
    if (!data?.appointments) return [];
    
    return data.appointments
      .filter((apt: any) => apt.appointmentDate && isToday(new Date(apt.appointmentDate)))
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [data]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'booked': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Manual refresh function
  const handleRefresh = () => {
    mutate();
  };

  const getRoleDashboardContent = () => {
    switch (user?.role) {
      case 'patient':
        return {
          title: 'Patient Portal',
          description: 'Manage your appointments and profile',
          quickActions: [
            { label: 'Book Appointment', action: () => router.push('/dashboard/appointments'), icon: Calendar },
            { label: 'View Profile', action: () => router.push('/dashboard/profile'), icon: Users }
          ]
        };
      case 'staff':
        return {
          title: 'Staff Dashboard',
          description: 'Manage appointments and patient check-ins',
          quickActions: [
            { label: 'View Appointments', action: () => router.push('/dashboard/appointments'), icon: Calendar },
            { label: 'Add Walk-in Patient', action: () => router.push('/dashboard/appointments'), icon: UserPlus }
          ]
        };
      case 'dentist':
        return {
          title: 'Dentist Dashboard',
          description: 'Manage appointments and patient records',
          quickActions: [
            { label: 'View Appointments', action: () => router.push('/dashboard/appointments'), icon: Calendar },
            { label: 'Patient Records', action: () => router.push('/dashboard/patients'), icon: Users }
          ]
        };
      case 'admin':
        return {
          title: 'Admin Dashboard',
          description: 'System administration and user management',
          quickActions: [
            { label: 'Manage Users', action: () => router.push('/dashboard/admin/users'), icon: Users },
            { label: 'View All Appointments', action: () => router.push('/dashboard/appointments'), icon: Calendar }
          ]
        };
      default:
        return {
          title: 'Dashboard',
          description: 'Welcome to the dental clinic management system',
          quickActions: []
        };
    }
  };

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">Failed to load dashboard data</p>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const roleContent = getRoleDashboardContent();

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-CustomPink1">
              {getGreeting()}, {user?.name}!
            </h1>
            <p className="text-CustomPink1 mt-1">{roleContent.description}</p>
          </div>
          
          {/* Refresh indicator */}
          <div className="flex items-center gap-3">
            {isValidating && (
              <div className="flex items-center text-sm text-CustomPink1">
                <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                Updating...
              </div>
            )}
            <Button 
              onClick={handleRefresh} 
              variant="outline_pink" 
              size="sm"
              disabled={isValidating}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isValidating ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
        
        {/* Current date indicator */}
        <div className="mt-2 text-sm text-CustomPink1">
          Today's appointments • {format(new Date(), 'EEEE, MMMM dd, yyyy')}
        </div>
      </div>

      {/* Quick Actions */}
      {roleContent.quickActions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {roleContent.quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Card key={index} className=" rounded-lg border-1 border-CustomPink1 bg-CustomPink2 cursor-pointer hover:shadow-md transition-shadow" onClick={action.action}>
                <CardContent className="flex items-center p-6">
                  <Icon className="h-8 w-8 text-CustomPink1" />
                  <div className="ml-4">
                    <p className="font-medium text-CustomPink1">{action.label}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Stats Cards */}
      <DashboardStats 
        stats={stats} 
        userRole={user?.role} 
        isValidating={isValidating} 
      />

      {/* Today's Schedule Alert */}
      {(user?.role !== 'patient') && (stats.todayAppointments > 0 || stats.tomorrowAppointments > 0) && (
        <Card className="mb-8 border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-CustomPink1" />
              <div>
                <p className="text-blue-800 font-medium">Upcoming Schedule</p>
                <p className="text-blue-700 text-sm">
                  {stats.todayAppointments > 0 && `${stats.todayAppointments} appointment${stats.todayAppointments !== 1 ? 's' : ''} today`}
                  {stats.todayAppointments > 0 && stats.tomorrowAppointments > 0 && ' • '}
                  {stats.tomorrowAppointments > 0 && `${stats.tomorrowAppointments} appointment${stats.tomorrowAppointments !== 1 ? 's' : ''} tomorrow`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Appointments */}
        <Card className='text-CustomPink1 bg-CustomPink3 rounded-lg border-1 border-CustomPink1'>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Today's Appointments</span>
              {isValidating && (
                <div className="flex items-center text-sm text-CustomPink1">
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                  <span className="text-xs">Updating...</span>
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentAppointments.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-CustomPink1 mx-auto mb-4" />
                <p className="text-CustomPink1">No appointments for today</p>
                {user?.role === 'patient' && (
                  <Button 
                    className="mt-4"
                    onClick={() => router.push('/dashboard/appointments')}
                  >
                    Book an Appointment
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {recentAppointments.map(appointment => (
                  <div key={appointment.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{appointment.patientName}</p>
                      <p className="text-sm text-gray-600">{appointment.reason}</p>
                      {appointment.appointmentDate && (
                        <p className="text-xs text-gray-500">
                          {format(new Date(appointment.appointmentDate), 'MMM dd, yyyy')}
                          {appointment.appointmentTime && ` at ${appointment.appointmentTime}`}
                        </p>
                      )}
                    </div>
                    <Badge className={getStatusColor(appointment.status)}>
                      {appointment.status}
                    </Badge>
                  </div>
                ))}
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => router.push('/dashboard/appointments')}
                >
                  View All Appointments
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* System Status */}
        <Card className='bg-CustomPink3 text-CustomPink1 font-bold rounded-lg border-1 border-CustomPink1'>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-CustomPink1">Database Connection</span>
                <Badge className="bg-green-100 text-green-800">Connected</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-CustomPink1">API Status</span>
                <Badge className="bg-green-100 text-green-800">Operational</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-CustomPink1">Last Data Sync</span>
                <span className="text-sm text-gray-500">
                  {isValidating ? 'Updating...' : 'Just now'}
                </span>
              </div>

              {user?.role === 'admin' && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-CustomPink1 mb-2">Admin Features:</p>
                  <ul className="text-xs text-gray-500 space-y-1">
                    <li>• Create staff and dentist accounts</li>
                    <li>• View all system data</li>
                    <li>• Monitor appointment flow</li>
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}