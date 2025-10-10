# API Reference

## Overview

Complete API documentation for the Go-Goyagoy Dental Clinic Management System. All APIs follow RESTful conventions with role-based access control and comprehensive error handling.

## Base URL

```
Development: http://localhost:3000/api
Production: https://your-domain.com/api
```

## Authentication

### Request Headers
```http
Content-Type: application/json
Authorization: Bearer <token>
```

### User Roles
- `patient` - Limited access to own data
- `staff` - Appointment and patient management
- `dentist` - Full clinical access
- `admin` - System administration

## Authentication APIs

### Login
```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "patient"
  },
  "token": "jwt-token"
}
```

### Register
```http
POST /api/auth/signup
```

**Request Body:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "user@example.com",
  "password": "password123",
  "phone": "+1234567890"
}
```

### Email Validation
```http
POST /api/auth/validate-email
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "token": "validation-token"
}
```

### Resend Validation
```http
POST /api/auth/resend-validation
```

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

## Appointment APIs

### List Appointments
```http
GET /api/appointments?userEmail={email}&role={role}&status={status}&date={date}
```

**Query Parameters:**
- `userEmail` (optional) - Filter by patient email
- `role` (optional) - User role for filtering
- `status` (optional) - Appointment status filter
- `date` (optional) - Filter by specific date

**Response:**
```json
{
  "success": true,
  "appointments": [
    {
      "id": "uuid",
      "patientName": "John Doe",
      "patientEmail": "john@example.com",
      "date": "2024-12-06",
      "time": "10:00",
      "service": "Dental Cleaning",
      "status": "confirmed",
      "dentist": "Dr. Smith"
    }
  ]
}
```

### Get Available Time Slots
```http
POST /api/appointments/available-slots
```

**Request Body:**
```json
{
  "date": "2024-12-06",
  "serviceDuration": 60,
  "bufferTime": 15
}
```

**Response:**
```json
{
  "success": true,
  "slots": [
    {
      "startTime": "09:00",
      "endTime": "10:15",
      "available": true
    }
  ],
  "metadata": {
    "date": "2024-12-06",
    "serviceDuration": 60,
    "bufferTime": 15,
    "totalSlotTime": 75,
    "existingAppointments": 2
  }
}
```

### Book Appointment
```http
POST /api/appointments/book
```

**Request Body (Smart Booking):**
```json
{
  "patientName": "John Smith",
  "patientEmail": "john@example.com",
  "patientPhone": "(555) 123-4567",
  "reason": "Routine Cleaning",
  "requestedDate": "2024-12-06",
  "requestedTimeSlot": "09:00-10:15",
  "serviceDuration": 60,
  "bufferTime": 15,
  "serviceDetails": {
    "id": "sc_1",
    "name": "Routine Cleaning",
    "description": "Comprehensive dental cleaning",
    "duration": 60,
    "buffer": 15
  },
  "needsStaffConfirmation": true,
  "type": "smart_booking_request"
}
```

### Get Specific Appointment
```http
GET /api/appointments/{id}?userEmail={email}&userRole={role}
```

### Update Appointment Status
```http
PUT /api/appointments/{id}/status
```

**Request Body:**
```json
{
  "status": "confirmed",
  "updatedBy": "staff@clinic.com",
  "notes": "Appointment confirmed by phone"
}
```

### Complete Appointment
```http
POST /api/appointments/{id}/complete
```

**Request Body:**
```json
{
  "serviceDetails": [
    {
      "id": "service-id",
      "name": "Tooth Filling",
      "pricing_model": "Per Tooth",
      "selectedTeeth": ["21", "22"],
      "notes": "Composite filling completed"
    }
  ],
  "treatmentNotes": "Treatment completed successfully",
  "completedBy": "dr.smith@clinic.com"
}
```

### Add Appointment Notes
```http
POST /api/appointments/{id}/notes
```

**Request Body:**
```json
{
  "notes": "Patient arrived on time",
  "addedBy": "staff@clinic.com"
}
```

### Confirm Appointment
```http
POST /api/appointments/{id}/confirm
```

**Request Body:**
```json
{
  "confirmedBy": "staff@clinic.com",
  "confirmationNotes": "Confirmed via phone call"
}
```

### Appointment Reports
```http
GET /api/appointments/reports?startDate={date}&endDate={date}&dentist={id}
```

## Patient APIs

### List Patients
```http
GET /api/patients?userEmail={email}&userRole={role}&search={term}
```

**Query Parameters:**
- `userEmail` (required) - Requesting user's email
- `userRole` (required) - User's role
- `search` (optional) - Search term for name/email

### Get Patient Details
```http
GET /api/patients/{id}?userEmail={email}&userRole={role}
```

**Response:**
```json
{
  "success": true,
  "patient": {
    "id": "uuid",
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "dateOfBirth": "1990-01-01",
    "address": "123 Main St",
    "emergencyContact": "Jane Doe",
    "emergencyPhone": "+0987654321",
    "role": "patient"
  }
}
```

### Update Patient Profile
```http
PUT /api/patients/{id}/profile
```

**Request Body:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+1234567890",
  "address": "123 Main St",
  "emergencyContact": "Jane Doe",
  "emergencyPhone": "+0987654321"
}
```

