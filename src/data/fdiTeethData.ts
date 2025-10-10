// FDI World Dental Federation notation data (ISO 3950)
import { ToothData, ToothPosition } from '../types/tooth';

// FDI tooth numbering system:
// Permanent teeth: Quadrants 1-4
// Primary teeth: Quadrants 5-8
// Quadrant 1: Upper Right (11-18)
// Quadrant 2: Upper Left (21-28)  
// Quadrant 3: Lower Left (31-38)
// Quadrant 4: Lower Right (41-48)
// Quadrant 5: Upper Right Primary (55-51)
// Quadrant 6: Upper Left Primary (65-61)
// Quadrant 7: Lower Left Primary (75-71)
// Quadrant 8: Lower Right Primary (85-81)

export const FDI_TEETH_DATA: Record<string, ToothData> = {
  // Permanent Teeth - Quadrant 1 (Upper Right)
  '18': { fdi: '18', name: 'Upper Right 3rd Molar', shortName: 'UR8', quadrant: 1, position: 8, type: 'permanent', category: 'molar' },
  '17': { fdi: '17', name: 'Upper Right 2nd Molar', shortName: 'UR7', quadrant: 1, position: 7, type: 'permanent', category: 'molar' },
  '16': { fdi: '16', name: 'Upper Right 1st Molar', shortName: 'UR6', quadrant: 1, position: 6, type: 'permanent', category: 'molar' },
  '15': { fdi: '15', name: 'Upper Right 2nd Premolar', shortName: 'UR5', quadrant: 1, position: 5, type: 'permanent', category: 'premolar' },
  '14': { fdi: '14', name: 'Upper Right 1st Premolar', shortName: 'UR4', quadrant: 1, position: 4, type: 'permanent', category: 'premolar' },
  '13': { fdi: '13', name: 'Upper Right Canine', shortName: 'UR3', quadrant: 1, position: 3, type: 'permanent', category: 'canine' },
  '12': { fdi: '12', name: 'Upper Right Lateral Incisor', shortName: 'UR2', quadrant: 1, position: 2, type: 'permanent', category: 'incisor' },
  '11': { fdi: '11', name: 'Upper Right Central Incisor', shortName: 'UR1', quadrant: 1, position: 1, type: 'permanent', category: 'incisor' },

  // Permanent Teeth - Quadrant 2 (Upper Left)
  '21': { fdi: '21', name: 'Upper Left Central Incisor', shortName: 'UL1', quadrant: 2, position: 1, type: 'permanent', category: 'incisor' },
  '22': { fdi: '22', name: 'Upper Left Lateral Incisor', shortName: 'UL2', quadrant: 2, position: 2, type: 'permanent', category: 'incisor' },
  '23': { fdi: '23', name: 'Upper Left Canine', shortName: 'UL3', quadrant: 2, position: 3, type: 'permanent', category: 'canine' },
  '24': { fdi: '24', name: 'Upper Left 1st Premolar', shortName: 'UL4', quadrant: 2, position: 4, type: 'permanent', category: 'premolar' },
  '25': { fdi: '25', name: 'Upper Left 2nd Premolar', shortName: 'UL5', quadrant: 2, position: 5, type: 'permanent', category: 'premolar' },
  '26': { fdi: '26', name: 'Upper Left 1st Molar', shortName: 'UL6', quadrant: 2, position: 6, type: 'permanent', category: 'molar' },
  '27': { fdi: '27', name: 'Upper Left 2nd Molar', shortName: 'UL7', quadrant: 2, position: 7, type: 'permanent', category: 'molar' },
  '28': { fdi: '28', name: 'Upper Left 3rd Molar', shortName: 'UL8', quadrant: 2, position: 8, type: 'permanent', category: 'molar' },

  // Permanent Teeth - Quadrant 3 (Lower Left)
  '31': { fdi: '31', name: 'Lower Left Central Incisor', shortName: 'LL1', quadrant: 3, position: 1, type: 'permanent', category: 'incisor' },
  '32': { fdi: '32', name: 'Lower Left Lateral Incisor', shortName: 'LL2', quadrant: 3, position: 2, type: 'permanent', category: 'incisor' },
  '33': { fdi: '33', name: 'Lower Left Canine', shortName: 'LL3', quadrant: 3, position: 3, type: 'permanent', category: 'canine' },
  '34': { fdi: '34', name: 'Lower Left 1st Premolar', shortName: 'LL4', quadrant: 3, position: 4, type: 'permanent', category: 'premolar' },
  '35': { fdi: '35', name: 'Lower Left 2nd Premolar', shortName: 'LL5', quadrant: 3, position: 5, type: 'permanent', category: 'premolar' },
  '36': { fdi: '36', name: 'Lower Left 1st Molar', shortName: 'LL6', quadrant: 3, position: 6, type: 'permanent', category: 'molar' },
  '37': { fdi: '37', name: 'Lower Left 2nd Molar', shortName: 'LL7', quadrant: 3, position: 7, type: 'permanent', category: 'molar' },
  '38': { fdi: '38', name: 'Lower Left 3rd Molar', shortName: 'LL8', quadrant: 3, position: 8, type: 'permanent', category: 'molar' },

  // Permanent Teeth - Quadrant 4 (Lower Right)
  '41': { fdi: '41', name: 'Lower Right Central Incisor', shortName: 'LR1', quadrant: 4, position: 1, type: 'permanent', category: 'incisor' },
  '42': { fdi: '42', name: 'Lower Right Lateral Incisor', shortName: 'LR2', quadrant: 4, position: 2, type: 'permanent', category: 'incisor' },
  '43': { fdi: '43', name: 'Lower Right Canine', shortName: 'LR3', quadrant: 4, position: 3, type: 'permanent', category: 'canine' },
  '44': { fdi: '44', name: 'Lower Right 1st Premolar', shortName: 'LR4', quadrant: 4, position: 4, type: 'permanent', category: 'premolar' },
  '45': { fdi: '45', name: 'Lower Right 2nd Premolar', shortName: 'LR5', quadrant: 4, position: 5, type: 'permanent', category: 'premolar' },
  '46': { fdi: '46', name: 'Lower Right 1st Molar', shortName: 'LR6', quadrant: 4, position: 6, type: 'permanent', category: 'molar' },
  '47': { fdi: '47', name: 'Lower Right 2nd Molar', shortName: 'LR7', quadrant: 4, position: 7, type: 'permanent', category: 'molar' },
  '48': { fdi: '48', name: 'Lower Right 3rd Molar', shortName: 'LR8', quadrant: 4, position: 8, type: 'permanent', category: 'molar' },

  // Primary Teeth - Quadrant 5 (Upper Right)
  '55': { fdi: '55', name: 'Upper Right 2nd Primary Molar', shortName: 'UR E', quadrant: 5, position: 5, type: 'primary', category: 'molar' },
  '54': { fdi: '54', name: 'Upper Right 1st Primary Molar', shortName: 'UR D', quadrant: 5, position: 4, type: 'primary', category: 'molar' },
  '53': { fdi: '53', name: 'Upper Right Primary Canine', shortName: 'UR C', quadrant: 5, position: 3, type: 'primary', category: 'canine' },
  '52': { fdi: '52', name: 'Upper Right Lateral Primary Incisor', shortName: 'UR B', quadrant: 5, position: 2, type: 'primary', category: 'incisor' },
  '51': { fdi: '51', name: 'Upper Right Central Primary Incisor', shortName: 'UR A', quadrant: 5, position: 1, type: 'primary', category: 'incisor' },

  // Primary Teeth - Quadrant 6 (Upper Left)
  '61': { fdi: '61', name: 'Upper Left Central Primary Incisor', shortName: 'UL A', quadrant: 6, position: 1, type: 'primary', category: 'incisor' },
  '62': { fdi: '62', name: 'Upper Left Lateral Primary Incisor', shortName: 'UL B', quadrant: 6, position: 2, type: 'primary', category: 'incisor' },
  '63': { fdi: '63', name: 'Upper Left Primary Canine', shortName: 'UL C', quadrant: 6, position: 3, type: 'primary', category: 'canine' },
  '64': { fdi: '64', name: 'Upper Left 1st Primary Molar', shortName: 'UL D', quadrant: 6, position: 4, type: 'primary', category: 'molar' },
  '65': { fdi: '65', name: 'Upper Left 2nd Primary Molar', shortName: 'UL E', quadrant: 6, position: 5, type: 'primary', category: 'molar' },

  // Primary Teeth - Quadrant 7 (Lower Left)
  '71': { fdi: '71', name: 'Lower Left Central Primary Incisor', shortName: 'LL A', quadrant: 7, position: 1, type: 'primary', category: 'incisor' },
  '72': { fdi: '72', name: 'Lower Left Lateral Primary Incisor', shortName: 'LL B', quadrant: 7, position: 2, type: 'primary', category: 'incisor' },
  '73': { fdi: '73', name: 'Lower Left Primary Canine', shortName: 'LL C', quadrant: 7, position: 3, type: 'primary', category: 'canine' },
  '74': { fdi: '74', name: 'Lower Left 1st Primary Molar', shortName: 'LL D', quadrant: 7, position: 4, type: 'primary', category: 'molar' },
  '75': { fdi: '75', name: 'Lower Left 2nd Primary Molar', shortName: 'LL E', quadrant: 7, position: 5, type: 'primary', category: 'molar' },

  // Primary Teeth - Quadrant 8 (Lower Right)
  '81': { fdi: '81', name: 'Lower Right Central Primary Incisor', shortName: 'LR A', quadrant: 8, position: 1, type: 'primary', category: 'incisor' },
  '82': { fdi: '82', name: 'Lower Right Lateral Primary Incisor', shortName: 'LR B', quadrant: 8, position: 2, type: 'primary', category: 'incisor' },
  '83': { fdi: '83', name: 'Lower Right Primary Canine', shortName: 'LR C', quadrant: 8, position: 3, type: 'primary', category: 'canine' },
  '84': { fdi: '84', name: 'Lower Right 1st Primary Molar', shortName: 'LR D', quadrant: 8, position: 4, type: 'primary', category: 'molar' },
  '85': { fdi: '85', name: 'Lower Right 2nd Primary Molar', shortName: 'LR E', quadrant: 8, position: 5, type: 'primary', category: 'molar' },
};

