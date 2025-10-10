'use client';

import React from 'react';
import { Card, CardContent } from './ui/card';
import { 
  Calendar, 
  CheckCircle, 
  XCircle, 
  TrendingUp,
  RefreshCw
} from 'lucide-react';

interface DashboardStatsProps {
  stats: {
    totalAppointments: number;
    bookedAppointments: number;
    cancelledAppointments: number;
    completedAppointments: number;
    todayAppointments: number;
    tomorrowAppointments: number;
  };
  userRole?: string;
  isValidating?: boolean;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ 
  stats, 
  userRole, 
  isValidating = false 
}) => {
  const statsConfig = [
    {
      title: userRole === 'patient' ? 'Today\'s Appointments' : 'Today\'s Total',
      value: stats.totalAppointments,
      icon: Calendar,
      color: 'text-CustomPink1'
    },
    {
      title: 'Booked',
      value: stats.bookedAppointments,
      icon: CheckCircle,
      color: 'text-CustomPink1'
    },
    {
      title: 'Cancelled',
      value: stats.cancelledAppointments,
      icon: XCircle,
      color: 'text-red-600'
    },
    {
      title: 'Completed',
      value: stats.completedAppointments,
      icon: TrendingUp,
      color: 'text-green-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 ">
      {statsConfig.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="relative bg-CustomPink2 rounded-lg border-1 border-CustomPink1">
            <CardContent className="flex items-center p-6">
              <Icon className={`h-8 w-8 ${stat.color}`} />
              <div className="ml-4">
                <p className="text-sm font-medium text-CustomPink1">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-CustomPink1">{stat.value}</p>
              </div>
            </CardContent>
            
            {/* Refresh indicator */}
            {isValidating && (
              <div className="absolute top-2 right-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
};