'use client';

import React, { useState } from 'react';
import { ToothChart } from '../../../components/ToothChart';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { ToothTreatment } from '../../../types/tooth';

// Mock treatment data for testing
const mockTreatments: ToothTreatment[] = [
  {
    id: '1',
    teeth_fdi: ['18', '28', '38', '48'],
    teeth_names: ['Upper Right 3rd Molar', 'Upper Left 3rd Molar', 'Lower Left 3rd Molar', 'Lower Right 3rd Molar'],
    detail: 'All wisdom teeth extracted - surgical extraction, patient tolerated well',
    surfaces: null,
    date: '2023-05-10',
    service_name: 'Surgical Extraction',
  },
  {
    id: '2',
    teeth_fdi: ['16', '26'],
    teeth_names: ['Upper Right 1st Molar', 'Upper Left 1st Molar'],
    detail: 'Composite filling on occlusal surface',
    surfaces: ['O'],
    date: '2023-04-15',
    service_name: 'Composite Filling',
  },
  {
    id: '3',
    teeth_fdi: ['11', '21'],
    teeth_names: ['Upper Right Central Incisor', 'Upper Left Central Incisor'],
    detail: 'Professional teeth cleaning and fluoride treatment',
    surfaces: null,
    date: '2023-03-20',
    service_name: 'Prophylaxis',
  },
];

export default function ToothChartDemo() {
  const [selectedTeeth, setSelectedTeeth] = useState<string[]>([]);
  const [mode, setMode] = useState<'edit' | 'readonly'>('edit');

  // Handle tooth selection
  const handleToothClick = (fdi: string) => {
    setSelectedTeeth(prev => {
      const isSelected = prev.includes(fdi);
      if (isSelected) {
        return prev.filter(tooth => tooth !== fdi);
      } else {
        return [...prev, fdi];
      }
    });
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedTeeth([]);
  };

  // Get treated teeth from mock treatments
  const treatedTeeth = mockTreatments.flatMap(treatment => treatment.teeth_fdi);
  
  // Mock missing teeth
  const missingTeeth = ['18', '28', '38', '48']; // Wisdom teeth extracted

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">FDI Tooth Chart Demo</h1>
        <div className="space-x-2">
          <Button
            variant={mode === 'edit' ? 'default' : 'outline'}
            onClick={() => setMode('edit')}
          >
            Edit Mode
          </Button>
          <Button
            variant={mode === 'readonly' ? 'default' : 'outline'}
            onClick={() => setMode('readonly')}
          >
            Read-Only Mode
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tooth Chart */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Interactive Tooth Chart</CardTitle>
              <p className="text-sm text-gray-600">
                {mode === 'edit' 
                  ? 'Click on teeth to select/deselect them. Hover for tooth information.'
                  : 'Read-only view showing treatment history. Hover for tooth information.'
                }
              </p>
            </CardHeader>
            <CardContent>
              <ToothChart
                mode={mode}
                selectedTeeth={selectedTeeth}
                treatedTeeth={treatedTeeth}
                missingTeeth={missingTeeth}
                treatments={mockTreatments}
                onToothClick={handleToothClick}
                showTooltip={true}
              />
            </CardContent>
          </Card>
        </div>

        {/* Controls and Info */}
        <div className="space-y-4">
          {/* Selection Info */}
          <Card>
            <CardHeader>
              <CardTitle>Selection Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Selected Teeth:</h4>
                {selectedTeeth.length > 0 ? (
                  <div className="space-y-1">
                    {selectedTeeth.map(fdi => (
                      <div key={fdi} className="text-sm">
                        #{fdi}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">None selected</p>
                )}
              </div>

              {mode === 'edit' && (
                <Button
                  onClick={clearSelection}
                  variant="outline"
                  size="sm"
                  disabled={selectedTeeth.length === 0}
                >
                  Clear Selection
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Treatment History */}
          <Card>
            <CardHeader>
              <CardTitle>Treatment History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockTreatments.map(treatment => (
                  <div key={treatment.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="font-medium text-sm">
                      {treatment.service_name}
                    </div>
                    <div className="text-xs text-gray-600 mb-1">
                      {treatment.date}
                    </div>
                    <div className="text-xs text-gray-500">
                      Teeth: {treatment.teeth_fdi.join(', ')}
                    </div>
                    <div className="text-xs text-gray-700 mt-1">
                      {treatment.detail}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Test Controls */}
          <Card>
            <CardHeader>
              <CardTitle>Test Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                onClick={() => setSelectedTeeth(['11', '12', '21', '22'])}
                variant="outline"
                size="sm"
                className="w-full"
              >
                Select Front Teeth
              </Button>
              <Button
                onClick={() => setSelectedTeeth(['16', '26', '36', '46'])}
                variant="outline"
                size="sm"
                className="w-full"
              >
                Select 1st Molars
              </Button>
              <Button
                onClick={() => setSelectedTeeth(['55', '54', '64', '65'])}
                variant="outline"
                size="sm"
                className="w-full"
              >
                Select Primary Molars
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}