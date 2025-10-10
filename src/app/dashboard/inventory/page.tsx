'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Badge } from '../../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '../../../components/ui/dialog';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Package, Plus, RefreshCw, AlertTriangle, TrendingUp, PackagePlus, ArrowUp, AlertCircle, CheckCircle, Edit, History, Clock, User, FileText, Check, X, Wifi, WifiOff, Timer } from 'lucide-react';
import { format } from 'date-fns';
import useSWR from 'swr';
import { toast } from 'sonner';
import { Textarea } from '../../../components/ui/textarea';

interface InventoryItem {
  id: string;
  itemName: string;
  category: string;
  quantity: number;          // always in usage units (pieces)
  unit: string;              // usage unit, e.g., "pcs"
  purchaseUnit: string;      // e.g., "box"
  conversionFactor: number;  // pieces per box
  minThreshold: number;      // in usage units
  maxThreshold: number;      // in usage units
  lastRestocked: string;
  createdAt: string;
  updatedAt: string;
}

interface RestockRequest {
  id: string;
  itemId: string;
  itemName: string;
  purchaseQuantity: number;
  usageQuantity: number;
  notes?: string;
  requestedBy: string;
  requestedByName: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  reviewNotes?: string;
}

interface InventoryLog {
  id: string;
  itemId: string;
  itemName: string;
  action: 'add' | 'edit' | 'restock' | 'restock_request' | 'restock_approved' | 'restock_rejected';
  changedBy: string;
  changedByName: string;
  changes: string;
  timestamp: string;
}

interface InventoryResponse {
  items: InventoryItem[];
  restockRequests?: RestockRequest[];
  logs?: InventoryLog[];
  timestamp?: number;
  queryTime?: number;
}

interface AddItemFormData {
  itemName: string;
  category: string;
  purchaseQuantity: number;  // quantity in purchase units
  unit: string;              // usage unit
  purchaseUnit: string;      // purchase unit
  conversionFactor: number;  // usage units per purchase unit
  minThreshold: number;      // in usage units
  maxThreshold: number;      // in usage units
}

interface RestockFormData {
  itemId: string;
  purchaseQuantity: number;  // quantity in purchase units
  notes?: string;
}

interface EditItemFormData {
  itemName: string;
  category: string;
  unit: string;              // usage unit
  purchaseUnit: string;      // purchase unit
  conversionFactor: number;  // usage units per purchase unit
  minThreshold: number;      // in usage units
  maxThreshold: number;      // in usage units
}

// Performance monitoring
interface PerformanceMetrics {
  revalidationCount: number;
  slowRevalidations: number;
  averageRevalidationTime: number;
  lastRevalidationTime: number;
}

// Enhanced SWR fetcher with performance monitoring
const fetchInventory = async (url: string): Promise<InventoryResponse> => {
  const startTime = performance.now();
  
  try {
    // Create timeout controller for broader browser support
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      // Try to get error details from response
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch {
        // If can't parse as JSON, use status text
      }
      throw new Error(errorMessage);
    }
    
    // Check if response is actually JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('[INVENTORY ERROR] Expected JSON, got:', text.substring(0, 200));
      throw new Error('Server returned non-JSON response. Please check server status.');
    }
    
    const data = await response.json();
    const endTime = performance.now();
    const queryTime = endTime - startTime;
    
    // Client-side performance monitoring
    if (queryTime > 2000) {
      console.warn(`[INVENTORY PERFORMANCE] Slow revalidation detected: ${queryTime.toFixed(2)}ms`);
    }
    
    return {
      ...data,
      timestamp: Date.now(),
      queryTime: queryTime
    };
  } catch (error) {
    const endTime = performance.now();
    const queryTime = endTime - startTime;
    
    // Better error classification
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.error(`[INVENTORY ERROR] Request timeout after ${queryTime.toFixed(2)}ms`);
        throw new Error('Request timed out. Please try again.');
      } else if (error.message.includes('Failed to fetch')) {
        console.error(`[INVENTORY ERROR] Network error after ${queryTime.toFixed(2)}ms:`, error);
        throw new Error('Network error. Please check your connection.');
      }
    }
    
    console.error(`[INVENTORY ERROR] Fetch failed in ${queryTime.toFixed(2)}ms:`, error);
    throw error;
  }
};

// Debounce utility with proper useRef initialization
const useDebounce = (callback: (...args: any[]) => void, delay: number) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  return useCallback((...args: any[]) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);
};

// Throttle utility
const useThrottle = (callback: (...args: any[]) => void, delay: number) => {
  const lastCallRef = useRef<number>(0);
  
  return useCallback((...args: any[]) => {
    const now = Date.now();
    if (now - lastCallRef.current >= delay) {
      lastCallRef.current = now;
      callback(...args);
    }
  }, [callback, delay]);
};

