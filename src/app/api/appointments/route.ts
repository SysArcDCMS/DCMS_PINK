import { NextRequest, NextResponse } from 'next/server';
import { projectId, publicAnonKey } from '../../../utils/supabase/info';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('userEmail');
    const role = searchParams.get('role');
    const currentDateOnly = searchParams.get('currentDateOnly');

    if (!userEmail || !role) {
      return NextResponse.json(
        { error: 'User email and role are required' },
        { status: 400 }
      );
    }

    // Construct query parameters for the Supabase function
    const params = new URLSearchParams({
      userEmail,
      role,
      ...(currentDateOnly && { currentDateOnly })
    });

    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-c89a26e4/appointments?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        // Add cache control for better performance
        next: { revalidate: 30 } // Revalidate every 30 seconds
      }
    );

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }

    const data = await response.json();

    // Add fresh data indicators
    const now = new Date().toISOString();
    const responseData = {
      ...data,
      fetchedAt: now,
      isFresh: true
    };

    return NextResponse.json(responseData, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        'X-Fetched-At': now,
      },
    });

  } catch (error) {
    console.error('Appointments API route error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch appointments',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}