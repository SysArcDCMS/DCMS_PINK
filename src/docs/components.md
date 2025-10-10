# Component Documentation

## Overview

Comprehensive documentation for all React components in the Go-Goyagoy system, organized by functionality and usage patterns.

## Component Architecture

### Component Categories
- **Page Components** - Full page implementations
- **Feature Components** - Major functionality blocks
- **Dialog Components** - Modal interfaces
- **UI Components** - Reusable interface elements
- **Layout Components** - Structural components

### Design Principles
- **Reusability** - Components designed for multiple use cases
- **Accessibility** - Full keyboard navigation and screen reader support
- **Performance** - Optimized rendering and state management
- **Type Safety** - Full TypeScript implementation

## Authentication Components

### LoginForm.tsx
**Purpose:** User authentication interface

**Props:**
```typescript
interface LoginFormProps {
  onSuccess?: (user: User) => void;
  redirectTo?: string;
}
```

**Features:**
- Email/password validation
- Remember me functionality
- Forgot password link
- Loading states
- Error handling

**Usage:**
```tsx
<LoginForm 
  onSuccess={(user) => router.push('/dashboard')}
  redirectTo="/dashboard"
/>
```

### SignUpForm.tsx
**Purpose:** User registration interface

**Props:**
```typescript
interface SignUpFormProps {
  onSuccess?: (user: User) => void;
  userRole?: 'patient' | 'staff' | 'dentist';
}
```

**Features:**
- Multi-step registration
- Email verification
- Password strength validation
- Terms acceptance
- Role-based registration

### ChangePassword.tsx
**Purpose:** Password change functionality

**Features:**
- Current password verification
- New password validation
- Confirmation matching
- Security requirements display

### OTPVerification.tsx
**Purpose:** Email verification with OTP

**Props:**
```typescript
interface OTPVerificationProps {
  email: string;
  onVerified: () => void;
  onResend: () => void;
}
```

## Appointment Components

### AppointmentManager.tsx
**Purpose:** Main appointment management interface

**Props:**
```typescript
interface AppointmentManagerProps {
  userRole: UserRole;
  userEmail: string;
  viewMode?: 'list' | 'calendar';
}
```

**Features:**
- Role-based appointment filtering
- Real-time appointment updates
- Status management
- Quick actions (confirm, cancel, reschedule)

### AppointmentsList.tsx
**Purpose:** Tabular appointment display

**Features:**
- Sortable columns
- Status-based filtering
- Pagination
- Bulk operations
- Export functionality

### AppointmentCard.tsx
**Purpose:** Individual appointment display card

**Props:**
```typescript
interface AppointmentCardProps {
  appointment: Appointment;
  onStatusChange?: (id: string, status: string) => void;
  onEdit?: (appointment: Appointment) => void;
  showActions?: boolean;
}
```

### BookingForm.tsx
**Purpose:** Registered user appointment booking

**Features:**
- Service selection
- Time slot picker
- Dentist preference
- Special requests
- Confirmation workflow

### HomeBookingForm.tsx
**Purpose:** Anonymous patient booking on homepage

**Features:**
- Smart time slot calculation
- Service suggestion
- Contact information capture
- Instant booking confirmation

### TimeSlotSelector.tsx
**Purpose:** Available time slot selection

**Props:**
```typescript
interface TimeSlotSelectorProps {
  date: Date;
  duration: number;
  bufferTime: number;
  onSlotSelect: (slot: TimeSlot) => void;
  selectedSlot?: TimeSlot;
}
```

### WalkInPatient.tsx
**Purpose:** Walk-in patient registration

**Features:**
- Quick patient registration
- Emergency prioritization
- Immediate scheduling
- Basic medical information

## Dialog Components

### CompleteAppointmentDialog.tsx
**Purpose:** Appointment completion workflow

**Props:**
```typescript
interface CompleteAppointmentDialogProps {
  appointment: Appointment;
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: CompletionData) => void;
}
```

**Features:**
- Service selection and confirmation
- Tooth chart integration
- Treatment notes
- Inventory deduction
- Bill generation

### GenerateBillDialog.tsx
**Purpose:** Bill generation and preview

**Features:**
- Service pricing calculation
- Multiple pricing models
- Tooth-specific billing
- Print preview
- Payment recording

### ViewBillDialog.tsx
**Purpose:** Bill viewing and printing

**Features:**
- Professional bill layout
- Print optimization
- Payment status display
- PDF export

### CancelAppointmentDialog.tsx
**Purpose:** Appointment cancellation

**Features:**
- Cancellation reason selection
- Rescheduling option
- Notification preferences
- Confirmation workflow

### RescheduleAppointmentDialog.tsx
**Purpose:** Appointment rescheduling

**Features:**
- New date/time selection
- Availability checking
- Reason documentation
- Automatic notifications

## Tooth Chart Components

### ToothChart.tsx
**Purpose:** Interactive dental chart display

**Props:**
```typescript
interface ToothChartProps {
  mode?: 'edit' | 'readonly';
  selectedTeeth?: string[];
  treatedTeeth?: string[];
  missingTeeth?: string[];
  disabledTeeth?: string[];
  treatments?: ToothTreatment[];
  onToothClick?: (fdi: string) => void;
  onToothHover?: (fdi: string | null) => void;
  showTooltip?: boolean;
  className?: string;
}
```

**Features:**
- FDI notation system
- Interactive tooth selection
- Visual treatment history
- Hover tooltips
- Multiple viewing modes

### ToothSVG.tsx
**Purpose:** Individual tooth SVG rendering

