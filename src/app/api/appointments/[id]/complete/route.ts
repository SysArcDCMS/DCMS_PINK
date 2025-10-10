import { NextRequest, NextResponse } from 'next/server';
import { projectId, publicAnonKey } from '../../../../../utils/supabase/info';

async function handleCompleteAppointment(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: appointmentId } = await params;
    console.log(`Complete appointment API called with method: ${request.method}, ID: ${appointmentId}`);
    
    const body = await request.json();
    console.log('Request body:', body);
    
    const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-c89a26e4/appointments/${appointmentId}/complete`;
    console.log('Calling server URL:', serverUrl);
    
    const response = await fetch(serverUrl, {
      method: request.method, // Use the same method as the incoming request
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      body: JSON.stringify(body),
    });

    console.log(`Server response: ${response.status} ${response.statusText}`);
    
    const data = await response.json();
    console.log('Server response data:', data);
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Complete appointment API error:', error);
    return NextResponse.json(
      { error: 'Appointment completion service unavailable' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleCompleteAppointment(request, { params });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleCompleteAppointment(request, { params });
}