'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Badge } from '../../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../../components/ui/dialog';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Textarea } from '../../../components/ui/textarea';
import { Separator } from '../../../components/ui/separator';
import { Receipt, AlertCircle, Eye, Edit, RefreshCw, Filter, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Bill, BillingStats, BillItem, PaymentHistory } from '../../../types';
import { useBilling, useBillingStats } from '../../../utils/swrCache';
import SearchAndPagination from '../../../components/SearchAndPagination';
import { useRouter } from 'next/navigation';
import { FDI_TEETH_DATA } from '../../../data/fdiTeethData';

export default function BillingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Search and pagination state
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);

  // Fetch billing data using custom SWR hooks
  const { data: billsData, error: billsError, isValidating: billsLoading, mutate: mutateBills } = useBilling();
  const { data: statsData, error: statsError, isValidating: statsLoading, mutate: mutateStats } = useBillingStats();

  const allBills: Bill[] = billsData?.bills || [];
  
  // Filter and search bills
  const filteredBills = useMemo(() => {
    let filtered = statusFilter === 'all' 
      ? allBills 
      : allBills.filter(bill => bill.status === statusFilter);
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(bill => 
        bill.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bill.patientEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bill.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered;
  }, [allBills, statusFilter, searchQuery]);

  // Pagination logic
  const paginatedBills = useMemo(() => {
    const startIndex = (currentPage - 1) * entriesPerPage;
    const endIndex = startIndex + entriesPerPage;
    return filteredBills.slice(startIndex, endIndex);
  }, [filteredBills, currentPage, entriesPerPage]);

  const totalPages = Math.ceil(filteredBills.length / entriesPerPage);
  const startEntry = ((currentPage - 1) * entriesPerPage) + 1;
  const endEntry = Math.min(currentPage * entriesPerPage, filteredBills.length);
  const stats: BillingStats = statsData?.stats || {
    totalBilledToday: 0,
    paymentsReceivedToday: 0,
    outstandingBalances: 0
  };

  const [editForm, setEditForm] = useState({
    paymentAmount: 0,
    paymentMethod: '',
    notes: ''
  });

  const canManageBilling = user?.role === 'admin' || user?.role === 'staff';

  // Helper function to convert tooth FDI numbers to readable names
  const formatToothNames = (selectedTeeth: string[]): string => {
    if (!selectedTeeth || selectedTeeth.length === 0) return '';
    
    return selectedTeeth.map(fdi => {
      const toothData = FDI_TEETH_DATA[fdi];
      if (toothData) {
        return `${fdi} (${toothData.name})`;
      }
      return fdi;
    }).join(', ');
  };

  const handleRefresh = () => {
    mutateBills();
    mutateStats();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Paid</Badge>;
      case 'partial':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Partial</Badge>;
      case 'pending':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
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
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch {
      return 'Invalid date';
    }
  };

  const openViewDialog = (bill: Bill) => {
    setSelectedBill(bill);
    setIsViewDialogOpen(true);
  };

  const openEditDialog = (bill: Bill) => {
    setSelectedBill(bill);
    setEditForm({
      paymentAmount: bill.outstandingBalance, // Auto-fill with remaining balance
      paymentMethod: '',
      notes: bill.notes || ''
    });
    setIsEditDialogOpen(true);
  };

  const handleMarkAsPaid = async () => {
    if (!canManageBilling || isSubmitting || !selectedBill) return;

    setIsSubmitting(true);
    try {
      // Create new payment entry for payment history
      const newPaymentEntry: PaymentHistory = {
        id: `payment-${Date.now()}`, // Generate unique ID
        amount: editForm.paymentAmount,
        paymentMethod: editForm.paymentMethod as 'cash' | 'card' | 'gcash',
        paidAt: new Date().toISOString(),
        processedBy: user?.email || 'Unknown',
        notes: 'Final payment'
      };

      const newPaidAmount = selectedBill.paidAmount + editForm.paymentAmount;
      const response = await fetch(`/api/billing/${selectedBill.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paidAmount: newPaidAmount,
          paymentMethod: editForm.paymentMethod,
          notes: editForm.notes,
          updatedBy: user?.email,
          newPayment: newPaymentEntry, // Send the new payment entry
        }),
      });

      if (response.ok) {
        await mutateBills();
        await mutateStats();
        setIsEditDialogOpen(false);
        setSelectedBill(null);
        toast.success('Bill marked as paid successfully');
      } else {
        const error = await response.json();
        toast.error(`Failed to update bill: ${error.error}`);
      }
    } catch (error) {
      toast.error('Failed to update bill - please try again');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateBill = async () => {
    if (!canManageBilling || isSubmitting || !selectedBill) return;

    setIsSubmitting(true);
    try {
      // Create new payment entry for payment history
      const newPaymentEntry: PaymentHistory = {
        id: `payment-${Date.now()}`, // Generate unique ID
        amount: editForm.paymentAmount,
        paymentMethod: editForm.paymentMethod as 'cash' | 'card' | 'gcash',
        paidAt: new Date().toISOString(),
        processedBy: user?.email || 'Unknown',
        notes: editForm.notes || (selectedBill.paidAmount === 0 ? 'Initial payment' : 
               (selectedBill.paidAmount + editForm.paymentAmount >= selectedBill.totalAmount ? 'Final payment' : 'Additional payment'))
      };

      const newPaidAmount = selectedBill.paidAmount + editForm.paymentAmount;
      const response = await fetch(`/api/billing/${selectedBill.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paidAmount: newPaidAmount,
          paymentMethod: editForm.paymentMethod,
          notes: editForm.notes,
          updatedBy: user?.email,
          newPayment: newPaymentEntry, // Send the new payment entry
        }),
      });

      if (response.ok) {
        await mutateBills();
        await mutateStats();
        setIsEditDialogOpen(false);
        setSelectedBill(null);
        toast.success('Payment recorded successfully');
      } else {
        const error = await response.json();
        toast.error(`Failed to update bill: ${error.error}`);
      }
    } catch (error) {
      toast.error('Failed to update bill - please try again');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchQuery, entriesPerPage]);

  if (billsError || statsError) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Failed to load billing data. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-CustomPink1">Billing Management</h1>
          <p className="text-gray-600">Manage patient bills and payment tracking</p>
        </div>
        <div className="flex gap-2">
          {canManageBilling && (
            <Button 
              variant="outline_pink" 
              onClick={() => router.push('/dashboard/billing/reports')} 
              className="flex items-center gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              Reports
            </Button>
          )}
          <Button 
            variant="outline_pink" 
            onClick={handleRefresh}
            className="flex items-center gap-2"
            disabled={billsLoading || statsLoading}
          >
            <RefreshCw className={`h-4 w-4 ${(billsLoading || statsLoading) ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Quick Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className='rounded-lg border-1 border-CustomPink1'>
          <CardContent className="flex items-center p-6">
            <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-CustomPink1 font-bold text-lg">₱</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-bold text-CustomPink1">Total Billed Today</p>
              <p className="text-2xl font-bold text-CustomPink1">
                {formatCurrency(stats.totalBilledToday)}
              </p>
            </div>
            {statsLoading && (
              <div className="ml-auto">
                <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse"></div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className='rounded-lg border-1 border-CustomPink1'>
          <CardContent className="flex items-center p-6">
            <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 font-bold text-lg">₱</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-bold text-CustomPink1">Payments Received</p>
              <p className="text-2xl font-bold text-CustomPink1">
                {formatCurrency(stats.paymentsReceivedToday)}
              </p>
            </div>
            {statsLoading && (
              <div className="ml-auto">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className='rounded-lg border-1 border-CustomPink1'>
          <CardContent className="flex items-center p-6">
            <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-orange-600 font-bold text-lg">₱</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-bold text-CustomPink1">Outstanding Balances</p>
              <p className="text-2xl font-bold text-CustomPink1">
                {formatCurrency(stats.outstandingBalances)}
              </p>
            </div>
            {statsLoading && (
              <div className="ml-auto">
                <div className="h-2 w-2 bg-orange-500 rounded-full animate-pulse"></div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Status Filter */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 font-bold text-CustomPink1 " />
          <Select
            value={statusFilter} 
            onValueChange={setStatusFilter}
          >
            <SelectTrigger className="w-40 bg-CustomPink3 font-bold text-CustomPink1 rounded-lg border-1 border-CustomPink1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-CustomPink3 font-bold text-CustomPink1 rounded-lg border-1 border-CustomPink1">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectContent>
          </Select>
          {statusFilter !== 'all' && (
            <Badge variant="outline" className="ml-2">
              {statusFilter} ({filteredBills.length})
            </Badge>
          )}
        </div>
      </div>

      {/* Search and Pagination */}
      <SearchAndPagination
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by patient name, email, or bill ID..."
        currentPage={currentPage}
        totalPages={totalPages}
        entriesPerPage={entriesPerPage}
        onPageChange={setCurrentPage}
        onEntriesPerPageChange={setEntriesPerPage}
        totalEntries={filteredBills.length}
        startEntry={startEntry}
        endEntry={endEntry}
      />

      {/* Billing List Table */}
      <Card className='border-1 border-CustomPink1 bg-CustomPink3'>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-bold text-CustomPink1">
            <Receipt className="h-5 w-5" />
            Billing Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          {paginatedBills.length === 0 ? (
            <div className="text-center py-8">
              <Receipt className="h-12 w-12 text-CustomPink1 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchQuery ? 
                  `No bills found matching "${searchQuery}"` :
                  (statusFilter === 'all' 
                    ? 'No billing records found' 
                    : `No ${statusFilter} bills found`
                  )
                }
              </p>
              {(statusFilter !== 'all' || searchQuery) && (
                <Button 
                  variant="link" 
                  onClick={() => {
                    setStatusFilter('all');
                    setSearchQuery('');
                  }}
                  className="mt-2"
                >
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Services</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Paid Amount</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedBills.map((bill) => (
                    <TableRow key={bill.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div>
                          <div className="font-medium">{bill.patientName}</div>
                          {bill.patientEmail && (
                            <div className="text-sm text-gray-500">{bill.patientEmail}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          {bill.items.slice(0, 2).map((item, index) => (
                            <div key={index} className="text-sm">
                              {item.serviceName}
                            </div>
                          ))}
                          {bill.items.length > 2 && (
                            <div className="text-xs text-gray-500">
                              +{bill.items.length - 2} more
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(bill.totalAmount)}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(bill.paidAmount)}
                      </TableCell>
                      <TableCell>
                        {bill.paymentMethod ? (
                          <Badge variant="outline" className="capitalize">
                            {bill.paymentMethod}
                          </Badge>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(bill.status)}
                      </TableCell>
                      <TableCell>
                        {formatDate(bill.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openViewDialog(bill)}
                            className="flex items-center gap-1"
                          >
                            <Eye className="h-3 w-3" />
                            View
                          </Button>
                          {canManageBilling && (bill.status === 'pending' || bill.status === 'partial') && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditDialog(bill)}
                              className="flex items-center gap-1"
                            >
                              <Edit className="h-3 w-3" />
                              Process Payment
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Bill Dialog - Enhanced */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Detailed Bill View
            </DialogTitle>
            <DialogDescription>
              Complete breakdown of the bill and payment information.
            </DialogDescription>
          </DialogHeader>
          {selectedBill && (
            <div className="space-y-6">
              {/* Bill Header with ID */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Receipt className="h-5 w-5 text-CustomPink1" />
                      <h3 className="text-xl font-bold text-blue-900">Bill ID: {selectedBill.id}</h3>
                    </div>
                    <p className="text-sm text-blue-700">
                      Created: {formatDate(selectedBill.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(selectedBill.status)}
                    <p className="text-sm text-blue-700 mt-1">
                      By: {selectedBill.createdBy}
                    </p>
                  </div>
                </div>
                
                {/* Patient Information */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700 font-medium">Patient:</span>
                    <span className="ml-2 font-bold text-blue-900">{selectedBill.patientName}</span>
                  </div>
                  <div>
                    <span className="text-blue-700 font-medium">Email:</span>
                    <span className="ml-2">{selectedBill.patientEmail}</span>
                  </div>
                  {selectedBill.patientPhone && (
                    <div>
                      <span className="text-blue-700 font-medium">Phone:</span>
                      <span className="ml-2">{selectedBill.patientPhone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Detailed Service Breakdown */}
              <div className="border rounded-lg">
                <div className="border-b px-6 py-4">
                  <h4 className="font-bold text-lg">Service Breakdown</h4>
                </div>
                <div className="p-6 space-y-4">
                  {selectedBill.items.map((item, index) => {
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

              {/* Payment Summary */}
              <div className="bg-blue-50 p-6 rounded-lg space-y-4">
                <h4 className="font-bold text-lg mb-4">Payment Summary</h4>
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="font-medium text-lg">Total Amount:</span>
                  <span className="font-bold text-2xl text-blue-900">{formatCurrency(selectedBill.totalAmount)}</span>
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  <span>Amount Paid:</span>
                  <span className="font-medium text-green-600 text-lg">{formatCurrency(selectedBill.paidAmount)}</span>
                </div>
                
                {selectedBill.outstandingBalance > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span>Outstanding Balance:</span>
                    <span className="font-medium text-orange-600 text-lg">{formatCurrency(selectedBill.outstandingBalance)}</span>
                  </div>
                )}
              </div>

              {/* Payment History */}
              <div className="border rounded-lg">
                <div className="border-b px-6 py-4">
                  <h4 className="font-bold text-lg flex items-center gap-2">
                    <RefreshCw className="h-5 w-5" />
                    Payment History
                  </h4>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    {selectedBill.paymentHistory && selectedBill.paymentHistory.length > 0 ? (
                      // Show actual payment history if available
                      selectedBill.paymentHistory.map((payment, index) => (
                        <div key={payment.id} className="bg-gray-50 p-4 rounded-lg border-l-4 border-green-200">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">
                                {payment.paymentMethod === 'cash' ? '💵' : 
                                 payment.paymentMethod === 'card' ? '💳' : 
                                 payment.paymentMethod === 'gcash' ? '📱' : '💰'}
                              </span>
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
                      selectedBill.paidAmount > 0 ? (
                        <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-green-200">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">
                              {selectedBill.paymentMethod === 'cash' ? '💵' : 
                               selectedBill.paymentMethod === 'card' ? '💳' : 
                               selectedBill.paymentMethod === 'gcash' ? '📱' : '💰'}
                            </span>
                            <div>
                              <p className="font-medium capitalize">{selectedBill.paymentMethod || 'Cash'} Payment</p>
                              <p className="text-sm text-gray-600">{formatDate(selectedBill.updatedAt)}</p>
                              <p className="text-xs text-gray-500">Amount: {formatCurrency(selectedBill.paidAmount)}</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-200 text-center">
                          <AlertCircle className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                          <p className="text-orange-700 font-medium">No payments received yet</p>
                          <p className="text-sm text-orange-600">Outstanding balance: {formatCurrency(selectedBill.outstandingBalance)}</p>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>

              {selectedBill.notes && (
                <div className="border rounded-lg">
                  <div className="border-b px-6 py-4">
                    <h4 className="font-bold text-lg">Notes</h4>
                  </div>
                  <div className="p-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm">{selectedBill.notes}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Timestamp information */}
              <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                <p>Bill created: {formatDate(selectedBill.createdAt)}</p>
                {selectedBill.updatedAt !== selectedBill.createdAt && (
                  <p>Last updated: {formatDate(selectedBill.updatedAt)}</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Bill Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-bold text-CustomPink1">
              <Receipt className="h-5 w-5" />
              Edit Bill
            </DialogTitle>
            <DialogDescription>
              Update payment information for this bill.
            </DialogDescription>
          </DialogHeader>
          
          {selectedBill && (
            <div className="space-y-6">
              {/* Bill Header - Copied from View Dialog */}
              <div className="p-4 rounded-lg border-1 border-CustomPink1 bg-CustomPink3">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-lg font-bold"><span className='text-CustomPink1'>Bill# </span>{selectedBill.id}</h4>
                    <p className="text-sm font-bold"><span className='text-CustomPink1'>Created: </span>
                      {formatDate(selectedBill.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(selectedBill.status)}
                    <p className="text-sm font-bold mt-1">
                      <span className='text-CustomPink1'>By: </span>{selectedBill.createdBy}
                    </p>
                  </div>
                </div>
                
                {/* Patient Information */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className=" font-bold text-CustomPink1">Patient:</span>
                    <span className="ml-2 font-bold text-gray-600">{selectedBill.patientName}</span>
                  </div>
                  <div>
                    <span className=" font-bold text-CustomPink1">Email:</span>
                    <span className="ml-2 font-bold text-gray-600">{selectedBill.patientEmail}</span>
                  </div>
                  {selectedBill.patientPhone && (
                    <div>
                      <span className=" font-bold text-CustomPink1">Phone:</span>
                      <span className="ml-2 font-bold text-gray-600">{selectedBill.patientPhone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bill Items - Copied from View Dialog */}
              <div>
                <h4 className="font-bold text-CustomPink1 mb-4">Services & Items</h4>
                <div className="space-y-3 rounded-lg border-1 border-CustomPink1 bg-CustomPink3">
                  {selectedBill.items.map((item, index) => (
                    <div key={item.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h5 className="font-bold text-CustomPink1">{item.serviceName}</h5>
                          {item.description && (
                            <p className="text-sm text-gray-600">{item.description}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm ">
                        <div>
                          <span className="font-bold text-CustomPink1">Quantity:</span>
                          <span className="ml-2 font-medium">{item.quantity}</span>
                        </div>
                        <div>
                          <span className="font-bold text-CustomPink1">Unit Price:</span>
                          <span className="ml-2 font-medium">{formatCurrency(item.unitPrice)}</span>
                        </div>
                        <div>
                          <span className="font-bold text-CustomPink1">Subtotal:</span>
                          <span className="ml-2 font-medium">{formatCurrency(item.subtotal)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Payment Summary - Copied from View Dialog */}
              <div className="space-y-4">
                <h4 className=" font-bold text-CustomPink1">Payment Summary</h4>
                
                <div className="p-4 space-y-3 rounded-lg border-1 border-CustomPink1 bg-CustomPink3">
                  <div className="flex justify-between items-center">
                    <span className=" font-bold text-CustomPink1">Total Amount:</span>
                    <span className="font-bold text-lg">{formatCurrency(selectedBill.totalAmount)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm">
                    <span className=" font-bold text-CustomPink1">Amount Paid:</span>
                    <span className="font-medium text-green-600">{formatCurrency(selectedBill.paidAmount)}</span>
                  </div>
                  
                  {selectedBill.outstandingBalance > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className=" font-bold text-CustomPink1">Outstanding Balance:</span>
                      <span className="font-medium text-orange-600">{formatCurrency(selectedBill.outstandingBalance)}</span>
                    </div>
                  )}
                  
                  {selectedBill.paymentMethod && (
                    <div className="flex justify-between items-center text-sm">
                      <span>Previous Payment Method:</span>
                      <span className="font-medium capitalize">{selectedBill.paymentMethod}</span>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Payment Form */}
              <div className="space-y-4">
                <h4 className=" font-bold text-CustomPink1">New Payment</h4>
                
                <div>
                  <Label htmlFor="paymentAmount" className=" font-bold text-CustomPink1">Payment Amount</Label>
                  <Input
                    className='rounded-lg border-1 border-CustomPink1 bg-CustomPink3'
                    id="paymentAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    max={selectedBill.outstandingBalance}
                    value={editForm.paymentAmount}
                    onChange={(e) => setEditForm({ ...editForm, paymentAmount: parseFloat(e.target.value) || 0 })}
                    placeholder="Enter payment amount"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Remaining balance: {formatCurrency(selectedBill.outstandingBalance)}
                  </p>
                  {editForm.paymentAmount > selectedBill.outstandingBalance && (
                    <p className="text-sm text-red-600 mt-1">Amount cannot exceed outstanding balance</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="paymentMethod" className=" font-bold text-CustomPink1">Payment Method</Label>
                  <Select 
                    value={editForm.paymentMethod} 
                    onValueChange={(value) => setEditForm({ ...editForm, paymentMethod: value })}
                  >
                    <SelectTrigger className='rounded-lg border-1 border-CustomPink1 bg-CustomPink3'>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent className='rounded-lg border-1 border-CustomPink1 bg-CustomPink3'>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="gcash">GCash</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="notes" className=" font-bold text-CustomPink1">Notes</Label>
                  <Textarea
                    className='rounded-lg border-1 border-CustomPink1 bg-CustomPink3'
                    id="notes"
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    placeholder="Add any notes about the payment"
                    rows={3}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                {/* Mark as Paid - only enabled if outstanding balance = 0 after payment and payment method is filled */}
                <Button 
                  onClick={handleMarkAsPaid}
                  disabled={
                    isSubmitting || 
                    !editForm.paymentMethod ||
                    editForm.paymentAmount <= 0 ||
                    editForm.paymentAmount > selectedBill.outstandingBalance ||
                    (selectedBill.outstandingBalance - editForm.paymentAmount) !== 0
                  }
                  className="flex-1"
                >
                  {isSubmitting ? 'Processing...' : 'Mark as Paid'}
                </Button>
                
                {/* Update Bill - enabled if outstanding balance > 0 after payment and payment method is filled */}
                <Button 
                  onClick={handleUpdateBill}
                  variant="outline_pink"
                  disabled={
                    isSubmitting || 
                    !editForm.paymentMethod ||
                    editForm.paymentAmount <= 0 ||
                    editForm.paymentAmount > selectedBill.outstandingBalance ||
                    (selectedBill.outstandingBalance - editForm.paymentAmount) === 0
                  }
                  className="flex-1"
                >
                  {isSubmitting ? 'Processing...' : 'Update Bill'}
                </Button>
                
                <Button 
                  variant="outline_pink" 
                  onClick={() => setIsEditDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}