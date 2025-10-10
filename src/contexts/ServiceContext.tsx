'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { ServiceCatalogItem, ServiceLog, ServiceSuggestion } from '../types';

interface ServiceContextType {
  // Services Catalog (role-restricted)
  servicesCatalog: ServiceCatalogItem[];
  serviceLogs: ServiceLog[];
  serviceSuggestions: ServiceSuggestion[];
  canViewServices: boolean;
  canManageServices: boolean;
  canEditServices: boolean;
  canArchiveServices: boolean;
  canViewLogs: boolean;
  canApproveSuggestions: boolean;
  
  isLoading: boolean;
  error: string | null;
  
  // Services Catalog management (role-restricted)
  fetchServicesCatalog: (includeInactive?: boolean, forBooking?: boolean) => Promise<void>;
  fetchServiceLogs: () => Promise<void>;
  fetchServiceSuggestions: () => Promise<void>;
  createCatalogService: (service: Omit<ServiceCatalogItem, 'id'>) => Promise<{ success: boolean; error?: string }>;
  updateCatalogService: (id: string, updates: Partial<ServiceCatalogItem>) => Promise<{ success: boolean; error?: string }>;
  archiveCatalogService: (id: string) => Promise<{ success: boolean; error?: string }>;
  activateCatalogService: (id: string) => Promise<{ success: boolean; error?: string }>;
  suggestServiceUpdate: (id: string, suggestion: string) => Promise<{ success: boolean; error?: string }>;
  approveServiceSuggestion: (suggestionId: string, reviewNotes?: string) => Promise<{ success: boolean; error?: string }>;
  rejectServiceSuggestion: (suggestionId: string, reviewNotes?: string) => Promise<{ success: boolean; error?: string }>;
  
  clearError: () => void;
  refreshAll: () => Promise<void>;
}

const ServiceContext = createContext<ServiceContextType | undefined>(undefined);

