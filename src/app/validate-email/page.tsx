'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { CheckCircle, AlertCircle, Mail, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

function ValidateEmailPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'validating' | 'success' | 'error' | 'expired' | 'waiting'>('validating');
  const [errorMessage, setErrorMessage] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    const validateEmail = async () => {
      const token = searchParams.get('token');
      const emailParam = searchParams.get('email');

      if (!token) {
        setStatus('error');
        setErrorMessage('Invalid validation link. Please check your email for the correct link.');
        return;
      }

      try {
        const response = await fetch(`/api/auth/validate-email?token=${encodeURIComponent(token)}`);
        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          setEmail(data.email || '');
          toast.success('Email validated successfully!', {
            description: 'Your account has been activated. You can now sign in.'
          });
        } else {
          if (data.error?.includes('expired')) {
            setStatus('expired');
          } else {
            setStatus('error');
          }
          setErrorMessage(data.error || 'Email validation failed');
          setEmail(data.email || '');
        }
      } catch (error) {
        setStatus('error');
        setErrorMessage('Network error. Please check your connection and try again.');
      }
    };

    validateEmail();
  }, [searchParams]);

  const handleResendValidation = async () => {
    try {
      const response = await fetch('/api/auth/resend-validation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Validation email sent!', {
          description: 'Please check your email for the new validation link.'
        });
      } else {
        toast.error('Failed to resend email', {
          description: data.error || 'Please try again later.'
        });
      }
    } catch (error) {
      toast.error('Network error', {
        description: 'Please check your connection and try again.'
      });
    }
  };

  const renderContent = () => {
    switch (status) {
      case 'waiting':
        return (
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <Mail className="h-16 w-16 text-CustomPink1" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-CustomPink1">Check your email!</h3>
              <p className="text-sm text-gray-600 mt-2">
                We've sent a validation link to <strong>{email}</strong>
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Click the link in your email to activate your account.
              </p>
            </div>
            <div className="space-y-2">
              <Button 
                onClick={handleResendValidation}
                variant="outline"
                className="w-full"
              >
                Resend validation email
              </Button>
              <Button 
                onClick={() => router.push('/login')}
                variant="ghost"
                className="w-full"
              >
                Go to Sign In
              </Button>
            </div>
          </div>
        );

      case 'validating':
        return (
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <RefreshCw className="h-16 w-16 text-CustomPink1 animate-spin" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-CustomPink1">Validating your email...</h3>
              <p className="text-sm text-gray-600 mt-2">
                Please wait while we verify your email address.
              </p>
            </div>
          </div>
        );

      case 'success':
        return (
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <CheckCircle className="h-16 w-16 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-CustomPink1">Email validated successfully!</h3>
              <p className="text-sm text-gray-600 mt-2">
                Your account has been activated. You can now sign in to Go-Goyagoy.
              </p>
            </div>
            <Button 
              onClick={() => router.push('/login')}
              className="w-full"
            >
              Sign In Now
            </Button>
          </div>
        );

      case 'expired':
        return (
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <AlertCircle className="h-16 w-16 text-amber-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-CustomPink1">Validation link expired</h3>
              <p className="text-sm text-gray-600 mt-2">
                This validation link has expired. We can send you a new validation email.
              </p>
              {email && (
                <p className="text-sm text-gray-500 mt-1">
                  Email: <strong>{email}</strong>
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Button 
                onClick={handleResendValidation}
                className="w-full"
              >
                Send new validation email
              </Button>
              <Button 
                onClick={() => router.push('/login?tab=signup')}
                variant="outline"
                className="w-full"
              >
                Back to sign up
              </Button>
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <AlertCircle className="h-16 w-16 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-CustomPink1">Validation failed</h3>
              <p className="text-sm text-gray-600 mt-2">
                {errorMessage}
              </p>
            </div>
            <div className="space-y-2">
              {email && (
                <Button 
                  onClick={handleResendValidation}
                  variant="outline"
                  className="w-full"
                >
                  Send new validation email
                </Button>
              )}
              <Button 
                onClick={() => router.push('/login?tab=signup')}
                variant="ghost"
                className="w-full"
              >
                Back to sign up
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-CustomPink1">
            Go-Goyagoy
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Email Validation
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            {renderContent()}
          </CardContent>
        </Card>

        <div className="text-center">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/')}
            className="text-sm text-gray-600 hover:text-CustomPink1"
          >
            ← Back to Homepage
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ValidateEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    }>
      <ValidateEmailPageContent />
    </Suspense>
  );
}