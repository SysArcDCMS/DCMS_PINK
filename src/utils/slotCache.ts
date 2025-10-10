import useSWR from 'swr';
import { format } from 'date-fns';

export interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
  conflictReason?: string;
}

export interface SlotRequest {
  date: Date;
  serviceDuration: number;
  bufferTime: number;
}

// Fetcher function for available slots
const fetchAvailableSlots = async (url: string, payload: string): Promise<TimeSlot[]> => {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: payload,
  });

  if (!response.ok) {
    throw new Error('Failed to fetch available slots');
  }

  const data = await response.json();
  return data.slots || [];
};

// Custom hook for slot caching with SWR
export const useAvailableSlots = (request: SlotRequest | null) => {
  // Create SWR key
  const slotsKey = request 
    ? [
        '/api/appointments/available-slots',
        JSON.stringify({
          date: format(request.date, 'yyyy-MM-dd'),
          serviceDuration: request.serviceDuration,
          bufferTime: request.bufferTime
        })
      ]
    : null;

  return useSWR<TimeSlot[]>(
    slotsKey,
    ([url, payload]) => fetchAvailableSlots(url, payload),
    {
      dedupingInterval: 5 * 60 * 1000, // 5 minutes deduping
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      errorRetryCount: 2,
      errorRetryInterval: 1000,
      refreshInterval: 10 * 60 * 1000, // Cache for 10 minutes
      revalidateIfStale: true
    }
  );
};