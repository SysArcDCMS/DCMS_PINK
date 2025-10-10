'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Mail, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

function SignupSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get('email') || '';
  
  const [isResending, setIsResending] = useState(false);
  const [resendCount, setResendCount] = useState(0);

  const handleResendEmail = async () => {
    if (resendCount >= 3) {
      toast.error('Maximum resend limit reached. Please try again in an hour.');
      return;
    }

    try {
      setIsResending(true);
      
      const response = await fetch('/api/auth/resend-validation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Validation email sent! Please check your inbox.');
        setResendCount(prev => prev + 1);
      } else {
        toast.error(data.error || 'Failed to resend validation email');
      }
    } catch (error) {
      console.error('Error resending validation email:', error);
      toast.error('Failed to resend validation email. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const handleBackToLogin = () => {
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <Mail className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle>Check Your Email</CardTitle>
          <CardDescription>
            We've sent a verification link to your email address
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Success Message */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-green-800">
                  <strong>Account created successfully!</strong>
                </p>
                <p className="text-sm text-green-700 mt-1">
                  A verification email has been sent to:
                </p>
                <p className="text-sm font-medium text-green-900 mt-1">
                  {email}
                </p>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-3">
            <h3 className="font-medium text-CustomPink1">Next Steps:</h3>
            <ol className="space-y-2 text-sm text-gray-700">
              <li className="flex gap-2">
                <span className="font-medium">1.</span>
                <span>Check your email inbox for the verification link</span>
              </li>
              <li className="flex gap-2">
                <span className="font-medium">2.</span>
                <span>Click the verification link to activate your account</span>
              </li>
              <li className="flex gap-2">
                <span className="font-medium">3.</span>
                <span>Return to the login page and sign in</span>
              </li>
            </ol>
          </div>

          {/* Important Notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm font-medium text-amber-900">
                  Important Information
                </p>
                <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
                  <li>The verification link expires in 24 hours</li>
                  <li>Check your spam/junk folder if you don't see it</li>
                  <li>You cannot login until your email is verified</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Resend Button */}
          <div className="pt-2">
            <p className="text-sm text-gray-600 mb-3 text-center">
              Didn't receive the email?
            </p>
            <Button
              onClick={handleResendEmail}
              disabled={isResending || resendCount >= 3}
              variant="outline"
              className="w-full"
            >
              {isResending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>Resend Verification Email</>
              )}
            </Button>
            {resendCount > 0 && resendCount < 3 && (
              <p className="text-xs text-gray-500 mt-2 text-center">
                {resendCount} of 3 resends used this hour
              </p>
            )}
            {resendCount >= 3 && (
              <p className="text-xs text-red-600 mt-2 text-center">
                Maximum resend limit reached. Please try again in an hour.
              </p>
            )}
          </div>

          {/* Back to Login */}
          <div className="pt-2 border-t">
            <Button
              onClick={handleBackToLogin}
              variant="secondary"
              className="w-full"
            >
              Back to Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SignupSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Loading...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <SignupSuccessContent />
    </Suspense>
  );
}