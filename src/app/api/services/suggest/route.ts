import { NextRequest, NextResponse } from 'next/server';
import { projectId, publicAnonKey } from '../../../../utils/supabase/info';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { serviceId, suggestion, suggestedBy } = body;
    
    if (!serviceId || !suggestion || !suggestedBy) {
      return NextResponse.json(
        { error: 'Service ID, suggestion, and suggested by are required' },
        { status: 400 }
      );
    }
    
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-c89a26e4/services/${serviceId}/suggest`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          suggestion,
          suggestedBy
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Service suggestion API route error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to submit suggestion',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}