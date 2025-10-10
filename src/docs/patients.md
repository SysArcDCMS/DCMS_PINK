# Patient Management

## Overview

The patient management system handles comprehensive patient records, from anonymous bookings to detailed medical histories, with role-based access control and integrated tooth chart management.

## Patient Types

### Anonymous Patients
- **Initial Contact**: Homepage booking without registration
- **Data Capture**: Basic contact information and service requests
- **Conversion**: Option to register for full account access
- **Privacy**: Minimal data collection, GDPR compliant

### Registered Patients
- **Full Profiles**: Complete demographic and medical information
- **Self-Service**: Profile management and appointment booking
- **History Access**: Complete service and billing history
- **Tooth Chart**: Personal dental chart viewing

### Walk-in Patients
- **Quick Registration**: Minimal information for immediate service
- **Emergency Handling**: Fast-track for urgent cases
- **Profile Completion**: Option to complete full registration later
- **Integration**: Seamless conversion to regular patient records

## Components

### Patient Management Components
- `PatientDetailView.tsx` - Comprehensive patient profile display
- `PatientProfile.tsx` - Patient profile editing interface
- `PatientRecords.tsx` - Medical records and history management
- `PatientServiceHistory.tsx` - Service history with tooth chart integration
- `PatientBillingHistory.tsx` - Financial history and payment tracking
- `WalkInPatient.tsx` - Walk-in patient registration workflow

### Supporting Components
- `SearchAndPagination.tsx` - Patient search and list management
- `FileUpload.tsx` - Medical record file management

## Pages & User Flows

### Patient Management (Staff/Admin)
1. **Patient List**: `/app/dashboard/patients/page.tsx`
2. **Patient Details**: `/app/dashboard/patients/[id]/page.tsx`
3. **Patient Appointments**: `/app/dashboard/patients/[id]/appointments/page.tsx`
4. **Tooth Chart**: `/app/dashboard/patients/[id]/tooth-chart/page.tsx`

### Patient Self-Service
1. **Profile Management**: `/app/dashboard/my-profile/page.tsx`
2. **Service History**: `/app/dashboard/service-history/page.tsx`
3. **Billing History**: `/app/dashboard/billing-history/page.tsx`

### Walk-in Registration
1. **Quick Registration**: `/app/dashboard/walk-in-patient/page.tsx`
2. **Immediate Scheduling**: Integration with appointment system
3. **Profile Enhancement**: Post-service profile completion

## Patient Data Structure

### Core Patient Information
```typescript
interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
  address?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  medicalHistory?: string;
  role: 'patient';
  createdAt: string;
  updatedAt: string;
  isEmailVerified: boolean;
  lastVisit?: string;
}
```

### Extended Patient Data
```typescript
interface PatientExtended extends Patient {
  appointments: Appointment[];
  billingHistory: Bill[];
  medicalRecords: MedicalRecord[];
  toothChart: PatientToothChart;
  insuranceInfo?: InsuranceInformation;
  preferences?: PatientPreferences;
}
```

## Patient Registration Workflows

### Anonymous to Registered Conversion
1. **Initial Booking**: Anonymous appointment booking
2. **Service Completion**: Positive experience with clinic
3. **Registration Prompt**: Optional account creation
4. **Profile Completion**: Enhanced features access
5. **History Integration**: Link previous anonymous appointments

### Walk-in Registration
1. **Immediate Need**: Patient arrives without appointment
2. **Quick Data Capture**: Essential information only
   - Name, contact info, emergency details
   - Chief complaint and urgency level
   - Insurance information if available
3. **Instant Scheduling**: Next available slot
4. **Profile Enhancement**: Complete registration post-treatment

### Direct Registration
1. **Online Registration**: Full registration via signup page
2. **Email Verification**: Account activation process
3. **Profile Completion**: Comprehensive information gathering
4. **First Appointment**: Booking with full patient benefits

## Medical Records Management

### File Management
- **Upload System**: Secure file upload for medical documents
- **File Types**: Support for images, PDFs, and medical formats
- **Organization**: Categorized by record type and date
- **Access Control**: Role-based viewing permissions

### Record Categories
- **X-rays and Imaging**: Dental radiographs and scans
- **Treatment Photos**: Before/after treatment documentation
- **Medical History**: Health questionnaires and forms
- **Insurance Documents**: Coverage and claim information
- **Referral Letters**: Communication with other healthcare providers

