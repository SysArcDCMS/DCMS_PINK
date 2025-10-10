// FDI World Dental Federation notation types (ISO 3950)

export interface ToothData {
  fdi: string;
  name: string;
  shortName: string;
  quadrant: number;
  position: number;
  type: 'permanent' | 'primary';
  category: 'incisor' | 'canine' | 'premolar' | 'molar';
}

export interface ToothTreatment {
  id: string;
  teeth_fdi: string[];
  teeth_names: string[];
  detail: string;
  surfaces: string[] | null;
  date?: string;
  service_name?: string;
  completed_by?: string; // Add this line
}

export type ToothState = 
  | 'normal'      // Default tooth (blue/gray)
  | 'selected'    // User clicked (green)
  | 'missing'     // Already extracted/absent (red strikethrough)
  | 'treated'     // Has previous treatments (yellow outline)
  | 'disabled';   // Not applicable for this service (grayed out)

export interface ToothChartProps {
  mode: 'edit' | 'readonly';
  selectedTeeth?: string[];
  disabledTeeth?: string[];
  missingTeeth?: string[];
  treatedTeeth?: string[];
  treatments?: ToothTreatment[];
  onToothClick?: (fdi: string) => void;
  onToothHover?: (fdi: string | null) => void;
  className?: string;
  showTooltip?: boolean;
}

export interface ToothPosition {
  x: number;
  y: number;
  rotation?: number;
}

export interface ToothSVGProps {
  fdi: string;
  position: ToothPosition;
  state: ToothState;
  isHovered: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}