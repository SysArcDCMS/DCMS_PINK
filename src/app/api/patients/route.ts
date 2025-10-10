import { NextRequest, NextResponse } from 'next/server';
import { projectId, publicAnonKey } from '../../../utils/supabase/info';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-c89a26e4/patients`,
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
    console.error('Get patients API error:', error);
    return NextResponse.json(
      { error: 'Patients service unavailable' },
      { status: 500 }
    );
  }
}