**Props:**
```typescript
interface ToothSVGProps {
  fdi: string;
  state: ToothState;
  position: { x: number; y: number };
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onClick?: () => void;
}
```

### ToothTooltip.tsx
**Purpose:** Treatment history tooltip display

**Features:**
- Tooth information display
- Treatment history listing
- Smart positioning
- Rich content formatting

## Patient Components

### PatientDetailView.tsx
**Purpose:** Comprehensive patient profile display

**Features:**
- Patient demographics
- Contact information
- Medical history
- Appointment history
- Billing summary

### PatientProfile.tsx
**Purpose:** Patient profile editing

**Features:**
- Contact information updates
- Emergency contact management
- Medical history editing
- Insurance information

### PatientServiceHistory.tsx
**Purpose:** Patient service history with tooth chart

**Features:**
- Chronological service listing
- Integrated tooth chart
- Treatment details
- Filtering and search

### PatientBillingHistory.tsx
**Purpose:** Patient financial history

**Features:**
- Billing statement listing
- Payment tracking
- Balance calculations
- Payment plan management

### PatientRecords.tsx
**Purpose:** Medical records management

**Features:**
- File upload and management
- Record categorization
- Search and filtering
- Access control

## Dashboard Components

### Dashboard.tsx
**Purpose:** Role-based dashboard implementation

**Features:**
- Role-specific content
- Quick statistics
- Recent activity
- Action shortcuts

### DashboardStats.tsx
**Purpose:** Dashboard statistics display

**Props:**
```typescript
interface DashboardStatsProps {
  userRole: UserRole;
  timeframe?: 'today' | 'week' | 'month';
}
```

### DashboardLayout.tsx
**Purpose:** Dashboard layout structure

**Features:**
- Responsive sidebar
- Navigation menu
- Breadcrumbs
- User context

### Navigation.tsx
**Purpose:** Main navigation component

**Features:**
- Role-based menu items
- Active state indication
- Responsive design
- User menu

## Utility Components

### LoadingSpinner.tsx
**Purpose:** Loading state indicator

**Props:**
```typescript
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}
```

### SearchAndPagination.tsx
**Purpose:** Search and pagination controls

**Props:**
```typescript
interface SearchAndPaginationProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage?: number;
}
```

### FileUpload.tsx
**Purpose:** File upload interface

**Features:**
- Drag and drop support
- File type validation
- Progress indication
- Multiple file support

### ServiceSuggestions.tsx
**Purpose:** AI-powered service recommendations

**Props:**
```typescript
interface ServiceSuggestionsProps {
  symptoms?: string;
  patientHistory?: ServiceHistory[];
  onServiceSelect: (service: Service) => void;
}
```

## Form Components

### CalendarPopover.tsx
**Purpose:** Date picker with calendar interface

**Features:**
- Month/year navigation
- Date validation
- Holiday highlighting
- Accessibility support

### DateRangePicker.tsx
**Purpose:** Date range selection

**Features:**
- Start/end date selection
- Preset ranges
- Validation
- Clear functionality

### TimeSlotGrid.tsx
**Purpose:** Visual time slot grid

**Features:**
- Calendar view
- Available slot highlighting
- Booking conflicts indication
- Interactive selection

## Reporting Components

### ReportsDashboard.tsx
**Purpose:** Main reporting interface

**Features:**
- Report category selection
- Date range filtering
- Export options
- Chart visualization

## Error Handling Components

### ToastNotification.tsx
**Purpose:** Toast notification system

**Features:**
- Multiple notification types
- Auto-dismiss timing
- Action buttons
- Positioning options

### LoginAttemptStatus.tsx
**Purpose:** Failed login attempt tracking

**Features:**
- Attempt counter
- Lockout status
- Security messaging
- Recovery options

## Layout Components

### Homepage.tsx
**Purpose:** Public homepage layout

**Features:**
- Hero section
- Service highlights
- Booking form integration
- Responsive design

### RouteRenderer.tsx
**Purpose:** Dynamic route rendering

**Features:**
- Role-based routing
- Protected routes
- Loading states
- Error boundaries

## Component Best Practices

### State Management
- Use custom hooks for data fetching
- Implement optimistic updates
- Handle loading and error states
- Minimize prop drilling

### Performance
- Implement React.memo for expensive components
- Use useMemo and useCallback appropriately
- Lazy load heavy components
- Optimize re-renders

### Accessibility
- Proper ARIA labels
- Keyboard navigation
- Screen reader support
- Focus management

### Testing
- Unit tests for business logic
- Integration tests for user flows
- Accessibility testing
- Visual regression testing

## Custom Hooks

### usePatientToothChart.ts
**Purpose:** Tooth chart data management

**Returns:**
```typescript
{
  toothChart: PatientToothChart | null;
  treatments: ToothTreatment[];
  isLoading: boolean;
  error: string | null;
  saveToothChart: (chart: PatientToothChart) => Promise<void>;
  markTeethAsMissing: (teeth: string[]) => void;
  unmarkTeethAsMissing: (teeth: string[]) => void;
}
```

### useCompleteAppointment.ts
**Purpose:** Appointment completion workflow

**Features:**
- Service validation
- Tooth chart updates
- Billing generation
- Inventory deduction

### useInventoryRealtime.ts
**Purpose:** Real-time inventory monitoring

**Features:**
- Live stock updates
- Low stock alerts
- Automatic refresh
- Error handling

## Related Documentation

- [Authentication System](./authentication.md) - Auth component integration
- [Tooth Chart System](./tooth-chart.md) - Tooth chart component details
- [API Reference](./api-reference.md) - Component API integration
- [Database Schema](./database-schema.md) - Data model integration