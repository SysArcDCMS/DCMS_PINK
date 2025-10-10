import { NextRequest, NextResponse } from 'next/server';
import { projectId, publicAnonKey } from '../../../utils/supabase/info';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const patientEmail = searchParams.get('patientEmail');

    let url = `https://${projectId}.supabase.co/functions/v1/make-server-c89a26e4/correction-requests`;
    
    if (patientEmail) {
      url += `/${encodeURIComponent(patientEmail)}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Correction requests GET API error:', error);
    return NextResponse.json(
      { error: 'Correction requests service unavailable' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const requestData = await request.json();
    
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-c89a26e4/correction-requests`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      }
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Correction requests POST API error:', error);
    return NextResponse.json(
      { error: 'Correction requests service unavailable' },
      { status: 500 }
    );
  }
}