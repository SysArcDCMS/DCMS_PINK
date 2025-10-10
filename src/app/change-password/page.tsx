'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, ArrowLeft, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function ChangePasswordPage() {
  const { user, changePassword, isLoading, error, clearError } = useAuth();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  useEffect(() => {
    if (!user && !isLoading) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    clearError();
  }, [clearError]);

  useEffect(() => {
    // Validate password strength
    const errors: string[] = [];
    if (formData.newPassword.length > 0) {
      if (formData.newPassword.length < 8) {
        errors.push('Password must be at least 8 characters long');
      }
      if (!/(?=.*[a-z])/.test(formData.newPassword)) {
        errors.push('Password must contain at least one lowercase letter');
      }
      if (!/(?=.*[A-Z])/.test(formData.newPassword)) {
        errors.push('Password must contain at least one uppercase letter');
      }
      if (!/(?=.*\d)/.test(formData.newPassword)) {
        errors.push('Password must contain at least one number');
      }
      if (formData.confirmPassword && formData.newPassword !== formData.confirmPassword) {
        errors.push('Passwords do not match');
      }
    }
    setPasswordErrors(errors);
  }, [formData.newPassword, formData.confirmPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    if (passwordErrors.length > 0) {
      toast.error('Please fix password errors', {
        description: 'Check the requirements below'
      });
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Passwords do not match', {
        description: 'Please make sure both password fields match'
      });
      return;
    }

    const result = await changePassword(formData.currentPassword, formData.newPassword);
    if (result.success) {
      toast.success('Password Changed Successfully!', {
        description: 'Your password has been updated.'
      });
      router.push('/dashboard');
    } else if (result.error) {
      toast.error('Password Change Failed', {
        description: result.error
      });
    }
  };

  const handleBack = () => {
    router.push('/dashboard');
  };

  if (!user && !isLoading) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const isFormValid = formData.currentPassword && 
                     formData.newPassword && 
                     formData.confirmPassword && 
                     passwordErrors.length === 0;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-CustomPink1">
            Change Password
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Update your account password
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Password Update</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <div className="relative">
                  <Input
                    id="current-password"
                    type={showPasswords.current ? "text" : "password"}
                    value={formData.currentPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    required
                    placeholder="Enter your current password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                  >
                    {showPasswords.current ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showPasswords.new ? "text" : "password"}
                    value={formData.newPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                    required
                    placeholder="Enter your new password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                  >
                    {showPasswords.new ? (
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

              {formData.newPassword && (
                <div className="space-y-2">
                  <Label className="text-sm text-gray-600">Password Requirements:</Label>
                  <div className="space-y-1">
                    {[
                      { check: formData.newPassword.length >= 8, text: 'At least 8 characters long' },
                      { check: /(?=.*[a-z])/.test(formData.newPassword), text: 'Contains lowercase letter' },
                      { check: /(?=.*[A-Z])/.test(formData.newPassword), text: 'Contains uppercase letter' },
                      { check: /(?=.*\d)/.test(formData.newPassword), text: 'Contains number' },
                      { check: formData.confirmPassword ? formData.newPassword === formData.confirmPassword : true, text: 'Passwords match' }
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

              <Button type="submit" className="w-full" disabled={isLoading || !isFormValid}>
                {isLoading ? 'Updating Password...' : 'Update Password'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button 
            variant="ghost" 
            onClick={handleBack}
            className="text-sm text-gray-600 hover:text-CustomPink1"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}