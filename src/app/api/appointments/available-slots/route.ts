import { NextRequest, NextResponse } from 'next/server';
import { projectId, publicAnonKey } from '../../../../utils/supabase/info';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🔍 Available-slots API - Request body:', body);
    
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-c89a26e4/available-slots`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify(body),
      }
    );

    console.log('🔍 Available-slots API - Server response status:', response.status);
    
    const data = await response.json();
    console.log('🔍 Available-slots API - Server response data:', {
      slotsCount: data.slots?.length || 0,
      debugInfo: data.debug,
      hasError: !!data.error
    });
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('🚨 Available slots API error:', error);
    return NextResponse.json(
      { error: 'Slot calculation service unavailable' },
      { status: 500 }
    );
  }
}