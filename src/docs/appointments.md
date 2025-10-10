# Appointment Management

## Overview

The appointment system handles the complete lifecycle from initial booking to treatment completion, supporting both anonymous and registered users with real-time updates.

## Core Features

- **Anonymous Booking**: No registration required for initial appointments
- **Smart Time Slot Calculation**: Automatic availability based on service duration
- **Walk-in Patient Support**: Quick registration for emergency cases
- **Real-time Status Updates**: Live synchronization across all users
- **Multi-role Management**: Different capabilities based on user role

## Components

### Main Appointment Components
- `AppointmentManager.tsx` - Core appointment management interface
- `AppointmentsList.tsx` - Appointment listing with filtering
- `AppointmentCard.tsx` - Individual appointment display
- `BookingForm.tsx` - Registered user booking interface
- `HomeBookingForm.tsx` - Anonymous user booking on homepage
- `WalkInPatient.tsx` - Emergency patient registration

### Dialog Components
- `CompleteAppointmentDialog.tsx` - Treatment completion workflow
- `CancelAppointmentDialog.tsx` - Appointment cancellation
- `RescheduleAppointmentDialog.tsx` - Date/time changes
- `GenerateBillDialog.tsx` - Billing generation after completion

### Time Management
- `TimeSlotSelector.tsx` - Available time slot display
- `TimeSlotGrid.tsx` - Calendar-based time selection
- `CalendarPopover.tsx` - Date picker interface

## Pages & User Flows

### Anonymous Patient Booking
1. **Homepage**: `/app/page.tsx`
2. **Flow**: Service selection → Date/time → Contact info → Confirmation
3. **Features**: 
   - Real-time slot availability
   - Service duration calculation
   - Buffer time inclusion
   - Instant booking confirmation

### Dashboard Appointment Management
1. **Main Dashboard**: `/app/dashboard/appointments/page.tsx`
2. **Completion**: `/app/dashboard/appointments/complete/[id]/page.tsx`
3. **Reports**: `/app/dashboard/appointments/reports/page.tsx`

### Walk-in Patient Workflow
1. **Page**: `/app/dashboard/walk-in-patient/page.tsx`
2. **Flow**: Basic info → Immediate appointment → Treatment

### Patient Appointment Booking
1. **Page**: `/app/dashboard/book-appointment/page.tsx`
2. **Features**: Advanced scheduling, service selection, dentist preference

## Appointment States

### Status Lifecycle
1. **Pending** - Initial booking request
2. **Confirmed** - Staff has validated the appointment
3. **In Progress** - Patient has arrived, treatment started
4. **Completed** - Treatment finished, billing generated
5. **Cancelled** - Appointment cancelled by patient or staff
6. **No Show** - Patient didn't arrive

### Status Management
- Role-based status change permissions
- Automatic status transitions
- Notification triggers on status changes
- Audit trail for all status modifications

## Time Slot Management

### Smart Slot Calculation
```typescript
interface TimeSlotRequest {
  date: string;
  serviceDuration: number; // minutes
  bufferTime: number; // minutes between appointments
}

interface TimeSlot {
  startTime: string; // "09:00"
  endTime: string; // "10:15"
  available: boolean;
}
```

### Availability Logic
- Clinic operating hours: 9:00 AM - 6:00 PM
- Lunch break: 12:00 PM - 1:00 PM
- Minimum buffer time between appointments
- Dentist availability consideration
- Holiday and weekend handling

## Service Integration

### Service Selection
- Integration with service catalog
- Duration-based scheduling
- Pricing model awareness
- Tooth chart usage requirements

### Treatment Completion
- Service details recording
- Tooth chart updates
- Inventory deductions
- Automatic billing generation

## Walk-in Patient System

### Quick Registration
- Minimal required information
- Emergency contact details
- Medical history flags
- Insurance information capture

### Immediate Scheduling
- Next available slot detection
- Priority-based queuing
- Emergency case handling
- Real-time waiting list management

## API Integration

### Core Appointment APIs
- `GET /api/appointments` - List appointments with role-based filtering
- `POST /api/appointments/book` - Create new appointment
- `GET /api/appointments/available-slots` - Calculate available time slots
- `PUT /api/appointments/[id]/status` - Update appointment status
- `POST /api/appointments/[id]/complete` - Complete appointment workflow

### Supporting APIs
- `POST /api/patients/walk-in` - Register walk-in patient
- `GET /api/appointments/reports` - Generate appointment reports
- `POST /api/appointments/[id]/notes` - Add appointment notes

## Appointment Completion Workflow

### Treatment Documentation
1. Service details entry
2. Tooth chart updates (if applicable)
3. Treatment notes recording
4. Completion validation

### Automated Processes
1. **Inventory Deduction**: Automatic stock updates based on service mappings
2. **Tooth Chart Update**: FDI tooth marking and treatment history
3. **Bill Generation**: Pricing model-based calculation
4. **Status Updates**: Real-time notifications to all users

### Data Capture
```typescript
interface AppointmentCompletion {
  serviceDetails: ServiceDetail[];
  treatmentNotes: string;
  completedBy: string;
  completionDate: string;
  inventoryUsed?: InventoryItem[];
  toothChartUpdates?: ToothChartUpdate[];
}
```

## Real-time Features

### Live Updates
- Appointment status changes
- New bookings notifications
- Cancellation alerts
- Schedule modifications

### Multi-user Synchronization
- Prevent double-booking
- Real-time availability updates
- Concurrent editing protection
- Session-based notifications

## Reporting & Analytics

### Appointment Reports
- Daily/weekly/monthly summaries
- Dentist performance metrics
- Service popularity analysis
- No-show rate tracking
- Revenue by appointment type

### Data Export
- CSV export functionality
- Date range filtering
- Custom report generation
- Print-ready formats

## Error Handling

### Booking Errors
- Double-booking prevention
- Invalid time slot selection
- Service unavailability
- Patient data validation

### System Errors
- Network connectivity issues
- Server timeout handling
- Data synchronization failures
- Graceful degradation

## Performance Optimizations

### Caching Strategy
- Time slot caching
- Appointment list caching
- Service catalog caching
- User-specific data caching

### Lazy Loading
- Appointment history pagination
- Large dataset handling
- Background data prefetching
- Progressive loading states

## Integration Points

### Patient Management
- Automatic patient profile creation
- Contact information updates
- Medical history integration
- Insurance information linking

### Billing Integration
- Service pricing application
- Multi-service billing
- Payment tracking
- Insurance claim preparation

### Inventory Integration
- Automatic stock deductions
- Service-inventory mappings
- Low stock alerts
- Reorder point triggers

## Related Documentation

- [Patients](./patients.md) - Patient management integration
- [Billing & Pricing](./billing.md) - Billing workflow details
- [Services](./services.md) - Service catalog integration
- [API Reference](./api-reference.md#appointments) - Complete API documentation