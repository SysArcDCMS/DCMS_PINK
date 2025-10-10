'use client';

import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { CheckCircle, Plus, Trash2, User, Clock, FileText, Coins, ChevronDown } from 'lucide-react';
import { Appointment, ServiceCatalogItem, ServiceInstance, Treatment } from '../types';
import { useServices } from '../utils/swrCache';
import { ToothChart } from './ToothChart';
import { ToothTreatment } from '../types/tooth';
import { getToothData } from '../data/fdiTeethData';

interface CompleteAppointmentDialogProps {
  appointment: Appointment | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (appointmentId: string, services: ServiceInstance[], notes?: string) => void;
  isLoading: boolean;
}

export default function CompleteAppointmentDialog({
  appointment,
  isOpen,
  onClose,
  onConfirm,
  isLoading
}: CompleteAppointmentDialogProps) {
  const { data: servicesData } = useServices();
  const services = servicesData?.services || [];
  
  const [completedServices, setCompletedServices] = useState<ServiceInstance[]>([]);
  const [completionNotes, setCompletionNotes] = useState<string>('');
  const [patientTreatments, setPatientTreatments] = useState<ToothTreatment[]>([]);

  // Auto-fill service when dialog opens
  useEffect(() => {
    if (appointment && isOpen) {
      // Use the appointment's existing service directly
      const appointmentService: ServiceInstance = {
        id: crypto.randomUUID(),
        serviceId: 'appointment-service',
        serviceName: appointment.serviceDetails?.[0].name || appointment.service || 'General Consultation',
        description: appointment.serviceDetails?.[0].description || `Service from appointment booking: ${appointment.service || 'General Consultation'}`,
        basePrice: appointment.serviceDetails?.[0].base_price || 0,
        finalPrice: appointment.serviceDetails?.[0].base_price || 0,
        treatmentDetail: '',
        notes: '',
        treatments: [],
        totalAmount: appointment.serviceDetails?.[0].base_price || 0
      };
      
      setCompletedServices([appointmentService]);
      setCompletionNotes('');
      
      // Fetch patient treatment history for tooth chart
      fetchPatientTreatmentHistory(appointment.patientId);
    }
  }, [appointment, isOpen]);

  const fetchPatientTreatmentHistory = async (patientId: string) => {
    try {
      // For now, we'll use mock data since the service history API is moved to Supabase
      // In a real implementation, you'd fetch from your Supabase server
      const mockTreatments: ToothTreatment[] = [
        {
          id: '1',
          teeth_fdi: ['16', '26'],
          teeth_names: ['Upper Right 1st Molar', 'Upper Left 1st Molar'],
          detail: 'Composite filling',
          surfaces: ['O'],
          date: '2023-04-15',
          service_name: 'Filling'
        },
        {
          id: '2', 
          teeth_fdi: ['11', '21'],
          teeth_names: ['Upper Right Central Incisor', 'Upper Left Central Incisor'],
          detail: 'Cleaning and polishing',
          surfaces: null,
          date: '2023-03-20',
          service_name: 'Prophylaxis'
        }
      ];
      
      setPatientTreatments(mockTreatments);
    } catch (error) {
      console.error('Error fetching patient treatment history:', error);
      setPatientTreatments([]);
    }
  };

  const handleAddService = (catalogServiceId: string) => {
    const catalogService = services.find((s: ServiceCatalogItem) => s.id === catalogServiceId);
    if (!catalogService) return;

    const newService: ServiceInstance = {
      id: crypto.randomUUID(),
      serviceId: catalogService.id,
      serviceName: catalogService.name,
      description: catalogService.description,
      basePrice: catalogService.base_price,
      finalPrice: catalogService.base_price,
      treatmentDetail: '',
      notes: '',
      treatments: catalogService.has_treatment_detail ? [{ id: crypto.randomUUID(), detail: '' }] : [],
      totalAmount: catalogService.base_price
    };
    setCompletedServices([...completedServices, newService]);
  };

  const handleRemoveService = (serviceId: string) => {
    setCompletedServices(completedServices.filter(s => s.id !== serviceId));
  };

  const handleServiceChange = (serviceId: string, field: keyof ServiceInstance, value: any) => {
    setCompletedServices(prev => prev.map(service => {
      if (service.id === serviceId) {
        const updated = { ...service, [field]: value };
        
        // Calculate total amount based on treatments
        const catalogService = services.find((s: ServiceCatalogItem) => s.id === updated.serviceId);
        if (catalogService && catalogService.has_treatment_detail && updated.treatments) {
          const treatmentCount = Math.max(1, updated.treatments.length);
          updated.totalAmount = updated.finalPrice * treatmentCount;
        } else {
          updated.totalAmount = updated.finalPrice;
        }
        
        return updated;
      }
      return service;
    }));
  };

  const handleAddTreatment = (serviceId: string) => {
    setCompletedServices(prev => prev.map(service => {
      if (service.id === serviceId) {
        const newTreatment: Treatment = {
          id: crypto.randomUUID(),
          detail: ''
        };
        const updatedTreatments = [...(service.treatments || []), newTreatment];
        const catalogService = services.find((s: ServiceCatalogItem) => s.id === service.serviceId);
        const treatmentCount = Math.max(1, updatedTreatments.length);
        
        return {
          ...service,
          treatments: updatedTreatments,
          totalAmount: catalogService && catalogService.has_treatment_detail 
            ? service.finalPrice * treatmentCount 
            : service.finalPrice
        };
      }
      return service;
    }));
  };

  const handleRemoveTreatment = (serviceId: string, treatmentId: string) => {
    setCompletedServices(prev => prev.map(service => {
      if (service.id === serviceId) {
        const updatedTreatments = (service.treatments || []).filter(t => t.id !== treatmentId);
        const catalogService = services.find((s: ServiceCatalogItem) => s.id === service.serviceId);
        const treatmentCount = Math.max(1, updatedTreatments.length);
        
        return {
          ...service,
          treatments: updatedTreatments,
          totalAmount: catalogService && catalogService.has_treatment_detail 
            ? service.finalPrice * treatmentCount 
            : service.finalPrice
        };
      }
      return service;
    }));
  };

  const handleTreatmentChange = (serviceId: string, treatmentId: string, detail: string) => {
    setCompletedServices(prev => prev.map(service => {
      if (service.id === serviceId) {
        const updatedTreatments = (service.treatments || []).map(treatment =>
          treatment.id === treatmentId ? { ...treatment, detail } : treatment
        );
        
        return {
          ...service,
          treatments: updatedTreatments
        };
      }
      return service;
    }));
  };

  const handleToothSelection = (serviceId: string, treatmentId: string, selectedTeeth: string[]) => {
    setCompletedServices(prev => prev.map(service => {
      if (service.id === serviceId) {
        const updatedTreatments = (service.treatments || []).map(treatment => {
          if (treatment.id === treatmentId) {
            // Generate teeth names from FDI numbers
            const teethNames = selectedTeeth.map(fdi => {
              const toothData = getToothData(fdi);
              return toothData?.name || `Tooth ${fdi}`;
            });

            return {
              ...treatment,
              teeth_fdi: selectedTeeth,
              teeth_names: teethNames
            };
          }
          return treatment;
        });
        
        return {
          ...service,
          treatments: updatedTreatments
        };
      }
      return service;
    }));
  };

  const handleClose = () => {
    setCompletedServices([]);
    setCompletionNotes('');
    onClose();
  };

  const handleConfirm = () => {
    if (!appointment || completedServices.length === 0) return;
    
    // Validate treatment services have at least one treatment
    for (const service of completedServices) {
      const catalogService = services.find((s: ServiceCatalogItem) => s.id === service.serviceId);
      if (catalogService && catalogService.has_treatment_detail) {
        if (!service.treatments || service.treatments.length === 0 || 
            service.treatments.every(t => t.detail.trim() === '')) {
          return; // Don't submit if treatment service has no valid treatments
        }
      }
    }
    
    onConfirm(appointment.id, completedServices, completionNotes || undefined);
    setCompletedServices([]);
    setCompletionNotes('');
  };

  const formatDate = (date: string) => {
    try {
      return new Date(date).toLocaleDateString('en-US', { 
        weekday: 'long',
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch {
      return date;
    }
  };

  const formatTime = (time: string) => {
    try {
      const [hours, minutes] = time.split(':');
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes));
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } catch {
      return time;
    }
  };

  const totalAmount = completedServices.reduce((sum, service) => sum + (service.totalAmount || service.finalPrice || 0), 0);
  
  const isValid = completedServices.length > 0 && 
    completedServices.every(s => {
      // Check treatment services have valid treatments
      const catalogService = services.find((cs: ServiceCatalogItem) => cs.id === s.serviceId);
      if (catalogService && catalogService.has_treatment_detail) {
        return s.treatments && s.treatments.length > 0 && 
               s.treatments.some(t => t.detail.trim() !== '');
      }
      
      return true;
    });

  if (!appointment) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            Complete Appointment
          </DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-4">
              {/* Appointment Summary */}
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="font-medium">{appointment.patientName}</p>
                      <p className="text-sm text-gray-600">{appointment.patientEmail}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="font-medium">{formatTime(appointment.time)}</p>
                      <p className="text-sm text-gray-600">{formatDate(appointment.date)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Services Performed */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-medium">Services Performed</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Service
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {services.map((catalogService: ServiceCatalogItem) => (
                    <DropdownMenuItem 
                      key={catalogService.id} 
                      onClick={() => handleAddService(catalogService.id)}
                      className="cursor-pointer"
                    >
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">{catalogService.name}</span>
                        <span className="text-sm text-muted-foreground">
                          ₱{catalogService.base_price.toLocaleString()}
                        </span>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="space-y-4">
              {completedServices.map((service, index) => {
                const catalogService = services.find((s: ServiceCatalogItem) => s.id === service.serviceId);
                const hasDetailSupport = catalogService?.has_treatment_detail;

                return (
                  <div key={service.id} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-start justify-between">
                      <h4 className="font-medium">
                        {service.serviceName || 'Actual Service Name'}
                      </h4>
                      {completedServices.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveService(service.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Price per {hasDetailSupport ? 'Treatment' : 'Service'} (₱)</Label>
                      <Input
                        type="number"
                        value={service.finalPrice}
                        onChange={(e) => handleServiceChange(service.id, 'finalPrice', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.01"
                      />
                    </div>

                    {/* Treatment Details (if service supports it) */}
                    {hasDetailSupport && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Treatments (Required)
                          </Label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddTreatment(service.id)}
                            className="flex items-center gap-2"
                          >
                            <Plus className="h-4 w-4" />
                            Add Treatment
                          </Button>
                        </div>

                        {service.treatments && service.treatments.length > 0 ? (
                          <div className="space-y-4">
                            {service.treatments.map((treatment, treatmentIndex) => (
                              <div key={treatment.id} className="border rounded-lg p-4 space-y-4">
                                <div className="flex items-center justify-between">
                                  <Label className="text-sm font-medium">Treatment {treatmentIndex + 1}</Label>
                                  {service.treatments!.length > 1 && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleRemoveTreatment(service.id, treatment.id)}
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>

                                {/* Tooth Selection Chart */}
                                <div className="space-y-2">
                                  <Label className="text-sm">Affected Teeth</Label>
                                  <ToothChart
                                    mode="edit"
                                    selectedTeeth={treatment.teeth_fdi || []}
                                    treatedTeeth={patientTreatments.flatMap(t => t.teeth_fdi)}
                                    treatments={patientTreatments}
                                    onToothClick={(fdi) => {
                                      const currentSelection = treatment.teeth_fdi || [];
                                      const isSelected = currentSelection.includes(fdi);
                                      const newSelection = isSelected
                                        ? currentSelection.filter(tooth => tooth !== fdi)
                                        : [...currentSelection, fdi];
                                      handleToothSelection(service.id, treatment.id, newSelection);
                                    }}
                                    className="bg-white border border-gray-200 rounded-lg p-3"
                                    showTooltip={true}
                                  />
                                </div>

                                {/* Treatment Details */}
                                <div className="space-y-2">
                                  <Label className="text-sm">Treatment Details</Label>
                                  <Textarea
                                    value={treatment.detail}
                                    onChange={(e) => handleTreatmentChange(service.id, treatment.id, e.target.value)}
                                    placeholder="Enter specific treatment details, procedures performed, materials used, etc."
                                    rows={3}
                                  />
                                </div>

                                {/* Selected Teeth Summary */}
                                {treatment.teeth_fdi && treatment.teeth_fdi.length > 0 && (
                                  <div className="bg-blue-50 p-3 rounded-lg">
                                    <div className="text-sm font-medium text-blue-800 mb-1">
                                      Selected Teeth ({treatment.teeth_fdi.length})
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                      {treatment.teeth_fdi.map((fdi, index) => (
                                        <span
                                          key={fdi}
                                          className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                                        >
                                          #{fdi}
                                          {treatment.teeth_names && treatment.teeth_names[index] && (
                                            <span className="ml-1 text-CustomPink1">
                                              ({treatment.teeth_names[index]})
                                            </span>
                                          )}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-4 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                            <p>No treatments added yet</p>
                            <p className="text-sm">Click "Add Treatment" to add at least one treatment</p>
                          </div>
                        )}

                        {/* Treatment Count and Total Display */}
                        {service.treatments && service.treatments.length > 0 && (
                          <div className="bg-blue-50 p-3 rounded-lg">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">
                                {service.treatments.length} treatment{service.treatments.length !== 1 ? 's' : ''} × ₱{service.finalPrice.toLocaleString()}
                              </span>
                              <span className="font-semibold">
                                = ₱{(service.finalPrice * service.treatments.length).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Service Notes */}
                    <div className="space-y-2">
                      <Label>Service Notes (Optional)</Label>
                      <Textarea
                        value={service.notes || ''}
                        onChange={(e) => handleServiceChange(service.id, 'notes', e.target.value)}
                        placeholder="Any additional notes about this service..."
                        rows={2}
                      />
                    </div>

                    {/* Service Total (for non-treatment services) */}
                    {!hasDetailSupport && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Service Total</span>
                          <span className="font-semibold text-green-600">
                            ₱{service.finalPrice.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Total Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-gray-600" />
                <span className="font-medium">Total Amount</span>
              </div>
              <span className="text-xl font-semibold text-green-600">
                ₱{totalAmount.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Overall Completion Notes */}
          <div className="space-y-2">
            <Label>Overall Completion Notes (Optional)</Label>
            <Textarea
              value={completionNotes}
              onChange={(e) => setCompletionNotes(e.target.value)}
              placeholder="Add any general notes about the appointment completion..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={!isValid || isLoading}
            className="bg-green-600 hover:bg-green-700"
          >
            {isLoading ? 'Completing...' : 'Mark as Completed'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}