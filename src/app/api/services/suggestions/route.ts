import { NextRequest, NextResponse } from 'next/server';
import { projectId, publicAnonKey } from '../../../../utils/supabase/info';

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-c89a26e4/service-suggestions`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Get service suggestions API route error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch service suggestions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { suggestionId, action, reviewedBy, reviewNotes } = body;
    
    if (!suggestionId || !action || !reviewedBy) {
      return NextResponse.json(
        { error: 'Suggestion ID, action, and reviewed by are required' },
        { status: 400 }
      );
    }
    
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-c89a26e4/service-suggestions/${suggestionId}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          reviewedBy,
          reviewNotes
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
    console.error('Update service suggestion API route error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update service suggestion',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}