export default function InventoryPage() {
  const { user } = useAuth();
  const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false);
  const [isRestockDialogOpen, setIsRestockDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isLogsDialogOpen, setIsLogsDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<RestockRequest | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [restockingItems, setRestockingItems] = useState<Set<string>>(new Set());
  const [reviewNotes, setReviewNotes] = useState('');
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  
  // Performance monitoring state
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    revalidationCount: 0,
    slowRevalidations: 0,
    averageRevalidationTime: 0,
    lastRevalidationTime: 0
  });
  
  // Connection status tracking
  const [isOnline, setIsOnline] = useState(true);
  const [lastDataUpdate, setLastDataUpdate] = useState<number>(Date.now());
  
  // Smart refresh state
  const [retryCount, setRetryCount] = useState(0);
  const [isAutoRetrying, setIsAutoRetrying] = useState(false);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Form states
  const [addItemForm, setAddItemForm] = useState<AddItemFormData>({
    itemName: '',
    category: '',
    purchaseQuantity: 0,
    unit: 'pcs',
    purchaseUnit: '',
    conversionFactor: 1,
    minThreshold: 0,
    maxThreshold: 0,
  });

  const [restockForm, setRestockForm] = useState<RestockFormData>({
    itemId: '',
    purchaseQuantity: 0,
    notes: '',
  });

  const [editItemForm, setEditItemForm] = useState<EditItemFormData>({
    itemName: '',
    category: '',
    unit: 'pcs',
    purchaseUnit: '',
    conversionFactor: 1,
    minThreshold: 0,
    maxThreshold: 0,
  });

  // Role-based permissions
  const canView = user?.role === 'admin' || user?.role === 'staff' || user?.role === 'dentist';
  const canAddItem = user?.role === 'admin';
  const canEditItem = user?.role === 'admin';
  const canRestock = user?.role === 'admin' || user?.role === 'staff';
  const canApproveRestock = user?.role === 'admin';
  const canViewLogs = user?.role === 'admin' || user?.role === 'staff' || user?.role === 'dentist';

  // Monitor connection status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Enhanced SWR configuration with all optimizations
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    canView ? '/api/inventory' : null,
    fetchInventory,
    {
      // 1. SWR Configuration Tuning
      refreshInterval: 15000, // Reduced to 15 seconds
      revalidateOnFocus: false, // Disabled to prevent spam
      revalidateOnReconnect: true,
      dedupingInterval: 10000, // Increased to 10 seconds
      errorRetryCount: 2, // Reduced to 2 max
      errorRetryInterval: 2000,
      keepPreviousData: true,
      
      // Enhanced error handling
      onError: (error) => {
        console.error('[INVENTORY SWR] Fetch error:', error);
        setPerformanceMetrics(prev => ({
          ...prev,
          revalidationCount: prev.revalidationCount + 1
        }));
      },
      
      // Performance monitoring
      onSuccess: (data) => {
        const now = Date.now();
        const revalidationTime = data.queryTime || 0;
        
        setPerformanceMetrics(prev => {
          const newCount = prev.revalidationCount + 1;
          const newAverage = (prev.averageRevalidationTime * prev.revalidationCount + revalidationTime) / newCount;
          
          return {
            revalidationCount: newCount,
            slowRevalidations: revalidationTime > 2000 ? prev.slowRevalidations + 1 : prev.slowRevalidations,
            averageRevalidationTime: newAverage,
            lastRevalidationTime: revalidationTime
          };
        });
        
        setLastDataUpdate(now);
        setRetryCount(0); // Reset retry counter on successful load
        setIsAutoRetrying(false);
      }
    }
  );

  const items = data?.items || [];
  const restockRequests = data?.restockRequests || [];
  const logs = data?.logs || [];

  // Filter pending requests
  const pendingRequests = restockRequests.filter(r => r.status === 'pending');

  // Calculate stats with category breakdown
  const totalItems = items.length;
  const lowStockItems = items.filter(item => item.quantity <= item.minThreshold);
  const outOfStockItems = items.filter(item => item.quantity === 0);
  const wellStockedItems = items.filter(item => item.quantity > item.minThreshold);

  // Smart manual refresh with throttling
  const handleRefreshThrottled = useThrottle(async () => {
    const dataAge = Date.now() - lastDataUpdate;
    
    // Check if data is stale (older than 3 seconds) and needs refresh
    if (dataAge > 3000 && retryCount === 0) {
      setIsAutoRetrying(true);
      setRetryCount(1);
      
      // Schedule automatic retry after 3 seconds
      refreshTimeoutRef.current = setTimeout(() => {
        mutate();
        setIsAutoRetrying(false);
      }, 3000);
    } else {
      // Manual refresh
      mutate();
    }
  }, 2000); // 2-second minimum between calls

  // Debounced refresh button
  const handleRefresh = useDebounce(handleRefreshThrottled, 1000);

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  // Category breakdown for stats
  const getTopCategories = (itemList: InventoryItem[]) => {
    const categoryCount = itemList.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(categoryCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([category, count]) => `${category} (${count})`)
      .join(', ');
  };

  // Helper functions for unit conversion
  const convertToUsageUnits = (purchaseQty: number, conversionFactor: number) => {
    return purchaseQty * conversionFactor;
  };

  const convertToPurchaseUnits = (usageQty: number, conversionFactor: number) => {
    return Math.ceil(usageQty / conversionFactor);
  };

  const formatConversion = (purchaseQty: number, conversionFactor: number, purchaseUnit: string, usageUnit: string) => {
    const usageQty = convertToUsageUnits(purchaseQty, conversionFactor);
    return `${purchaseQty} ${purchaseUnit}${purchaseQty !== 1 ? 's' : ''} → ${usageQty} ${usageUnit}`;
  };

  // Suggested thresholds based on typical stock
  const getSuggestedThresholds = (category: string, totalUsageUnits: number) => {
    let minPercentage = 0.25; // 25% default
    let maxMultiplier = 2; // 2x default

    // Category-specific suggestions
    switch (category) {
      case 'consumables':
      case 'hygiene':
        minPercentage = 0.30; // 30% for high-usage items
        maxMultiplier = 2.5;
        break;
      case 'medications':
        minPercentage = 0.20; // 20% for controlled items
        maxMultiplier = 1.5;
        break;
      case 'equipment':
      case 'instruments':
        minPercentage = 0.15; // 15% for durable items
        maxMultiplier = 1.2;
        break;
    }

    return {
      min: Math.ceil(totalUsageUnits * minPercentage),
      max: Math.ceil(totalUsageUnits * maxMultiplier)
    };
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return 'Unknown';
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch {
      return 'Unknown';
    }
  };

  const getStockStatus = (item: InventoryItem) => {
    if (item.quantity === 0) {
      return { status: 'out-of-stock', label: 'Out of Stock', color: 'bg-red-100 text-red-800 border-red-200' };
    } else if (item.quantity <= item.minThreshold) {
      return { status: 'low-stock', label: 'Low Stock', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
    } else if (item.quantity >= item.maxThreshold) {
      return { status: 'overstocked', label: 'Overstocked', color: 'bg-blue-100 text-blue-800 border-blue-200' };
    } else {
      return { status: 'in-stock', label: 'In Stock', color: 'bg-green-100 text-green-800 border-green-200' };
    }
  };

  // Enhanced operations with timeout and optimistic updates
  const performOperationWithTimeout = async (
    operation: () => Promise<any>,
    optimisticUpdate: () => void,
    rollbackUpdate: () => void,
    successMessage: string,
    errorMessage: string,
    timeout: number = 8000
  ) => {
    const timeoutId = setTimeout(() => {
      rollbackUpdate();
      toast.error(`Operation timed out after ${timeout / 1000} seconds. Rolling back changes.`);
      // Force server refresh after rollback
      setTimeout(() => mutate(), 500);
    }, timeout);

    try {
      optimisticUpdate();
      const result = await operation();
      clearTimeout(timeoutId);
      toast.success(successMessage);
      return result;
    } catch (error) {
      clearTimeout(timeoutId);
      rollbackUpdate();
      toast.error(errorMessage);
      throw error;
    }
  };

  const handleAddItem = async () => {
    if (!canAddItem || isSubmitting) return;

    setIsSubmitting(true);
    
    // Convert purchase quantity to usage units
    const totalUsageUnits = convertToUsageUnits(addItemForm.purchaseQuantity, addItemForm.conversionFactor);
    
    // Create optimistic item
    const optimisticItem: InventoryItem = {
      id: `temp-${Date.now()}`, // Temporary ID
      itemName: addItemForm.itemName,
      category: addItemForm.category,
      quantity: totalUsageUnits,
      unit: addItemForm.unit,
      purchaseUnit: addItemForm.purchaseUnit,
      conversionFactor: addItemForm.conversionFactor,
      minThreshold: addItemForm.minThreshold,
      maxThreshold: addItemForm.maxThreshold,
      lastRestocked: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const optimisticUpdate = () => {
      mutate(
        (currentData) => {
          if (!currentData) return { items: [optimisticItem], restockRequests: [], logs: [] };
          return { ...currentData, items: [...currentData.items, optimisticItem] };
        },
        false
      );
    };

    const rollbackUpdate = () => {
      mutate(
        (currentData) => {
          if (!currentData) return { items: [], restockRequests: [], logs: [] };
          return {
            ...currentData,
            items: currentData.items.filter(i => i.id !== optimisticItem.id)
          };
        },
        false
      );
    };

    const operation = async () => {
      const response = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemName: addItemForm.itemName,
          category: addItemForm.category,
          quantity: totalUsageUnits, // store in usage units
          unit: addItemForm.unit,
          purchaseUnit: addItemForm.purchaseUnit,
          conversionFactor: addItemForm.conversionFactor,
          minThreshold: addItemForm.minThreshold,
          maxThreshold: addItemForm.maxThreshold,
          addedBy: user?.email,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add item');
      }

      const { item } = await response.json();
      
      // Update with real item from server
      mutate(
        (currentData) => {
          if (!currentData) return { items: [item], restockRequests: [], logs: [] };
          return {
            ...currentData,
            items: currentData.items.map(i => 
              i.id === optimisticItem.id ? item : i
            )
          };
        },
        false
      );
      
      return item;
    };

    try {
      await performOperationWithTimeout(
        operation,
        optimisticUpdate,
        rollbackUpdate,
        `${addItemForm.itemName} added to inventory successfully`,
        'Failed to add item - please try again'
      );
      
      setIsAddItemDialogOpen(false);
      setAddItemForm({
        itemName: '',
        category: '',
        purchaseQuantity: 0,
        unit: 'pcs',
        purchaseUnit: '',
        conversionFactor: 1,
        minThreshold: 0,
        maxThreshold: 0,
      });
      // Refresh to get updated logs
      mutate();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestock = async () => {
    if (!canRestock || isSubmitting || !selectedItem) return;

    setIsSubmitting(true);
    
    // Convert purchase quantity to usage units
    const usageUnitsToAdd = convertToUsageUnits(restockForm.purchaseQuantity, selectedItem.conversionFactor);
    
    try {
      // For staff, create a restock request
      if (user?.role === 'staff') {
        const response = await fetch('/api/inventory/restock-requests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            itemId: selectedItem.id,
            itemName: selectedItem.itemName,
            purchaseQuantity: restockForm.purchaseQuantity,
            usageQuantity: usageUnitsToAdd,
            notes: restockForm.notes,
            requestedBy: user?.email,
          }),
        });

        if (response.ok) {
          setIsRestockDialogOpen(false);
          setSelectedItem(null);
          setRestockForm({ itemId: '', purchaseQuantity: 0, notes: '' });
          toast.success(`Restock request submitted for ${selectedItem.itemName}. Waiting for admin approval.`);
          mutate(); // Refresh data
        } else {
          const error = await response.json();
          toast.error(`Failed to submit restock request: ${error.error}`);
        }
      } 
      // For admin, directly restock with optimistic updates and timeout
      else if (user?.role === 'admin') {
        const originalQuantity = selectedItem.quantity;
        const newQuantity = originalQuantity + usageUnitsToAdd;
        
        const optimisticUpdate = () => {
          setRestockingItems(prev => new Set(prev.add(selectedItem.id)));
          mutate(
            (currentData) => {
              if (!currentData) return currentData;
              return {
                ...currentData,
                items: currentData.items.map(item => 
                  item.id === selectedItem.id 
                    ? { 
                        ...item, 
                        quantity: newQuantity, 
                        lastRestocked: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                      }
                    : item
                )
              };
            },
            false
          );
        };

        const rollbackUpdate = () => {
          setRestockingItems(prev => {
            const newSet = new Set(prev);
            newSet.delete(selectedItem.id);
            return newSet;
          });
          
          mutate(
            (currentData) => {
              if (!currentData) return currentData;
              return {
                ...currentData,
                items: currentData.items.map(item => 
                  item.id === selectedItem.id 
                    ? { ...item, quantity: originalQuantity }
                    : item
                )
              };
            },
            false
          );
        };

        const operation = async () => {
          const response = await fetch(`/api/inventory/${selectedItem.id}/restock`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              quantity: usageUnitsToAdd, // send usage units to server
              purchaseQuantity: restockForm.purchaseQuantity,
              notes: restockForm.notes,
              restockedBy: user?.email,
            }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to restock item');
          }

          return response.json();
        };

        await performOperationWithTimeout(
          operation,
          optimisticUpdate,
          rollbackUpdate,
          `${selectedItem.itemName} restocked successfully`,
          'Failed to restock item - please try again'
        );
        
        // Remove from restocking set
        setRestockingItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(selectedItem.id);
          return newSet;
        });
        
        setIsRestockDialogOpen(false);
        setSelectedItem(null);
        setRestockForm({ itemId: '', purchaseQuantity: 0, notes: '' });
        mutate(); // Refresh to get updated data and logs
      }
    } catch (error) {
      if (user?.role === 'admin') {
        setRestockingItems(prev => {
          const newSet = new Set(prev);
          if (selectedItem) newSet.delete(selectedItem.id);
          return newSet;
        });
      }
      toast.error('Failed to process restock - please try again');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveRestock = async (request: RestockRequest) => {
    if (!canApproveRestock || isSubmitting) return;

    setIsSubmitting(true);
    
    try {
      const response = await fetch(`/api/inventory/restock-requests/${request.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve',
          reviewedBy: user?.email,
          reviewNotes: reviewNotes,
        }),
      });

      if (response.ok) {
        toast.success(`Restock request approved for ${request.itemName}`);
        setReviewNotes('');
        setSelectedRequest(null);
        setIsApproveDialogOpen(false);
        mutate(); // Refresh data
      } else {
        const error = await response.json();
        toast.error(`Failed to approve request: ${error.error}`);
      }
    } catch (error) {
      toast.error('Failed to approve request - please try again');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectRestock = async (request: RestockRequest) => {
    if (!canApproveRestock || isSubmitting) return;

    setIsSubmitting(true);
    
    try {
      const response = await fetch(`/api/inventory/restock-requests/${request.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject',
          reviewedBy: user?.email,
          reviewNotes: reviewNotes,
        }),
      });

      if (response.ok) {
        toast.success(`Restock request rejected for ${request.itemName}`);
        setReviewNotes('');
        setSelectedRequest(null);
        setIsRejectDialogOpen(false);
        mutate(); // Refresh data
      } else {
        const error = await response.json();
        toast.error(`Failed to reject request: ${error.error}`);
      }
    } catch (error) {
      toast.error('Failed to reject request - please try again');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (item: InventoryItem) => {
    setSelectedItem(item);
    setEditItemForm({
      itemName: item.itemName,
      category: item.category,
      unit: item.unit,
      purchaseUnit: item.purchaseUnit,
      conversionFactor: item.conversionFactor,
      minThreshold: item.minThreshold,
      maxThreshold: item.maxThreshold,
    });
    setIsEditDialogOpen(true);
  };

  const handleEditItem = async () => {
    if (!canEditItem || isSubmitting || !selectedItem) return;

    setIsSubmitting(true);
    
    try {
      const response = await fetch(`/api/inventory/${selectedItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemName: editItemForm.itemName,
          category: editItemForm.category,
          unit: editItemForm.unit,
          purchaseUnit: editItemForm.purchaseUnit,
          conversionFactor: editItemForm.conversionFactor,
          minThreshold: editItemForm.minThreshold,
          maxThreshold: editItemForm.maxThreshold,
          editedBy: user?.email,
        }),
      });

      if (response.ok) {
        setIsEditDialogOpen(false);
        setSelectedItem(null);
        toast.success(`${editItemForm.itemName} updated successfully`);
        mutate(); // Refresh data
      } else {
        const error = await response.json();
        toast.error(`Failed to update item: ${error.error}`);
      }
    } catch (error) {
      toast.error('Failed to update item - please try again');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openRestockDialog = (item: InventoryItem) => {
    setSelectedItem(item);
    setRestockForm({ itemId: item.id, purchaseQuantity: 0, notes: '' });
    setIsRestockDialogOpen(true);
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'add': return 'Added';
      case 'edit': return 'Edited';
      case 'restock': return 'Restocked';
      case 'restock_request': return 'Restock Requested';
      case 'restock_approved': return 'Request Approved';
      case 'restock_rejected': return 'Request Rejected';
      default: return action;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'add': return 'bg-green-100 text-green-800 border-green-200';
      case 'edit': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'restock': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'restock_request': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'restock_approved': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'restock_rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (!canView) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-gray-500">Access denied. You don't have permission to view inventory.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="py-8">
            <div className="flex items-center justify-center">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              <p>Loading inventory...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 mb-4">Failed to load inventory data</p>
              <p className="text-sm text-gray-500 mb-4">{error.message}</p>
              <Button onClick={() => mutate()} className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="flex items-center gap-2 font-bold text-CustomPink1">
            <Package className="h-8 w-8 text-CustomPink1" />
            Inventory Management
          </h1>
          <div className="flex items-center gap-4 text-gray-600 mt-2">
            <p>Manage dental clinic supplies and equipment</p>
            {/* Connection Status with Tooltip */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1">
                    {isOnline ? (
                      <Wifi className="h-4 w-4 text-green-600" />
                    ) : (
                      <WifiOff className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isOnline ? 'Connected to server' : 'Connection lost'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {isAutoRetrying && (
              <div className="flex items-center gap-1 text-xs text-orange-600">
                <Timer className="h-3 w-3" />
                <span>Auto-retry</span>
              </div>
            )}
            {/* Performance Metrics Display */}
            {user?.role === 'admin' && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>Revalidations: {performanceMetrics.revalidationCount}</span>
                {performanceMetrics.slowRevalidations > 0 && (
                  <span className="text-orange-600">
                    Slow: {performanceMetrics.slowRevalidations}
                  </span>
                )}
                {performanceMetrics.lastRevalidationTime > 0 && (
                  <span>
                    Last: {performanceMetrics.lastRevalidationTime.toFixed(0)}ms
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline_pink" 
            onClick={handleRefresh} 
            className="flex items-center gap-2"
            disabled={isValidating}
          >
            <RefreshCw className={`h-4 w-4 ${isValidating ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          {canViewLogs && (
            <Button 
              variant="outline_pink" 
              onClick={() => setIsLogsDialogOpen(true)} 
              className="flex items-center gap-2"
            >
              <History className="h-4 w-4" />
              Activity Logs
            </Button>
          )}
          
          {canAddItem && (
            <Dialog open={isAddItemDialogOpen} onOpenChange={setIsAddItemDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add New Item
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md border-1 border-CustomPink1 bg-CustomPink3">
                <DialogHeader>
                  <DialogTitle className='font-bold text-CustomPink1'>Add New Inventory Item</DialogTitle>
                  <DialogDescription>
                    Add a new item to the inventory with purchase and usage unit tracking.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="itemName" className='font-bold text-CustomPink1'>Item Name</Label>
                    <Input
                      className='border-1 border-CustomPink1 bg-CustomPink3'
                      id="itemName"
                      value={addItemForm.itemName}
                      onChange={(e) => setAddItemForm({ ...addItemForm, itemName: e.target.value })}
                      placeholder="e.g., Dental Gloves"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category" className='font-bold text-CustomPink1'>Category</Label>
                    <Select 
                      value={addItemForm.category} 
                      onValueChange={(value) => setAddItemForm({ ...addItemForm, category: value })}
                    >
                      <SelectTrigger className='border-1 border-CustomPink1 bg-CustomPink3'>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent className='border-1 border-CustomPink1 bg-CustomPink3'>
                        <SelectItem value="consumables">Consumables</SelectItem>
                        <SelectItem value="equipment">Equipment</SelectItem>
                        <SelectItem value="medications">Medications</SelectItem>
                        <SelectItem value="hygiene">Hygiene</SelectItem>
                        <SelectItem value="instruments">Instruments</SelectItem>
                        <SelectItem value="disposables">Disposables</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Purchase and Usage Unit Configuration */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="unit" className='font-bold text-CustomPink1'>Usage Unit</Label>
                      <Select 
                        value={addItemForm.unit} 
                        onValueChange={(value) => setAddItemForm({ ...addItemForm, unit: value })}
                      >
                        <SelectTrigger className='border-1 border-CustomPink1 bg-CustomPink3'>
                          <SelectValue placeholder="Usage unit" />
                        </SelectTrigger>
                        <SelectContent className='border-1 border-CustomPink1 bg-CustomPink3'>
                          <SelectItem value="pcs">Pieces</SelectItem>
                          <SelectItem value="units">Units</SelectItem>
                          <SelectItem value="ml">Milliliters</SelectItem>
                          <SelectItem value="g">Grams</SelectItem>
                          <SelectItem value="doses">Doses</SelectItem>
                          <SelectItem value="applications">Applications</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="purchaseUnit" className='font-bold text-CustomPink1'>Purchase Unit</Label>
                      <Select 
                        value={addItemForm.purchaseUnit} 
                        onValueChange={(value) => setAddItemForm({ ...addItemForm, purchaseUnit: value })}
                      >
                        <SelectTrigger className='border-1 border-CustomPink1 bg-CustomPink3'>
                          <SelectValue placeholder="Purchase unit" />
                        </SelectTrigger>
                        <SelectContent className='border-1 border-CustomPink1 bg-CustomPink3'>
                          <SelectItem value="pcs">Piece</SelectItem>
                          <SelectItem value="box">Box</SelectItem>
                          <SelectItem value="bottle">Bottle</SelectItem>
                          <SelectItem value="tube">Tube</SelectItem>
                          <SelectItem value="packet">Packet</SelectItem>
                          <SelectItem value="bag">Bag</SelectItem>
                          <SelectItem value="case">Case</SelectItem>
                          <SelectItem value="kit">Kit</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="conversionFactor" className='font-bold text-CustomPink1'>
                        {addItemForm.unit} per {addItemForm.purchaseUnit || 'purchase unit'}
                      </Label>
                      <Input
                        className='border-1 border-CustomPink1 bg-CustomPink3'
                        id="conversionFactor"
                        type="number"
                        min="1"
                        value={addItemForm.conversionFactor}
                        onChange={(e) => setAddItemForm({ ...addItemForm, conversionFactor: parseInt(e.target.value) || 1 })}
                        placeholder="e.g., 100"
                      />
                    </div>
                    <div>
                      <Label htmlFor="purchaseQuantity" className='font-bold text-CustomPink1'>Initial Stock ({addItemForm.purchaseUnit || 'purchase units'})</Label>
                      <Input
                        className='border-1 border-CustomPink1 bg-CustomPink3'
                        id="purchaseQuantity"
                        type="number"
                        min="0"
                        value={addItemForm.purchaseQuantity}
                        onChange={(e) => {
                          const qty = parseInt(e.target.value) || 0;
                          setAddItemForm({ ...addItemForm, purchaseQuantity: qty });
                          
                          // Auto-suggest thresholds based on total usage units
                          const totalUsageUnits = convertToUsageUnits(qty, addItemForm.conversionFactor);
                          const suggestions = getSuggestedThresholds(addItemForm.category, totalUsageUnits);
                          
                          if (totalUsageUnits > 0 && (addItemForm.minThreshold === 0 || addItemForm.maxThreshold === 0)) {
                            setAddItemForm(prev => ({
                              ...prev,
                              purchaseQuantity: qty,
                              minThreshold: prev.minThreshold === 0 ? suggestions.min : prev.minThreshold,
                              maxThreshold: prev.maxThreshold === 0 ? suggestions.max : prev.maxThreshold,
                            }));
                          }
                        }}
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {/* Show conversion preview */}
                  {addItemForm.purchaseQuantity > 0 && addItemForm.conversionFactor > 0 && (
                    <div className="text-sm text-gray-600 bg-blue-50 p-2 rounded">
                      <strong>Conversion:</strong> {formatConversion(
                        addItemForm.purchaseQuantity, 
                        addItemForm.conversionFactor, 
                        addItemForm.purchaseUnit || 'units', 
                        addItemForm.unit
                      )}
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="minThreshold" className='font-bold text-CustomPink1'>Low Stock Alert ({addItemForm.unit})</Label>
                      <Input
                        className='border-1 border-CustomPink1 bg-CustomPink3'
                        id="minThreshold"
                        type="number"
                        min="0"
                        value={addItemForm.minThreshold}
                        onChange={(e) => setAddItemForm({ ...addItemForm, minThreshold: parseInt(e.target.value) || 0 })}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="maxThreshold" className='font-bold text-CustomPink1'>Overstock Alert ({addItemForm.unit})</Label>
                      <Input 
                        className='border-1 border-CustomPink1 bg-CustomPink3'
                        id="maxThreshold"
                        type="number"
                        min="0"
                        value={addItemForm.maxThreshold}
                        onChange={(e) => setAddItemForm({ ...addItemForm, maxThreshold: parseInt(e.target.value) || 0 })}
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline_pink" onClick={() => setIsAddItemDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleAddItem} 
                    disabled={!addItemForm.itemName || !addItemForm.category || isSubmitting}
                  >
                    {isSubmitting ? 'Adding...' : 'Add Item'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className='border-1 border-CustomPink1 bg-CustomPink3'>
          <CardContent className="flex items-center p-6">
            <Package className="h-8 w-8 font-bold text-CustomPink1" />
            <div className="ml-4">
              <p className="text-sm font-bold text-CustomPink1">Total Items</p>
              <p className="text-2xl font-bold text-CustomPink1">{totalItems}</p>
            </div>
            {isValidating && (
              <div className="ml-auto">
                <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse"></div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className='border-1 border-CustomPink1 bg-CustomPink3'>
          <CardContent className="flex items-center p-6">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-bold text-green-600">Well Stocked</p>
              <p className="text-2xl font-bold text-green-600">{wellStockedItems.length}</p>
            </div>
            {isValidating && (
              <div className="ml-auto">
                <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse"></div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className='border-1 border-CustomPink1 bg-CustomPink3'>
          <CardContent className="flex items-center p-6">
            <AlertTriangle className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-yellow-600">Low Stock</p>
              <p className="text-2xl font-bold text-yellow-600">{lowStockItems.length}</p>
            </div>
            {isValidating && (
              <div className="ml-auto">
                <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse"></div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className='border-1 border-CustomPink1 bg-CustomPink3'>
          <CardContent className="flex items-center p-6">
            <AlertCircle className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-red-600">Out of Stock</p>
              <p className="text-2xl font-bold text-red-600">{outOfStockItems.length}</p>
            </div>
            {isValidating && (
              <div className="ml-auto">
                <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse"></div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pending Restock Requests (Admin Only) */}
      {canApproveRestock && pendingRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Pending Restock Requests ({pendingRequests.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{request.itemName}</span>
                      <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                        {request.purchaseQuantity} {request.itemName.includes('box') ? 'boxes' : 'units'}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      <span>Requested by: {request.requestedByName || request.requestedBy}</span>
                      <span className="mx-2">•</span>
                      <span>{formatDateTime(request.createdAt)}</span>
                    </div>
                    {request.notes && (
                      <p className="text-sm text-gray-600 mt-1">Note: {request.notes}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedRequest(request);
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
                        setSelectedRequest(request);
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

      {/* Inventory Table */}
      <Card className='border-1 border-CustomPink1 bg-CustomPink3'>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 font-bold text-CustomPink1">
              <Package className="h-5 w-5"/>
              Inventory Items ({totalItems})
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4 font-bold" />
              Last updated: {new Date(lastDataUpdate).toLocaleTimeString()}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]font-bold text-CustomPink1">Item Name</TableHead>
                  <TableHead className="font-bold text-CustomPink1">Category</TableHead>
                  <TableHead className="font-bold text-CustomPink1">Current Stock</TableHead>
                  <TableHead className="font-bold text-CustomPink1">Purchase Unit</TableHead>
                  <TableHead className="font-bold text-CustomPink1">Usage Unit</TableHead>                  
                  <TableHead className="font-bold text-CustomPink1">Last Restocked</TableHead>
                  <TableHead className="font-bold text-CustomPink1">Stock Status</TableHead>
                  <TableHead className="font-bold text-CustomPink1">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="font-bold">
                {items.map((item) => {
                  const stockStatus = getStockStatus(item);
                  const isRestocking = restockingItems.has(item.id);
                  
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="font-medium">{item.itemName}</div>
                        <div className="text-xs text-muted-foreground">
                          Min: {item.minThreshold} • Max: {item.maxThreshold}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {item.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-semibold">{item.quantity} {item.unit}</div>
                          {item.conversionFactor > 1 && (
                            <div className="text-xs text-muted-foreground">
                              ≈ {convertToPurchaseUnits(item.quantity, item.conversionFactor)} {item.purchaseUnit}s
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{item.purchaseUnit}</div>
                          {item.conversionFactor > 1 && (
                            <div className="text-xs text-muted-foreground">
                              1 = {item.conversionFactor} {item.unit}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{item.unit}</div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(item.lastRestocked)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={stockStatus.color}>
                          {stockStatus.label}
                        </Badge>
                      </TableCell>                      
                      <TableCell>
                        <div className="flex gap-2">
                            {canEditItem && (
                              <Button
                                size="sm"
                                variant="outline_pink"
                                onClick={() => openEditDialog(item)}
                                className="flex items-center gap-1"
                              >
                                <Edit className="h-3 w-3" />
                                Edit
                              </Button>
                            )}
                            {canRestock && (
                              <Button
                                size="sm"
                                variant="outline_pink"
                                onClick={() => openRestockDialog(item)}
                                className="flex items-center gap-1"
                              >
                                <TrendingUp className="h-3 w-3" />
                                Restock
                              </Button>
                            )}
                          </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <Package className="h-8 w-8 text-muted-foreground/50" />
                        <p>No inventory items found.</p>
                        {canAddItem && <p className="text-sm">Add your first item to get started.</p>}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Restock Dialog */}
      <Dialog open={isRestockDialogOpen} onOpenChange={setIsRestockDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {user?.role === 'staff' ? 'Request Restock' : 'Restock Item'}
            </DialogTitle>
            <DialogDescription>
              {selectedItem && (
                <>
                  {user?.role === 'staff' 
                    ? `Submit a restock request for ${selectedItem.itemName}. An admin will review and approve.`
                    : `Add stock to ${selectedItem.itemName}. Current: ${selectedItem.quantity} ${selectedItem.unit}`
                  }
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="restockQuantity">
                    Quantity ({selectedItem.purchaseUnit})
                  </Label>
                  <Input
                    id="restockQuantity"
                    type="number"
                    min="1"
                    value={restockForm.purchaseQuantity}
                    onChange={(e) => setRestockForm({ ...restockForm, purchaseQuantity: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>Conversion Preview</Label>
                  <div className="text-sm text-gray-600 p-2 bg-gray-50 rounded border">
                    {restockForm.purchaseQuantity > 0 ? 
                      formatConversion(
                        restockForm.purchaseQuantity, 
                        selectedItem.conversionFactor, 
                        selectedItem.purchaseUnit, 
                        selectedItem.unit
                      ) : 
                      `0 ${selectedItem.purchaseUnit} → 0 ${selectedItem.unit}`
                    }
                  </div>
                </div>
              </div>
              
              <div>
                <Label htmlFor="restockNotes">Notes (Optional)</Label>
                <Textarea
                  id="restockNotes"
                  value={restockForm.notes}
                  onChange={(e) => setRestockForm({ ...restockForm, notes: e.target.value })}
                  placeholder="Add any notes about this restock..."
                  rows={3}
                />
              </div>

              {restockForm.purchaseQuantity > 0 && (
                <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-CustomPink1" />
                    <span className="font-medium">Stock Forecast</span>
                  </div>
                  <div>
                    <strong>New total:</strong> {selectedItem.quantity + convertToUsageUnits(restockForm.purchaseQuantity, selectedItem.conversionFactor)} {selectedItem.unit}
                  </div>
                  <div className="mt-1">
                    <strong>Status after restock:</strong> {
                      (() => {
                        const newQty = selectedItem.quantity + convertToUsageUnits(restockForm.purchaseQuantity, selectedItem.conversionFactor);
                        if (newQty >= selectedItem.maxThreshold) return '🔵 Overstocked';
                        if (newQty > selectedItem.minThreshold) return '🟢 Well stocked';
                        return '🟡 Still low';
                      })()
                    }
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRestockDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleRestock} 
              disabled={!restockForm.purchaseQuantity || restockForm.purchaseQuantity <= 0 || isSubmitting}
            >
              {isSubmitting ? 'Processing...' : (user?.role === 'staff' ? 'Submit Request' : 'Restock')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Inventory Item</DialogTitle>
            <DialogDescription>
              Update item details. Current stock quantity will remain unchanged.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editItemName">Item Name</Label>
              <Input
                id="editItemName"
                value={editItemForm.itemName}
                onChange={(e) => setEditItemForm({ ...editItemForm, itemName: e.target.value })}
                placeholder="e.g., Dental Gloves"
              />
            </div>
            <div>
              <Label htmlFor="editCategory">Category</Label>
              <Select 
                value={editItemForm.category} 
                onValueChange={(value) => setEditItemForm({ ...editItemForm, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="consumables">Consumables</SelectItem>
                  <SelectItem value="equipment">Equipment</SelectItem>
                  <SelectItem value="medications">Medications</SelectItem>
                  <SelectItem value="hygiene">Hygiene</SelectItem>
                  <SelectItem value="instruments">Instruments</SelectItem>
                  <SelectItem value="disposables">Disposables</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="editPurchaseUnit">Purchase Unit</Label>
                <Input
                  id="editPurchaseUnit"
                  value={editItemForm.purchaseUnit}
                  onChange={(e) => setEditItemForm({ ...editItemForm, purchaseUnit: e.target.value })}
                  placeholder="e.g., box"
                />
              </div>
              <div>
                <Label htmlFor="editUnit">Usage Unit</Label>
                <Input
                  id="editUnit"
                  value={editItemForm.unit}
                  onChange={(e) => setEditItemForm({ ...editItemForm, unit: e.target.value })}
                  placeholder="e.g., pcs"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="editConversionFactor">
                {editItemForm.unit} per {editItemForm.purchaseUnit || 'purchase unit'}
              </Label>
              <Input
                id="editConversionFactor"
                type="number"
                min="1"
                value={editItemForm.conversionFactor}
                onChange={(e) => setEditItemForm({ ...editItemForm, conversionFactor: parseInt(e.target.value) || 1 })}
                placeholder="e.g., 100"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="editMinThreshold">Low Stock Alert ({editItemForm.unit})</Label>
                <Input
                  id="editMinThreshold"
                  type="number"
                  min="0"
                  value={editItemForm.minThreshold}
                  onChange={(e) => setEditItemForm({ ...editItemForm, minThreshold: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="editMaxThreshold">Overstock Alert ({editItemForm.unit})</Label>
                <Input
                  id="editMaxThreshold"
                  type="number"
                  min="0"
                  value={editItemForm.maxThreshold}
                  onChange={(e) => setEditItemForm({ ...editItemForm, maxThreshold: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleEditItem} 
              disabled={!editItemForm.itemName || !editItemForm.category || isSubmitting}
            >
              {isSubmitting ? 'Updating...' : 'Update Item'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Restock Dialog */}
      <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Approve Restock Request</DialogTitle>
            <DialogDescription>
              {selectedRequest && `Approve restock request for ${selectedRequest.itemName}`}
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="bg-green-50 p-3 rounded">
                <div className="text-sm space-y-1">
                  <div><strong>Item:</strong> {selectedRequest.itemName}</div>
                  <div><strong>Requested Quantity:</strong> {selectedRequest.purchaseQuantity} units</div>
                  <div><strong>Usage Quantity:</strong> {selectedRequest.usageQuantity} pieces</div>
                  <div><strong>Requested by:</strong> {selectedRequest.requestedByName || selectedRequest.requestedBy}</div>
                  <div><strong>Date:</strong> {formatDateTime(selectedRequest.createdAt)}</div>
                  {selectedRequest.notes && (
                    <div><strong>Notes:</strong> {selectedRequest.notes}</div>
                  )}
                </div>
              </div>
              
              <div>
                <Label htmlFor="approveNotes">Review Notes (Optional)</Label>
                <Textarea
                  id="approveNotes"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add any notes about this approval..."
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApproveDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => selectedRequest && handleApproveRestock(selectedRequest)} 
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? 'Approving...' : 'Approve Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Restock Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Restock Request</DialogTitle>
            <DialogDescription>
              {selectedRequest && `Reject restock request for ${selectedRequest.itemName}`}
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="bg-red-50 p-3 rounded">
                <div className="text-sm space-y-1">
                  <div><strong>Item:</strong> {selectedRequest.itemName}</div>
                  <div><strong>Requested Quantity:</strong> {selectedRequest.purchaseQuantity} units</div>
                  <div><strong>Usage Quantity:</strong> {selectedRequest.usageQuantity} pieces</div>
                  <div><strong>Requested by:</strong> {selectedRequest.requestedByName || selectedRequest.requestedBy}</div>
                  <div><strong>Date:</strong> {formatDateTime(selectedRequest.createdAt)}</div>
                  {selectedRequest.notes && (
                    <div><strong>Notes:</strong> {selectedRequest.notes}</div>
                  )}
                </div>
              </div>
              
              <div>
                <Label htmlFor="rejectNotes">Rejection Reason</Label>
                <Textarea
                  id="rejectNotes"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Please provide a reason for rejection..."
                  rows={3}
                  required
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => selectedRequest && handleRejectRestock(selectedRequest)} 
              disabled={isSubmitting || !reviewNotes.trim()}
              variant="destructive"
            >
              {isSubmitting ? 'Rejecting...' : 'Reject Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Activity Logs Dialog */}
      <Dialog open={isLogsDialogOpen} onOpenChange={setIsLogsDialogOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[80vh] border-1 border-CustomPink1 bg-CustomPink3">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-bold text-CustomPink1">
              <History className="h-5 w-5" />
              Inventory Activity Logs
            </DialogTitle>
            <DialogDescription>
              Recent inventory changes and activities
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='font-bold text-CustomPink1'>Item</TableHead>
                  <TableHead className='font-bold text-CustomPink1'>Action</TableHead>
                  <TableHead className='font-bold text-CustomPink1'>Changed By</TableHead>
                  <TableHead className='font-bold text-CustomPink1'>Changes</TableHead>
                  <TableHead className='font-bold text-CustomPink1'>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">{log.itemName}</TableCell>
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
                {logs.length === 0 && (
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
    </div>
  );
}