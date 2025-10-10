import { NextRequest, NextResponse } from 'next/server';
import { projectId, publicAnonKey } from '../../../../utils/supabase/info';

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-c89a26e4/billing/stats`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log('Supabase response status:', response.status);
    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Get billing stats API route error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch billing stats',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}