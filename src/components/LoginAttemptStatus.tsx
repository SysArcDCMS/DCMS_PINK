'use client';

import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { AlertTriangle, Clock, RefreshCw } from 'lucide-react';

interface LoginAttemptStatusProps {
  email: string;
}

interface AttemptData {
  count: number;
  firstAttempt: string;
  lastAttempt?: string;
}

interface LockoutData {
  lockedUntil: string;
  attempts: number;
}

export function LoginAttemptStatus({ email }: LoginAttemptStatusProps) {
  const [attemptData, setAttemptData] = useState<AttemptData | null>(null);
  const [lockoutData, setLockoutData] = useState<LockoutData | null>(null);
  const [remainingTime, setRemainingTime] = useState<number>(0);

  const attemptKey = `dcms_login_attempts_${email}`;
  const lockoutKey = `dcms_lockout_${email}`;

  const checkStatus = () => {
    if (!email) return;

    const attemptStr = localStorage.getItem(attemptKey);
    const lockoutStr = localStorage.getItem(lockoutKey);

    setAttemptData(attemptStr ? JSON.parse(attemptStr) : null);
    setLockoutData(lockoutStr ? JSON.parse(lockoutStr) : null);
  };

  const clearAttempts = () => {
    localStorage.removeItem(attemptKey);
    localStorage.removeItem(lockoutKey);
    setAttemptData(null);
    setLockoutData(null);
    setRemainingTime(0);
  };

  useEffect(() => {
    checkStatus();
  }, [email]);

  useEffect(() => {
    if (lockoutData) {
      const lockoutTime = new Date(lockoutData.lockedUntil);
      const updateRemainingTime = () => {
        const now = new Date();
        if (now < lockoutTime) {
          setRemainingTime(Math.ceil((lockoutTime.getTime() - now.getTime()) / 1000 / 60));
        } else {
          setRemainingTime(0);
          checkStatus(); // Recheck status when lockout expires
        }
      };

      updateRemainingTime();
      const interval = setInterval(updateRemainingTime, 1000);
      return () => clearInterval(interval);
    }
  }, [lockoutData]);

  if (!email) return null;

  const isLockedOut = lockoutData && remainingTime > 0;

  return (
    <div className="space-y-3">
      {isLockedOut && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <span>
                Account locked for {remainingTime} minute{remainingTime !== 1 ? 's' : ''}
              </span>
              <Clock className="h-4 w-4" />
            </div>
          </AlertDescription>
        </Alert>
      )}

      {attemptData && !isLockedOut && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {attemptData.count} failed login attempt{attemptData.count !== 1 ? 's' : ''} for this email.
            {3 - attemptData.count} attempt{3 - attemptData.count !== 1 ? 's' : ''} remaining before temporary lockout.
          </AlertDescription>
        </Alert>
      )}

      {(attemptData || lockoutData) && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="text-sm text-orange-800">
                <strong>Development Tool:</strong> Clear login attempts for testing
              </div>
              <Button
                onClick={clearAttempts}
                variant="outline"
                size="sm"
                className="text-xs border-orange-300 text-orange-700 hover:bg-orange-100"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Clear Attempts
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}