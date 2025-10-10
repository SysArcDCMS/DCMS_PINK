'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Receipt, Loader2, AlertCircle, History, CreditCard, FileText, Hash } from 'lucide-react';
import { toast } from 'sonner';
import { Appointment, PaymentHistory, Treatment } from '../types';
import { FDI_TEETH_DATA } from '../data/fdiTeethData';

interface BillItem {
  id: string;
  serviceId?: string;
  serviceName: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  hasTreatment?: boolean;
  treatments?: Treatment[];
  hasTeethSelected?: boolean;
  selectedTeeth?: string[];
}

interface Bill {
  id: string;
  appointmentId: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  patientPhone?: string;
  items: BillItem[];
  totalAmount: number;
  paidAmount: number;
  outstandingBalance: number;
  paymentMethod?: string;
  status: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  paymentHistory?: PaymentHistory[];
}

interface ViewBillDialogProps {
  appointment: Appointment | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ViewBillDialog({ 
  appointment, 
  isOpen, 
  onOpenChange 
}: ViewBillDialogProps) {
  const [bill, setBill] = useState<Bill | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && appointment?.billId) {
      fetchBill(appointment.billId);
    }
  }, [isOpen, appointment?.billId]);

  const fetchBill = async (billId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/billing/${billId}`);
      if (response.ok) {
        const data = await response.json();
        let billData = data.bill;
        
        // Use real bill data from server
        
        setBill(billData);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to load bill');
      }
    } catch (error) {
      setError('Failed to load bill - please try again');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">Paid</Badge>;
      case 'partial':
        return <Badge variant="default" className="bg-yellow-100 text-yellow-800 border-yellow-200">Partial</Badge>;
      case 'pending':
        return <Badge variant="default" className="bg-orange-100 text-orange-800 border-orange-200">Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method.toLowerCase()) {
      case 'cash':
        return '💵';
      case 'card':
        return '💳';
      case 'gcash':
        return '📱';
      default:
        return '💰';
    }
  };

  if (!appointment) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Detailed Bill View
          </DialogTitle>
          <DialogDescription>
            Complete breakdown of bill for appointment on {appointment.date} at {appointment.time}
          </DialogDescription>
        </DialogHeader>
        
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-CustomPink1" />
            <span className="ml-2">Loading bill details...</span>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center py-12 text-red-600">
            <AlertCircle className="h-8 w-8 mr-2" />
            <span>{error}</span>
          </div>
        )}

        {bill && !isLoading && !error && (
          <div className="space-y-6">
            {/* Bill Header with ID */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Hash className="h-5 w-5 text-CustomPink1" />
                      <h3 className="text-xl font-bold text-blue-900">Bill ID: {bill.id}</h3>
                    </div>
                    <p className="text-sm text-blue-700">
                      Created: {formatDate(bill.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(bill.status)}
                    <p className="text-sm text-blue-700 mt-1">
                      By: {bill.createdBy}
                    </p>
                  </div>
                </div>
                
                {/* Patient Information */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700 font-medium">Patient:</span>
                    <span className="ml-2 font-bold text-blue-900">{bill.patientName}</span>
                  </div>
                  <div>
                    <span className="text-blue-700 font-medium">Email:</span>
                    <span className="ml-2">{bill.patientEmail}</span>
                  </div>
                  {bill.patientPhone && (
                    <div>
                      <span className="text-blue-700 font-medium">Phone:</span>
                      <span className="ml-2">{bill.patientPhone}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-blue-700 font-medium">Appointment:</span>
                    <span className="ml-2">{appointment.date} at {appointment.time}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Detailed Service Breakdown */}
            <div className="border rounded-lg">
              <div className="border-b px-6 py-4">
                <h4 className="font-bold text-lg">Service Breakdown</h4>
              </div>
              <div className="p-6 space-y-4">
                {bill.items.map((item, index) => {
                  // Check if service has treatments (quantity > 1 typically indicates treatments)
                  const hasTreatments = item.quantity > 1;
                  const quantity = item.quantity;
                  
                  return (
                    <div key={index} className="border-l-4 border-blue-200 pl-4 py-3">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          {hasTreatments ? (
                            <div>
                              <p className="font-medium text-lg">
                                {quantity} {item.serviceName} (with treatment) @ {formatCurrency(item.unitPrice)}
                              </p>
                              <p className="text-sm text-gray-600 mb-2">
                                {item.description}
                              </p>
                              <div className="bg-gray-50 p-3 rounded-lg">
                                <p className="font-medium text-sm text-gray-700 mb-2">Treated Teeth:</p>
                                <ul className="space-y-1">
                                  {Array.from({ length: quantity }, (_, i) => (
                                    <li key={i} className="text-sm text-gray-600 flex items-center gap-2">
                                      <span className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-medium">
                                        {i + 1}
                                      </span>
                                      {item.hasTeethSelected && item.selectedTeeth && item.selectedTeeth[i] ? 
                                        `${item.selectedTeeth[i]} ${FDI_TEETH_DATA[item.selectedTeeth[i]] ? `(${FDI_TEETH_DATA[item.selectedTeeth[i]].name})` : ''}` : 
                                        `Treatment ${i + 1}`}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <p className="font-medium text-lg">
                                {quantity} {item.serviceName} (no treatment) @ {formatCurrency(item.unitPrice)}
                              </p>
                              {item.description && (
                                <p className="text-sm text-gray-600">{item.description}</p>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          <p className="font-bold text-lg">{formatCurrency(item.subtotal)}</p>
                          {hasTreatments && (
                            <p className="text-sm text-gray-500">
                              {formatCurrency(item.unitPrice)} × {quantity}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm mt-3 pt-3 border-t border-gray-100">
                        <div>
                          <span className="text-gray-500">Quantity:</span>
                          <span className="ml-2 font-medium">{quantity}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Unit Price:</span>
                          <span className="ml-2 font-medium">{formatCurrency(item.unitPrice)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Subtotal:</span>
                          <span className="ml-2 font-bold text-CustomPink1">{formatCurrency(item.subtotal)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <Separator />

            {/* Payment Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-blue-50 p-6 rounded-lg space-y-4">
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="font-medium text-lg">Total Amount:</span>
                    <span className="font-bold text-2xl text-blue-900">{formatCurrency(bill.totalAmount)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm">
                    <span>Amount Paid:</span>
                    <span className="font-medium text-green-600 text-lg">{formatCurrency(bill.paidAmount)}</span>
                  </div>
                  
                  {bill.outstandingBalance > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span>Outstanding Balance:</span>
                      <span className="font-medium text-orange-600 text-lg">{formatCurrency(bill.outstandingBalance)}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Payment History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Payment History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {bill.paymentHistory && bill.paymentHistory.length > 0 ? (
                    // Show actual payment history if available
                    bill.paymentHistory.map((payment, index) => (
                      <div key={payment.id} className="bg-gray-50 p-4 rounded-lg border-l-4 border-green-200">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{getPaymentMethodIcon(payment.paymentMethod)}</span>
                            <div>
                              <p className="font-medium capitalize">
                                {index === 0 ? 'First' : index === 1 ? 'Second' : index === 2 ? 'Third' : `${index + 1}th`} Payment - {payment.paymentMethod}
                              </p>
                              <p className="text-sm text-gray-600">{formatDate(payment.paidAt)}</p>
                              <p className="text-xs text-gray-500">Processed by: {payment.processedBy}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg text-green-600">{formatCurrency(payment.amount)}</p>
                            {payment.notes && (
                              <p className="text-xs text-gray-500 max-w-xs">{payment.notes}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    // Fallback: Show single payment if no payment history array exists
                    bill.paidAmount > 0 && (
                      <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-green-200">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{getPaymentMethodIcon(bill.paymentMethod || 'cash')}</span>
                            <div>
                              <p className="font-medium capitalize">
                                {bill.paymentMethod || 'Cash'} Payment
                              </p>
                              <p className="text-sm text-gray-600">{formatDate(bill.updatedAt)}</p>
                              <p className="text-xs text-gray-500">Processed by: {bill.createdBy}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg text-green-600">{formatCurrency(bill.paidAmount)}</p>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                  
                  {/* Show if no payments made yet */}
                  {bill.paidAmount === 0 && (
                    <div className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-200 text-center">
                      <AlertCircle className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                      <p className="text-orange-700 font-medium">No payments received yet</p>
                      <p className="text-sm text-orange-600">Outstanding balance: {formatCurrency(bill.outstandingBalance)}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Legacy payment method display for bills without payment history */}
            {(!bill.paymentHistory || bill.paymentHistory.length === 0) && bill.paymentMethod && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Payment Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getPaymentMethodIcon(bill.paymentMethod)}</span>
                      <div>
                        <p className="font-medium capitalize">{bill.paymentMethod} Payment</p>
                        <p className="text-sm text-gray-600">Amount: {formatCurrency(bill.paidAmount)}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {bill.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm">{bill.notes}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Timestamp information */}
            <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
              <p>Bill created: {formatDate(bill.createdAt)}</p>
              {bill.updatedAt !== bill.createdAt && (
                <p>Last updated: {formatDate(bill.updatedAt)}</p>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Close
          </Button>
          {bill && (
            <Button 
              onClick={() => window.print()}
              className="flex items-center gap-2"
            >
              <Receipt className="h-4 w-4" />
              Print Bill
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}