import { NextRequest, NextResponse } from 'next/server';
import { projectId, publicAnonKey } from '../../../utils/supabase/info';
import { da } from 'date-fns/locale';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-c89a26e4/billing${date ? `?date=${date}` : ''}`,
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
    
    //console.log('Raw data from Supabase:', data);

    let bills = [];
    
    if (Array.isArray(data)) {
      // The entire response is an array of JSON strings
      bills = data.map(item => {
        if (typeof item === 'string') {
          try {
            return JSON.parse(item);
          } catch (e) {
            console.error('Failed to parse bill JSON:', e);
            return null;
          }
        }
        return item;
      }).filter(bill => bill !== null);
    } else if (data && typeof data === 'object' && data.bills) {
      // If it already has a bills property (for backward compatibility)
      bills = data.bills;
    }

    //console.log('Parsed bills:', bills);

    return NextResponse.json({bills});

  } catch (error) {
    console.error('Get billing API route error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch billing data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const billData = await request.json();

    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-c89a26e4/billing`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(billData),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Create bill API route error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create bill',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}