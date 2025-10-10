import { NextRequest, NextResponse } from 'next/server';
import { projectId, publicAnonKey } from '../../../../../utils/supabase/info';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // Change params to Promise
): Promise<NextResponse> {
  try {
    const resolvedParams = await params; // Await the params Promise
    const patientId = resolvedParams.id;
    const url = new URL(request.url);
    const userEmail = url.searchParams.get('userEmail');
    const userRole = url.searchParams.get('userRole');

    // Forward request to Supabase server function
    const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-c89a26e4/patients/${encodeURIComponent(patientId)}/service-history`;
    const queryParams = new URLSearchParams();
    
    if (userEmail) queryParams.append('userEmail', userEmail);
    if (userRole) queryParams.append('userRole', userRole);
    
    const fullServerUrl = queryParams.toString() 
      ? `${serverUrl}?${queryParams.toString()}`
      : serverUrl;

    const response = await fetch(fullServerUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to fetch service history' }));
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Get service history API error:', error);
    return NextResponse.json(
      { error: 'Service history service unavailable' },
      { status: 500 }
    );
  }
}