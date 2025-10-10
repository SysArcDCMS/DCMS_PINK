'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { AlertCircle, ArrowLeft, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function ResetPasswordForm() {
  const { user, isLoading, resetPassword } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const token = searchParams.get('token');
  const email = searchParams.get('email');
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });

  const [showPasswords, setShowPasswords] = useState({
    password: false,
    confirm: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [isTokenValid, setIsTokenValid] = useState(true);

  useEffect(() => {
    if (user && !isLoading) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    // In a real app, validate the token here
    if (!token || !email) {
      setIsTokenValid(false);
    }
  }, [token, email]);

  // Password validation
  useEffect(() => {
    const errors: string[] = [];
    if (formData.password.length > 0) {
      if (formData.password.length < 8) {
        errors.push('Password must be at least 8 characters long');
      }
      if (!/(?=.*[a-z])/.test(formData.password)) {
        errors.push('Password must contain at least one lowercase letter');
      }
      if (!/(?=.*[A-Z])/.test(formData.password)) {
        errors.push('Password must contain at least one uppercase letter');
      }
      if (!/(?=.*\d)/.test(formData.password)) {
        errors.push('Password must contain at least one number');
      }
      if (!/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(formData.password)) {
        errors.push('Password must contain at least one special character');
      }
      if (formData.confirmPassword && formData.password !== formData.confirmPassword) {
        errors.push('Passwords do not match');
      }
    }
    setPasswordErrors(errors);
  }, [formData.password, formData.confirmPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordErrors.length > 0) {
      toast.error('Please fix password errors', {
        description: 'Check the requirements below'
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match', {
        description: 'Please make sure both password fields match'
      });
      return;
    }

    if (!token || !email) {
      toast.error('Invalid reset link', {
        description: 'This reset link is invalid or has expired.'
      });
      return;
    }

    setIsSubmitting(true);
    
    const result = await resetPassword(token, email, formData.password);
    if (result.success) {
      toast.success('Password Reset Successfully!', {
        description: 'Your password has been securely updated in the database. You can now sign in with your new password.'
      });
      
      // Wait a moment to show the success message, then redirect
      setTimeout(() => {
        router.push('/login');
      }, 1500);
    } else {
      toast.error('Password Reset Failed', {
        description: result.error || 'Failed to reset password. Please try again or request a new reset link.'
      });
    }
    setIsSubmitting(false);
  };

  const handleBack = () => {
    router.push('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isTokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <Card>
            <CardContent className="pt-6">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  This password reset link is invalid or has expired. Please request a new one.
                </AlertDescription>
              </Alert>
              
              <div className="mt-6 flex flex-col space-y-3">
                <Button onClick={() => router.push('/forgot-password')}>
                  Request New Reset Link
                </Button>
                <Button variant="outline" onClick={handleBack}>
                  Back to Sign In
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const isFormValid = formData.password && 
                     formData.confirmPassword && 
                     passwordErrors.length === 0;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-CustomPink1">
            Reset Your Password
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter your new password for {email}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create New Password</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPasswords.password ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    required
                    placeholder="Enter your new password"
                    disabled={isSubmitting}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPasswords(prev => ({ ...prev, password: !prev.password }))}
                  >
                    {showPasswords.password ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showPasswords.confirm ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    required
                    placeholder="Confirm your new password"
                    disabled={isSubmitting}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                  >
                    {showPasswords.confirm ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {formData.password && (
                <div className="space-y-2">
                  <Label className="text-sm text-gray-600">Password Requirements:</Label>
                  <div className="space-y-1">
                    {[
                      { check: formData.password.length >= 8, text: 'At least 8 characters long' },
                      { check: /(?=.*[a-z])/.test(formData.password), text: 'Contains lowercase letter' },
                      { check: /(?=.*[A-Z])/.test(formData.password), text: 'Contains uppercase letter' },
                      { check: /(?=.*\d)/.test(formData.password), text: 'Contains number' },
                      { check: /(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(formData.password), text: 'Contains special character' },
                      { check: formData.confirmPassword && formData.password ? formData.password === formData.confirmPassword : false, text: 'Passwords match' }
                    ].map((requirement, index) => (
                      <div key={index} className="flex items-center space-x-2 text-xs">
                        <CheckCircle className={`h-3 w-3 ${requirement.check ? 'text-green-500' : 'text-gray-300'}`} />
                        <span className={requirement.check ? 'text-green-600' : 'text-gray-500'}>
                          {requirement.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isSubmitting || !isFormValid}>
                {isSubmitting ? 'Updating Password...' : 'Update Password'}
              </Button>
            </form>

            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Supabase Backend Integration
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>
                      This connects to your Supabase backend to validate the reset token, 
                      hash the new password securely, and update your password in the database. 
                      The token is invalidated after successful use for security.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button 
            variant="ghost" 
            onClick={handleBack}
            className="text-sm text-gray-600 hover:text-CustomPink1"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Sign In
          </Button>
        </div>
      </div>
    </div>
  );
}