// Tooth positions for arch layout (SVG coordinates)
// Upper arch: y=50-120, Lower arch: y=180-250
// Left side: x=50-200, Right side: x=300-450
export const TOOTH_POSITIONS: Record<string, ToothPosition> = {
  // Upper Right (Quadrant 1) - Permanent
  '18': { x: 450, y: 80, rotation: -10 },  // 3rd Molar
  '17': { x: 420, y: 75, rotation: -5 },   // 2nd Molar
  '16': { x: 390, y: 70, rotation: 0 },    // 1st Molar
  '15': { x: 360, y: 65, rotation: 5 },    // 2nd Premolar
  '14': { x: 335, y: 60, rotation: 10 },   // 1st Premolar
  '13': { x: 315, y: 55, rotation: 15 },   // Canine
  '12': { x: 295, y: 50, rotation: 5 },    // Lateral Incisor
  '11': { x: 275, y: 50, rotation: 0 },    // Central Incisor

  // Upper Left (Quadrant 2) - Permanent
  '21': { x: 225, y: 50, rotation: 0 },    // Central Incisor
  '22': { x: 205, y: 50, rotation: -5 },   // Lateral Incisor
  '23': { x: 185, y: 55, rotation: -15 },  // Canine
  '24': { x: 165, y: 60, rotation: -10 },  // 1st Premolar
  '25': { x: 140, y: 65, rotation: -5 },   // 2nd Premolar
  '26': { x: 110, y: 70, rotation: 0 },    // 1st Molar
  '27': { x: 80, y: 75, rotation: 5 },     // 2nd Molar
  '28': { x: 50, y: 80, rotation: 10 },    // 3rd Molar

  // Lower Left (Quadrant 3) - Permanent
  '31': { x: 225, y: 250, rotation: 0 },   // Central Incisor
  '32': { x: 205, y: 250, rotation: 5 },   // Lateral Incisor
  '33': { x: 185, y: 245, rotation: 15 },  // Canine
  '34': { x: 165, y: 240, rotation: 10 },  // 1st Premolar
  '35': { x: 140, y: 235, rotation: 5 },   // 2nd Premolar
  '36': { x: 110, y: 230, rotation: 0 },   // 1st Molar
  '37': { x: 80, y: 225, rotation: -5 },   // 2nd Molar
  '38': { x: 50, y: 220, rotation: -10 },  // 3rd Molar

  // Lower Right (Quadrant 4) - Permanent
  '41': { x: 275, y: 250, rotation: 0 },   // Central Incisor
  '42': { x: 295, y: 250, rotation: -5 },  // Lateral Incisor
  '43': { x: 315, y: 245, rotation: -15 }, // Canine
  '44': { x: 335, y: 240, rotation: -10 }, // 1st Premolar
  '45': { x: 360, y: 235, rotation: -5 },  // 2nd Premolar
  '46': { x: 390, y: 230, rotation: 0 },   // 1st Molar
  '47': { x: 420, y: 225, rotation: 5 },   // 2nd Molar
  '48': { x: 450, y: 220, rotation: 10 },  // 3rd Molar

  // Primary teeth positions (smaller, inner positions)
  // Upper Right (Quadrant 5) - Primary
  '55': { x: 370, y: 85, rotation: 0 },    // 2nd Primary Molar
  '54': { x: 345, y: 80, rotation: 5 },    // 1st Primary Molar
  '53': { x: 325, y: 75, rotation: 10 },   // Primary Canine
  '52': { x: 305, y: 70, rotation: 5 },    // Lateral Primary Incisor
  '51': { x: 285, y: 70, rotation: 0 },    // Central Primary Incisor

  // Upper Left (Quadrant 6) - Primary
  '61': { x: 215, y: 70, rotation: 0 },    // Central Primary Incisor
  '62': { x: 195, y: 70, rotation: -5 },   // Lateral Primary Incisor
  '63': { x: 175, y: 75, rotation: -10 },  // Primary Canine
  '64': { x: 155, y: 80, rotation: -5 },   // 1st Primary Molar
  '65': { x: 130, y: 85, rotation: 0 },    // 2nd Primary Molar

  // Lower Left (Quadrant 7) - Primary
  '71': { x: 215, y: 230, rotation: 0 },   // Central Primary Incisor
  '72': { x: 195, y: 230, rotation: 5 },   // Lateral Primary Incisor
  '73': { x: 175, y: 225, rotation: 10 },  // Primary Canine
  '74': { x: 155, y: 220, rotation: 5 },   // 1st Primary Molar
  '75': { x: 130, y: 215, rotation: 0 },   // 2nd Primary Molar

  // Lower Right (Quadrant 8) - Primary
  '81': { x: 285, y: 230, rotation: 0 },   // Central Primary Incisor
  '82': { x: 305, y: 230, rotation: -5 },  // Lateral Primary Incisor
  '83': { x: 325, y: 225, rotation: -10 }, // Primary Canine
  '84': { x: 345, y: 220, rotation: -5 },  // 1st Primary Molar
  '85': { x: 370, y: 215, rotation: 0 },   // 2nd Primary Molar
};

// Helper functions
export const getToothData = (fdi: string): ToothData | undefined => {
  return FDI_TEETH_DATA[fdi];
};

export const getToothPosition = (fdi: string): ToothPosition | undefined => {
  return TOOTH_POSITIONS[fdi];
};

export const getAllPermanentTeeth = (): string[] => {
  return Object.keys(FDI_TEETH_DATA).filter(fdi => FDI_TEETH_DATA[fdi].type === 'permanent');
};

export const getAllPrimaryTeeth = (): string[] => {
  return Object.keys(FDI_TEETH_DATA).filter(fdi => FDI_TEETH_DATA[fdi].type === 'primary');
};

export const getTeethByQuadrant = (quadrant: number): string[] => {
  return Object.keys(FDI_TEETH_DATA).filter(fdi => FDI_TEETH_DATA[fdi].quadrant === quadrant);
};