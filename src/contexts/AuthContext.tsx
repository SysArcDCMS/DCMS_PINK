'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { User, Address } from '../types/index';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string; requiresOTP?: boolean; contactMethod?: 'phone' | 'email'; contactValue?: string; errorCode?: string;}>;
  signUp: (email: string, password: string, first_name: string, last_name: string, phone?: string) => Promise<{ success: boolean; error?: string; requiresOTP?: boolean; contactMethod?: 'phone' | 'email'; contactValue?: string; emailValidationRequired?: boolean }>;
  verifyOTP: (email: string, otp: string, type: 'signin' | 'signup') => Promise<{ success: boolean; error?: string }>;
  resendOTP: (email: string, type: 'signin' | 'signup') => Promise<{ success: boolean; error?: string }>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  forgotPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (token: string, email: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => void;
  clearError: () => void;
  updateProfile: (updates: Partial<User>) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for existing session in localStorage
    const savedUser = localStorage.getItem('dcms_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('dcms_user');
      }
    }
    setIsLoading(false);
  }, []);

  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string; requiresOTP?: boolean; contactMethod?: 'phone' | 'email'; contactValue?: string; errorCode?: string;}> => {
    setIsLoading(true);
    setError(null);

    console.log('Attempting sign in for:', email);

    // Check login attempts tracking
    const attemptKey = `dcms_login_attempts_${email}`;
    const lockoutKey = `dcms_lockout_${email}`;
    const attemptData = localStorage.getItem(attemptKey);
    const lockoutData = localStorage.getItem(lockoutKey);

    // Check if user is currently locked out
    if (lockoutData) {
      const lockoutInfo = JSON.parse(lockoutData);
      const lockoutTime = new Date(lockoutInfo.lockedUntil);
      if (new Date() < lockoutTime) {
        const remainingTime = Math.ceil((lockoutTime.getTime() - new Date().getTime()) / 1000 / 60);
        const errorMessage = `Too many failed login attempts. Please try again in ${remainingTime} minute${remainingTime !== 1 ? 's' : ''}.`;
        setError(errorMessage);
        setIsLoading(false);
        return { success: false, error: errorMessage };
      } else {
        // Lockout expired, clear it
        localStorage.removeItem(lockoutKey);
        localStorage.removeItem(attemptKey);
      }
    }

    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-c89a26e4/auth/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({ email, password, requireOTP: true })
      });

      console.log('Sign-in response status:', response.status);

      const data = await response.json();
      console.log('Sign-in response data:', data);

      if (!response.ok) {
        let errorMessage = data.error || 'Authentication failed';
        
        // Handle email not validated error (403)
        if (response.status === 403 && (data.errorCode === 'EMAIL_NOT_VALIDATED' || errorMessage.includes('verify your email'))) {
          setError(errorMessage);
          return { 
            success: false, 
            error: errorMessage,
            errorCode: 'EMAIL_NOT_VALIDATED'
          };
        }
        
        // Handle failed attempts tracking for authentication errors
        if (response.status === 401) {
          // Track failed attempt
          const attempts = attemptData ? JSON.parse(attemptData) : { count: 0, firstAttempt: new Date().toISOString() };
          attempts.count += 1;
          attempts.lastAttempt = new Date().toISOString();

          if (attempts.count >= 3) {
            // Lock out user for 15 minutes
            const lockoutUntil = new Date(Date.now() + 15 * 60 * 1000);
            localStorage.setItem(lockoutKey, JSON.stringify({
              lockedUntil: lockoutUntil.toISOString(),
              attempts: attempts.count
            }));
            localStorage.removeItem(attemptKey); // Clear attempts as user is now locked out
            
            errorMessage = `Too many failed login attempts (${attempts.count}). Your account has been temporarily locked for 15 minutes for security. Please try again later or use the "Forgot Password" option.`;
          } else {
            localStorage.setItem(attemptKey, JSON.stringify(attempts));
            const remainingAttempts = 3 - attempts.count;
            
            if (data.error?.includes('No account exists')) {
              errorMessage = `No account exists with the email address "${email}". Please check your email or create a new account. (${remainingAttempts} attempt${remainingAttempts !== 1 ? 's' : ''} remaining)`;
            } else if (data.error?.includes('Incorrect password')) {
              errorMessage = `Incorrect password. Please check your password and try again. (${remainingAttempts} attempt${remainingAttempts !== 1 ? 's' : ''} remaining)`;
            } else {
              errorMessage = `Invalid login credentials. Please check your email and password. (${remainingAttempts} attempt${remainingAttempts !== 1 ? 's' : ''} remaining)`;
            }
          }
        } else if (response.status >= 500) {
          errorMessage = 'Server error. The system may be starting up. Please wait a moment and try again.';
        }

        console.error('Sign-in error:', errorMessage);
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }

      // Successful login - clear any failed attempts
      localStorage.removeItem(attemptKey);
      localStorage.removeItem(lockoutKey);

      if (!data.user) {
        const errorMsg = 'Invalid response from server. Please try again.';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }

      if (!data.user.canLogin) {
        const errorMsg = 'This account cannot login. Please register yourself if you are a walk-in patient.';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }

      // If OTP is required, return success with OTP requirement
      if (data.requiresOTP) {
        console.log('OTP required for sign-in');
        return { 
          success: true, 
          requiresOTP: true, 
          contactMethod: data.user.phone ? 'phone' : 'email',
          contactValue: data.user.phone || data.user.email
        };
      }

      console.log('Sign-in successful for:', data.user.email, 'Role:', data.user.role);
      setUser(data.user);
      localStorage.setItem('dcms_user', JSON.stringify(data.user));
      return { success: true };
    } catch (error) {
      console.error('Network error during sign-in:', error);
      const errorMsg = 'Network connection error. Please check your internet connection and try again.';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, first_name: string, last_name: string, phone?: string): Promise<{ success: boolean; error?: string; requiresOTP?: boolean; contactMethod?: 'phone' | 'email'; contactValue?: string; emailValidationRequired?: boolean }> => {
    setIsLoading(true);
    setError(null);

    try {
      // Call Next.js API route which handles email sending
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email, 
          password, 
          first_name, 
          last_name, 
          phone
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error);
        return { success: false, error: data.error };
      }

      // Email validation is now always required
      console.log('[AuthContext] Signup successful, email validation required');
      return { 
        success: true, 
        emailValidationRequired: true,
        contactMethod: 'email',
        contactValue: email
      };
      return { success: true };
    } catch (error) {
      const errorMsg = 'Network error. Please try again.';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = () => {
    setUser(null);
    setError(null);
    localStorage.removeItem('dcms_user');
  };

  const clearError = () => {
    setError(null);
  };

  const updateProfile = async (updates: Partial<User>): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'No user logged in' };

    try {
      // Merge the updates with current user data, especially for nested objects like address
      const updatedUser = { ...user };
      
      Object.keys(updates).forEach(key => {
        if (key === 'address' && updates.address && user.address) {
          // Merge address fields
          updatedUser.address = { ...user.address, ...updates.address };
        } else {
          (updatedUser as any)[key] = (updates as any)[key];
        }
      });

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-c89a26e4/profile/${user.email}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify(updates)
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to update profile' };
      }

      // Use the updated user from the response, or fall back to our merged version
      const finalUser = data.user || updatedUser;
      setUser(finalUser);
      localStorage.setItem('dcms_user', JSON.stringify(finalUser));
      return { success: true };
    } catch (error) {
      console.error('Profile update error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const verifyOTP = async (email: string, otp: string, type: 'signin' | 'signup'): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-c89a26e4/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({ email, otp, type })
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.error || 'Invalid verification code';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }

      if (data.user) {
        setUser(data.user);
        localStorage.setItem('dcms_user', JSON.stringify(data.user));
      }

      return { success: true };
    } catch (error) {
      const errorMsg = 'Network error. Please try again.';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };

  const resendOTP = async (email: string, type: 'signin' | 'signup'): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-c89a26e4/auth/resend-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({ email, type })
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.error || 'Failed to resend verification code';
        return { success: false, error: errorMsg };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'No user logged in' };

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-c89a26e4/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({ 
          email: user.email, 
          currentPassword, 
          newPassword 
        })
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.error || 'Failed to change password';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }

      return { success: true };
    } catch (error) {
      const errorMsg = 'Network error. Please try again.';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };

  const forgotPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    setError(null);

    try {
      // Get the current domain for reset link generation
      const currentDomain = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
      
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-c89a26e4/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({ email, domain: currentDomain })
      });

      const data = await response.json();

      if (!response.ok) {
        let errorMsg = data.error || 'Failed to send reset email. Please try again.';
        
        // Handle specific error cases
        if (response.status === 404) {
          errorMsg = `No account exists with the email address "${email}". Please check your email or create a new account.`;
        } else if (response.status >= 500) {
          errorMsg = 'Server error. Please try again in a few moments.';
        }
        
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }

      // For demo purposes, also show the console message
      if (data.resetLink) {
        console.log('=== SUPABASE EMAIL SERVICE ===');
        console.log(`To: ${email}`);
        console.log(`Subject: Reset Your Go-Goyagoy Password`);
        console.log(`Reset Link: ${data.resetLink}`);
        console.log('===============================');
      }

      return { success: true };
    } catch (error) {
      console.error('Network error during forgot password:', error);
      const errorMsg = 'Network connection error. Please check your internet connection and try again.';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (token: string, email: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-c89a26e4/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({ token, email, newPassword })
      });

      const data = await response.json();

      if (!response.ok) {
        let errorMsg = data.error || 'Failed to reset password. Please try again.';
        
        // Handle specific error cases
        if (response.status === 400) {
          if (data.error?.includes('Invalid token') || data.error?.includes('expired')) {
            errorMsg = 'Invalid or expired reset token. Please request a new password reset link.';
          } else if (data.error?.includes('Token does not match')) {
            errorMsg = 'This reset link is not valid for this email address.';
          }
        } else if (response.status === 404) {
          errorMsg = 'Reset token not found. Please request a new password reset link.';
        } else if (response.status >= 500) {
          errorMsg = 'Server error. Please try again in a few moments.';
        }
        
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }

      // Log successful password reset for demo purposes
      console.log('=== SUPABASE PASSWORD RESET ===');
      console.log(`Email: ${email}`);
      console.log(`Password successfully updated in Supabase database`);
      console.log(`Reset token invalidated`);
      console.log('===============================');

      return { success: true };
    } catch (error) {
      console.error('Network error during password reset:', error);
      const errorMsg = 'Network connection error. Please check your internet connection and try again.';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    isLoading,
    error,
    signIn,
    signUp,
    verifyOTP,
    resendOTP,
    changePassword,
    forgotPassword,
    resetPassword,
    signOut,
    clearError,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}