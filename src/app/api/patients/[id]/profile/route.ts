import { NextRequest, NextResponse } from 'next/server';
import { projectId, publicAnonKey } from '../../../../../utils/supabase/info';

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const body = await request.json();
    
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-c89a26e4/patients/${params.id}/profile`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Profile update API error:', error);
    return NextResponse.json(
      { error: 'Profile service unavailable' },
      { status: 500 }
    );
  }
}