import { NextRequest, NextResponse } from 'next/server';
import { projectId, publicAnonKey } from '../../../../../utils/supabase/info';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id: notificationId } = await params;
    
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-c89a26e4/notifications/${notificationId}/read`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Mark notification as read API error:', error);
    return NextResponse.json(
      { error: 'Notifications service unavailable' },
      { status: 500 }
    );
  }
}