export function ServiceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [servicesCatalog, setServicesCatalog] = useState<ServiceCatalogItem[]>([]);
  const [serviceLogs, setServiceLogs] = useState<ServiceLog[]>([]);
  const [serviceSuggestions, setServiceSuggestions] = useState<ServiceSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Role-based access control for services catalog
  const canViewServices = user?.role === 'staff' || user?.role === 'dentist' || user?.role === 'admin';
  const canManageServices = user?.role === 'admin'; // Only Admin can add/edit
  const canEditServices = user?.role === 'admin'; // Only Admin can edit
  const canArchiveServices = user?.role === 'admin'; // Only Admin can archive/activate
  const canViewLogs = user?.role === 'admin' || user?.role === 'staff' || user?.role === 'dentist';
  const canApproveSuggestions = user?.role === 'admin'; // Only Admin can approve/reject suggestions

  // Initialize services catalog for authorized users
  useEffect(() => {
    if (canViewServices && servicesCatalog.length === 0) {
      fetchServicesCatalog();
    }
  }, [canViewServices, servicesCatalog.length]);

  const fetchServicesCatalog = async (includeInactive?: boolean, forBooking?: boolean): Promise<void> => {
    // Bypass role check if forBooking is true (for public booking forms)
    if (!forBooking && !canViewServices) {
      setError('Access denied. Only staff, dentists, and administrators can access the services catalog.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/services' + (includeInactive ? '?includeInactive=true' : ''));

      if (response.ok) {
        const data = await response.json();
        setServicesCatalog(data.services || []);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch services catalog');
      }
    } catch (error) {
      console.error('Error fetching services catalog:', error);
      setError('Failed to fetch services catalog');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchServiceLogs = async (): Promise<void> => {
    if (!canViewLogs) {
      setError('Access denied. Only staff, dentists, and administrators can view service logs.');
      return;
    }

    try {
      const response = await fetch('/api/services?logs=true');

      if (response.ok) {
        const data = await response.json();
        setServiceLogs(data.logs || []);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch service logs');
      }
    } catch (error) {
      console.error('Error fetching service logs:', error);
      setError('Failed to fetch service logs');
    }
  };

  const createCatalogService = async (service: Omit<ServiceCatalogItem, 'id'>): Promise<{ success: boolean; error?: string }> => {
    if (!canManageServices) {
      return { success: false, error: 'Access denied. Only administrators can create services.' };
    }

    try {
      const response = await fetch('/api/services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          ...service, 
          is_active: true,
          createdBy: user?.email || 'system',
          // Backward compatibility: derive has_treatment_detail from tooth_chart_use
          has_treatment_detail: service.tooth_chart_use === 'required'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setServicesCatalog(prev => [...prev, data.service]);
        return { success: true };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.error || 'Failed to create service' };
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to create catalog service';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  const updateCatalogService = async (id: string, updates: Partial<ServiceCatalogItem>): Promise<{ success: boolean; error?: string }> => {
    if (!canEditServices) {
      return { success: false, error: 'Access denied. Only administrators can edit services.' };
    }

    try {
      const response = await fetch(`/api/services/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...updates,
          updatedBy: user?.email || 'system'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setServicesCatalog(prev => 
          prev.map(service => 
            service.id === id ? data.service : service
          )
        );
        return { success: true };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.error || 'Failed to update service' };
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to update catalog service';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  const archiveCatalogService = async (id: string): Promise<{ success: boolean; error?: string }> => {
    if (!canArchiveServices) {
      return { success: false, error: 'Access denied. Only administrators can archive services.' };
    }

    return updateCatalogService(id, { is_active: false });
  };

  const activateCatalogService = async (id: string): Promise<{ success: boolean; error?: string }> => {
    if (!canArchiveServices) {
      return { success: false, error: 'Access denied. Only administrators can activate services.' };
    }

    return updateCatalogService(id, { is_active: true });
  };

  const suggestServiceUpdate = async (id: string, suggestion: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/services/suggest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          serviceId: id,
          suggestion: suggestion,
          suggestedBy: user?.email || 'anonymous'
        })
      });

      if (response.ok) {
        // Refresh logs and suggestions after successful suggestion
        if (canViewLogs) {
          await fetchServiceLogs();
        }
        if (canApproveSuggestions) {
          await fetchServiceSuggestions();
        }
        return { success: true };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.error || 'Failed to submit suggestion' };
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to submit suggestion';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  const fetchServiceSuggestions = async (): Promise<void> => {
    if (!canApproveSuggestions) {
      setError('Access denied. Only administrators can view service suggestions.');
      return;
    }

    try {
      const response = await fetch('/api/services/suggestions');

      if (response.ok) {
        const data = await response.json();
        setServiceSuggestions(data.suggestions || []);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch service suggestions');
      }
    } catch (error) {
      console.error('Error fetching service suggestions:', error);
      setError('Failed to fetch service suggestions');
    }
  };

  const approveServiceSuggestion = async (suggestionId: string, reviewNotes?: string): Promise<{ success: boolean; error?: string }> => {
    if (!canApproveSuggestions) {
      return { success: false, error: 'Access denied. Only administrators can approve suggestions.' };
    }

    try {
      const response = await fetch('/api/services/suggestions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          suggestionId,
          action: 'approve',
          reviewedBy: user?.email || 'system',
          reviewNotes
        })
      });

      if (response.ok) {
        // Refresh suggestions and logs after approval
        await fetchServiceSuggestions();
        if (canViewLogs) {
          await fetchServiceLogs();
        }
        return { success: true };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.error || 'Failed to approve suggestion' };
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to approve suggestion';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  const rejectServiceSuggestion = async (suggestionId: string, reviewNotes?: string): Promise<{ success: boolean; error?: string }> => {
    if (!canApproveSuggestions) {
      return { success: false, error: 'Access denied. Only administrators can reject suggestions.' };
    }

    try {
      const response = await fetch('/api/services/suggestions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          suggestionId,
          action: 'reject',
          reviewedBy: user?.email || 'system',
          reviewNotes
        })
      });

      if (response.ok) {
        // Refresh suggestions and logs after rejection
        await fetchServiceSuggestions();
        if (canViewLogs) {
          await fetchServiceLogs();
        }
        return { success: true };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.error || 'Failed to reject suggestion' };
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to reject suggestion';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };



  const clearError = () => setError(null);

  const refreshAll = async (): Promise<void> => {
    setIsLoading(true);
    try {
      if (canViewServices) {
        await fetchServicesCatalog();
      }
      if (canViewLogs) {
        await fetchServiceLogs();
      }
      if (canApproveSuggestions) {
        await fetchServiceSuggestions();
      }
    } catch (error) {
      console.error('Error refreshing service data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    servicesCatalog,
    serviceLogs,
    serviceSuggestions,
    canViewServices,
    canManageServices,
    canEditServices,
    canArchiveServices,
    canViewLogs,
    canApproveSuggestions,
    isLoading,
    error,
    fetchServicesCatalog,
    fetchServiceLogs,
    fetchServiceSuggestions,
    createCatalogService,
    updateCatalogService,
    archiveCatalogService,
    activateCatalogService,
    suggestServiceUpdate,
    approveServiceSuggestion,
    rejectServiceSuggestion,
    clearError,
    refreshAll
  };

  return (
    <ServiceContext.Provider value={value}>
      {children}
    </ServiceContext.Provider>
  );
}

export function useServices() {
  const context = useContext(ServiceContext);
  if (context === undefined) {
    throw new Error('useServices must be used within a ServiceProvider');
  }
  return context;
}