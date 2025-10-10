import { NextRequest, NextResponse } from 'next/server';
import { projectId, publicAnonKey } from '../../../utils/supabase/info';

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-c89a26e4/server-status`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      }
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Server status API error:', error);
    return NextResponse.json(
      { error: 'Server status service unavailable' },
      { status: 500 }
    );
  }
}