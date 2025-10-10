import { NextRequest, NextResponse } from 'next/server';
import { projectId, publicAnonKey } from '../../../../utils/supabase/info';
import { generateEmailToken, generateTokenExpiry } from '../../../../utils/tokenGenerator';
import { sendResendValidationEmail } from '../../../../utils/emailService';

// Rate limiting: Track resend attempts per email
const resendAttempts = new Map<string, { count: number; firstAttempt: number }>();

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Rate limiting: Max 3 resends per hour
    const now = Date.now();
    const attempts = resendAttempts.get(email);
    
    if (attempts) {
      const hourInMs = 60 * 60 * 1000;
      const timeSinceFirst = now - attempts.firstAttempt;
      
      if (timeSinceFirst < hourInMs) {
        if (attempts.count >= 3) {
          return NextResponse.json(
            { error: 'Maximum resend limit reached. Please try again in an hour.' },
            { status: 429 }
          );
        }
        attempts.count += 1;
      } else {
        // Reset after an hour
        resendAttempts.set(email, { count: 1, firstAttempt: now });
      }
    } else {
      resendAttempts.set(email, { count: 1, firstAttempt: now });
    }

    // Check if user exists and get validation status from Supabase
    const checkResponse = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-c89a26e4/auth/check-validation-status`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ email }),
      }
    );

    const checkData = await checkResponse.json();

    if (!checkResponse.ok) {
      if (checkResponse.status === 404) {
        return NextResponse.json(
          { error: 'No account found for this email address.' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: checkData.error || 'Failed to check validation status' },
        { status: checkResponse.status }
      );
    }

    // Check if already validated
    if (checkData.emailValidated) {
      return NextResponse.json(
        { error: 'This email has already been validated. You can now sign in.' },
        { status: 400 }
      );
    }

    // Generate new validation token
    const validationToken = generateEmailToken();
    const tokenExpiry = generateTokenExpiry();

    // Store new validation token (invalidate old one)
    await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-c89a26e4/auth/store-validation-token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          userId: checkData.userId,
          token: validationToken,
          expiresAt: tokenExpiry,
        }),
      }
    );

    // Send validation email
    const userName = checkData.userName || 'User';
    const emailSent = await sendResendValidationEmail(
      email,
      userName,
      validationToken
    );

    if (!emailSent) {
      console.error('[Resend Validation] Failed to send email to:', email);
      return NextResponse.json(
        { error: 'Failed to send validation email. Please try again later.' },
        { status: 500 }
      );
    }

    console.log('[Resend Validation] Email sent successfully to:', email);

    return NextResponse.json({
      success: true,
      message: 'Validation email sent successfully. Please check your inbox.',
    });
  } catch (error) {
    console.error('[Resend Validation] Error:', error);
    return NextResponse.json(
      { error: 'Email validation service unavailable' },
      { status: 500 }
    );
  }
}