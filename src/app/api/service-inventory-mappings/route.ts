import { NextRequest, NextResponse } from 'next/server';
import { projectId, publicAnonKey } from '../../../utils/supabase/info';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userEmail = url.searchParams.get('userEmail');
    const userRole = url.searchParams.get('userRole');
    const serviceId = url.searchParams.get('serviceId');

    // Build query parameters for the server function
    const params = new URLSearchParams();
    if (userEmail) params.append('userEmail', userEmail);
    if (userRole) params.append('userRole', userRole);
    if (serviceId) params.append('serviceId', serviceId);

    const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-c89a26e4/service-inventory-mappings?${params}`;
    console.log(serverUrl);

    const response = await fetch(serverUrl, {
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.log(errorData);
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    console.log(data);
    return NextResponse.json(data);

  } catch (error) {
    console.error('Service-inventory mappings API route error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch service-inventory mappings',
        details: error instanceof Error ? error.message : 'Unknown error',
        // Return empty mappings structure on error
        mappings: []
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log(body);
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-c89a26e4/service-inventory-mappings`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Create service-inventory mapping API route error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create service-inventory mapping',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}