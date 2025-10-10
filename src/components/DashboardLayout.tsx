'use client';

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigation } from './Navigation';
import { LoadingSpinner } from './LoadingSpinner';

import { Route } from '../hooks/useRouter';

interface DashboardLayoutProps {
  navigate?: (route: Route) => void;
  children?: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ navigate, children }) => {
  const { user, isLoading } = useAuth();
  const [activeSection, setActiveSection] = useState('dashboard');

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    navigate?.('home');
    return <LoadingSpinner />;
  }

  const handleChangePassword = () => {
    navigate?.('change-password');
  };

  return (
    <div className="flex h-screen bg-gray-50 relative">
      <Navigation 
        activeSection={activeSection} 
        setActiveSection={setActiveSection}
      />
      {/* Main content area with mobile padding */}
      <div className="flex-1 overflow-auto pt-16 lg:pt-0">
        <div className="h-full">
          {children}
        </div>
      </div>
    </div>
  );
};