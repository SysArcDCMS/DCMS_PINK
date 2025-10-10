'use client';

import React, { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Card } from '../../../components/ui/card';
import { toast } from 'sonner';

export default function ToothChartTestPage() {
  const [patientEmail, setPatientEmail] = useState('');
  const [toothChart, setToothChart] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchToothChart = async () => {
    if (!patientEmail) {
      toast.error('Please enter patient email');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/patients/${encodeURIComponent(patientEmail)}/tooth-chart`);
      const data = await response.json();
      
      if (response.ok) {
        setToothChart(data.toothChart);
        toast.success('Tooth chart fetched successfully');
      } else {
        toast.error(data.error || 'Failed to fetch tooth chart');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to fetch tooth chart');
    } finally {
      setIsLoading(false);
    }
  };

  const createTestToothChart = async () => {
    if (!patientEmail) {
      toast.error('Please enter patient email');
      return;
    }

    setIsLoading(true);
    try {
      const testToothChart = {
        id: crypto.randomUUID(),
        patientId: patientEmail,
        missingTeeth: [],
        disabledTeeth: [],
        treatedTeeth: ['11', '21'],
        treatments: [
          {
            id: crypto.randomUUID(),
            service_name: 'Test Cleaning',
            date: new Date().toISOString().split('T')[0],
            detail: 'Test treatment detail',
            teeth_fdi: ['11', '21'],
            appointment_id: 'test-appointment',
            completed_by: 'test@example.com'
          }
        ],
        lastUpdated: new Date().toISOString()
      };

      const response = await fetch(`/api/patients/${encodeURIComponent(patientEmail)}/tooth-chart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ toothChart: testToothChart }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setToothChart(data.toothChart);
        toast.success('Test tooth chart created successfully');
      } else {
        toast.error(data.error || 'Failed to create tooth chart');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to create tooth chart');
    } finally {
      setIsLoading(false);
    }
  };

  const testAppointmentCompletion = async () => {
    if (!patientEmail) {
      toast.error('Please enter patient email');
      return;
    }

    setIsLoading(true);
    try {
      // Create a test appointment first
      const testAppointment = {
        id: crypto.randomUUID(),
        patientEmail: patientEmail,
        patientId: patientEmail,
        patientName: 'Test Patient',
        patientPhone: '123-456-7890',
        date: new Date().toISOString().split('T')[0],
        time: '10:00',
        service: 'Test Service',
        status: 'booked',
        serviceDetails: [
          {
            id: 'test-service-1',
            name: 'Test Root Canal',
            description: 'Test root canal treatment',
            base_price: 500,
            duration: 60,
            buffer: 15,
            pricing_model: 'Per Tooth',
            tooth_chart_use: 'required',
            finalPrice: 500,
            totalAmount: 1000,
            selectedTeeth: [12, 13], // Numbers that will be converted to strings
            notes: 'Test treatment notes'
          }
        ]
      };

      // Call the appointment completion endpoint
      const response = await fetch(`/api/appointments/${testAppointment.id}/complete`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...testAppointment,
          status: 'completed',
          completedBy: 'test@example.com',
          completedAt: new Date().toISOString()
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success('Test appointment completion successful');
        // Refresh the tooth chart display
        setTimeout(() => fetchToothChart(), 1000);
      } else {
        toast.error(data.error || 'Failed to complete test appointment');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to test appointment completion');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-2xl font-semibold mb-6">Tooth Chart Test Page</h1>
      
      <Card className="p-6 mb-6">
        <h2 className="text-lg font-medium mb-4">Patient Email</h2>
        <div className="flex gap-4 mb-4">
          <Input
            type="email"
            placeholder="Enter patient email"
            value={patientEmail}
            onChange={(e) => setPatientEmail(e.target.value)}
            className="flex-1"
          />
        </div>
        
        <div className="flex gap-4">
          <Button onClick={fetchToothChart} disabled={isLoading}>
            Fetch Tooth Chart
          </Button>
          <Button onClick={createTestToothChart} disabled={isLoading} variant="outline">
            Create Test Chart
          </Button>
          <Button onClick={testAppointmentCompletion} disabled={isLoading} variant="secondary">
            Test Appointment Completion
          </Button>
        </div>
      </Card>

      {toothChart && (
        <Card className="p-6">
          <h2 className="text-lg font-medium mb-4">Tooth Chart Data</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
            {JSON.stringify(toothChart, null, 2)}
          </pre>
        </Card>
      )}

      {isLoading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Processing...</p>
        </div>
      )}
    </div>
  );
}