'use client';

import React from 'react';
import { toast } from 'sonner';
import { CheckCircle, AlertCircle, XCircle, Info } from 'lucide-react';

interface ToastNotificationProps {
  type?: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
  duration?: number;
}

export const ToastNotification = {
  success: (title: string, description?: string, duration: number = 4000) => {
    toast.success(title, {
      description,
      duration,
      icon: <CheckCircle className="h-4 w-4" />,
    });
  },

  error: (title: string, description?: string, duration: number = 5000) => {
    toast.error(title, {
      description,
      duration,
      icon: <XCircle className="h-4 w-4" />,
    });
  },

  warning: (title: string, description?: string, duration: number = 4000) => {
    toast.warning(title, {
      description,
      duration,
      icon: <AlertCircle className="h-4 w-4" />,
    });
  },

  info: (title: string, description?: string, duration: number = 3000) => {
    toast.info(title, {
      description,
      duration,
      icon: <Info className="h-4 w-4" />,
    });
  },

  // Custom toast with component
  //custom: (component: React.ReactNode, duration: number = 4000) => {
  //  toast.custom(component, { duration });
  //}
  custom: (component: React.ReactNode, duration: number = 4000) => {
  toast.custom((id) => <>{component}</>, { duration });
}

};

// Toast provider component to wrap the app
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <>
      {children}
    </>
  );
};