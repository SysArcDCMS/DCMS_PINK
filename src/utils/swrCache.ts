import useSWR from 'swr';

// Generic fetcher function
const fetcher = (url: string) => fetch(url).then(res => res.json());

// SWR configuration for real-time data
const realtimeConfig = {
  refreshInterval: 30000, // Refresh every 30 seconds
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  dedupingInterval: 5000, // Dedupe requests within 5 seconds
};

// SWR configuration for static data
const staticConfig = {
  refreshInterval: 0, // No auto-refresh
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 10000, // Dedupe requests within 10 seconds
};

// Appointments hook
export function useAppointments(userEmail?: string, role?: string, currentDateOnly = true) {
  const swrKey = userEmail && role ? 'appointments' : null;
  const apiUrl = userEmail && role 
    ? `/api/appointments?userEmail=${encodeURIComponent(userEmail)}&role=${role}&currentDateOnly=${currentDateOnly}`
    : null;

  return useSWR(
    swrKey && apiUrl ? [swrKey, apiUrl] : null,
    ([, url]) => fetcher(url),
    realtimeConfig
  );
}

// Billing data hook
export function useBilling() {
  return useSWR('/api/billing', fetcher, realtimeConfig);
}

// Billing stats hook
export function useBillingStats() {
  return useSWR('/api/billing/stats', fetcher, realtimeConfig);
}

// Services catalog hook
export function useServices() {
  return useSWR('/api/services', fetcher, staticConfig);
}

// Inventory hook
export function useInventory() {
  return useSWR('/api/inventory', fetcher, realtimeConfig);
}

// Patients hook
export function usePatients() {
  return useSWR('/api/patients', fetcher, realtimeConfig);
}

// Individual bill hook
export function useBill(billId?: string) {
  return useSWR(
    billId ? `/api/billing/${billId}` : null,
    fetcher,
    staticConfig
  );
}

// Generic hook for any API endpoint
export function useApiData<T = any>(
  endpoint: string | null,
  config: 'realtime' | 'static' = 'realtime'
) {
  const result = useSWR<T>(
    endpoint,
    fetcher,
    config === 'realtime' ? realtimeConfig : staticConfig
  );
  
  return {
    ...result,
    isLoading: !result.error && !result.data,
    isEmpty: !result.isLoading && !result.error && !result.data
  };
}

// Hook with custom configuration
export function useCustomSWR<T = any>(
  endpoint: string | null,
  customConfig: any = {}
) {
  return useSWR<T>(
    endpoint,
    fetcher,
    { ...realtimeConfig, ...customConfig }
  );
}