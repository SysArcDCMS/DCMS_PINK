import { NextRequest, NextResponse } from 'next/server';
import { projectId, publicAnonKey } from '../../../utils/supabase/info';

export async function POST(request: NextRequest) {
  try {
    // First, get a service to create a suggestion for
    const servicesResponse = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-c89a26e4/service-catalog`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!servicesResponse.ok) {
      return NextResponse.json({ error: 'Failed to get services' }, { status: 500 });
    }

    const servicesData = await servicesResponse.json();
    const services = servicesData.services || [];
    
    if (services.length === 0) {
      return NextResponse.json({ error: 'No services found' }, { status: 404 });
    }

    const firstService = services[0];

    // Create a test suggestion
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-c89a26e4/services/${firstService.id}/suggest`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          suggestion: `Test suggestion for ${firstService.name} - Consider updating the description to be more detailed.`,
          suggestedBy: 'test@example.com'
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Test suggestion creation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create test suggestion',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}