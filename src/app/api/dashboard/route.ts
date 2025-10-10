import { NextRequest, NextResponse } from 'next/server';
import { projectId, publicAnonKey } from '../../../utils/supabase/info';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('userEmail');
    const role = searchParams.get('role');
    const currentDateOnly = searchParams.get('currentDateOnly');

    const params = new URLSearchParams();
    if (userEmail) params.append('userEmail', userEmail);
    if (role) params.append('role', role);
    if (currentDateOnly) params.append('currentDateOnly', currentDateOnly);

    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-c89a26e4/appointments?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Cache-Control': 'no-cache', // Ensure fresh data
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }

    const data = await response.json();
    
    // Add server timestamp for freshness indicator
    const responseData = {
      ...data,
      lastUpdated: new Date().toISOString(),
      cacheStatus: 'fresh'
    };

    return NextResponse.json(responseData, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch dashboard data',
        lastUpdated: new Date().toISOString(),
        cacheStatus: 'error'
      },
      { status: 500 }
    );
  }
}