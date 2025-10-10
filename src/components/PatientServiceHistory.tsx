import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Calendar, Clipboard, User, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { ToothChart } from './ToothChart';
import { usePatientToothChart } from '../hooks/usePatientToothChart';

interface ServiceHistoryItem {
  serviceName: string;
  date: string;
  dentist: string;
  treatmentDetails: string[] | null;
  notes: string | null;
  toothChartUse?: 'required' | 'optional' | 'not needed';
  teethSelected?: string[] | null;
}

interface PatientServiceHistoryProps {
  patientId: string;
  userEmail: string;
  userRole: string;
}

export default function PatientServiceHistory({ patientId, userEmail, userRole }: PatientServiceHistoryProps) {
  const [serviceHistory, setServiceHistory] = useState<ServiceHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showToothChart, setShowToothChart] = useState(false);
  
  // Get patient tooth chart data
  const { 
    toothChart, 
    treatments, 
    isLoading: toothChartLoading 
  } = usePatientToothChart(patientId);

  // Filter services for Service History section
  const serviceHistoryItems = serviceHistory.filter(service => 
    service.toothChartUse === 'not needed' || 
    (service.toothChartUse === 'optional' && (!service.teethSelected || service.teethSelected.length === 0))
  );

  useEffect(() => {
    fetchServiceHistory();
  }, [patientId, userEmail, userRole]);

  const fetchServiceHistory = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({
        userEmail,
        userRole,
      });

      const response = await fetch(`/api/patients/${encodeURIComponent(patientId)}/service-history?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch service history');
      }

      const data = await response.json();
      
      if (data.success) {
        setServiceHistory(data.serviceHistory || []);
      } else {
        throw new Error(data.error || 'Failed to fetch service history');
      }
    } catch (error) {
      console.error('Error fetching service history:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch service history');
    } finally {
      setIsLoading(false);
    }
  };

  const formatServiceDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (error) {
      return dateString;
    }
  };

  if (userRole !== 'patient') {
    return null; // Only show for patients
  }

  return (
    <div className="space-y-6">
      {/* Dental Chart Section */}
      <Card className='rounded-lg border-1 border-CustomPink1 bg-CustomPink3'>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 font-bold text-CustomPink1">
              <Eye className="h-5 w-5" />
              My Dental Chart
            </CardTitle>
            <button
              onClick={() => setShowToothChart(!showToothChart)}
              className="text-sm text-CustomPink1 hover:text-blue-700"
            >
              {showToothChart ? 'Hide Chart' : 'View Chart'}
            </button>
          </div>
        </CardHeader>
        {showToothChart && (
          <CardContent>
            {toothChartLoading ? (
              <div className="text-center py-4">
                <p className="text-gray-500">Loading tooth chart...</p>
              </div>
            ) : toothChart ? (
              <div>
                <ToothChart
                  mode="readonly"
                  treatedTeeth={toothChart.treatedTeeth || []}
                  missingTeeth={toothChart.missingTeeth || []}
                  treatments={treatments || []}
                  showTooltip={true}
                  className="w-full font-bold"
                />
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Chart Summary</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-blue-700">Treated Teeth: </span>
                      <span className="font-medium">{toothChart.treatedTeeth?.length || 0}</span>
                    </div>
                    <div>
                      <span className="text-blue-700">Missing Teeth: </span>
                      <span className="font-medium">{toothChart.missingTeeth?.length || 0}</span>
                    </div>
                    <div>
                      <span className="text-blue-700">Total Treatments: </span>
                      <span className="font-medium">{treatments?.length || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500">No dental chart data available yet.</p>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Service History Section */}
      <Card className='rounded-lg border-1 border-CustomPink1 bg-CustomPink3'>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-bold text-CustomPink1">
            <Clipboard className="h-5 w-5" />
            Service History
          </CardTitle>
          <p className="text-sm text-gray-600">
            General services and treatments not requiring specific tooth selection.
          </p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">
              <p className="text-gray-500">Loading service history...</p>
            </div>
          ) : error ? (
            <div className="text-center py-4">
              <p className="text-red-600">{error}</p>
            </div>
          ) : serviceHistoryItems.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-gray-500">No general services found.</p>
              <p className="text-xs text-gray-400 mt-1">
                Tooth-specific treatments are shown in the dental chart above.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {serviceHistoryItems.map((service, index) => (
                <div
                  key={`${service.serviceName}-${service.date}-${index}`}
                  className="p-3 bg-gray-50 rounded-lg border"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="font-medium text-sm">{service.serviceName}</p>
                        <p className="text-xs text-gray-600">
                          {formatServiceDate(service.date)}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                      Completed
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Dentist: {service.dentist}</span>
                  </div>

                  {service.treatmentDetails && service.treatmentDetails.length > 0 && (
                    <details className="mt-2">
                      <summary className="text-xs text-CustomPink1 cursor-pointer hover:text-blue-700">
                        View Treatment Details
                      </summary>
                      <div className="mt-2 p-2 bg-white rounded border">
                        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                          {service.treatmentDetails.map((detail, idx) => (
                            <li key={idx}>{detail}</li>
                          ))}
                        </ul>
                      </div>
                    </details>
                  )}

                  {service.notes && (
                    <details className="mt-2">
                      <summary className="text-xs text-CustomPink1 cursor-pointer hover:text-blue-700">
                        View Notes
                      </summary>
                      <div className="mt-2 p-2 bg-white rounded border">
                        <p className="text-sm text-gray-600">{service.notes}</p>
                      </div>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}