### Register Walk-in Patient
```http
POST /api/patients/walk-in
```

**Request Body:**
```json
{
  "first_name": "Emergency",
  "last_name": "Patient",
  "phone": "+1234567890",
  "reason": "Tooth pain",
  "urgency": "high"
}
```

### Validate Patient
```http
POST /api/patients/validate
```

**Request Body:**
```json
{
  "email": "patient@example.com",
  "phone": "+1234567890"
}
```

### Patient Service History
```http
GET /api/patients/{id}/service-history?userEmail={email}&userRole={role}
```

### Patient Billing History
```http
GET /api/patients/{id}/billing-history?userEmail={email}&userRole={role}
```

### Patient Tooth Chart
```http
GET /api/patients/{id}/tooth-chart
POST /api/patients/{id}/tooth-chart
```

**POST Request Body:**
```json
{
  "toothChart": {
    "missingTeeth": ["18", "28"],
    "treatedTeeth": ["21", "22"],
    "disabledTeeth": [],
    "treatments": [
      {
        "id": "treatment-id",
        "service_name": "Tooth Filling",
        "date": "2024-12-06",
        "detail": "Composite filling",
        "teeth_fdi": ["21"],
        "appointment_id": "apt-id",
        "completed_by": "Dr. Smith"
      }
    ]
  }
}
```

## Services APIs

### List Services
```http
GET /api/services?category={category}&active={boolean}
```

**Response:**
```json
{
  "success": true,
  "services": [
    {
      "id": "service-id",
      "name": "Tooth Filling",
      "description": "Composite resin filling",
      "price": 1750,
      "duration": 30,
      "pricing_model": "Per Tooth",
      "tooth_chart_use": "required",
      "category": "Restorative",
      "isActive": true
    }
  ]
}
```

### Get Service Details
```http
GET /api/services/{id}
```

### Create Service
```http
POST /api/services
```

**Request Body:**
```json
{
  "name": "New Service",
  "description": "Service description",
  "price": 1000,
  "duration": 45,
  "pricing_model": "Per Session",
  "tooth_chart_use": "optional",
  "category": "Preventive"
}
```

### Update Service
```http
PUT /api/services/{id}
```

### Service Suggestions
```http
GET /api/services/suggest?symptoms={symptoms}&history={history}
```

## Billing APIs

### List Bills
```http
GET /api/billing?status={status}&patientId={id}&startDate={date}&endDate={date}
```

### Get Bill Details
```http
GET /api/billing/{id}
```

**Response:**
```json
{
  "success": true,
  "bill": {
    "id": "bill-id",
    "appointmentId": "apt-id",
    "patientName": "John Doe",
    "patientEmail": "john@example.com",
    "appointmentDate": "2024-12-06",
    "services": [
      {
        "serviceName": "Tooth Filling",
        "pricingModel": "Per Tooth",
        "quantity": 2,
        "unitPrice": 1750,
        "subtotal": 3500,
        "teethTreated": ["21", "22"]
      }
    ],
    "subtotal": 3500,
    "total": 3500,
    "status": "pending"
  }
}
```

### Update Bill Status
```http
PUT /api/billing/{id}
```

**Request Body:**
```json
{
  "status": "paid",
  "paymentDate": "2024-12-06",
  "paymentMethod": "cash",
  "notes": "Payment received in full"
}
```

### Billing Statistics
```http
GET /api/billing/stats?period={monthly|weekly|daily}&startDate={date}&endDate={date}
```

## Inventory APIs

