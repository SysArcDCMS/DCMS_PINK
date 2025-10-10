import { useEffect, useRef, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

interface RealtimeSubscriptionOptions {
  onQuantityChange?: (payload: any) => void;
  onInsert?: (payload: any) => void;
  onUpdate?: (payload: any) => void;
  enabled?: boolean;
}

interface ConnectionStatus {
  isConnected: boolean;
  lastConnected?: Date;
  reconnectAttempts: number;
  error?: string;
}

export const useInventoryRealtime = (options: RealtimeSubscriptionOptions = {}) => {
  const { onQuantityChange, onInsert, onUpdate, enabled = true } = options;
  const supabaseRef = useRef(createClient(supabaseUrl, supabaseKey));
  const subscriptionRef = useRef<any>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isConnected: false,
    reconnectAttempts: 0
  });

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const supabase = supabaseRef.current;
    let reconnectTimeout: NodeJS.Timeout;

    const setupSubscription = () => {
      try {
        // Clean up existing subscription
        if (subscriptionRef.current) {
          supabaseRef.current.removeChannel(subscriptionRef.current);
        }

        // Create new subscription with selective filtering
        subscriptionRef.current = supabase
          .channel('inventory-changes')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'dcms_inventory_items'
            },
            (payload) => {
              console.log('[REALTIME] Inventory item inserted:', payload);
              onInsert?.(payload);
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'dcms_inventory_items',
              // Only subscribe to quantity changes to reduce noise
              filter: 'quantity.neq.old.quantity'
            },
            (payload) => {
              console.log('[REALTIME] Inventory quantity changed:', payload);
              
              // Check if quantity actually changed
              const oldQuantity = payload.old?.quantity;
              const newQuantity = payload.new?.quantity;
              
              if (oldQuantity !== newQuantity) {
                onQuantityChange?.(payload);
                onUpdate?.(payload);
              }
            }
          )
          .subscribe((status, err) => {
            console.log('[REALTIME] Subscription status:', status);
            
            if (status === 'SUBSCRIBED') {
              setConnectionStatus({
                isConnected: true,
                lastConnected: new Date(),
                reconnectAttempts: 0
              });
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
              setConnectionStatus(prev => ({
                isConnected: false,
                reconnectAttempts: prev.reconnectAttempts + 1,
                error: err?.message || 'Connection failed'
              }));

              // Exponential backoff for reconnection (max 30 seconds)
              const backoffDelay = Math.min(1000 * Math.pow(2, connectionStatus.reconnectAttempts), 30000);
              
              console.warn(`[REALTIME] Connection failed, retrying in ${backoffDelay}ms`);
              
              reconnectTimeout = setTimeout(() => {
                if (connectionStatus.reconnectAttempts < 5) { // Max 5 attempts
                  setupSubscription();
                }
              }, backoffDelay);
            } else if (status === 'CLOSED') {
              setConnectionStatus(prev => ({
                ...prev,
                isConnected: false
              }));
            }
          });
      } catch (error) {
        console.error('[REALTIME] Setup error:', error);
        setConnectionStatus(prev => ({
          ...prev,
          isConnected: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }));
      }
    };

    // Initial setup
    setupSubscription();

    // Handle online/offline events for better connection management
    const handleOnline = () => {
      if (!connectionStatus.isConnected) {
        console.log('[REALTIME] Back online, reconnecting...');
        setupSubscription();
      }
    };

    const handleOffline = () => {
      setConnectionStatus(prev => ({
        ...prev,
        isConnected: false,
        error: 'Device offline'
      }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup
    return () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      
      if (subscriptionRef.current) {
        supabaseRef.current.removeChannel(subscriptionRef.current);
      }
      
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [enabled, onQuantityChange, onInsert, onUpdate, connectionStatus.reconnectAttempts]);

  // Manual reconnection function
  const reconnect = () => {
    setConnectionStatus(prev => ({
      ...prev,
      reconnectAttempts: 0,
      error: undefined
    }));
    
    if (subscriptionRef.current) {
      supabaseRef.current.removeChannel(subscriptionRef.current);
    }
    
    // Re-trigger setup
    setConnectionStatus(prev => ({ ...prev, isConnected: false }));
  };

  return {
    connectionStatus,
    reconnect,
    isConnected: connectionStatus.isConnected
  };
};