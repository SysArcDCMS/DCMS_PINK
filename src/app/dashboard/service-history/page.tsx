'use client';

import React from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import PatientServiceHistory from '../../../components/PatientServiceHistory';

export default function ServiceHistoryPage() {
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
        <h1 className="text-2xl font-bold text-CustomPink1">Service History</h1>
        <p className="text-gray-600 mt-2">
          View your complete dental chart and service history records.
        </p>
      </div>
      
      <PatientServiceHistory
        patientId={user.email}
        userEmail={user.email}
        userRole={user.role}
      />
    </div>
  );
}