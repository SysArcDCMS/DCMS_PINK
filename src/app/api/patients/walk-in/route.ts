import { NextRequest, NextResponse } from 'next/server';
import { projectId, publicAnonKey } from '../../../../utils/supabase/info';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const walkInData = await request.json();
    
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-c89a26e4/walk-in-patient`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(walkInData),
      }
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Walk-in patient API error:', error);
    return NextResponse.json(
      { error: 'Walk-in patient service unavailable' },
      { status: 500 }
    );
  }
}