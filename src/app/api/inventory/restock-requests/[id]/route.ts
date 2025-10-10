import { NextRequest, NextResponse } from 'next/server';
import { projectId, publicAnonKey } from '../../../../../utils/supabase/info';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  
  try {
    const { id: requestId } = await params;
    const reviewData = await request.json();

    const serverStartTime = Date.now();
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-c89a26e4/inventory/restock-requests/${requestId}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reviewData),
      }
    );
    const serverEndTime = Date.now();
    const serverQueryTime = serverEndTime - serverStartTime;

    // Performance monitoring - log slow operations
    if (serverQueryTime > 1000) {
      console.warn(`[RESTOCK REQUEST PERFORMANCE] Slow operation detected: ${serverQueryTime}ms for request ${requestId}`);
    }

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    const totalTime = Date.now() - startTime;
    
    return NextResponse.json(data, {
      headers: {
        'X-Query-Time': totalTime.toString(),
        'X-Server-Query-Time': serverQueryTime.toString(),
      }
    });

  } catch (error) {
    console.error('Review restock request API route error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to review restock request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
