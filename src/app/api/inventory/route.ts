import { NextRequest, NextResponse } from 'next/server';
import { projectId, publicAnonKey } from '../../../utils/supabase/info';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Get query params to include restock requests and logs
    const url = new URL(request.url);
    const includeRequests = url.searchParams.get('includeRequests') !== 'false';
    const includeLogs = url.searchParams.get('includeLogs') !== 'false';

    const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-c89a26e4/inventory?includeRequests=${includeRequests}&includeLogs=${includeLogs}`;

    const serverStartTime = Date.now();
    const response = await fetch(
      serverUrl,
      {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        // Add cache control for better performance
        next: { revalidate: 60 } // Revalidate every minute
      }
    );
    const serverEndTime = Date.now();
    const serverQueryTime = serverEndTime - serverStartTime;

    // Server-side performance monitoring - log queries >1 second
    if (serverQueryTime > 1000) {
      console.warn(`[INVENTORY PERFORMANCE] Slow server query detected: ${serverQueryTime}ms`);
    }

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }

    const data = await response.json();
    const endTime = Date.now();
    const totalQueryTime = endTime - startTime;

    // Add performance metadata and fresh data indicators
    const now = new Date().toISOString();
    const responseData = {
      ...data,
      fetchedAt: now,
      isFresh: true,
      queryTime: totalQueryTime,
      serverQueryTime: serverQueryTime,
      timestamp: Date.now()
    };

    return NextResponse.json(responseData, {
      headers: {
        'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30', // Optimized for 15-second refresh
        'X-Fetched-At': now,
        'X-Query-Time': totalQueryTime.toString(),
        'X-Server-Query-Time': serverQueryTime.toString(),
        'X-Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Inventory API route error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch inventory',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const itemData = await request.json();

    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-c89a26e4/inventory`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(itemData),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Add inventory item API route error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to add inventory item',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}