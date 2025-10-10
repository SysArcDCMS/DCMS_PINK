'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { AlertCircle, Eye, EyeOff, CheckCircle, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { LoginAttemptStatus } from '../../components/LoginAttemptStatus';

function LoginPageContent() {
  const { user, signIn, signUp, isLoading, error, clearError } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [signInData, setSignInData] = useState({
    email: '',
    password: ''
  });
  
  const [signUpData, setSignUpData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: ''
  });

  const [showPassword, setShowPassword] = useState({
    signIn: false,
    signUp: false,
    confirm: false
  });
  const [activeTab, setActiveTab] = useState('signin');
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [signUpStep, setSignUpStep] = useState<'form' | 'email-sent'>('form');
  const [pendingEmail, setPendingEmail] = useState('');

  // Check URL params for tab selection
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'signup') {
      setActiveTab('signup');
    }
  }, [searchParams]);

  // Check if user should be allowed to access this page
  useEffect(() => {
    if (user && !isLoading) {
      // If user has email and canLogin = true, redirect them away (they shouldn't be here)
      if (user.email && user.canLogin) {
        router.push('/dashboard');
      }
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    // Clear error when switching tabs
    clearError();
  }, [activeTab, clearError]);

  // Password validation for signup
  useEffect(() => {
    const errors: string[] = [];
    if (signUpData.password.length > 0) {
      if (signUpData.password.length < 8) {
        errors.push('Password must be at least 8 characters long');
      }
      if (!/(?=.*[a-z])/.test(signUpData.password)) {
        errors.push('Password must contain at least one lowercase letter');
      }
      if (!/(?=.*[A-Z])/.test(signUpData.password)) {
        errors.push('Password must contain at least one uppercase letter');
      }
      if (!/(?=.*\d)/.test(signUpData.password)) {
        errors.push('Password must contain at least one number');
      }
      if (!/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(signUpData.password)) {
        errors.push('Password must contain at least one special character');
      }
      if (signUpData.confirmPassword && signUpData.password !== signUpData.confirmPassword) {
        errors.push('Passwords do not match');
      }
    }
    setPasswordErrors(errors);
  }, [signUpData.password, signUpData.confirmPassword]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    const result = await signIn(signInData.email, signInData.password);
    if (result.success) {
      toast.success('Welcome back!', {
        description: 'You have been successfully signed in.'
      });
      router.push('/dashboard');
    } else if (result.error) {
      // Check if this is a lockout message (contains "too many failed login attempts")
      if (result.error.toLowerCase().includes('too many failed login attempts')) {
        toast.error('Account Temporarily Locked', {
          description: result.error,
          duration: 10000, // Show longer for security message
        });
      } else {
        toast.error('Sign In Failed', {
          description: result.error
        });
      }
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    // Email domain validation - only allow gmail.com or yahoo.com
    const emailDomain = signUpData.email.toLowerCase().split('@')[1];
    const allowedDomains = ['gmail.com', 'yahoo.com'];
    
    if (!allowedDomains.includes(emailDomain)) {
      toast.error('Email Domain Not Allowed', {
        description: 'Please use a Gmail or Yahoo email address for registration.'
      });
      return;
    }
    
    if (passwordErrors.length > 0) {
      toast.error('Please fix password errors', {
        description: 'Check the requirements below'
      });
      return;
    }

    if (signUpData.password !== signUpData.confirmPassword) {
      toast.error('Passwords do not match', {
        description: 'Please make sure both password fields match'
      });
      return;
    }

    // Validate names
    if (!signUpData.first_name.trim()) {
      toast.error('First name is required');
      return;
    }

    if (!signUpData.last_name.trim()) {
      toast.error('Last name is required');
      return;
    }
    
    const result = await signUp(signUpData.email, signUpData.password, signUpData.first_name, signUpData.last_name);
    if (result.success) {
      if (result.emailValidationRequired) {
        setPendingEmail(signUpData.email);
        setSignUpStep('email-sent');
        toast.success('Registration successful!', {
          description: 'Please check your email for a validation link to complete your registration.'
        });
      } else {
        // Fallback for immediate registration (shouldn't happen in new flow)
        toast.success('Account Created!', {
          description: 'Welcome to Go-Goyagoy. You are now signed in.'
        });
        router.push('/dashboard');
      }
    } else if (result.error) {
      toast.error('Sign Up Failed', {
        description: result.error
      });
    }
  };

  const handleResendValidationEmail = async () => {
    try {
      const response = await fetch('/api/auth/resend-validation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: pendingEmail }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Validation email sent!', {
          description: 'Please check your email for the validation link.'
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If user has email and canLogin = true, they shouldn't access this page
  if (user && user.email && user.canLogin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-gray-500 mb-4">You are already logged in.</p>
            <Button onClick={() => router.push('/dashboard')}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isSignUpFormValid = signUpData.email && 
                           signUpData.password && 
                           signUpData.confirmPassword && 
                           signUpData.first_name.trim() && 
                           signUpData.last_name.trim() && 
                           passwordErrors.length === 0;

  return (
    <div className="min-h-screen flex items-center justify-center bg-CustomPink3 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-CustomPink1">
            <strong>Go-Goyagoy</strong>
          </h2>
          <p className="mt-2 text-sm text-CustomPink1">
            <strong>Sign in to your account or create a new one</strong>
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full h-10 grid-cols-2 bg-CustomPink2 border-2 border-grey-50">
            <TabsTrigger value="signin"><strong>Sign In</strong></TabsTrigger>
            <TabsTrigger value="signup"><strong>Sign Up</strong></TabsTrigger>
          </TabsList>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <TabsContent value="signin">
            <Card className="bg-CustomPink2 border-2 border-grey-50">
              <CardHeader>
                <CardTitle><strong>Sign In</strong></CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email"><strong>Email</strong></Label>
                    <Input
                      className= "bg-CustomPink3 border-CustomPink1 border-2"
                      id="signin-email"
                      type="email"
                      value={signInData.email}
                      onChange={(e) => setSignInData(prev => ({ ...prev, email: e.target.value }))}
                      required
                      placeholder="Enter your email"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signin-password"><strong>Password</strong></Label>
                    <div className="relative">
                      <Input
                        className= "bg-CustomPink3 border-CustomPink1 border-2"
                        id="signin-password"
                        type={showPassword.signIn ? "text" : "password"}
                        value={signInData.password}
                        onChange={(e) => setSignInData(prev => ({ ...prev, password: e.target.value }))}
                        required
                        placeholder="Enter your password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(prev => ({ ...prev, signIn: !prev.signIn }))}
                      >
                        {showPassword.signIn ? (
                            <EyeOff className="h-4 w-4 text-CustomPink1" />
                          ) : (
                            <Eye className="h-4 w-4 text-CustomPink1" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Button
                      type="button"
                      variant="link"
                      className="px-0 h-auto text-sm"
                      onClick={() => router.push('/forgot-password')}
                    >
                      <strong>Forgot your password?</strong>
                    </Button>
                  </div>

                  <Button type="submit" className="w-full" variant="outline_pink" disabled={isLoading}>
                    {isLoading ? 'Signing In...' : 'Sign In'}
                  </Button>
                </form>

                {/*<div className="mt-6 p-4 rounded-lg bg-CustomPink3 border-CustomPink1 border-2">
                  <p className="text-sm mb-2"><strong>Demo Accounts:</strong></p>
                  <div className="text-xs space-y-1">
                    <div><strong>Admin:</strong> admin@localhost</div>
                    <div><strong>Dentist:</strong> dentist@dentalclinic.com</div>
                    <div><strong>Staff:</strong> staff@dentalclinic.com</div>
                    <div><strong>Patient:</strong> patient@example.com</div>
                    <div className="text-green-600"><strong>Admin Password:</strong> c1$Vg4unme</div>
                    <div className="text-green-600"><strong>Other Passwords:</strong> password123</div>
                  </div>
                  <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                    <strong>Testing Login:</strong> Use any of the demo accounts above. If you get "No account exists" error, the Supabase server may need a moment to initialize the demo data.
                  </div>
                </div>*/}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="signup">
            <Card className="bg-CustomPink2 border-2 border-grey-50">
              <CardHeader>
                <CardTitle><strong>Create Account</strong></CardTitle>
              </CardHeader>
              <CardContent>
                {signUpStep === 'form' ? (
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-first-name"><strong>First Name</strong></Label>
                        <Input
                      className= "bg-CustomPink3 border-CustomPink1 border-2"
                          id="signup-first-name"
                          type="text"
                          value={signUpData.first_name}
                          onChange={(e) => setSignUpData(prev => ({ ...prev, first_name: e.target.value }))}
                          required
                          placeholder="First name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-last-name"><strong>Last Name</strong></Label>
                        <Input
                      className= "bg-CustomPink3 border-CustomPink1 border-2"
                          id="signup-last-name"
                          type="text"
                          value={signUpData.last_name}
                          onChange={(e) => setSignUpData(prev => ({ ...prev, last_name: e.target.value }))}
                          required
                          placeholder="Last name"
                        />
                      </div>
                    </div>


                    <div className="space-y-2">
                      <Label htmlFor="signup-email"><strong>Email</strong></Label>
                      <Input
                        className= "bg-CustomPink3 border-CustomPink1 border-2"
                        id="signup-email"
                        type="email"
                        value={signUpData.email}
                        onChange={(e) => setSignUpData(prev => ({ ...prev, email: e.target.value }))}
                        required
                        placeholder="Enter your email"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <div className="relative">
                        <Input
                          className= "bg-CustomPink3 border-CustomPink1 border-2"
                          id="signup-password"
                          type={showPassword.signUp ? "text" : "password"}
                          value={signUpData.password}
                          onChange={(e) => setSignUpData(prev => ({ ...prev, password: e.target.value }))}
                          required
                          placeholder="Create a password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(prev => ({ ...prev, signUp: !prev.signUp }))}
                        >
                          {showPassword.signUp ? (
                            <EyeOff className="h-4 w-4 text-CustomPink1" />
                          ) : (
                            <Eye className="h-4 w-4 text-CustomPink1" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-confirm-password">Confirm Password</Label>
                      <div className="relative">
                        <Input
                          className= "bg-CustomPink3 border-CustomPink1 border-2"
                          id="signup-confirm-password"
                          type={showPassword.confirm ? "text" : "password"}
                          value={signUpData.confirmPassword}
                          onChange={(e) => setSignUpData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          required
                          placeholder="Confirm your password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(prev => ({ ...prev, confirm: !prev.confirm }))}
                        >
                          {showPassword.confirm ? (
                            <EyeOff className="h-4 w-4 text-CustomPink1" />
                          ) : (
                            <Eye className="h-4 w-4 text-CustomPink1" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {signUpData.password && (
                      <div className="space-y-2">
                        <Label className="text-sm text-gray-600">Password Requirements:</Label>
                        <div className="space-y-1">
                          {[
                            { check: signUpData.password.length >= 8, text: 'At least 8 characters long' },
                            { check: /(?=.*[a-z])/.test(signUpData.password), text: 'Contains lowercase letter' },
                            { check: /(?=.*[A-Z])/.test(signUpData.password), text: 'Contains uppercase letter' },
                            { check: /(?=.*\d)/.test(signUpData.password), text: 'Contains number' },
                            { check: /(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(signUpData.password), text: 'Contains special character' },
                            { check: signUpData.confirmPassword && signUpData.password ? signUpData.password === signUpData.confirmPassword : false, text: 'Passwords match' }
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

                    <Button type="submit" className="w-full" disabled={isLoading || !isSignUpFormValid}>
                      {isLoading ? 'Creating Account...' : 'Create Account'}
                    </Button>
                  </form>
                ) : (
                  <div className="text-center space-y-4">
                    <div className="flex justify-center">
                      <Mail className="h-16 w-16 text-CustomPink1" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-CustomPink1"><strong>Check your email</strong></h3>
                      <p className="text-sm text-gray-600 mt-2">
                        We've sent a validation link to <strong>{pendingEmail}</strong>
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        Please click the link in your email to complete your registration.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Button 
                        onClick={handleResendValidationEmail}
                        variant="ghost_pink" 
                        className="w-60"
                      >
                        <strong>Resend validation email</strong>
                      </Button>
                      <Button 
                        onClick={() => setSignUpStep('form')}
                        variant="ghost_pink"
                      >
                        <strong>← Back to sign up form</strong>
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="text-center">
          <Button 
            variant="ghost_pink" 
            onClick={() => router.push('/')}
            className="text-sm text-gray-600"
          >
            <strong>← Back to Homepage</strong>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}