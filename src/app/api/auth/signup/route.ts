import { NextRequest, NextResponse } from 'next/server';
import { projectId, publicAnonKey } from '../../../../utils/supabase/info';
import { generateEmailToken, generateTokenExpiry } from '../../../../utils/tokenGenerator';
import { sendValidationEmail } from '../../../../utils/emailService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // First, create user in Supabase (with emailValidated = false)
    const userPayload = {
      ...body,
      emailValidated: false, // Ensure user is not validated initially
    };
    
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-c89a26e4/auth/signup`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify(userPayload),
      }
    );

    const data = await response.json();
    console.log('[Signup] Supabase response:', data);

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    // Generate validation token
    const validationToken = generateEmailToken();
    const tokenExpiry = generateTokenExpiry();

    // Store validation token in database
    const userId = data.user?.id;
    if (userId) {
      await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-c89a26e4/auth/store-validation-token`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            userId,
            token: validationToken,
            expiresAt: tokenExpiry,
          }),
        }
      );

      // Send validation email
      const userName = `${body.first_name} ${body.last_name}`.trim();
      const emailSent = await sendValidationEmail(
        body.email,
        userName,
        validationToken
      );

      if (!emailSent) {
        console.error('[Signup] Failed to send validation email to:', body.email);
        // Note: We don't fail the signup if email fails to send
        // User can request a resend later
      }
    }

    // Return success but indicate email needs validation
    return NextResponse.json({
      success: true,
      message: 'Account created successfully. Please check your email to verify your account.',
      emailSent: true,
      user: {
        id: data.user?.id,
        email: data.user?.email,
        emailValidated: false,
      },
    });
  } catch (error) {
    console.error('[Signup] Error:', error);
    return NextResponse.json(
      { error: 'Authentication service unavailable' },
      { status: 500 }
    );
  }
}