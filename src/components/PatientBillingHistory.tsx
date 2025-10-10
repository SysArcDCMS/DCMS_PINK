import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Receipt, Calendar, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface BillingHistoryItem {
  id: string;
  billNumber: string;
  date: string;
  totalAmount: number;
  paidAmount: number;
  outstandingBalance: number;
  status: 'pending' | 'partial' | 'paid';
  paymentMethod: string;
  services: Array<{
    name: string;
    cost: number;
  }>;
}

interface PatientBillingHistoryProps {
  patientId: string;
  userEmail: string;
  userRole: string;
}

export default function PatientBillingHistory({ patientId, userEmail, userRole }: PatientBillingHistoryProps) {
  const [billingHistory, setBillingHistory] = useState<BillingHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBillingHistory();
  }, [patientId, userEmail, userRole]);

  const fetchBillingHistory = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({
        userEmail,
        userRole,
      });

      const response = await fetch(`/api/patients/${encodeURIComponent(patientId)}/billing-history?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch billing history');
      }

      const data = await response.json();
      
      if (data.success) {
        setBillingHistory(data.billingHistory || []);
      } else {
        throw new Error(data.error || 'Failed to fetch billing history');
      }
    } catch (error) {
      console.error('Error fetching billing history:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch billing history');
    } finally {
      setIsLoading(false);
    }
  };

  const formatBillDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (error) {
      return dateString;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getStatusBadge = (status: string, outstandingBalance: number) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Paid</Badge>;
      case 'partial':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Partial Payment</Badge>;
      case 'pending':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Pending Payment</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (userRole !== 'patient') {
    return null; // Only show for patients
  }

  return (
    <Card className='rounded-lg border-1 border-CustomPink1 bg-CustomPink3'>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-bold text-CustomPink1">
          <Receipt className="h-5 w-5" />
          Billing History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4">
            <p className="text-gray-500">Loading billing history...</p>
          </div>
        ) : error ? (
          <div className="text-center py-4">
            <p className="text-red-600">{error}</p>
          </div>
        ) : billingHistory.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-gray-500">No billing records found.</p>
          </div>
        ) : (
          <div className="space-y-3 rounded-lg border-1 border-CustomPink1">
            {billingHistory.map((bill, index) => (
              <div
                key={`${bill.id || bill.billNumber}-${index}`}
                className="p-3 bg-gray-50 rounded-lg border"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Receipt className="h-4 w-4 font-bold text-CustomPink1" />
                    <div>
                      <p className="font-medium text-sm"><span className='font-bold text-CustomPink1'>Bill# </span>{bill.id || bill.billNumber}</p>
                      <p className="text-xs font-bold">
                        {formatBillDate(bill.date)}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(bill.status, bill.outstandingBalance)}
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <p className="text-xs font-bold mb-1">Total Amount</p>
                    <p className="font-medium">{formatCurrency(bill.totalAmount)}</p>
                  </div>
                  
                  {bill.outstandingBalance > 0 ? (
                    <div>
                      <p className="text-xs font-bold text-red-600 mb-1">Outstanding</p>
                      <p className="font-medium text-red-600">{formatCurrency(bill.outstandingBalance)}</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs font-bold text-green-600 mb-1">Paid Amount</p>
                      <p className="font-medium text-green-600">{formatCurrency(bill.paidAmount)}</p>
                    </div>
                  )}
                  
                  <div>
                    <p className="text-xs font-bold mb-1">Status</p>
                    <p className="font-medium capitalize">{bill.status}</p>
                  </div>

                  {bill.paymentMethod && (
                    <div>
                      <p className="text-xs font-bold mb-1">Payment</p>
                      <p className="font-medium text-sm">{bill.paymentMethod}</p>
                    </div>
                  )}
                </div>

                {/* Collapsible Services List */}
                {bill.services && bill.services.length > 0 && (
                  <details className="mt-2">
                    <summary className="text-xs text-CustomPink1 cursor-pointer hover:text-blue-700">
                      View Services ({bill.services.length})
                    </summary>
                    <div className="mt-2 p-2 bg-white rounded border text-sm">
                      {bill.services.map((service, idx) => (
                        <div key={idx} className="flex justify-between py-1">
                          <span className="text-gray-600">{service.name}</span>
                          <span className="font-medium">{formatCurrency(service.cost)}</span>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}