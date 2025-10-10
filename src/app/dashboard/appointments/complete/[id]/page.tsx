'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../../../contexts/AuthContext';
import { Button } from '../../../../../components/ui/button';
import { Input } from '../../../../../components/ui/input';
import { Textarea } from '../../../../../components/ui/textarea';
import { Label } from '../../../../../components/ui/label';
import { Separator } from '../../../../../components/ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../../../../components/ui/dropdown-menu';
import { CheckCircle, Plus, Trash2, User, Clock, FileText, Coins, ChevronDown, ArrowLeft, UserCircle } from 'lucide-react';
import { Appointment, ServiceCatalogItem, Treatment } from '../../../../../types';
import { useServices } from '../../../../../utils/swrCache';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../../components/ui/select';
import { ToothChart } from '../../../../../components/ToothChart';
import { ToothTreatment } from '../../../../../types/tooth';
import { getToothData, FDI_TEETH_DATA } from '../../../../../data/fdiTeethData';
import { usePatientToothChart } from '../../../../../hooks/usePatientToothChart';

interface AppointmentService {
  id: string;
  name: string;
  description: string;
  base_price: number;
  duration: number;
  buffer: number;
  pricing_model: 'Per Tooth' | 'Per Tooth (Package)' | 'Per Session' | 'Per Film' | 'Per Treatment Package';
  tooth_chart_use: 'required' | 'not needed' | 'optional';
  finalPrice?: number;
  totalAmount?: number;
  isInitial?: boolean; // Flag to identify initial booking service
  notes?: string; // Optional service notes
  selectedTeeth?: string[]; // Selected teeth for tooth chart services
  showToothChart?: boolean; // Toggle for optional tooth chart display
}

