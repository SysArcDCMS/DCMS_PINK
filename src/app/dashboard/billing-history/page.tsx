'use client';

import React from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import PatientBillingHistory from '../../../components/PatientBillingHistory';

export default function BillingHistoryPage() {
  const { user } = useAuth();

  if (!user || user.role !== 'patient') {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-CustomPink1 mb-4">Access Denied</h1>
          <p className="text-gray-600">This page is only available to registered patients.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-CustomPink1">Billing History</h1>
        <p className="text-gray-600 mt-2">
          View your payment records, bill details, and outstanding balances.
        </p>
      </div>
      
      <PatientBillingHistory
        patientId={user.email}
        userEmail={user.email}
        userRole={user.role}
      />
    </div>
  );
}