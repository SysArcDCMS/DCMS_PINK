import { NextRequest, NextResponse } from 'next/server';
import { projectId, publicAnonKey } from '../../../../utils/supabase/info';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: itemId } = await params;
    const updateData = await request.json();

    // Get the current timestamp
    const now = new Date().toISOString();

    // Forward to the edge function server
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-c89a26e4/inventory/${itemId}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        'X-Updated-At': now,
        'X-Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Update inventory item API route error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update inventory item',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}