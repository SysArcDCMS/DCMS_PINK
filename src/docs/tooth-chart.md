# Tooth Chart System

## Overview

The tooth chart system is a core innovation of Go-Goyagoy, implementing the FDI World Dental Federation notation with visual treatment tracking and automated billing integration.

## Key Features

- **FDI Standard Compliance**: International tooth numbering system (11-48, 51-85)
- **Interactive Visual Chart**: SVG-based tooth representation
- **Treatment History Tooltips**: Hover-based treatment information display
- **Real-time Updates**: Automatic synchronization with appointment completion
- **Multi-tooth Treatment Support**: Handle treatments affecting multiple teeth
- **Missing Tooth Management**: Mark teeth as extracted or congenitally missing

## Components

### Core Components
- `ToothChart.tsx` - Main interactive tooth chart component
- `ToothSVG.tsx` - Individual tooth SVG rendering
- `ToothTooltip.tsx` - Treatment history tooltip display
- `PatientServiceHistory.tsx` - Patient view with integrated tooth chart

### Data Management
- `usePatientToothChart.ts` - Custom hook for tooth chart operations
- `fdiTeethData.ts` - Complete FDI tooth data and utilities
- `/types/tooth.ts` - TypeScript interfaces for tooth chart data

## FDI Notation System

### Permanent Teeth (11-48)
```
Quadrant 1 (Upper Right): 11-18
Quadrant 2 (Upper Left):  21-28  
Quadrant 3 (Lower Left):  31-38
Quadrant 4 (Lower Right): 41-48
```

### Primary Teeth (51-85)
```
Quadrant 5 (Upper Right): 51-55
Quadrant 6 (Upper Left):  61-65
Quadrant 7 (Lower Left):  71-75  
Quadrant 8 (Lower Right): 81-85
```

### Tooth Categories
- **Incisors**: Central and lateral cutting teeth
- **Canines**: Pointed teeth for tearing
- **Premolars**: Teeth for grinding (bicuspids)
- **Molars**: Large grinding teeth (including wisdom teeth)

## Visual States

### Tooth Color Coding
- 🟢 **White/Default**: Normal, untreated tooth
- 🟡 **Yellow/Amber**: Treated tooth with history
- 🔵 **Blue**: Currently selected tooth
- 🔴 **Red/Crossed**: Missing or extracted tooth
- ⚪ **Gray**: Disabled tooth (not interactive)

### Interactive Features
- **Click**: Mark/unmark tooth as missing
- **Hover**: Display treatment history tooltip
- **Multi-select**: Select multiple teeth for treatments
- **Visual Feedback**: Immediate state changes

## Tooth Chart Modes

### Edit Mode
- **Purpose**: Staff/dentist tooth chart management
- **Features**: Click to mark missing, full interactivity
- **Save Functionality**: Persist changes to database
- **Access**: `/dashboard/patients/[id]/tooth-chart`

### Readonly Mode  
- **Purpose**: Patient viewing of their own chart
- **Features**: Hover tooltips, no editing capability
- **Access**: `/dashboard/service-history` (patient role)

## Treatment History Integration

### Tooltip Display
```
┌─────────────────────────────────┐
│ Tooth #21                       │
│ Upper Left Central Incisor      │  
│ (Permanent Incisor)             │
├─────────────────────────────────┤
│ Previous Treatments:            │
│                                 │
│ Tooth Filling    10/05/2024    │
│ Minor cavity repair             │
│                                 │
│ Dental Cleaning  08/15/2024    │
│ Routine cleaning and polish     │
│                                 │
│ +2 more treatments              │
└─────────────────────────────────┘
```

### Treatment Data Structure
```typescript
interface ToothTreatment {
  id: string;
  service_name: string;
  date: string;
  detail: string;
  teeth_fdi: string[]; // Multiple teeth per treatment
  appointment_id: string;
  completed_by: string;
}
```

## Pages & User Flows

### Staff Tooth Chart Management
1. **Page**: `/app/dashboard/patients/[id]/tooth-chart/page.tsx`
2. **Flow**: Patient selection → Chart view → Edit teeth → Save changes
3. **Features**:
   - Interactive tooth chart
   - Missing tooth marking
   - Treatment history display
   - Chart statistics summary
   - Save functionality

### Patient Tooth Chart Viewing
1. **Page**: `/app/dashboard/service-history/page.tsx`
2. **Flow**: Login → Dashboard → View chart → Treatment history
3. **Features**:
   - Personal dental chart access
   - Treatment history with tooltips
   - Chart summary statistics
   - Read-only interaction

