import { NextRequest, NextResponse } from 'next/server';
import { projectId, publicAnonKey } from '../../../../../utils/supabase/info';

// Define the params type
type RouteParams = {
  params: Promise<{
    serviceId: string;
    inventoryItemId: string;
  }>;
};

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // Await the params to resolve the Promise
    const { serviceId, inventoryItemId } = await params;
    const body = await request.json();

    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-c89a26e4/service-inventory-mappings/${serviceId}/${inventoryItemId}`,
      {
        method: 'PUT',
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
    console.error('Update service-inventory mapping API route error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update service-inventory mapping',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Await the params to resolve the Promise
    const { serviceId, inventoryItemId } = await params;
    const url = new URL(request.url);
    const userEmail = url.searchParams.get('userEmail');
    const userRole = url.searchParams.get('userRole');

    const deleteParams = new URLSearchParams();
    if (userEmail) deleteParams.append('userEmail', userEmail);
    if (userRole) deleteParams.append('userRole', userRole);

    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-c89a26e4/service-inventory-mappings/${serviceId}/${inventoryItemId}?${deleteParams}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Delete service-inventory mapping API route error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete service-inventory mapping',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}