export default function CompleteAppointmentPage() {
  const router = useRouter();
  const params = useParams();
  const appointmentId = params.id as string;
  const { user } = useAuth();
  
  const { data: servicesData } = useServices();
  const services = servicesData?.services || [];
  
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [completionNotes, setCompletionNotes] = useState<string>('');
  const [isLoadingAppointment, setIsLoadingAppointment] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [dentists, setDentists] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [selectedDentist, setSelectedDentist] = useState<string>('');
  // Patient tooth chart management
  const {
    toothChart,
    isLoading: isLoadingToothChart,
    saveToothChart,
    updateToothTreatment
  } = usePatientToothChart(appointment?.patientId || null);

  // Fetch dentists
  useEffect(() => {
    const fetchDentists = async () => {
      try {
        const response = await fetch('/api/dentists');
        if (response.ok) {
          const data = await response.json();
          setDentists(data.dentists || []);
        }
      } catch (error) {
        console.error('Error fetching dentists:', error);
      }
    };

    fetchDentists();
  }, []);

  // Fetch appointment data
  useEffect(() => {
    const fetchAppointment = async () => {
      if (!appointmentId) return;
      
      try {
        setIsLoadingAppointment(true);
        const response = await fetch(`/api/appointments/${appointmentId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch appointment');
        }
        
        const data = await response.json();
        setAppointment(data.appointment);
        
        // Set selected dentist if already assigned
        if (data.appointment.dentist_id) {
          setSelectedDentist(data.appointment.dentist_id);
        }
      } catch (error) {
        console.error('Error fetching appointment:', error);
        toast.error('Failed to load appointment');
        router.push('/dashboard/appointments');
      } finally {
        setIsLoadingAppointment(false);
      }
    };

    fetchAppointment();
  }, [appointmentId, router]);



  // Initialize appointment serviceDetails if needed
  useEffect(() => {
    if (appointment && (!appointment.serviceDetails || appointment.serviceDetails.length === 0)) {
      // Create initial service from booking data
      const initialService: AppointmentService = {
        id: appointment.serviceDetails?.[0]?.id || 'initial-service',
        name: appointment.serviceDetails?.[0]?.name || appointment.service || 'General Consultation',
        description: appointment.serviceDetails?.[0]?.description || `Service from appointment booking: ${appointment.service || 'General Consultation'}`,
        base_price: appointment.serviceDetails?.[0]?.base_price || 0,
        duration: appointment.serviceDetails?.[0]?.duration || 60,
        buffer: appointment.serviceDetails?.[0]?.buffer || 15,
        pricing_model: appointment.serviceDetails?.[0]?.pricing_model || 'Per Session',
        tooth_chart_use: appointment.serviceDetails?.[0]?.tooth_chart_use || 'optional', // Default to optional for older appointments
        finalPrice: appointment.serviceDetails?.[0]?.base_price || 0,
        totalAmount: appointment.serviceDetails?.[0]?.base_price || 0,
        isInitial: true,
        notes: '',
        selectedTeeth: [],
        showToothChart: false
      };
      
      // Update appointment with initial serviceDetails
      const updatedAppointment = {
        ...appointment,
        serviceDetails: [initialService]
      };
      setAppointment(updatedAppointment);
      setCompletionNotes('');
    }
  }, [appointment]);

  const handleAddService = (catalogServiceId: string) => {
    const catalogService = services.find((s: ServiceCatalogItem) => s.id === catalogServiceId);
    if (!catalogService || !appointment) return;

    // Check if this service is already the initial service
    const isInitialService = appointment.serviceDetails?.some(
      s => s.id === catalogServiceId && s.isInitial
    );
    
    if (isInitialService) {
      toast.error('This service is already the initial service for the appointment');
      return;
    }

    // Check for duplicate non-initial services
    const isDuplicateService = appointment.serviceDetails?.some(
      s => s.id === catalogServiceId && !s.isInitial
    );

    if (isDuplicateService) {
      toast.error('This service has already been added to the appointment');
      return;
    }

    const newService: AppointmentService = {
      id: catalogService.id,
      name: catalogService.name,
      description: catalogService.description,
      base_price: catalogService.base_price,
      duration: catalogService.estimated_duration,
      buffer: catalogService.buffer_time,
      pricing_model: catalogService.pricing_model,
      tooth_chart_use: catalogService.tooth_chart_use,
      finalPrice: catalogService.base_price,
      totalAmount: catalogService.base_price,
      isInitial: false,
      notes: '',
      selectedTeeth: [],
      showToothChart: catalogService.tooth_chart_use === 'optional' ? false : undefined
    };
    
    // Add to appointment.serviceDetails array
    const updatedAppointment = {
      ...appointment,
      serviceDetails: [...(appointment.serviceDetails || []), newService]
    };
    setAppointment(updatedAppointment);
  };

  const handleRemoveService = (serviceId: string) => {
    if (!appointment) return;
    
    // Don't allow removal of initial service
    const serviceToRemove = appointment.serviceDetails?.find(s => s.id === serviceId);
    if (serviceToRemove?.isInitial) {
      toast.error('Cannot remove the initial service from the appointment');
      return;
    }
    
    const updatedAppointment = {
      ...appointment,
      serviceDetails: appointment.serviceDetails?.filter(s => s.id !== serviceId) || []
    };
    setAppointment(updatedAppointment);
  };

  const handleServicePriceChange = (serviceId: string, finalPrice: number) => {
    if (!appointment) return;
    
    const updatedServiceDetails = appointment.serviceDetails?.map(service => {
      if (service.id === serviceId) {
        const updated = { ...service, finalPrice };
        
        // Calculate total amount based on pricing model
        switch (service.pricing_model) {
          case 'Per Tooth':
          case 'Per Tooth (Package)':
            // Calculate based on selected teeth count
            const teethCount = service.selectedTeeth ? service.selectedTeeth.length : 1;
            updated.totalAmount = finalPrice * Math.max(teethCount, 1);
            break;
          case 'Per Session':
          case 'Per Film':
          case 'Per Treatment Package':
          default:
            // Fixed price regardless of teeth count
            updated.totalAmount = finalPrice;
            break;
        }
        
        return updated;
      }
      return service;
    }) || [];
    
    setAppointment({
      ...appointment,
      serviceDetails: updatedServiceDetails
    });
  };

  const handleServiceNotesChange = (serviceId: string, notes: string) => {
    if (!appointment) return;
    
    const updatedServiceDetails = appointment.serviceDetails?.map(service => {
      if (service.id === serviceId) {
        return { ...service, notes };
      }
      return service;
    }) || [];
    
    setAppointment({
      ...appointment,
      serviceDetails: updatedServiceDetails
    });
  };




  const handleToothSelection = (serviceId: string, selectedTeeth: string[]) => {
    if (!appointment) return;
    
    const updatedServiceDetails = appointment.serviceDetails?.map(service => {
      if (service.id === serviceId) {
        let totalAmount = service.finalPrice || service.base_price;
        
        // Recalculate total amount for Per Tooth pricing models
        if (service.pricing_model === 'Per Tooth' || service.pricing_model === 'Per Tooth (Package)') {
          totalAmount = (service.finalPrice || service.base_price) * Math.max(selectedTeeth.length, 1);
        }
        
        return {
          ...service,
          selectedTeeth,
          totalAmount
        };
      }
      return service;
    }) || [];
    
    setAppointment({
      ...appointment,
      serviceDetails: updatedServiceDetails
    });
  };

  const handleCompleteAppointment = async () => {
    if (!appointment || !appointment.serviceDetails || appointment.serviceDetails.length === 0) return;
    
    // Validate dentist selection
    if (!selectedDentist) {
      toast.error('Please select a dentist');
      return;
    }
    
    // Validate services based on tooth chart requirements
    for (const service of appointment.serviceDetails) {
      if (service.tooth_chart_use === 'required') {
        // For per-tooth pricing, ensure teeth are selected
        if (service.pricing_model === 'Per Tooth' || service.pricing_model === 'Per Tooth (Package)') {
          if (!service.selectedTeeth || service.selectedTeeth.length === 0) {
            toast.error(`Please select teeth for "${service.name}" (per-tooth pricing requires tooth selection)`);
            return;
          }
        }
      }
    }
    
    setIsLoading(true);
    try {
      // Prepare the appointment data for completion
      const appointmentToComplete = {
        ...appointment,
        status: 'completed',
        dentist_id: selectedDentist,
        completionNotes,
        completedBy: user?.email,
        completedAt: new Date().toISOString()
      };

      const response = await fetch(`/api/appointments/${appointment.id}/complete`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appointmentToComplete),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Failed to complete appointment (${response.status})`);
      }

      const data = await response.json();

      // Save tooth chart data to patient history
      if (toothChart && appointment.serviceDetails) {
        try {
          const newTreatments: ToothTreatment[] = [];
          
          for (const service of appointment.serviceDetails) {
            // Only process services with tooth chart data
            if (service.tooth_chart_use !== 'not needed' && service.selectedTeeth && service.selectedTeeth.length > 0) {
              const treatmentDetail = service.notes?.trim() || `${service.name} treatment`;
              
              newTreatments.push({
                id: crypto.randomUUID(),
                teeth_fdi: service.selectedTeeth.map(String), // Convert to string array for compatibility
                teeth_names: service.selectedTeeth.map(fdi => {
                  const toothData = getToothData(String(fdi));
                  return toothData?.name || `Tooth ${fdi}`;
                }),
                detail: treatmentDetail,
                surfaces: null,
                date: new Date().toISOString().split('T')[0],
                service_name: service.name
              });
            }
          }
          
          if (newTreatments.length > 0) {
            // Update tooth chart with new treatments
            const updatedToothChart = {
              ...toothChart,
              treatments: [...toothChart.treatments, ...newTreatments],
              treatedTeeth: [...new Set([
                ...toothChart.treatedTeeth,
                ...newTreatments.flatMap(t => t.teeth_fdi)
              ])],
              lastUpdated: new Date().toISOString()
            };
            
            await saveToothChart(updatedToothChart);
          }
        } catch (toothChartError) {
          console.error('Error saving tooth chart:', toothChartError);
          // Don't fail the appointment completion for tooth chart errors
          toast.warning('Appointment completed but tooth chart may not have been updated');
        }
      }

      // Display inventory deduction notifications
      if (data.inventoryDeductions && data.inventoryDeductions.length > 0) {
        const deductedItems = data.inventoryDeductions.filter((item: any) => item.quantityDeducted > 0);
        const warningItems = data.inventoryDeductions.filter((item: any) => item.warning);
        
        if (deductedItems.length > 0) {
          const deductionSummary = deductedItems
            .map((item: any) => `${item.quantityDeducted} ${item.unit} of ${item.itemName}`)
            .join(', ');
          
          toast.success(`Appointment completed – ${deductionSummary} deducted from inventory.`);
        }
        
        if (warningItems.length > 0) {
          warningItems.forEach((item: any) => {
            toast.error(`Warning: ${item.warning} for ${item.itemName} in service "${item.serviceName}"`);
          });
        }
      } else {
        toast.success('Appointment completed successfully!');
      }
      
      router.push('/dashboard/appointments');
    } catch (error) {
      console.error('Complete appointment error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
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

  const totalAmount = appointment?.serviceDetails?.reduce((sum, service) => sum + (service.totalAmount || service.finalPrice || service.base_price || 0), 0) || 0;
  
  const isValid = selectedDentist && appointment?.serviceDetails && appointment.serviceDetails.length > 0 && 
    appointment.serviceDetails.every(s => {
      // Check services with required tooth chart usage
      if (s.tooth_chart_use === 'required') {
        // For per-tooth pricing, ensure teeth are selected
        if (s.pricing_model === 'Per Tooth' || s.pricing_model === 'Per Tooth (Package)') {
          return s.selectedTeeth && s.selectedTeeth.length > 0;
        }
        return true; // Required services without per-tooth pricing are always valid
      }
      
      return true; // Optional and not needed services are always valid
    });

  if (isLoadingAppointment) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading appointment...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <p className="text-lg mb-4">Appointment not found</p>
          <Button onClick={() => router.push('/dashboard/appointments')}>
            Back to Appointments
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/dashboard/appointments')}
          className="p-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2 font-bold text-green-600">
            <CheckCircle className="h-6 w-6 " />
            Complete Appointment
          </h1>
          <p className="text-muted-foreground">Mark this appointment as completed and record services performed</p>
        </div>
      </div>

      {/* Appointment Summary */}
      <div className="bg-CustomPink3 border border-CustomPink1 p-6 rounded-lg mb-8">
        <h2 className="text-lg font-bold text-CustomPink1 mb-4">Appointment Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 font-bold text-CustomPink1" />
            <div>
              <p className="font-bold">{appointment.patientName}</p>
              <p className="text-sm font-bold text-CustomPink1">{appointment.patientEmail}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 font-bold text-CustomPink1" />
            <div>
              <p className="font-bold">{formatTime(appointment.time)}</p>
              <p className="text-sm font-bold text-CustomPink1">{formatDate(appointment.date)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Dentist Selection */}
      <div className="bg-CustomPink3 border border-CustomPink1 p-6 rounded-lg mb-8">
        <div className="space-y-3">
          <Label className="flex items-center gap-2 font-bold text-CustomPink1">
            <UserCircle className="h-5 w-5 text-CustomPink1" />
            Assigned Dentist *
          </Label>
          <Select value={selectedDentist} onValueChange={setSelectedDentist}>
            <SelectTrigger className="max-w-md bg-white">
              <SelectValue placeholder="Select dentist for this appointment" />
            </SelectTrigger>
            <SelectContent>
              {dentists.map((dentist) => (
                <SelectItem key={dentist.id} value={dentist.id}>
                  {dentist.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            Select the dentist who performed the services
          </p>
        </div>
      </div>

      {/* Services Performed */}
      <div className="space-y-6 bg-CustomPink3 p-6 rounded-lg mb-8 border-2 border-CustomPink1 ">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-CustomPink1">Services Performed</h2>
            <p className="text-muted-foreground">Record all services and treatments provided during this appointment</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline_pink"
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
                  className="cursor-pointer text-bold text-CustomPink1"
                >
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">{catalogService.name}</span>
                    <span className="text-sm text-bold text-CustomPink1">
                      ₱{catalogService.base_price.toLocaleString()}
                    </span>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-6">
          {appointment?.serviceDetails?.map((service, index) => {

            // Determine pricing label based on pricing model
            const getPricingLabel = () => {
              switch (service.pricing_model) {
                case 'Per Tooth': return 'Price per Tooth';
                case 'Per Film': return 'Price per Film';
                case 'Per Treatment Package': return 'Price per Treatment Package';
                case 'Per Tooth (Package)': return 'Price per Tooth Package';
                case 'Per Session':
                default: return 'Price per Service';
              }
            };

            return (
              <div key={service.id} className="border text-bold rounded-lg p-6 space-y-6 bg-CustomPink2">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-medium">
                      {service.name}
                      {service.isInitial && (
                        <span className="ml-2 text-sm text-CustomPink1 bg-blue-100 px-2 py-1 rounded">
                          Initial Service
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                  </div>
                  {!service.isInitial && (
                    <Button
                      type="button"
                      variant="ghost_pink"
                      size="sm"
                      onClick={() => handleRemoveService(service.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="space-y-3">
                  <Label>{getPricingLabel()} (₱)</Label>
                  <Input
                    type="number"
                    value={service.finalPrice || service.base_price}
                    onChange={(e) => handleServicePriceChange(service.id, parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                    className="max-w-xs"
                  />
                </div>

                {/* Tooth Chart Section */}
                {service.tooth_chart_use === 'required' && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <Label className="text-base">Tooth Chart (Required)</Label>
                    </div>
                    
                    {/* Always show tooth chart for required services */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Affected Teeth</Label>
                      {isLoadingToothChart ? (
                        <div className="border border-gray-200 rounded-lg p-4 flex items-center justify-center h-32">
                          <div className="text-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                            <p className="text-sm text-muted-foreground">Loading patient tooth chart...</p>
                          </div>
                        </div>
                      ) : (
                        <ToothChart
                          mode="edit"
                          selectedTeeth={service.selectedTeeth || []}
                          treatedTeeth={toothChart?.treatedTeeth || []}
                          missingTeeth={toothChart?.missingTeeth || []}
                          disabledTeeth={toothChart?.disabledTeeth || []}
                          treatments={toothChart?.treatments || []}
                          onToothClick={(fdi) => {
                            const currentSelection = service.selectedTeeth || [];
                            const isSelected = currentSelection.includes(String(fdi));
                            const newSelection = isSelected
                              ? currentSelection.filter(tooth => tooth !== String(fdi))
                              : [...currentSelection, String(fdi)];
                            handleToothSelection(service.id, newSelection);
                          }}
                          className="border border-gray-200 rounded-lg p-4"
                          showTooltip={true}
                        />
                      )}
                    </div>

                    {/* Selected Teeth Summary with Long Names */}
                    {service.selectedTeeth && service.selectedTeeth.length > 0 && (
                      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                        <div className="text-sm font-medium text-blue-800 mb-2">
                          Selected Teeth ({service.selectedTeeth.length})
                        </div>
                        <div className="space-y-2">
                          {service.selectedTeeth.map((fdi) => {
                            const toothData = FDI_TEETH_DATA[String(fdi)];
                            return (
                              <div
                                key={fdi}
                                className="flex items-center justify-between px-3 py-2 bg-blue-100 text-blue-800 text-sm rounded-md"
                              >
                                <span className="font-medium">#{fdi}</span>
                                <span className="text-xs">{toothData?.name || `Tooth ${fdi}`}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {service.tooth_chart_use === 'optional' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <Label className="text-base">Tooth Chart (Optional)</Label>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const updatedServices = appointment!.serviceDetails!.map(s =>
                            s.id === service.id 
                              ? { ...s, showToothChart: !s.showToothChart }
                              : s
                          );
                          setAppointment({ ...appointment!, serviceDetails: updatedServices });
                        }}
                        className="flex items-center gap-2"
                      >
                        <FileText className="h-4 w-4" />
                        {service.showToothChart ? 'Hide Tooth Chart' : 'Show Tooth Chart'}
                      </Button>
                    </div>

                    {service.showToothChart && (
                      <div className="space-y-3">
                        <Label className="text-sm font-medium">Affected Teeth</Label>
                        {isLoadingToothChart ? (
                          <div className="border border-gray-200 rounded-lg p-4 flex items-center justify-center h-32">
                            <div className="text-center">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                              <p className="text-sm text-muted-foreground">Loading patient tooth chart...</p>
                            </div>
                          </div>
                        ) : (
                          <ToothChart
                            mode="edit"
                            selectedTeeth={service.selectedTeeth || []}
                            treatedTeeth={toothChart?.treatedTeeth || []}
                            missingTeeth={toothChart?.missingTeeth || []}
                            disabledTeeth={toothChart?.disabledTeeth || []}
                            treatments={toothChart?.treatments || []}
                            onToothClick={(fdi) => {
                              const currentSelection = service.selectedTeeth || [];
                              const isSelected = currentSelection.includes(fdi);
                              const newSelection = isSelected
                                ? currentSelection.filter(tooth => tooth !== fdi)
                                : [...currentSelection, fdi];
                              handleToothSelection(service.id, newSelection);
                            }}
                            className="border border-gray-200 rounded-lg p-4"
                            showTooltip={true}
                          />
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Service Notes (Optional) */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Service Notes (Optional)</Label>
                  <Textarea
                    value={service.notes || ''}
                    onChange={(e) => handleServiceNotesChange(service.id, e.target.value)}
                    placeholder="Enter any additional notes about this service (optional)..."
                    rows={3}
                  />
                </div>

                {/* Service Total Display */}
                <div className=" bg-CustomPink3 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">
                      {(service.pricing_model === 'Per Tooth' || service.pricing_model === 'Per Tooth (Package)') && service.selectedTeeth && service.selectedTeeth.length > 0 ? (
                        `${service.selectedTeeth.length} teeth × ₱${(service.finalPrice || service.base_price).toLocaleString()}`
                      ) : (
                        'Service Total'
                      )}
                    </span>
                    <span className="text-lg font-semibold text-green-600">
                      ₱{(
                        (service.pricing_model === 'Per Tooth' || service.pricing_model === 'Per Tooth (Package)') && service.selectedTeeth 
                          ? (service.finalPrice || service.base_price) * service.selectedTeeth.length
                          : service.finalPrice || service.base_price
                      ).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Separator className="my-8" />

      {/* Total Summary */}
      <div className="bg-CustomPink3 p-6 rounded-lg mb-8 border-2 border-CustomPink1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Coins className="h-6 w-6 text-CustomPink1" />
            <span className="text-xl font-bold text-CustomPink1">Total Amount</span>
          </div>
          <span className="text-2xl font-semibold text-green-600">
            ₱{totalAmount.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Overall Completion Notes */}
      <div className="space-y-3 mb-8 p-6 rounded-lg border-2 border-CustomPink1 bg-CustomPink3">
        <Label className="font-bold text-CustomPink1">Overall Completion Notes (Optional)</Label>
        <Textarea
          className='border-2 border-CustomPink1'
          value={completionNotes}
          onChange={(e) => setCompletionNotes(e.target.value)}
          placeholder="Add any general notes about the appointment completion..."
          rows={4}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-4 pt-6 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/dashboard/appointments')}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleCompleteAppointment}
          disabled={!isValid || isLoading}
          className="bg-green-600 hover:bg-green-700"
        >
          {isLoading ? 'Completing...' : 'Mark as Completed'}
        </Button>
      </div>
    </div>
  );
}