### List Inventory Items
```http
GET /api/inventory?category={category}&lowStock={boolean}
```

**Response:**
```json
{
  "success": true,
  "inventory": [
    {
      "id": "inv-id",
      "name": "Composite Resin A3",
      "category": "Restorative Materials",
      "currentStock": 15,
      "minStock": 5,
      "maxStock": 50,
      "unit": "syringe",
      "costPerUnit": 450,
      "supplier": "Dental Supply Co.",
      "lastRestocked": "2024-11-20"
    }
  ]
}
```

### Get Inventory Item
```http
GET /api/inventory/{id}
```

### Update Inventory Item
```http
PUT /api/inventory/{id}
```

### Restock Item
```http
POST /api/inventory/{id}/restock
```

**Request Body:**
```json
{
  "quantity": 25,
  "costPerUnit": 450,
  "supplier": "Dental Supply Co.",
  "invoiceNumber": "INV-12345",
  "restockedBy": "staff@clinic.com"
}
```

### List Restock Requests
```http
GET /api/inventory/restock-requests?status={status}
```

### Create Restock Request
```http
POST /api/inventory/restock-requests
```

**Request Body:**
```json
{
  "inventoryItemId": "inv-id",
  "requestedQuantity": 50,
  "urgency": "medium",
  "reason": "Running low on stock",
  "requestedBy": "staff@clinic.com"
}
```

### Update Restock Request
```http
PUT /api/inventory/restock-requests/{id}
```

## Service-Inventory Mapping APIs

### List Mappings
```http
GET /api/service-inventory-mappings?serviceId={id}
```

### Create Mapping
```http
POST /api/service-inventory-mappings
```

**Request Body:**
```json
{
  "serviceId": "service-id",
  "inventoryItemId": "inv-id",
  "quantityUsed": 1,
  "isRequired": true
}
```

### Delete Mapping
```http
DELETE /api/service-inventory-mappings/{serviceId}/{inventoryItemId}
```

## Medical Records APIs

### List Medical Records
```http
GET /api/medical-records?patientId={id}&category={category}
```

### Upload Medical Record
```http
POST /api/medical-records
```

**Request Body (multipart/form-data):**
```
file: [File]
patientId: "patient-id"
category: "diagnostic-images"
description: "X-ray of tooth 21"
```

### Get Medical Record
```http
GET /api/medical-records/{id}
```

### Download File
```http
GET /api/files/{id}
```

## Dashboard APIs

### Dashboard Statistics
```http
GET /api/dashboard?userEmail={email}&userRole={role}
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "todayAppointments": 8,
    "pendingAppointments": 3,
    "completedAppointments": 5,
    "totalPatients": 150,
    "lowStockItems": 2,
    "todayRevenue": 15000,
    "monthlyRevenue": 125000
  }
}
```

## Notifications APIs

### List Notifications
```http
GET /api/notifications?userEmail={email}
```

### Mark Notification as Read
```http
POST /api/notifications/{id}/read
```

## Dentists APIs

### List Dentists
```http
GET /api/dentists
```

**Response:**
```json
{
  "success": true,
  "dentists": [
    {
      "id": "dentist-id",
      "first_name": "Dr. Robert",
      "last_name": "Smith",
      "email": "dr.smith@clinic.com",
      "specialization": "General Dentistry",
      "isActive": true
    }
  ]
}
```

## Server Status API

### Check Server Status
```http
GET /api/server-status
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-12-06T10:00:00Z",
  "version": "1.0.0",
  "services": {
    "database": "connected",
    "storage": "available",
    "cache": "operational"
  }
}
```

## Error Responses

### Standard Error Format
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "validation error details"
  }
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Unprocessable Entity
- `500` - Internal Server Error

## Rate Limiting

### Limits
- Authentication APIs: 5 requests per minute
- General APIs: 100 requests per minute
- File Upload APIs: 10 requests per minute

### Headers
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1638360000
```

## Pagination

### Request Parameters
```
?page=1&limit=20&sortBy=createdAt&sortOrder=desc
```

### Response Format
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## Related Documentation

- [Authentication System](./authentication.md) - Authentication details
- [Appointments](./appointments.md) - Appointment management
- [Patients](./patients.md) - Patient management
- [Services](./services.md) - Service catalog
- [Billing & Pricing](./billing.md) - Billing system
- [Inventory Management](./inventory.md) - Inventory tracking