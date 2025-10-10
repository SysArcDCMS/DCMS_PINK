import { NextRequest, NextResponse } from 'next/server';
import { projectId, publicAnonKey } from '../../../../../utils/supabase/info';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // Change to Promise
): Promise<NextResponse> {
  try {
    const resolvedParams = await params; // Await the params
    const patientId = resolvedParams.id;
    
    // Call the Supabase server function to get patient tooth chart
    const serverResponse = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-c89a26e4/patients/${encodeURIComponent(patientId)}/tooth-chart`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      }
    );

    if (!serverResponse.ok) {
      const errorData = await serverResponse.json().catch(() => ({ error: 'Failed to fetch tooth chart' }));
      return NextResponse.json(errorData, { status: serverResponse.status });
    }

    const data = await serverResponse.json();
    
    return NextResponse.json({
      success: true,
      toothChart: data.toothChart || null
    });
  } catch (error) {
    console.error('Get patient tooth chart error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch patient tooth chart' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // Change to Promise
): Promise<NextResponse> {
  try {
    const resolvedParams = await params; // Await the params
    const patientId = resolvedParams.id;
    const body = await request.json();
    const { toothChart } = body;
    
    // Call the Supabase server function to save patient tooth chart
    const serverResponse = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-c89a26e4/patients/${encodeURIComponent(patientId)}/tooth-chart`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          toothChart
        }),
      }
    );

    if (!serverResponse.ok) {
      const errorData = await serverResponse.json().catch(() => ({ error: 'Failed to save tooth chart' }));
      return NextResponse.json(errorData, { status: serverResponse.status });
    }

    const data = await serverResponse.json();
    
    return NextResponse.json({
      success: true,
      toothChart: data.toothChart
    });
  } catch (error) {
    console.error('Save patient tooth chart error:', error);
    return NextResponse.json(
      { error: 'Failed to save patient tooth chart' },
      { status: 500 }
    );
  }
}