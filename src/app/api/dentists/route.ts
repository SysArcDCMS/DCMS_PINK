import { NextRequest, NextResponse } from 'next/server';
import { projectId, publicAnonKey } from '../../../utils/supabase/info';

export async function GET() {
  try {
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-c89a26e4/dentists`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      }
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Dentists API error:', error);
    return NextResponse.json(
      { error: 'Dentists service unavailable' },
      { status: 500 }
    );
  }
}