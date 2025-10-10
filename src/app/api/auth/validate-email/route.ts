import { NextRequest, NextResponse } from 'next/server';
import { projectId, publicAnonKey } from '../../../../utils/supabase/info';
import { isTokenExpired } from '../../../../utils/tokenGenerator';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Missing validation token' },
        { status: 400 }
      );
    }

    // Validate token in Supabase server
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-c89a26e4/auth/validate-email`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ token }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      let errorMessage = data.error || 'Email validation failed';
      
      // Handle specific error cases for better UX
      if (response.status === 400) {
        if (data.error?.includes('Invalid token') || data.error?.includes('expired')) {
          errorMessage = 'This validation link has expired. Please request a new one.';
        } else if (data.error?.includes('already validated')) {
          errorMessage = 'This email has already been validated. You can now sign in.';
        }
      } else if (response.status === 404) {
        errorMessage = 'Validation link not found. Please request a new validation email.';
      }
      
      return NextResponse.json({ error: errorMessage }, { status: response.status });
    }

    // Success - email validated
    console.log('[Validate Email] Successfully validated:', data.email);
    
    return NextResponse.json({
      success: true,
      message: 'Email validated successfully! You can now sign in.',
      email: data.email,
    });
  } catch (error) {
    console.error('[Validate Email] Error:', error);
    return NextResponse.json(
      { error: 'Email validation service unavailable' },
      { status: 500 }
    );
  }
}