### Integration Points
- **Appointment Notes**: Link records to specific visits
- **Treatment Documentation**: Visual evidence of procedures
- **Insurance Claims**: Supporting documentation for reimbursement
- **Legal Compliance**: Maintain records per healthcare regulations

## Patient Search & Management

### Search Capabilities
- **Name Search**: First and last name matching
- **Email Search**: Email address lookup
- **Phone Search**: Phone number identification
- **Advanced Filters**: Multiple criteria combination

### List Management
- **Pagination**: Efficient handling of large patient databases
- **Sorting Options**: Name, last visit, registration date
- **Status Indicators**: Active, inactive, overdue payments
- **Quick Actions**: Appointment scheduling, profile editing

## Privacy & Security

### Data Protection
- **HIPAA Compliance**: Healthcare privacy standards
- **Role-Based Access**: Limited data exposure per user role
- **Audit Trails**: Track all patient data access
- **Encryption**: Secure data storage and transmission

### Patient Rights
- **Data Access**: Patients can view their own information
- **Data Correction**: Request profile corrections
- **Data Portability**: Export personal health information
- **Privacy Controls**: Manage data sharing preferences

## Integration Features

### Tooth Chart Integration
- **Visual History**: Dental chart with treatment visualization
- **Treatment Mapping**: Link procedures to specific teeth
- **Historical Timeline**: Chronological treatment progression
- **Real-time Updates**: Automatic chart updates after treatment

### Appointment Integration
- **Scheduling**: Direct appointment booking from patient profile
- **History**: Complete appointment timeline
- **Preferences**: Dentist and time preferences
- **Reminders**: Automated appointment notifications

### Billing Integration
- **Financial Overview**: Account balance and payment history
- **Payment Plans**: Structured payment arrangements
- **Insurance Processing**: Automatic claim generation
- **Statement Generation**: Periodic billing statements

## API Integration

### Patient APIs
- `GET /api/patients` - List patients with role-based filtering
- `GET /api/patients/[id]` - Get specific patient details
- `PUT /api/patients/[id]` - Update patient information
- `POST /api/patients/validate` - Validate patient data
- `POST /api/patients/walk-in` - Register walk-in patient

### Patient-Specific APIs
- `GET /api/patients/[id]/appointments` - Patient appointment history
- `GET /api/patients/[id]/billing-history` - Financial records
- `GET /api/patients/[id]/service-history` - Treatment history
- `GET /api/patients/[id]/tooth-chart` - Dental chart data
- `POST /api/patients/[id]/tooth-chart` - Update dental chart

## Performance Optimizations

### Data Loading
- **Lazy Loading**: Load patient details on demand
- **Pagination**: Efficient list management
- **Caching**: Cache frequently accessed patient data
- **Background Refresh**: Update data in background

### Search Optimization
- **Indexed Search**: Fast patient lookup
- **Debounced Input**: Efficient search as you type
- **Result Caching**: Cache search results
- **Progressive Loading**: Show results as they load

## Error Handling

### Data Validation
- **Contact Information**: Email and phone validation
- **Date Validation**: Birth date and appointment date checks
- **Required Fields**: Ensure essential information is captured
- **Format Validation**: Consistent data formatting

### Error Recovery
- **Graceful Degradation**: Continue operation with partial data
- **Retry Mechanisms**: Handle temporary failures
- **User Feedback**: Clear error messages and resolution steps
- **Data Backup**: Prevent data loss during errors

## Reporting & Analytics

### Patient Analytics
- **Registration Trends**: New patient acquisition rates
- **Demographics**: Age, location, and insurance analysis
- **Visit Frequency**: Patient retention and loyalty metrics
- **Treatment Patterns**: Common services and preferences

### Clinical Insights
- **Treatment Outcomes**: Success rates and follow-up needs
- **No-Show Patterns**: Identify and address attendance issues
- **Preference Analysis**: Optimize scheduling and services
- **Revenue per Patient**: Financial performance metrics

## Related Documentation

- [Authentication System](./authentication.md) - User management and roles
- [Appointments](./appointments.md) - Appointment management integration
- [Tooth Chart System](./tooth-chart.md) - Dental chart integration
- [Billing & Pricing](./billing.md) - Financial management
- [Medical Records](./medical-records.md) - File management system
- [API Reference](./api-reference.md#patients) - API documentation