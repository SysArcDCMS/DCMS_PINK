'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Separator } from './ui/separator';
import { Calculator } from 'lucide-react';
import { toast } from 'sonner';
import { Appointment, BillItem } from '../types';
import { FDI_TEETH_DATA } from '../data/fdiTeethData';

interface GenerateBillDialogProps {
  appointment: Appointment | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onBillGenerated?: () => void;
}

export default function GenerateBillDialog({ 
  appointment, 
  isOpen, 
  onOpenChange, 
  onBillGenerated 
}: GenerateBillDialogProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  
  const [billForm, setBillForm] = useState({
    notes: ''
  });

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

  // Initialize bill items when appointment changes
  useEffect(() => {
    if (appointment && appointment.serviceDetails && Array.isArray(appointment.serviceDetails)) {
      // Auto-populate from serviceDetails array
      const items = appointment.serviceDetails.map((service: any, index) => {
        // Calculate quantity and pricing based on pricing model
        let quantity = 1;
        let unitPrice = service.base_price || 0;
        let subtotal = 0;
        
        // Determine pricing model (fallback to 'Per Session' if not specified)
        const pricingModel = service.pricing_model || 'Per Session';
        
        switch (pricingModel) {
          case 'Per Tooth':
            // Calculate based on selected teeth
            if (service.selectedTeeth && Array.isArray(service.selectedTeeth)) {
              quantity = Math.max(service.selectedTeeth.length, 1); // At least 1 if no teeth specified
              unitPrice = service.finalPrice || service.base_price || 0;
              subtotal = unitPrice * quantity;
            } else {
              quantity = 1;
              unitPrice = service.finalPrice || service.base_price || 0;
              subtotal = unitPrice;
            }
            break;
            
          case 'Per Tooth (Package)':
            // Calculate based on selected teeth count but show as package
            if (service.selectedTeeth && Array.isArray(service.selectedTeeth)) {
              quantity = Math.max(service.selectedTeeth.length, 1);
              unitPrice = service.finalPrice || service.base_price || 0;
              subtotal = unitPrice * quantity;
            } else {
              quantity = 1;
              unitPrice = service.finalPrice || service.base_price || 0;
              subtotal = unitPrice;
            }
            break;
            
          case 'Per Session':
            // One session price
            quantity = 1;
            unitPrice = service.finalPrice || service.base_price || 0;
            subtotal = unitPrice;
            break;
            
          case 'Per Film':
            // For film-based services, default to 1 film unless specified
            quantity = 1;
            unitPrice = service.finalPrice || service.base_price || 0;
            subtotal = unitPrice;
            break;
            
          case 'Per Treatment Package':
            // One package price for all treatments
            quantity = 1;
            unitPrice = service.finalPrice || service.base_price || 0;
            subtotal = unitPrice;
            break;
            
          default:
            // Fallback - use calculated total amount or base price
            quantity = 1;
            unitPrice = service.totalAmount || service.finalPrice || service.base_price || 0;
            subtotal = unitPrice;
        }
        
        // Generate description based on pricing model and teeth selection
        let description = service.description || `Completed on ${appointment.date}`;
        if ((pricingModel === 'Per Tooth' || pricingModel === 'Per Tooth (Package)') && service.selectedTeeth && service.selectedTeeth.length > 0) {
          const toothNames = formatToothNames(service.selectedTeeth);
          description += ` - Teeth: ${toothNames}`;
        }
        description += ` (${pricingModel})`;
        
        // Generate quantity label based on pricing model
        let quantityLabel = 'Quantity';
        switch (pricingModel) {
          case 'Per Tooth':
          case 'Per Tooth (Package)':
            quantityLabel = 'Teeth Count';
            break;
          case 'Per Film':
            quantityLabel = 'Films';
            break;
          case 'Per Session':
            quantityLabel = 'Sessions';
            break;
          default:
            quantityLabel = 'Quantity';
        }
        
        return {
          id: `item-${service.id || index}`,
          serviceId: service.id,
          serviceName: service.name,
          description: description,
          quantity: quantity,
          quantityLabel: quantityLabel,
          unitPrice: unitPrice,
          subtotal: subtotal,
          hasTeethSelected: Boolean(service.selectedTeeth && service.selectedTeeth.length > 0),
          selectedTeeth: service.selectedTeeth
        };
      });
      
      setBillItems(items);
      
      const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);
      
      toast.success(`Auto-populated ${items.length} service(s) - Total: ₱${totalAmount.toLocaleString()}`);
    } else if (appointment && appointment.service) {
      // Fallback for old appointment structure
      const suggestedPrice = appointment.service.toLowerCase().includes('consultation') ? 500 :
                            appointment.service.toLowerCase().includes('cleaning') ? 800 :
                            appointment.service.toLowerCase().includes('checkup') ? 300 : 
                            1000;

      setBillItems([{
        id: `item-${Date.now()}`,
        serviceName: appointment.service,
        description: `Completed service - ${appointment.date}`,
        quantity: 1,
        unitPrice: suggestedPrice,
        subtotal: suggestedPrice
      }]);
    }
  }, [appointment]);

  const calculateTotal = () => {
    return billItems.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const handleGenerateBill = async () => {
    if (!appointment || isSubmitting) return;

    if (billItems.length === 0) {
      toast.error('Please add at least one service');
      return;
    }

    const totalAmount = calculateTotal();
    if (totalAmount <= 0) {
      toast.error('Total amount must be greater than zero');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: appointment.id,
          patientId: appointment.patientId || 'anonymous',
          patientName: appointment.patientName,
          patientEmail: appointment.patientEmail,
          patientPhone: appointment.patientPhone,
          items: billItems,
          totalAmount,
          paidAmount: 0, // Always 0 for pending status
          paymentMethod: undefined, // No payment method initially
          notes: billForm.notes,
          createdBy: user?.email,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const billId = data.bill?.id;
        
        // Update appointment with has_bill and billId
        if (billId) {
          try {
            const updateResponse = await fetch(`/api/appointments/${appointment.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                has_bill: true,
                billId: billId
              }),
            });
            
            if (!updateResponse.ok) {
              console.error('Failed to update appointment with bill information');
            }
          } catch (error) {
            console.error('Error updating appointment:', error);
          }
        }
        
        toast.success('Bill generated successfully');
        onOpenChange(false);
        onBillGenerated?.();
        
        // Reset form
        setBillItems([]);
        setBillForm({
          notes: ''
        });
      } else {
        const error = await response.json();
        toast.error(`Failed to generate bill: ${error.error}`);
      }
    } catch (error) {
      toast.error('Failed to generate bill - please try again');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!appointment) return null;

  const totalAmount = calculateTotal();

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg border-1 border-CustomPink1 bg-CustomPink3">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-bold text-CustomPink1">
            <Calculator className="h-5 w-5" />
            Generate Bill
          </DialogTitle>
          <DialogDescription>
            Create a bill for the completed appointment with services. Payment can be recorded later.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 rounded-lg">
          {/* Patient Information */}
          <div className="p-4 rounded-lg border-1 border-CustomPink1 bg-CustomPink2">
            <h4 className="font-medium mb-2 font-bold text-CustomPink1">Patient Information</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-bold text-CustomPink1">Name:</span>
                <span className="font-bold ml-2 font-medium">{appointment.patientName}</span>
              </div>
              {appointment.patientEmail && (
                <div>
                  <span className="font-bold text-CustomPink1">Email:</span>
                  <span className="font-bold ml-2">{appointment.patientEmail}</span>
                </div>
              )}
              {appointment.patientPhone && (
                <div>
                  <span className="font-bold text-CustomPink1">Phone:</span>
                  <span className="font-bold ml-2">{appointment.patientPhone}</span>
                </div>
              )}
              <div>
                <span className="font-bold text-CustomPink1">Appointment:</span>
                <span className="font-bold ml-2">{appointment.date} at {appointment.time}</span>
              </div>
            </div>
          </div>

          {/* Services & Pricing */}
          <div>
            <div className="mb-4">
              <h4 className="font-bold text-CustomPink1">Services & Pricing</h4>
            </div>

            <div className="space-y-3">
              {billItems.map((item, index) => (
                <div key={item.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h5 className="font-bold text-CustomPink1">{item.serviceName}</h5>
                      {item.description && (
                        <p className="text-sm text-gray-600">{item.description}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3 items-end">
                    <div>
                      <Label className='font-bold text-CustomPink1'>{item.quantityLabel || 'Quantity'}</Label>
                      <div className="px-3 py-2 font-medium rounded-lg border-1 border-CustomPink1 bg-CustomPink2">
                        {item.quantity}
                      </div>
                    </div>
                    <div>
                      <Label className='font-bold text-CustomPink1'>Unit Price</Label>
                      <div className="px-3 py-2 font-medium rounded-lg border-1 border-CustomPink1 bg-CustomPink2">
                        {formatCurrency(item.unitPrice)}
                      </div>
                    </div>
                    <div>
                      <Label className='font-bold text-CustomPink1'>Subtotal</Label>
                      <div className="px-3 py-2 font-medium rounded-lg border-1 border-CustomPink1 bg-CustomPink2">
                        {formatCurrency(item.subtotal)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Total Amount & Outstanding Balance */}
          <div className="p-4 space-y-3 rounded-lg border-1 border-CustomPink1 bg-CustomPink2">
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-CustomPink1">Total Amount:</span>
              <span className="text-xl font-bold text-CustomPink1">
                {formatCurrency(totalAmount)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-CustomPink1">Outstanding Balance:</span>
              <span className="text-xl font-bold text-orange-600">
                {formatCurrency(totalAmount)}
              </span>
            </div>
            <div className="text-sm text-gray-600 mt-2">
              Payment can be recorded later in the billing management section.
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="billNotes" className='font-bold text-CustomPink1'>Notes</Label>
              <Textarea
                className=' rounded-lg border-1 border-CustomPink1 bg-CustomPink2'
                id="billNotes"
                value={billForm.notes}
                onChange={(e) => setBillForm({ ...billForm, notes: e.target.value })}
                placeholder="Add any notes about the bill or services"
                rows={3}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button 
              onClick={handleGenerateBill} 
              disabled={
                isSubmitting || 
                billItems.length === 0 || 
                totalAmount <= 0
              }
              className="flex-1"
            >
              {isSubmitting ? 'Generating...' : 'Generate Bill'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}