## Automated Integration

### Appointment Completion Integration
When an appointment is completed with tooth-specific services:

1. **Service Processing**: Check if service requires tooth chart usage
2. **Tooth Marking**: Mark selected teeth as "treated"
3. **Treatment Recording**: Add treatment record with:
   - Service name and details
   - Treatment date
   - FDI tooth numbers
   - Treating dentist
4. **Chart Update**: Real-time chart state update
5. **Billing Integration**: Per-tooth pricing calculation

### Pricing Model Integration
- **Per Tooth**: Calculate cost based on number of teeth treated
- **Per Tooth Package**: Fixed price regardless of tooth count
- **Visual Feedback**: Treated teeth highlighted in chart

## Data Management

### Storage Structure
```typescript
interface PatientToothChart {
  id: string;
  patientId: string;
  missingTeeth: string[];     // FDI numbers of missing teeth
  treatedTeeth: string[];     // FDI numbers with treatment history
  disabledTeeth: string[];    // FDI numbers of disabled teeth
  treatments: ToothTreatment[];
  lastUpdated: string;
}
```

### Database Operations
- **Create**: Initialize tooth chart for new patients
- **Read**: Fetch tooth chart with treatment history
- **Update**: Save missing tooth changes and new treatments
- **Sync**: Real-time updates across user sessions

## API Integration

### Tooth Chart APIs
- `GET /api/patients/[id]/tooth-chart` - Fetch patient tooth chart
- `POST /api/patients/[id]/tooth-chart` - Save tooth chart updates
- `GET /api/patients/[id]/service-history` - Get treatment history

### Server Integration
- Supabase KV Store: `dcms:patient-tooth-chart:${patientEmail}`
- Real-time synchronization with appointment completion
- Automatic tooth chart creation during treatment

## Advanced Features

### Multiple Treatments per Tooth
- Track multiple procedures on same tooth
- Chronological treatment history
- Treatment details with dates and providers
- Comprehensive tooltip display

### Missing Tooth Management
- Mark teeth as extracted
- Mark congenitally missing teeth
- Visual indication with red coloring
- Exclusion from treatment calculations

### Chart Statistics
- **Present Teeth**: 32 - missing count
- **Missing Teeth**: Total extracted/missing
- **Treated Teeth**: Teeth with treatment history
- **Total Treatments**: Sum of all procedures

## Implementation Details

### FDI Data Structure
```typescript
interface FDIToothData {
  fdi: string;
  name: string;            // "Upper Right Central Incisor"
  shortName: string;       // "UR1"
  quadrant: number;        // 1-4 (permanent), 5-8 (primary)
  position: number;        // 1-8 tooth position in quadrant
  type: 'permanent' | 'primary';
  category: 'incisor' | 'canine' | 'premolar' | 'molar';
  svgPath?: string;        // SVG path for tooth shape
}
```

### Chart Rendering
- **SVG-based**: Scalable vector graphics for all devices
- **Responsive Design**: Adapts to container size
- **Touch Support**: Mobile-friendly interactions
- **Accessibility**: Keyboard navigation and screen reader support

## Error Handling

### Data Validation
- FDI number validation
- Treatment date validation
- Patient permission checks
- Tooth state consistency

### User Feedback
- Loading states during save operations
- Success/error toast notifications
- Visual confirmation of changes
- Graceful error recovery

## Performance Optimizations

### Caching Strategy
- Tooth chart data caching
- Treatment history prefetching
- SVG component memoization
- Optimistic UI updates

### Real-time Updates
- Efficient data synchronization
- Minimal re-rendering
- State management optimization
- Background data refresh

## Integration Points

### Billing System
- Per-tooth pricing calculations
- Treatment cost aggregation
- Service-tooth associations
- Billing history integration

### Appointment System
- Automatic chart updates on completion
- Service-tooth chart usage validation
- Treatment recording workflow
- Real-time status synchronization

### Patient Management
- Chart access control
- Patient data integration
- Medical history correlation
- Treatment timeline construction

## Related Documentation

- [Billing & Pricing](./billing.md) - Pricing model integration
- [Appointments](./appointments.md) - Treatment completion workflow
- [Patients](./patients.md) - Patient data integration
- [API Reference](./api-reference.md#tooth-chart) - API documentation
- [Components](./components.md#tooth-chart) - Component details