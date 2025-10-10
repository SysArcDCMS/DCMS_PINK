import React from 'react';
import { ToothSVGProps, ToothState } from '../types/tooth';
import { getToothData } from '../data/fdiTeethData';

// Individual tooth SVG component
export const ToothSVG: React.FC<ToothSVGProps> = ({
  fdi,
  position,
  state,
  isHovered,
  onClick,
  onMouseEnter,
  onMouseLeave,
}) => {
  const toothData = getToothData(fdi);
  if (!toothData) return null;

  // Define colors based on state
  const getToothColors = (state: ToothState, isHovered: boolean) => {
    const baseColors = {
      normal: { fill: '#e2e8f0', stroke: '#64748b', strokeWidth: 1 },
      selected: { fill: '#10b981', stroke: '#059669', strokeWidth: 2 },
      missing: { fill: '#ef4444', stroke: '#dc2626', strokeWidth: 2 },
      treated: { fill: '#fbbf24', stroke: '#f59e0b', strokeWidth: 2 },
      disabled: { fill: '#9ca3af', stroke: '#6b7280', strokeWidth: 1 },
    };

    const colors = baseColors[state];
    
    if (isHovered && state !== 'disabled') {
      return {
        ...colors,
        fill: state === 'selected' ? '#059669' : '#cbd5e1',
        strokeWidth: colors.strokeWidth + 1,
      };
    }
    
    return colors;
  };

  const colors = getToothColors(state, isHovered);
  const { x, y, rotation = 0 } = position;

  // Tooth shape based on category
  const getToothShape = () => {
    const { category, type } = toothData;
    const size = type === 'primary' ? 12 : 16;
    const width = size;
    const height = size * 1.2;

    switch (category) {
      case 'incisor':
        // Rectangular shape for incisors
        return (
          <rect
            x={-width / 2}
            y={-height / 2}
            width={width}
            height={height}
            rx={2}
            ry={2}
          />
        );
      
      case 'canine':
        // Pointed triangle-like shape for canines
        return (
          <path
            d={`M ${-width / 2} ${height / 2} 
                L 0 ${-height / 2} 
                L ${width / 2} ${height / 2} 
                Q ${width / 4} ${height / 3} 0 ${height / 3}
                Q ${-width / 4} ${height / 3} ${-width / 2} ${height / 2} Z`}
          />
        );
      
      case 'premolar':
        // Oval shape for premolars
        return (
          <ellipse
            cx={0}
            cy={0}
            rx={width / 2}
            ry={height / 2}
          />
        );
      
      case 'molar':
        // Square with rounded corners for molars
        return (
          <rect
            x={-width / 2}
            y={-height / 2}
            width={width}
            height={height}
            rx={4}
            ry={4}
          />
        );
      
      default:
        return (
          <circle
            cx={0}
            cy={0}
            r={size / 2}
          />
        );
    }
  };

  return (
    <g
      transform={`translate(${x}, ${y}) rotate(${rotation})`}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{ cursor: state === 'disabled' ? 'not-allowed' : 'pointer' }}
      className="tooth-svg"
    >
      {/* Tooth shape */}
      <g
        fill={colors.fill}
        stroke={colors.stroke}
        strokeWidth={colors.strokeWidth}
        className="transition-all duration-200"
      >
        {getToothShape()}
      </g>
      
      {/* Missing tooth indicator (strikethrough) */}
      {state === 'missing' && (
        <line
          x1={-12}
          y1={-12}
          x2={12}
          y2={12}
          stroke="#dc2626"
          strokeWidth={3}
          className="opacity-80"
        />
      )}
      
      {/* Tooth number label */}
      <text
        x={0}
        y={2}
        textAnchor="middle"
        fontSize={toothData.type === 'primary' ? '8' : '10'}
        fill={state === 'selected' ? '#ffffff' : '#374151'}
        className="pointer-events-none select-none"
        style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
      >
        {fdi}
      </text>
    </g>
  );
};