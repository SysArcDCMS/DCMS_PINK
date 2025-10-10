import { NextRequest, NextResponse } from 'next/server';
import { projectId, publicAnonKey } from '../../../../utils/supabase/info';

export async function GET(request: NextRequest) {
  try {
    // Forward the request to the server endpoint for appointments only
    const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-c89a26e4/appointments`, {
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch from server');
    }
    
    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('API appointments/reports error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch appointment reports data' }, 
      { status: 500 }
    );
  }
}