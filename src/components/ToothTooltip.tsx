import React from 'react';
import { ToothTreatment } from '../types/tooth';
import { getToothData } from '../data/fdiTeethData';

interface ToothTooltipProps {
  fdi: string;
  treatments?: ToothTreatment[];
  position: { x: number; y: number };
  visible: boolean;
}

export const ToothTooltip: React.FC<ToothTooltipProps> = ({
  fdi,
  treatments = [],
  position,
  visible,
}) => {
  const toothData = getToothData(fdi);
  if (!toothData || !visible) return null;

  // Filter treatments that include this tooth and sort by date (newest first)
  const toothTreatments = treatments
    .filter(treatment => treatment.teeth_fdi.includes(fdi))
    .sort((a, b) => {
      // Sort by date descending (newest first)
      const dateA = new Date(a.date || 0).getTime();
      const dateB = new Date(b.date || 0).getTime();
      return dateB - dateA;
    });

  // Calculate tooltip position to avoid going off-screen
  const tooltipStyle: React.CSSProperties = {
    position: 'fixed',
    left: Math.min(position.x + 10, window.innerWidth - 300),
    top: Math.max(position.y - 10, 10),
    zIndex: 1000,
    pointerEvents: 'none',
  };

  return (
    <div
      style={tooltipStyle}
      className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 max-w-xs"
    >
      {/* Tooth header */}
      <div className="border-b border-gray-100 pb-2 mb-2">
        <div className="text-sm font-semibold text-CustomPink1">
          Tooth #{fdi}
        </div>
        <div className="text-xs text-gray-600">
          {toothData.name}
        </div>
        <div className="text-xs text-gray-500">
          ({toothData.type === 'primary' ? 'Primary' : 'Permanent'} {toothData.category})
        </div>
      </div>

      {/* Treatment history */}
      {toothTreatments.length > 0 ? (
        <div>
          <div className="text-xs font-medium text-gray-700 mb-1">
            Treatment History ({toothTreatments.length} total):
          </div>
          <div className="space-y-1.5">
            {toothTreatments.slice(0, 3).map((treatment, index) => (
              <div key={treatment.id || index} className="text-xs text-gray-600 bg-gray-50 rounded p-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-CustomPink1">
                    {treatment.service_name || 'Treatment'}
                  </span>
                  {treatment.date && (
                    <span className="text-xs text-gray-500">
                      {new Date(treatment.date).toLocaleDateString()}
                    </span>
                  )}
                </div>
                {treatment.detail && (
                  <div className="text-gray-600 mt-0.5">
                    {treatment.detail.length > 50 
                      ? `${treatment.detail.substring(0, 50)}...`
                      : treatment.detail
                    }
                  </div>
                )}
                {treatment.completed_by && (
                  <div className="text-xs text-gray-400 mt-0.5">
                    By: {treatment.completed_by}
                  </div>
                )}
              </div>
            ))}
            {toothTreatments.length > 3 && (
              <div className="text-xs text-gray-400 italic text-center pt-1">
                +{toothTreatments.length - 3} more treatment{toothTreatments.length - 3 > 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-xs text-gray-500">
          No previous treatments recorded
        </div>
      )}
    </div>
  );
};
