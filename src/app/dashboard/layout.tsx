'use client';

import { useAuth } from '../../contexts/AuthContext';
import { Navigation } from '../../components/Navigation';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Redirect non-authenticated users to homepage
    if (!user && !isLoading) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Show loading if user is not authenticated
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Get active section from pathname
  const getActiveSection = () => {
    // Handle appointment reports separately to keep appointments active
    if (pathname.includes('/appointments/reports')) {
      return 'appointments';
    }
    
    // Handle billing reports separately to keep billing active
    if (pathname.includes('/billing/reports')) {
      return 'billing';
    }
    
    // Handle other sub-routes
    if (pathname.includes('/appointments')) {
      return 'appointments';
    }
    if (pathname.includes('/patients')) {
      return 'patients';
    }
    if (pathname.includes('/billing')) {
      return 'billing';
    }
    if (pathname.includes('/services')) {
      return 'services';
    }
    if (pathname.includes('/inventory')) {
      return 'inventory';
    }
    if (pathname.includes('/admin/users')) {
      return 'admin/users';
    }
    if (pathname.includes('/walk-in-patient')) {
      return 'walk-in-patient';
    }
    if (pathname.includes('/profile')) {
      return 'profile';
    }
    if (pathname.includes('/reports')) {
      return 'reports';
    }
    if (pathname.includes('/medical-records')) {
      return 'medical-records';
    }
    if (pathname.includes('/service-history')) {
      return 'service-history';
    }
    if (pathname.includes('/billing-history')) {
      return 'billing-history';
    }
    
    const path = pathname.split('/').pop() || 'dashboard';
    return path;
  };

  // Handle section navigation
  const setActiveSection = (section: string) => {
    if (section === 'dashboard') {
      router.push('/dashboard');
    } else {
      router.push(`/dashboard/${section}`);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Navigation 
        activeSection={getActiveSection()} 
        setActiveSection={setActiveSection} 
      />
      {/* Main content area with mobile padding */}
      <div className="flex-1 overflow-auto pt-16 lg:pt-0 min-w-0">
        <div className="h-full">
          {children}
        </div>
      </div>
    </div>
  );
}