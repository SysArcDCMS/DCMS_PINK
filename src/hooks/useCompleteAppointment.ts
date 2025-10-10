import { useState } from 'react';
import { ServiceInstance } from '../types';

interface CompleteAppointmentParams {
  appointmentId: string;
  completedServices: ServiceInstance[];
  completionNotes?: string;
  completedBy?: string;
}

interface InventoryDeduction {
  serviceName: string;
  itemName: string;
  quantityDeducted: number;
  unit: string;
  remainingQuantity?: number;
  warning?: string;
}

interface CompleteAppointmentResult {
  completeAppointment: (params: CompleteAppointmentParams) => Promise<{ success: boolean; inventoryDeductions?: InventoryDeduction[] }>;
  isLoading: boolean;
  error: string | null;
}

export const useCompleteAppointment = (): CompleteAppointmentResult => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const completeAppointment = async (params: CompleteAppointmentParams): Promise<{ success: boolean; inventoryDeductions?: InventoryDeduction[] }> => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('Attempting to complete appointment:', params.appointmentId);
      
      const response = await fetch(`/api/appointments/${params.appointmentId}/complete`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          completedServices: params.completedServices,
          completionNotes: params.completionNotes,
          completedBy: params.completedBy
        }),
      });

      console.log('Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('API Error:', errorData);
        throw new Error(errorData.error || `Failed to complete appointment (${response.status})`);
      }

      const data = await response.json();
      console.log('Completion successful:', data);
      
      return {
        success: true,
        inventoryDeductions: data.inventoryDeductions || []
      };
    } catch (err) {
      console.error('Complete appointment error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    completeAppointment,
    isLoading,
    error
  };
};