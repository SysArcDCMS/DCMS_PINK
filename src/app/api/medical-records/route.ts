import { NextRequest, NextResponse } from 'next/server';
import { projectId, publicAnonKey } from '../../../utils/supabase/info';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const patientEmail = searchParams.get('patientEmail');

    if (!patientEmail) {
      return NextResponse.json(
        { error: 'Patient email is required' },
        { status: 400 }
      );
    }

    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-c89a26e4/medical-records?patientEmail=${encodeURIComponent(patientEmail)}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Medical records GET API error:', error);
    return NextResponse.json(
      { error: 'Medical records service unavailable' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const recordData = await request.json();
    
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-c89a26e4/medical-records`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(recordData),
      }
    );
    console.log('Response status:', response);
    const data = await response.json();
    console.log('Medical record created:', data);
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Medical records POST API error:', error);
    return NextResponse.json(
      { error: 'Medical records service unavailable' },
      { status: 500 }
    );
  }
}