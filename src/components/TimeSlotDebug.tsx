'use client';

import React, { useState } from 'react';
import { Button } from './ui/button';
import { format } from 'date-fns';

export const TimeSlotDebug: React.FC = () => {
  const [debugData, setDebugData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testTodaySlots = async () => {
    setLoading(true);
    try {
      const today = new Date();
      const response = await fetch('/api/appointments/available-slots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          date: format(today, 'yyyy-MM-dd'),
          serviceDuration: 60,
          bufferTime: 15
        })
      });

      const data = await response.json();
      setDebugData(data);
      console.log('Debug slots data:', data);
    } catch (error) {
      console.error('Debug error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-md bg-gray-50 max-w-2xl">
      <h3 className="font-semibold mb-4">Time Slot Debug Tool</h3>
      
      <Button onClick={testTodaySlots} disabled={loading}>
        {loading ? 'Testing...' : 'Test Today\'s Slots'}
      </Button>

      {debugData && (
        <div className="mt-4">
          <h4 className="font-medium">Available Slots ({debugData.slots?.length || 0}):</h4>
          <div className="grid grid-cols-4 gap-2 mt-2">
            {debugData.slots?.map((slot: any) => (
              <div key={slot.startTime} className="p-2 bg-green-100 rounded text-xs">
                {slot.startTime}
              </div>
            ))}
          </div>

          {debugData.debug && (
            <div className="mt-4">
              <h4 className="font-medium">Debug Info:</h4>
              <p>Total slots: {debugData.debug.totalSlots}</p>
              <p>Available: {debugData.debug.availableCount}</p>
              
              <h5 className="font-medium mt-2">Unavailable Slots:</h5>
              <div className="text-xs space-y-1">
                {debugData.debug.unavailableSlots?.map((slot: any, i: number) => (
                  <div key={i} className="text-red-600">
                    {slot.time}: {slot.reason}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};