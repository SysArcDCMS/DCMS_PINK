import React, { useState, useCallback, useMemo } from 'react';
import { ToothChartProps, ToothState } from '../types/tooth';
import { ToothSVG } from './ToothSVG';
import { ToothTooltip } from './ToothTooltip';
import {
  FDI_TEETH_DATA,
  TOOTH_POSITIONS,
  getAllPermanentTeeth,
  getAllPrimaryTeeth,
} from '../data/fdiTeethData';

export const ToothChart: React.FC<ToothChartProps> = ({
  mode = 'edit',
  selectedTeeth = [],
  disabledTeeth = [],
  missingTeeth = [],
  treatedTeeth = [],
  treatments = [],
  onToothClick,
  onToothHover,
  className = '',
  showTooltip = true,
}) => {
  const [hoveredTooth, setHoveredTooth] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // Determine which teeth to show (permanent + primary for now)
  const allTeeth = useMemo(() => {
    return [...getAllPermanentTeeth(), ...getAllPrimaryTeeth()];
  }, []);

  // Determine tooth state
  const getToothState = useCallback((fdi: string): ToothState => {
    if (disabledTeeth.includes(fdi)) return 'disabled';
    if (missingTeeth.includes(fdi)) return 'missing';
    if (selectedTeeth.includes(fdi)) return 'selected';
    if (treatedTeeth.includes(fdi)) return 'treated';
    return 'normal';
  }, [disabledTeeth, missingTeeth, selectedTeeth, treatedTeeth]);

  // Handle tooth click
  const handleToothClick = useCallback((fdi: string) => {
    if (mode === 'readonly') return;
    if (disabledTeeth.includes(fdi)) return;
    
    onToothClick?.(fdi);
  }, [mode, disabledTeeth, onToothClick]);

  // Handle tooth hover
  const handleToothHover = useCallback((fdi: string | null, event?: React.MouseEvent) => {
    setHoveredTooth(fdi);
    
    if (fdi && event && showTooltip) {
      setTooltipPosition({ x: event.clientX, y: event.clientY });
    }
    
    onToothHover?.(fdi);
  }, [onToothHover, showTooltip]);

  // Handle mouse enter
  const handleToothMouseEnter = useCallback((fdi: string) => {
    handleToothHover(fdi);
  }, [handleToothHover]);

  // Handle mouse leave
  const handleToothMouseLeave = useCallback(() => {
    handleToothHover(null);
  }, [handleToothHover]);

  return (
    <div className={`relative ${className}`}>
      {/* SVG Chart */}
      <svg
        width="500"
        height="300"
        viewBox="0 0 500 300"
        className="w-full h-auto bg-gray-50 rounded-lg border border-gray-200"
      >
        {/* Background arch guides */}
        <g className="opacity-30">
          {/* Upper arch */}
          <path
            d="M 50 100 Q 250 30 450 100"
            fill="none"
            stroke="#d1d5db"
            strokeWidth={1}
            strokeDasharray="5,5"
          />
          {/* Lower arch */}
          <path
            d="M 50 200 Q 250 270 450 200"
            fill="none"
            stroke="#d1d5db"
            strokeWidth={1}
            strokeDasharray="5,5"
          />
        </g>

        {/* Quadrant labels */}
        <g className="text-xs fill-gray-400">
          <text x="400" y="30" textAnchor="middle">Upper Right</text>
          <text x="100" y="30" textAnchor="middle">Upper Left</text>
          <text x="100" y="285" textAnchor="middle">Lower Left</text>
          <text x="400" y="285" textAnchor="middle">Lower Right</text>
        </g>

        {/* Teeth */}
        {allTeeth.map((fdi) => {
          const position = TOOTH_POSITIONS[fdi];
          if (!position) return null;

          const state = getToothState(fdi);
          const isHovered = hoveredTooth === fdi;

          return (
            <ToothSVG
              key={fdi}
              fdi={fdi}
              position={position}
              state={state}
              isHovered={isHovered}
              onClick={() => handleToothClick(fdi)}
              onMouseEnter={() => handleToothMouseEnter(fdi)}
              onMouseLeave={handleToothMouseLeave}
            />
          );
        })}
      </svg>

      {/* Tooltip */}
      {showTooltip && hoveredTooth && (
        <ToothTooltip
          fdi={hoveredTooth}
          treatments={treatments}
          position={tooltipPosition}
          visible={!!hoveredTooth}
        />
      )}

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-slate-300 rounded border border-slate-500"></div>
          <span>Normal</span>
        </div>
        {mode === 'edit' && (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-emerald-500 rounded border-2 border-emerald-600"></div>
            <span>Selected</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-amber-400 rounded border-2 border-amber-500"></div>
          <span>Previously Treated</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded border-2 border-red-600 relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-6 h-0.5 bg-red-600 rotate-45"></div>
            </div>
          </div>
          <span>Missing/Extracted</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-400 rounded border border-gray-500"></div>
          <span>Disabled</span>
        </div>
      </div>

      {/* Selection Summary */}
      {mode === 'edit' && selectedTeeth.length > 0 && (
        <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
          <h4 className="font-medium text-emerald-800 mb-2">
            Selected Teeth ({selectedTeeth.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {selectedTeeth.map((fdi) => {
              const toothData = FDI_TEETH_DATA[fdi];
              return (
                <span
                  key={fdi}
                  className="inline-flex items-center px-2 py-1 bg-emerald-100 text-emerald-800 text-xs rounded"
                >
                  #{fdi} - {toothData?.shortName}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};