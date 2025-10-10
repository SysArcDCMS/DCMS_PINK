import { NextRequest, NextResponse } from 'next/server';
import { projectId, publicAnonKey } from '../../../../utils/supabase/info';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { email, firstName, lastName, phone } = await request.json();
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }
    
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-c89a26e4/patients/validate`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ email, firstName, lastName, phone }),
      }
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Patient validation API error:', error);
    return NextResponse.json(
      { error: 'Patient validation service unavailable' },
      { status: 500 }
    );
  }
}