'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../../components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { Separator } from '../../../../components/ui/separator';
import { LoadingSpinner } from '../../../../components/LoadingSpinner';
import { toast } from 'sonner';
import { useAuth } from '../../../../contexts/AuthContext';
import { useServices } from '../../../../contexts/ServiceContext';
import { ServiceCatalogItem } from '../../../../types';
import { projectId, publicAnonKey } from '../../../../utils/supabase/info';
import { Trash2, Plus, Settings, Eye, Edit } from 'lucide-react';

interface ServiceInventoryMapping {
  id: string;
  service_id: string;
  inventory_item_id: string;
  quantity_required: number;
  inventory_item?: {
    id: string;
    itemName?: string; // Make it optional to handle both cases
    name?: string; // Legacy support
    item_name?: string; // Raw data support
    unit: string;
    quantity: number;
  };
  created_at: string;
  updated_at: string;
}

interface InventoryItem {
  id: string;
  itemName: string;
  category: string;
  quantity: number;
  unit: string;
  purchaseUnit: string;
  conversionFactor: number;
  minThreshold: number;
  maxThreshold: number;
  lastRestocked?: string;
  createdAt: string;
  updatedAt?: string;
}

// Using ServiceCatalogItem from types

export default function ServiceInventoryMappingsPage(): React.JSX.Element {
  const { user } = useAuth();
  const { servicesCatalog: services } = useServices();
  const [mappings, setMappings] = useState<Record<string, ServiceInventoryMapping[]>>({});
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<ServiceCatalogItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddingItem, setIsAddingItem] = useState(false);
  
  // Form state for adding new mapping
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('1');
  
  // State for inline editing
  const [editingMapping, setEditingMapping] = useState<string | null>(null);
  const [editQuantity, setEditQuantity] = useState<string>('');

  const canEdit = user?.role === 'admin' || user?.role === 'dentist';

  useEffect(() => {
    if (user) {
      loadInitialData();
    }
  }, [user]);

  const loadInitialData = async (): Promise<void> => {
    try {
      setLoading(true);
      await Promise.all([
        loadInventoryItems(),
        loadAllMappings()
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get inventory item details by ID
  const getInventoryItemById = (itemId: string): InventoryItem | null => {
    return inventoryItems.find(item => item.id === itemId) || null;
  };

  // Helper function to get display name for inventory item
  const getInventoryItemDisplayName = (mapping: ServiceInventoryMapping): string => {
    // First try the inventory_item from the mapping
    if (mapping.inventory_item?.itemName) return mapping.inventory_item.itemName;
    if (mapping.inventory_item?.name) return mapping.inventory_item.name;
    if (mapping.inventory_item?.item_name) return mapping.inventory_item.item_name;
    
    // Fallback to looking up in local inventory items
    const item = getInventoryItemById(mapping.inventory_item_id);
    if (item?.itemName) return item.itemName;
    
    return 'Unknown Item';
  };

  // Helper function to get unit for inventory item
  const getInventoryItemUnit = (mapping: ServiceInventoryMapping): string => {
    // First try the inventory_item from the mapping
    if (mapping.inventory_item?.unit) return mapping.inventory_item.unit;
    
    // Fallback to looking up in local inventory items
    const item = getInventoryItemById(mapping.inventory_item_id);
    if (item?.unit) return item.unit;
    
    return 'units';
  };

  // Helper function to get quantity for inventory item
  const getInventoryItemQuantity = (mapping: ServiceInventoryMapping): number => {
    // First try the inventory_item from the mapping
    if (mapping.inventory_item?.quantity !== undefined) return mapping.inventory_item.quantity;
    
    // Fallback to looking up in local inventory items
    const item = getInventoryItemById(mapping.inventory_item_id);
    if (item?.quantity !== undefined) return item.quantity;
    
    return 0;
  };

  const loadInventoryItems = async (): Promise<void> => {
    try {
      // The inventory API doesn't need user params, it handles authentication internally
      const response = await fetch('/api/inventory?includeRequests=false&includeLogs=false');
      if (!response.ok) {
        throw new Error(`Failed to fetch inventory: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Inventory API response:', data);
      
      // The API returns items in data.items, not data.inventory
      const items = data.items || [];
      
      // All items from the API are considered active (no is_active field in the transformed data)
      setInventoryItems(items);
      
      console.log('Loaded inventory items:', items);
    } catch (error) {
      console.error('Error loading inventory:', error);
      // Set empty array on error to prevent undefined issues
      setInventoryItems([]);
    }
  };

  const loadAllMappings = async (): Promise<void> => {
    try {
      const params = new URLSearchParams({
        userEmail: user?.email || '',
        userRole: user?.role || '',
      });

      // Try the API route first (more reliable)
      console.log('Fetching mappings from API route:', `/api/service-inventory-mappings?${params}`);
      let response = await fetch(`/api/service-inventory-mappings?${params}`);
      
      // If API route fails, try direct Supabase call
      if (!response.ok) {
        console.warn(`API route failed with status ${response.status}: ${response.statusText}`);
        console.log('Trying direct Supabase call to:', `https://${projectId}.supabase.co/functions/v1/make-server-c89a26e4/service-inventory-mappings?${params}`);
        response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-c89a26e4/service-inventory-mappings?${params}`, {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
        });
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch mappings: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Mappings API response:', data);
      
      // Group mappings by service_id
      const mappingsGrouped: Record<string, ServiceInventoryMapping[]> = {};
      (data.mappings || []).forEach((mapping: ServiceInventoryMapping) => {
        if (!mappingsGrouped[mapping.service_id]) {
          mappingsGrouped[mapping.service_id] = [];
        }
        mappingsGrouped[mapping.service_id].push(mapping);
      });
      
      setMappings(mappingsGrouped);
      console.log('Loaded mappings:', mappingsGrouped);
    } catch (error) {
      console.error('Error loading mappings:', error);
      // Set empty mappings on error to prevent undefined issues
      setMappings({});
    }
  };

  const loadServiceMappings = async (serviceId: string): Promise<void> => {
    try {
      const params = new URLSearchParams({
        userEmail: user?.email || '',
        userRole: user?.role || '',
        serviceId: serviceId,
      });

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-c89a26e4/service-inventory-mappings?${params}`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to fetch service mappings');
      
      const data = await response.json();
      setMappings(prev => ({
        ...prev,
        [serviceId]: data.mappings || []
      }));
    } catch (error) {
      console.error('Error loading service mappings:', error);
      toast.error('Failed to load service mappings');
    }
  };

  const handleManageSupplies = async (service: ServiceCatalogItem): Promise<void> => {
    setSelectedService(service);
    setIsModalOpen(true);
    
    // Ensure inventory items are loaded
    if (inventoryItems.length === 0) {
      await loadInventoryItems();
    }
    
    // Load mappings for this service if not already loaded
    if (!mappings[service.id]) {
      await loadServiceMappings(service.id);
    }
  };

  const handleAddMapping = async (): Promise<void> => {
    if (!selectedService || !selectedInventoryItem || !quantity) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      setIsAddingItem(true);

      // Try the API route first (more reliable)
      let response = await fetch('/api/service-inventory-mappings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serviceId: selectedService.id,
          inventoryItemId: selectedInventoryItem,
          quantityRequired: parseInt(quantity),
          userEmail: user?.email,
          userRole: user?.role,
        }),
      });
      
      // If API route fails, try direct Supabase call
      if (!response.ok) {
        console.warn('API route failed, trying direct Supabase call');
        response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-c89a26e4/service-inventory-mappings`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            serviceId: selectedService.id,
            inventoryItemId: selectedInventoryItem,
            quantityRequired: parseInt(quantity),
            userEmail: user?.email,
            userRole: user?.role,
          }),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create mapping');
      }

      const result = await response.json();
      toast.success('Inventory item mapped successfully');
      
      // Update local state with the new mapping (which includes full inventory item details)
      if (result.mapping) {
        let newMapping = result.mapping;
        
        // If the server didn't return full inventory item details, populate them from local state
        if (!newMapping.inventory_item || !newMapping.inventory_item.itemName) {
          const inventoryItem = getInventoryItemById(selectedInventoryItem);
          if (inventoryItem) {
            newMapping = {
              ...newMapping,
              inventory_item: inventoryItem
            };
          }
        }
        
        setMappings(prev => ({
          ...prev,
          [selectedService.id]: [
            ...(prev[selectedService.id] || []),
            newMapping
          ]
        }));
      }
      
      // Reset form
      setSelectedInventoryItem('');
      setQuantity('1');
      
    } catch (error) {
      console.error('Error adding mapping:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add mapping');
    } finally {
      setIsAddingItem(false);
    }
  };

  const handleDeleteMapping = async (serviceId: string, inventoryItemId: string): Promise<void> => {
    try {
      const params = new URLSearchParams({
        userEmail: user?.email || '',
        userRole: user?.role || '',
      });

      // Try the API route first (more reliable)
      let response = await fetch(`/api/service-inventory-mappings/${serviceId}/${inventoryItemId}?${params}`, {
        method: 'DELETE',
      });
      
      // If API route fails, try direct Supabase call
      if (!response.ok) {
        console.warn('API route failed, trying direct Supabase call');
        response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-c89a26e4/service-inventory-mappings/${serviceId}/${inventoryItemId}?${params}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete mapping');
      }

      toast.success('Mapping removed successfully');
      
      // Reload mappings for this service
      await loadServiceMappings(serviceId);
      
    } catch (error) {
      console.error('Error deleting mapping:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to remove mapping');
    }
  };

  const handleEditQuantity = (mappingKey: string, currentQuantity: number): void => {
    setEditingMapping(mappingKey);
    setEditQuantity(currentQuantity.toString());
  };

  const handleSaveQuantity = async (serviceId: string, inventoryItemId: string): Promise<void> => {
    if (!editQuantity || parseInt(editQuantity) <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-c89a26e4/service-inventory-mappings/${serviceId}/${inventoryItemId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quantityRequired: parseInt(editQuantity),
          userEmail: user?.email,
          userRole: user?.role,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update mapping');
      }

      toast.success('Quantity updated successfully');
      setEditingMapping(null);
      setEditQuantity('');
      
      // Reload mappings for this service
      await loadServiceMappings(serviceId);
      
    } catch (error) {
      console.error('Error updating mapping:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update quantity');
    }
  };

  const handleCancelEdit = (): void => {
    setEditingMapping(null);
    setEditQuantity('');
  };

  const availableInventoryItems = inventoryItems.filter(item => 
    selectedService && 
    !mappings[selectedService.id]?.some(mapping => mapping.inventory_item_id === item.id)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="mb-2 font-bold text-CustomPink1">Service-Inventory Mappings</h1>
        <p className="text-muted-foreground font-bold text-CustomPink1">
          Manage which inventory items are consumed when services are completed.
          {canEdit ? ' As an admin or dentist, you can add, edit, and remove mappings.' : ' You have view-only access to see which supplies are linked to services.'}
        </p>
      </div>

      <Card className='rounded-lg border-1 border-CustomPink1 bg-CustomPink3'>
        <CardHeader>
          <CardTitle className='font-bold text-CustomPink1'>Services</CardTitle>
          <CardDescription>
            Click "Manage Supplies" to configure which inventory items each service consumes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='font-bold text-CustomPink1'>Service Name</TableHead>
                <TableHead className='font-bold text-CustomPink1'>Status</TableHead>
                <TableHead className='font-bold text-CustomPink1'>Mapped Items</TableHead>
                <TableHead className='font-bold text-CustomPink1'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className='font-bold'>
              {services.map((service) => (
                <TableRow key={service.id}>
                  <TableCell>
                    <div>{service.name}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={service.is_active ? "default" : "secondary"}>
                      {service.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {mappings[service.id]?.length || 0} items mapped
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline_pink"
                      size="sm"
                      onClick={() => handleManageSupplies(service)}
                    >
                      {canEdit ? (
                        <>
                          <Settings className="w-4 h-4 mr-2" />
                          Manage Supplies
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4 mr-2" />
                          View Supplies
                        </>
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Manage Supplies Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className='font-bold text-CustomPink1'>
              Service–Inventory Mapping: {selectedService?.name}
            </DialogTitle>
            <DialogDescription>
              {canEdit 
                ? 'Configure which inventory items are consumed when this service is completed. As an admin or dentist, you can add, edit, and remove mappings.'
                : 'View which inventory items are consumed when this service is completed. As staff, you have view-only access.'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Mapped Items Section */}
            <div>
              <h3 className="mb-4 font-bold text-CustomPink1">Mapped Items</h3>
              {selectedService && mappings[selectedService.id]?.length > 0 ? (
                <div className="space-y-3">
                  {mappings[selectedService.id].map((mapping) => {
                    const mappingKey = `${mapping.service_id}-${mapping.inventory_item_id}`;
                    const isEditing = editingMapping === mappingKey;
                    
                    return (
                      <div
                        key={mappingKey}
                        className="flex items-center justify-between p-3 rounded-lg border-1 border-CustomPink1 bg-CustomPink3"
                      >
                        <div className="flex-1">
                          <div className="font-medium">
                            {getInventoryItemDisplayName(mapping)}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-2 ">
                            {isEditing && canEdit ? (
                              <div className="flex items-center gap-2">
                                <Input 
                                  className='w-20 h-8 rounded-lg border-1 border-CustomPink1 bg-CustomPink3'
                                  type="number"
                                  min="1"
                                  value={editQuantity}
                                  onChange={(e) => setEditQuantity(e.target.value)}
                                />
                                <span>x {getInventoryItemUnit(mapping)} required per service</span>
                                <Button
                                  size="sm"
                                  onClick={() => handleSaveQuantity(mapping.service_id, mapping.inventory_item_id)}
                                  className="h-8 px-2"
                                >
                                  Save
                                </Button>
                                <Button
                                  className='h-8 px-2'
                                  size="sm"
                                  variant="outline_pink"
                                  onClick={handleCancelEdit}
                                >
                                  Cancel
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 font-bold">
                                <span>{mapping.quantity_required}x {getInventoryItemUnit(mapping)} required per service</span>
                                {canEdit && (
                                  <Button
                                    className='h-6 w-6 p-0'
                                    size="sm"
                                    variant="ghost_pink"
                                    onClick={() => handleEditQuantity(mappingKey, mapping.quantity_required)}
                                  >
                                    <Edit className="w-3 h-3 font-bold text-CustomPink1" />
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground font-bold">
                            Available: {getInventoryItemQuantity(mapping)} {getInventoryItemUnit(mapping)}
                          </div>
                        </div>
                        {canEdit && !isEditing && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteMapping(mapping.service_id, mapping.inventory_item_id)}
                          >
                            <Trash2 className="w-4 h-4 font-bold text-CustomPink1" />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground font-bold">
                  No inventory items mapped to this service yet.
                </div>
              )}
            </div>

            {canEdit && (
              <>
                <Separator />

                {/* Add Item Section */}
                <div>
                  <h3 className="mb-4 font-bold text-CustomPink1">Add Item</h3>
                  <div className="space-y-4 ">
                    <div>
                      <Label htmlFor="inventory-item" className='font-bold text-CustomPink1'>Inventory Item</Label>
                      <Select value={selectedInventoryItem} onValueChange={setSelectedInventoryItem}>
                        <SelectTrigger className='rounded-lg border-1 border-CustomPink1 bg-CustomPink3'>
                          <SelectValue placeholder={
                            inventoryItems.length === 0 
                              ? "Loading inventory items..." 
                              : availableInventoryItems.length === 0
                                ? "No available items (all items already mapped)"
                                : "Select an inventory item"
                          } />
                        </SelectTrigger>
                        <SelectContent className='rounded-lg border-1 border-CustomPink1 bg-CustomPink3'>
                          {availableInventoryItems.length > 0 ? (
                            availableInventoryItems.map((item) => (
                              <SelectItem key={item.id} value={item.id}>
                                {item.itemName} ({item.quantity} {item.unit} available)
                              </SelectItem>
                            ))
                          ) : (
                            <div className="px-3 py-2 text-sm text-muted-foreground">
                              {inventoryItems.length === 0 
                                ? "Loading inventory items..."
                                : "No available inventory items to map"
                              }
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                      
                      {/* Debug info - remove in production */}
                      <div className="text-xs text-muted-foreground mt-1 font-bold">
                        Total inventory items: {inventoryItems.length}, Available: {availableInventoryItems.length}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="quantity" className='font-bold text-CustomPink1'>Quantity Required</Label>
                      <Input
                        className='rounded-lg border-1 border-CustomPink1 bg-CustomPink3'
                        id="quantity"
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        placeholder="Enter quantity"
                      />
                    </div>

                    <Button
                      onClick={handleAddMapping}
                      disabled={!selectedInventoryItem || !quantity || isAddingItem}
                    >
                      {isAddingItem ? (
                        <>
                          <LoadingSpinner />
                          Adding...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Add to Service
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}