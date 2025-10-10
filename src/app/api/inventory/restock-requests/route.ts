import { NextRequest, NextResponse } from 'next/server';
import { projectId, publicAnonKey } from '../../../../utils/supabase/info';

export async function POST(request: NextRequest) {
  try {
    const requestData = await request.json();

    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-c89a26e4/inventory/restock-requests`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Create restock request API route error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create restock request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
