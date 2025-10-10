import { NextRequest, NextResponse } from 'next/server';
import { projectId, publicAnonKey } from '../../../../utils/supabase/info';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const resolvedParams = await params;
    const patientId = resolvedParams.id;
    const url = new URL(request.url);
    const userEmail = url.searchParams.get('userEmail');
    const userRole = url.searchParams.get('userRole');

    // Forward request to Supabase server function
    const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-c89a26e4/patients/${encodeURIComponent(patientId)}`;
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
      const errorData = await response.json().catch(() => ({ error: 'Failed to fetch patient' }));
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Get patient API error:', error);
    return NextResponse.json(
      { error: 'Patient service unavailable' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const resolvedParams = await params;
    const patientId = resolvedParams.id;
    const body = await request.json();
    const url = new URL(request.url);
    const userEmail = url.searchParams.get('userEmail');
    const userRole = url.searchParams.get('userRole');

    // Forward request to Supabase server function
    const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-c89a26e4/patients/${encodeURIComponent(patientId)}`;
    const queryParams = new URLSearchParams();
    
    if (userEmail) queryParams.append('userEmail', userEmail);
    if (userRole) queryParams.append('userRole', userRole);
    
    const fullServerUrl = queryParams.toString() 
      ? `${serverUrl}?${queryParams.toString()}`
      : serverUrl;

    const response = await fetch(fullServerUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to update patient' }));
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Update patient API error:', error);
    return NextResponse.json(
      { error: 'Patient service unavailable' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const resolvedParams = await params;
    const patientId = resolvedParams.id;
    const url = new URL(request.url);
    const userEmail = url.searchParams.get('userEmail');
    const userRole = url.searchParams.get('userRole');

    // Forward request to Supabase server function
    const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-c89a26e4/patients/${encodeURIComponent(patientId)}`;
    const queryParams = new URLSearchParams();
    
    if (userEmail) queryParams.append('userEmail', userEmail);
    if (userRole) queryParams.append('userRole', userRole);
    
    const fullServerUrl = queryParams.toString() 
      ? `${serverUrl}?${queryParams.toString()}`
      : serverUrl;

    const response = await fetch(fullServerUrl, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to delete patient' }));
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Delete patient API error:', error);
    return NextResponse.json(
      { error: 'Patient service unavailable' },
      { status: 500 }
    );
  }
}