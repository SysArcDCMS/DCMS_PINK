# Go-Goyagoy Dental Clinic Management System

A comprehensive dental clinic management system built with Next.js 15.4.6, TypeScript, and Supabase.

## Overview

Go-Goyagoy is a modern, role-based dental clinic management system that streamlines operations from patient booking to treatment completion. The system features an innovative FDI tooth chart integration with automated billing and real-time collaboration capabilities.

## Key Features

- **Role-Based Access Control**: 4 user types (Anonymous Patient, Registered Patient, Staff, Dentist/Admin)
- **FDI Tooth Chart System**: International standard tooth numbering with visual treatment tracking
- **Flexible Pricing Models**: Per Tooth, Per Session, Per Film, Per Package billing options
- **Real-Time Updates**: Live synchronization across all user sessions
- **Anonymous Patient Booking**: Barrier-free appointment scheduling
- **Comprehensive Billing**: Automated bill generation with detailed tracking
- **Inventory Management**: Stock tracking with automatic deductions
- **Medical Records**: Secure file management and patient history

## Architecture

- **Frontend**: Next.js 15.4.6 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui + custom components
- **Backend**: Supabase Functions + KV Store
- **Database**: Supabase PostgreSQL
- **Authentication**: Role-based access control
- **Real-time**: Server-sent events

## User Roles

### Anonymous Patient
- Online appointment booking
- Service browsing
- No registration required

### Registered Patient  
- Personal appointment management
- Dental chart access
- Service history viewing
- Billing history

### Staff
- Appointment management
- Walk-in patient workflow
- Treatment completion
- Basic reporting

### Dentist/Admin
- Full system access
- User management
- Comprehensive reporting
- Inventory control
- System configuration

## Quick Start

1. Install dependencies:
```bash
npm install
```

2. Run development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000)

## Documentation Structure

- [Authentication System](./authentication.md) - User management and access control
- [Appointments](./appointments.md) - Booking, scheduling, and management
- [Patients](./patients.md) - Patient management and profiles
- [Tooth Chart System](./tooth-chart.md) - FDI notation and treatment tracking
- [Billing & Pricing](./billing.md) - Automated billing and pricing models
- [Inventory Management](./inventory.md) - Stock tracking and management
- [Services](./services.md) - Service catalog and mappings
- [Medical Records](./medical-records.md) - File management and patient history
- [API Reference](./api-reference.md) - Complete API documentation
- [Components](./components.md) - React component documentation
- [Database Schema](./database-schema.md) - Data models and relationships

## Technology Stack

- **Next.js 15.4.6**: React framework with App Router
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS v4**: Utility-first CSS framework
- **shadcn/ui**: Modern UI component library
- **Supabase**: Backend-as-a-Service with real-time capabilities
- **KV Store**: High-performance key-value storage
- **Lucide React**: Icon library

## Key Innovations

1. **FDI Tooth Chart Integration**: First dental system to combine international tooth numbering with automated billing
2. **Anonymous Patient Booking**: Removes barriers to dental care access
3. **Real-Time Multi-User Updates**: Modern collaboration features
4. **Flexible Pricing Models**: Supports multiple billing scenarios
5. **Comprehensive Role System**: Serves all stakeholders effectively

## License

This project is for demonstration and educational purposes.