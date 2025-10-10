# Go-Goyagoy Documentation Index

## Quick Navigation

### 🚀 Getting Started
- [System Overview](./README.md) - Complete system introduction
- [API Reference](./api-reference.md) - Complete API documentation
- [Database Schema](./database-schema.md) - Data models and relationships

### 👥 User Management
- [Authentication System](./authentication.md) - Login, signup, and access control
- [Patients](./patients.md) - Patient management and profiles

### 📅 Core Features  
- [Appointments](./appointments.md) - Booking, scheduling, and management
- [Tooth Chart System](./tooth-chart.md) - FDI notation and treatment tracking
- [Billing & Pricing](./billing.md) - Automated billing and pricing models
- [Services](./services.md) - Service catalog and management

### 🏥 Operations
- [Inventory Management](./inventory.md) - Stock tracking and management
- [Medical Records](./medical-records.md) - File management and patient history

### 🔧 Technical
- [Components](./components.md) - React component documentation
- [API Reference](./api-reference.md) - Complete API documentation
- [Database Schema](./database-schema.md) - Data models and relationships

## System Architecture

```
┌─────────────────────────────────────┐
│           Frontend Layer            │
├─────────────────────────────────────┤
│  Next.js 15.4.6 + TypeScript       │
│  Tailwind CSS v4 + shadcn/ui       │
│  React Hooks + Context API         │
└─────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────┐
│           API Layer                 │
├─────────────────────────────────────┤
│  Next.js API Routes                 │
│  Server-side Validation            │
│  Error Handling & Logging          │
└─────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────┐
│           Backend Layer             │
├─────────────────────────────────────┤
│  Supabase Functions                 │
│  KV Store for Data Persistence     │
│  Real-time Updates                  │
└─────────────────────────────────────┘
```

## Key Features by Documentation

### Authentication & User Management
- **Role-Based Access**: 4 user types with distinct permissions
- **Email Verification**: Secure account activation
- **Password Management**: Secure password policies
- **Session Management**: JWT-based authentication

### Appointment System
- **Anonymous Booking**: No registration required for initial appointments
- **Smart Scheduling**: Automatic time slot calculation
- **Walk-in Support**: Emergency patient workflow
- **Real-time Updates**: Live appointment synchronization

### Tooth Chart Innovation
- **FDI Compliance**: International dental notation standard
- **Visual Treatment Tracking**: Interactive tooth chart
- **Automated Integration**: Real-time updates from appointments
- **Treatment History**: Comprehensive dental record keeping

### Flexible Billing
- **Multiple Pricing Models**: Per tooth, per session, per package
- **Automated Generation**: Bills created on appointment completion
- **Transparent Pricing**: Clear cost breakdown for patients
- **Payment Tracking**: Comprehensive financial management

### Inventory Integration
- **Automatic Deductions**: Stock updates on service completion
- **Real-time Monitoring**: Live inventory level tracking
- **Reorder Management**: Automated low stock alerts
- **Cost Tracking**: Material cost allocation per service

## User Role Capabilities

| Feature | Anonymous | Patient | Staff | Dentist/Admin |
|---------|-----------|---------|-------|---------------|
| Book Appointments | ✅ | ✅ | ✅ | ✅ |
| View Own Data | ❌ | ✅ | ✅ | ✅ |
| Manage Appointments | ❌ | Own Only | ✅ | ✅ |
| Access Tooth Charts | ❌ | Own Only | ✅ | ✅ |
| Generate Bills | ❌ | ❌ | ✅ | ✅ |
| Manage Inventory | ❌ | ❌ | ✅ | ✅ |
| System Administration | ❌ | ❌ | ❌ | ✅ |

## API Overview

### Core Endpoints
- **Authentication**: `/api/auth/*` - User management
- **Appointments**: `/api/appointments/*` - Scheduling and management
- **Patients**: `/api/patients/*` - Patient profiles and data
- **Services**: `/api/services/*` - Service catalog management
- **Billing**: `/api/billing/*` - Financial operations
- **Inventory**: `/api/inventory/*` - Stock management
- **Medical Records**: `/api/medical-records/*` - File management

### Data Flow
1. **Frontend** → API Routes → **Validation** → Supabase Functions
2. **Real-time Updates** → KV Store → **WebSocket** → Frontend
3. **File Upload** → **Security Scan** → Encrypted Storage

## Database Design

### Core Tables
- **users** - User accounts and profiles
- **appointments** - Appointment scheduling
- **services** - Service catalog
- **inventory** - Stock management
- **bills** - Financial transactions
- **medical_records** - File management

### KV Store Usage
- **Patient Tooth Charts**: High-frequency access data
- **Appointment Cache**: Real-time appointment data
- **Service Cache**: Quick service lookup
- **Inventory Alerts**: Live stock monitoring

## Component Architecture

### Page Components
- Dashboard pages for each user role
- Public pages for marketing and booking
- Authentication pages for user management

### Feature Components
- Appointment management interfaces
- Patient profile and history views
- Billing and payment interfaces
- Tooth chart visualization

### Utility Components
- Form controls and validation
- File upload and management
- Search and pagination
- Loading and error states

## Development Guidelines

### Code Organization
```
/app/                   # Next.js pages and API routes
/components/           # React components
/contexts/            # React context providers
/hooks/               # Custom React hooks
/types/               # TypeScript type definitions
/utils/               # Utility functions
/data/                # Static data and configurations
/docs/                # Documentation
```

### Best Practices
- **TypeScript**: Full type safety across the application
- **Component Design**: Reusable, accessible, and performant
- **Error Handling**: Comprehensive error states and recovery
- **Testing**: Unit, integration, and accessibility testing
- **Performance**: Optimized rendering and data fetching

## Deployment & Infrastructure

### Technology Stack
- **Frontend**: Next.js 15.4.6 with App Router
- **Styling**: Tailwind CSS v4 with shadcn/ui components
- **Backend**: Supabase with PostgreSQL and KV Store
- **Authentication**: Supabase Auth with custom role management
- **File Storage**: Supabase Storage with encryption
- **Hosting**: Vercel (recommended) or similar platform

### Environment Requirements
- Node.js 18+
- PostgreSQL 13+
- Supabase account with KV Store enabled
- Email service for notifications

## Getting Help

### Documentation Structure
Each documentation file includes:
- **Overview**: Purpose and key features
- **Components**: Related React components
- **Pages & Flows**: User interaction patterns
- **API Integration**: Backend endpoints
- **Data Models**: Database relationships
- **Implementation Details**: Technical specifics

### Cross-References
All documentation files are cross-linked to provide comprehensive coverage of features and their interactions.

### Update Policy
Documentation is updated with each major feature release and reviewed quarterly for accuracy and completeness.