'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useServices } from '../../../contexts/ServiceContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { Badge } from '../../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '../../../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Switch } from '../../../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Plus, Edit3, Wrench, Search, RefreshCw, Clock, Timer, MessageSquare, History, User, AlertTriangle, Check, X, Settings } from 'lucide-react';
import { ServiceCatalogItem, ServiceSuggestion } from '../../../types';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function ServicesPage() {
  const { user } = useAuth();
  const { 
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
    refreshAll,
    clearError
  } = useServices();

  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceCatalogItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [isSuggestionDialogOpen, setIsSuggestionDialogOpen] = useState(false);
  const [selectedServiceForSuggestion, setSelectedServiceForSuggestion] = useState<ServiceCatalogItem | null>(null);
  const [suggestionText, setSuggestionText] = useState('');
  const [isLogsDialogOpen, setIsLogsDialogOpen] = useState(false);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<ServiceSuggestion | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    base_price: '',
    estimated_duration: '',
    buffer_time: '',
    pricing_model: 'Per Session' as 'Per Tooth' | 'Per Tooth (Package)' | 'Per Session' | 'Per Film' | 'Per Treatment Package',
    tooth_chart_use: 'not needed' as 'required' | 'not needed' | 'optional'
  });

  useEffect(() => {
    if (canViewServices) {
      fetchServicesCatalog(showInactive);
    }
  }, [canViewServices, showInactive]);

  useEffect(() => {
    if (canApproveSuggestions) {
      fetchServiceSuggestions();
    }
  }, [canApproveSuggestions]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  const filteredServices = servicesCatalog.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesActiveFilter = showInactive ? true : service.is_active;
    return matchesSearch && matchesActiveFilter;
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      base_price: '',
      estimated_duration: '',
      buffer_time: '',
      pricing_model: 'Per Session' as 'Per Tooth' | 'Per Tooth (Package)' | 'Per Session' | 'Per Film' | 'Per Treatment Package',
      tooth_chart_use: 'not needed' as 'required' | 'not needed' | 'optional'
    });
    setEditingService(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.description.trim() || !formData.base_price.trim() || !formData.estimated_duration.trim() || !formData.buffer_time.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    const basePrice = parseFloat(formData.base_price);
    const estimatedDuration = parseInt(formData.estimated_duration);
    const bufferTime = parseInt(formData.buffer_time);

    if (isNaN(basePrice) || basePrice <= 0) {
      toast.error('Please enter a valid base price');
      return;
    }

    if (isNaN(estimatedDuration) || estimatedDuration <= 0) {
      toast.error('Please enter a valid estimated duration');
      return;
    }

    if (isNaN(bufferTime) || bufferTime < 0) {
      toast.error('Please enter a valid buffer time');
      return;
    }

    try {
      setIsSubmitting(true);

      const result = await createCatalogService({
        name: formData.name.trim(),
        description: formData.description.trim(),
        base_price: basePrice,
        estimated_duration: estimatedDuration,
        buffer_time: bufferTime,
        pricing_model: formData.pricing_model,
        tooth_chart_use: formData.tooth_chart_use,
        is_active: true
      });

      if (result.success) {
        toast.success('Service created successfully');
        setIsAddDialogOpen(false);
        resetForm();
      } else {
        toast.error(result.error || 'Failed to create service');
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingService) return;

    if (!formData.name.trim() || !formData.description.trim() || !formData.base_price.trim() || !formData.estimated_duration.trim() || !formData.buffer_time.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    const basePrice = parseFloat(formData.base_price);
    const estimatedDuration = parseInt(formData.estimated_duration);
    const bufferTime = parseInt(formData.buffer_time);

    if (isNaN(basePrice) || basePrice <= 0) {
      toast.error('Please enter a valid base price');
      return;
    }

    if (isNaN(estimatedDuration) || estimatedDuration <= 0) {
      toast.error('Please enter a valid estimated duration');
      return;
    }

    if (isNaN(bufferTime) || bufferTime < 0) {
      toast.error('Please enter a valid buffer time');
      return;
    }

    try {
      setIsSubmitting(true);

      const result = await updateCatalogService(editingService.id, {
        name: formData.name.trim(),
        description: formData.description.trim(),
        base_price: basePrice,
        estimated_duration: estimatedDuration,
        buffer_time: bufferTime,
        pricing_model: formData.pricing_model,
        tooth_chart_use: formData.tooth_chart_use
      });

      if (result.success) {
        toast.success('Service updated successfully');
        resetForm();
      } else {
        toast.error(result.error || 'Failed to update service');
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuggestUpdate = async () => {
    if (!selectedServiceForSuggestion || !suggestionText.trim()) {
      toast.error('Please enter a suggestion');
      return;
    }

    try {
      const result = await suggestServiceUpdate(selectedServiceForSuggestion.id, suggestionText.trim());
      
      if (result.success) {
        toast.success('Suggestion submitted successfully');
        setIsSuggestionDialogOpen(false);
        setSuggestionText('');
        setSelectedServiceForSuggestion(null);
      } else {
        toast.error(result.error || 'Failed to submit suggestion');
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
    }
  };

  const handleApproveSuggestion = async () => {
    if (!selectedSuggestion) return;

    try {
      const result = await approveServiceSuggestion(selectedSuggestion.id, reviewNotes);
      
      if (result.success) {
        toast.success('Suggestion approved successfully');
        setIsApproveDialogOpen(false);
        setReviewNotes('');
        setSelectedSuggestion(null);
        fetchServiceSuggestions(); // Refresh suggestions
      } else {
        toast.error(result.error || 'Failed to approve suggestion');
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
    }
  };

  const handleRejectSuggestion = async () => {
    if (!selectedSuggestion) return;

    try {
      const result = await rejectServiceSuggestion(selectedSuggestion.id, reviewNotes);
      
      if (result.success) {
        toast.success('Suggestion rejected');
        setIsRejectDialogOpen(false);
        setReviewNotes('');
        setSelectedSuggestion(null);
        fetchServiceSuggestions(); // Refresh suggestions
      } else {
        toast.error(result.error || 'Failed to reject suggestion');
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'create': return 'Created';
      case 'update': return 'Updated';
      case 'archive': return 'Archived';
      case 'activate': return 'Activated';
      case 'suggest': return 'Suggestion Made';
      case 'suggest_approved': return 'Suggestion Approved';
      case 'suggest_rejected': return 'Suggestion Rejected';
      default: return action;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create': return 'bg-green-100 text-green-800 border-green-200';
      case 'update': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'archive': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'activate': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'suggest': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'suggest_approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'suggest_rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch {
      return 'Unknown';
    }
  };

  const openEditDialog = (service: ServiceCatalogItem) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description,
      base_price: service.base_price.toString(),
      estimated_duration: service.estimated_duration.toString(),
      buffer_time: service.buffer_time.toString(),
      pricing_model: service.pricing_model || 'Per Session',
      tooth_chart_use: service.tooth_chart_use || 'not needed'
    });
  };

  if (!canViewServices) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-500">Access denied. Only staff, dentists, and administrators can access the services catalog.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-CustomPink1">Services Catalog</h1>
          <p className="text-gray-600 mt-1">Manage dental services, pricing, and timing</p>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={refreshAll} variant="outline_pink" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>

          {canViewServices && (
            <Button 
              variant="outline_pink" 
              onClick={() => window.location.href = '/dashboard/services/mappings'} 
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Supply Mappings
            </Button>
          )}

          {canViewLogs && (
            <Button 
              variant="outline_pink" 
              onClick={() => {
                setIsLogsDialogOpen(true);
                fetchServiceLogs();
              }} 
              className="flex items-center gap-2"
            >
              <History className="h-4 w-4" />
              Activity Logs
            </Button>
          )}
          
          {canViewServices && (
            <Button
              onClick={() => setShowInactive(!showInactive)}
              variant="outline_pink"
              className="flex items-center gap-2"
            >
              {showInactive ? 'Show Active Only' : 'Show All Services'}
            </Button>
          )}
          
          {canManageServices && (
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2" onClick={resetForm}>
                  <Plus className="h-4 w-4" />
                  Add Service
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg border-1 border-CustomPink1 bg-CustomPink3">
                <DialogHeader>
                  <DialogTitle className='font-bold text-CustomPink1'>Add New Service</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className='font-bold text-CustomPink1'>Service Name *</Label>
                    <Input
                      className='border-1 border-CustomPink1 bg-CustomPink3'
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter service name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className='font-bold text-CustomPink1'>Description *</Label>
                    <Textarea
                      className='border-1 border-CustomPink1 bg-CustomPink3'
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Enter service description"
                      rows={3}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price" className='font-bold text-CustomPink1'>Base Price (₱) *</Label>
                    <Input
                      className='border-1 border-CustomPink1 bg-CustomPink3'
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.base_price}
                      onChange={(e) => setFormData(prev => ({ ...prev, base_price: e.target.value }))}
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="duration" className='font-bold text-CustomPink1'>Estimated Duration (minutes) *</Label>
                      <Input
                        className='border-1 border-CustomPink1 bg-CustomPink3'
                        id="duration"
                        type="number"
                        min="1"
                        value={formData.estimated_duration}
                        onChange={(e) => setFormData(prev => ({ ...prev, estimated_duration: e.target.value }))}
                        placeholder="60"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="buffer" className='font-bold text-CustomPink1'>Buffer Time (minutes) *</Label>
                      <Input
                        className='border-1 border-CustomPink1 bg-CustomPink3'
                        id="buffer"
                        type="number"
                        min="0"
                        value={formData.buffer_time}
                        onChange={(e) => setFormData(prev => ({ ...prev, buffer_time: e.target.value }))}
                        placeholder="15"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="pricing_model" className='font-bold text-CustomPink1'>Pricing Model *</Label>
                      <Select 
                        value={formData.pricing_model} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, pricing_model: value as any }))}
                      >
                        <SelectTrigger className='border-1 border-CustomPink1 bg-CustomPink3'>
                          <SelectValue placeholder="Select pricing model" />
                        </SelectTrigger>
                        <SelectContent className='border-1 border-CustomPink1 bg-CustomPink3'>
                          <SelectItem value="Per Tooth">Per Tooth</SelectItem>
                          <SelectItem value="Per Tooth (Package)">Per Tooth (Package)</SelectItem>
                          <SelectItem value="Per Session">Per Session</SelectItem>
                          <SelectItem value="Per Film">Per Film</SelectItem>
                          <SelectItem value="Per Treatment Package">Per Treatment Package</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tooth_chart_use" className='font-bold text-CustomPink1'>Tooth Chart Usage *</Label>
                      <Select 
                        value={formData.tooth_chart_use} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, tooth_chart_use: value as any }))}
                      >
                        <SelectTrigger className='border-1 border-CustomPink1 bg-CustomPink3'>
                          <SelectValue placeholder="Select tooth chart usage" />
                        </SelectTrigger>
                        <SelectContent className='border-1 border-CustomPink1 bg-CustomPink3'>
                          <SelectItem value="required">Required</SelectItem>
                          <SelectItem value="optional">Optional</SelectItem>
                          <SelectItem value="not needed">Not Needed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>



                  <div className="flex gap-2">
                    <Button type="submit" disabled={isSubmitting} className="flex-1">
                      {isSubmitting ? 'Creating...' : 'Create Service'}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline_pink" 
                      onClick={() => setIsAddDialogOpen(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            className='pl-10 border-1 border-CustomPink1 bg-CustomPink3'
            placeholder="Search services..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className='border-1 border-CustomPink1 bg-CustomPink3'>
          <CardContent className="flex items-center p-6">
            <Wrench className="h-8 w-8 text-CustomPink1" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Services</p>
              <p className="text-2xl font-bold">{servicesCatalog.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>



      {/* Pending Service Suggestions (Admin Only) */}
      {canApproveSuggestions && serviceSuggestions.filter(s => s.status === 'pending').length > 0 && (
        <Card className="mb-8 border-1 border-CustomPink1 bg-CustomPink3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Pending Service Suggestions ({serviceSuggestions.filter(s => s.status === 'pending').length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {serviceSuggestions.filter(s => s.status === 'pending').map((suggestion) => (
                <div key={suggestion.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{suggestion.serviceName}</span>
                      <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                        Suggestion
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      <span>Suggested by: {suggestion.suggestedByName || suggestion.suggestedBy}</span>
                      <span className="mx-2">•</span>
                      <span>{formatDateTime(suggestion.createdAt)}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">"{suggestion.suggestion}"</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedSuggestion(suggestion);
                        setIsApproveDialogOpen(true);
                      }}
                      className="text-green-600 border-green-200 hover:bg-green-50"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedSuggestion(suggestion);
                        setIsRejectDialogOpen(true);
                      }}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Services Table */}
      <Card className='border-1 border-CustomPink1 bg-CustomPink3'>
        <CardHeader>
          <CardTitle className='font-bold text-CustomPink1'>Services List</CardTitle>
          <p className="text-sm text-gray-600">Manage service catalog, pricing, and timing</p>
        </CardHeader>
        <CardContent>
          {filteredServices.length === 0 ? (
            <div className="text-center py-12">
              <Wrench className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchTerm ? 'No services found matching your search' : 'No services found'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto font-bold">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Base Price</TableHead>
                    <TableHead>Pricing Model</TableHead>
                    <TableHead>Tooth Chart</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Buffer Time</TableHead>

                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredServices.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell className="font-medium">{service.name}</TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate" title={service.description}>
                          {service.description}
                        </div>
                      </TableCell>
                      <TableCell>₱{service.base_price.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {service.pricing_model || 'Per Session'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {service.tooth_chart_use || 'not needed'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 font-bold text-CustomPink1" />
                          {service.estimated_duration}m
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Timer className="h-3 w-3 font-bold text-CustomPink1" />
                          {service.buffer_time}m
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          {canArchiveServices && (
                            <Switch
                              checked={service.is_active}
                              onCheckedChange={async (checked) => {
                                try {
                                  const result = checked 
                                    ? await activateCatalogService(service.id)
                                    : await archiveCatalogService(service.id);
                                  
                                  if (result.success) {
                                    toast.success(`Service ${checked ? 'activated' : 'archived'} successfully`);
                                  } else {
                                    toast.error(result.error || `Failed to ${checked ? 'activate' : 'archive'} service`);
                                  }
                                } catch (error) {
                                  toast.error('Network error. Please try again.');
                                }
                              }}
                            />
                          )}
                          
                          {!canArchiveServices && (
                            <Badge variant={service.is_active ? "default" : "secondary"}>
                              {service.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {canEditServices && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline_pink"
                                  onClick={() => openEditDialog(service)}
                                >
                                  <Edit3 className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-lg">
                                <DialogHeader>
                                  <DialogTitle>Edit Service</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleEditSubmit} className="space-y-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="edit-name">Service Name *</Label>
                                    <Input
                                      id="edit-name"
                                      value={formData.name}
                                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                      placeholder="Enter service name"
                                      required
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <Label htmlFor="edit-description">Description *</Label>
                                    <Textarea
                                      id="edit-description"
                                      value={formData.description}
                                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                      placeholder="Enter service description"
                                      rows={3}
                                      required
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <Label htmlFor="edit-price">Base Price (₱) *</Label>
                                    <Input
                                      id="edit-price"
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={formData.base_price}
                                      onChange={(e) => setFormData(prev => ({ ...prev, base_price: e.target.value }))}
                                      placeholder="0.00"
                                      required
                                    />
                                  </div>

                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <Label htmlFor="edit-duration">Estimated Duration (minutes) *</Label>
                                      <Input
                                        id="edit-duration"
                                        type="number"
                                        min="1"
                                        value={formData.estimated_duration}
                                        onChange={(e) => setFormData(prev => ({ ...prev, estimated_duration: e.target.value }))}
                                        placeholder="60"
                                        required
                                      />
                                    </div>

                                    <div className="space-y-2">
                                      <Label htmlFor="edit-buffer">Buffer Time (minutes) *</Label>
                                      <Input
                                        id="edit-buffer"
                                        type="number"
                                        min="0"
                                        value={formData.buffer_time}
                                        onChange={(e) => setFormData(prev => ({ ...prev, buffer_time: e.target.value }))}
                                        placeholder="15"
                                        required
                                      />
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <Label htmlFor="edit-pricing_model">Pricing Model *</Label>
                                      <Select 
                                        value={formData.pricing_model} 
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, pricing_model: value as any }))}
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select pricing model" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="Per Tooth">Per Tooth</SelectItem>
                                          <SelectItem value="Per Tooth (Package)">Per Tooth (Package)</SelectItem>
                                          <SelectItem value="Per Session">Per Session</SelectItem>
                                          <SelectItem value="Per Film">Per Film</SelectItem>
                                          <SelectItem value="Per Treatment Package">Per Treatment Package</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>

                                    <div className="space-y-2">
                                      <Label htmlFor="edit-tooth_chart_use">Tooth Chart Usage *</Label>
                                      <Select 
                                        value={formData.tooth_chart_use} 
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, tooth_chart_use: value as any }))}
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select tooth chart usage" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="required">Required</SelectItem>
                                          <SelectItem value="optional">Optional</SelectItem>
                                          <SelectItem value="not needed">Not Needed</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>



                                  <div className="flex gap-2">
                                    <Button type="submit" disabled={isSubmitting} className="flex-1">
                                      {isSubmitting ? 'Updating...' : 'Update Service'}
                                    </Button>
                                    <Button 
                                      type="button" 
                                      variant="outline" 
                                      onClick={resetForm}
                                      className="flex-1"
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </form>
                              </DialogContent>
                            </Dialog>
                          )}

                          {(canViewServices && !canManageServices) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedServiceForSuggestion(service);
                                setIsSuggestionDialogOpen(true);
                              }}
                            >
                              Suggest
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

      {/* Suggestion Dialog */}
      <Dialog open={isSuggestionDialogOpen} onOpenChange={setIsSuggestionDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Suggest Service Update</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedServiceForSuggestion && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium">{selectedServiceForSuggestion.name}</p>
                <p className="text-sm text-gray-600">{selectedServiceForSuggestion.description}</p>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="suggestion">Your Suggestion *</Label>
              <Textarea
                id="suggestion"
                value={suggestionText}
                onChange={(e) => setSuggestionText(e.target.value)}
                placeholder="Describe what changes you would like to suggest for this service..."
                rows={4}
                required
              />
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleSuggestUpdate}
                disabled={!suggestionText.trim()}
                className="flex-1"
              >
                Submit Suggestion
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsSuggestionDialogOpen(false);
                  setSuggestionText('');
                  setSelectedServiceForSuggestion(null);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Activity Logs Dialog */}
      <Dialog open={isLogsDialogOpen} onOpenChange={setIsLogsDialogOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[80vh] border-1 border-CustomPink1 bg-CustomPink3">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-bold text-CustomPink1">
              <History className="h-5 w-5" />
              Service Catalog Activity Logs
            </DialogTitle>
            <DialogDescription>
              Recent service changes and activities
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-auto">
            <Table className='font-bold'>
              <TableHeader>
                <TableRow>
                  <TableHead className='text-CustomPink1'>Service</TableHead>
                  <TableHead className='text-CustomPink1'>Action</TableHead>
                  <TableHead className='text-CustomPink1'>Changed By</TableHead>
                  <TableHead className='text-CustomPink1'>Changes</TableHead>
                  <TableHead className='text-CustomPink1'>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {serviceLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">{log.serviceName}</TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={getActionColor(log.action)}
                      >
                        {getActionLabel(log.action)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {log.changedByName || log.changedBy}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">{log.changes}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {formatDateTime(log.timestamp)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
                {serviceLogs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      No activity logs found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      {/* Approve Suggestion Dialog */}
      <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Approve Service Suggestion</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this suggestion?
            </DialogDescription>
          </DialogHeader>
          {selectedSuggestion && (
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium">{selectedSuggestion.serviceName}</p>
                <p className="text-sm text-gray-600 mt-1">"{selectedSuggestion.suggestion}"</p>
                <p className="text-xs text-gray-500 mt-1">
                  Suggested by: {selectedSuggestion.suggestedByName || selectedSuggestion.suggestedBy}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="review-notes">Review Notes (Optional)</Label>
                <Textarea
                  id="review-notes"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add any notes about this approval..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={handleApproveSuggestion}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Approve
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsApproveDialogOpen(false);
                    setReviewNotes('');
                    setSelectedSuggestion(null);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Suggestion Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Reject Service Suggestion</DialogTitle>
            <DialogDescription>
              Are you sure you want to reject this suggestion?
            </DialogDescription>
          </DialogHeader>
          {selectedSuggestion && (
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium">{selectedSuggestion.serviceName}</p>
                <p className="text-sm text-gray-600 mt-1">"{selectedSuggestion.suggestion}"</p>
                <p className="text-xs text-gray-500 mt-1">
                  Suggested by: {selectedSuggestion.suggestedByName || selectedSuggestion.suggestedBy}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="reject-notes">Rejection Reason (Optional)</Label>
                <Textarea
                  id="reject-notes"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Explain why this suggestion is being rejected..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={handleRejectSuggestion}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  <X className="h-4 w-4 mr-1" />
                  Reject
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsRejectDialogOpen(false);
                    setReviewNotes('');
                    setSelectedSuggestion(null);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="mt-8 p-4 rounded-lg border-1 border-CustomPink1 bg-CustomPink3">
        <h3 className="font-medium text-CustomPink1 mb-2">Services Catalog Management</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• <strong>Admin:</strong> Can add, edit, archive/activate services</li>
          <li>• <strong>Staff & Dentist:</strong> Can view services and suggest updates</li>
          <li>• Base prices are in Philippine Peso (₱) and used as defaults for billing</li>
          <li>• Estimated duration helps with appointment scheduling and time management</li>
          <li>• Buffer time includes preparation, cleanup, and transition between appointments</li>
          <li>• Services with treatment details may require additional documentation</li>
          <li>• Inactive services are archived but preserved for historical appointments</li>
        </ul>
      </div>
    </div>
  );
}