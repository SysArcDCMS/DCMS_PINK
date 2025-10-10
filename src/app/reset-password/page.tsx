import React, { Suspense } from 'react';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import ResetPasswordForm from './ResetPasswordForm';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
