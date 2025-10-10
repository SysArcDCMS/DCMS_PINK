# Database Schema

## Overview

The Go-Goyagoy system uses Supabase PostgreSQL with KV Store for high-performance data storage. This document outlines the complete data model and relationships.

## Storage Architecture

### Primary Storage
- **PostgreSQL Database**: Relational data with strong consistency
- **KV Store**: High-performance key-value storage for frequently accessed data
- **File Storage**: Secure file storage for medical records

### KV Store Keys Pattern
```
dcms:patient-tooth-chart:${patientEmail}
dcms:appointment:${appointmentId}
dcms:inventory:${itemId}
dcms:service:${serviceId}
dcms:user:${userEmail}
```

## Core Entities

### Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('patient', 'staff', 'dentist', 'admin')),
    phone VARCHAR(20),
    date_of_birth DATE,
    address TEXT,
    emergency_contact VARCHAR(100),
    emergency_phone VARCHAR(20),
    medical_history TEXT,
    is_email_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Appointments Table
```sql
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES users(id),
    patient_name VARCHAR(200) NOT NULL,
    patient_email VARCHAR(255) NOT NULL,
    patient_phone VARCHAR(20),
    dentist_id UUID REFERENCES users(id),
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    duration INTEGER DEFAULT 60, -- minutes
    service_requested TEXT,
    reason TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
        'pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'
    )),
    type VARCHAR(20) DEFAULT 'regular' CHECK (type IN (
        'regular', 'walk_in', 'emergency', 'follow_up'
    )),
    treatment_notes TEXT,
    cancellation_reason TEXT,
    cancelled_by UUID REFERENCES users(id),
    confirmed_by UUID REFERENCES users(id),
    completed_by UUID REFERENCES users(id),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_appointment_time CHECK (
        appointment_time >= '09:00:00' AND appointment_time <= '18:00:00'
    )
);
```

### Services Table
```sql
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    duration INTEGER NOT NULL, -- minutes
    pricing_model VARCHAR(30) DEFAULT 'Per Session' CHECK (pricing_model IN (
        'Per Tooth', 'Per Tooth Package', 'Per Session', 'Per Film', 'Per Treatment Package'
    )),
    tooth_chart_use VARCHAR(20) DEFAULT 'not needed' CHECK (tooth_chart_use IN (
        'required', 'not needed', 'optional'
    )),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Inventory Table
```sql
CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    current_stock INTEGER NOT NULL DEFAULT 0,
    min_stock INTEGER NOT NULL DEFAULT 0,
    max_stock INTEGER NOT NULL DEFAULT 100,
    unit VARCHAR(50) NOT NULL, -- 'box', 'bottle', 'piece', etc.
    cost_per_unit DECIMAL(10,2) NOT NULL,
    supplier VARCHAR(200),
    supplier_contact VARCHAR(255),
    last_restocked DATE,
    expiration_date DATE,
    storage_location VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT positive_stock CHECK (current_stock >= 0),
    CONSTRAINT valid_stock_levels CHECK (min_stock <= max_stock)
);
```

### Bills Table
```sql
CREATE TABLE bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID REFERENCES appointments(id),
    patient_id UUID REFERENCES users(id),
    patient_name VARCHAR(200) NOT NULL,
    patient_email VARCHAR(255) NOT NULL,
    appointment_date DATE NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
        'pending', 'paid', 'partial', 'overdue', 'cancelled'
    )),
    payment_method VARCHAR(50),
    payment_date DATE,
    payment_reference VARCHAR(100),
    notes TEXT,
    generated_by UUID REFERENCES users(id),
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Bill Items Table
```sql
CREATE TABLE bill_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_id UUID REFERENCES bills(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id),
    service_name VARCHAR(200) NOT NULL,
    description TEXT,
    pricing_model VARCHAR(30) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    teeth_treated JSONB, -- Array of FDI tooth numbers
    treatment_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Medical Records Table
```sql
CREATE TABLE medical_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES users(id),
    appointment_id UUID REFERENCES appointments(id),
    file_name VARCHAR(255) NOT NULL,
    original_file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN (
        'diagnostic-images', 'treatment-photos', 'forms-documents', 
        'administrative', 'insurance', 'correspondence'
    )),
    subcategory VARCHAR(100),
    description TEXT,
    access_level VARCHAR(20) DEFAULT 'staff' CHECK (access_level IN (
        'patient', 'staff', 'dentist', 'admin'
    )),
    tags JSONB,
    metadata JSONB,
    uploaded_by UUID REFERENCES users(id),
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_archived BOOLEAN DEFAULT FALSE
);
```

## Relationship Tables

### Service Inventory Mappings
```sql
CREATE TABLE service_inventory_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID REFERENCES services(id),
    inventory_item_id UUID REFERENCES inventory(id),
    quantity_used DECIMAL(8,2) NOT NULL DEFAULT 1,
    per_tooth_quantity DECIMAL(8,2), -- For per-tooth services
    is_required BOOLEAN DEFAULT TRUE,
    alternative_items JSONB, -- Array of alternative inventory item IDs
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(service_id, inventory_item_id)
);
```

### Appointment Services
```sql
CREATE TABLE appointment_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID REFERENCES appointments(id),
    service_id UUID REFERENCES services(id),
    service_name VARCHAR(200) NOT NULL,
    pricing_model VARCHAR(30) NOT NULL,
    teeth_selected JSONB, -- Array of FDI tooth numbers
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    treatment_notes TEXT,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Stock Movements
```sql
CREATE TABLE stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_item_id UUID REFERENCES inventory(id),
    movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN (
        'restock', 'deduction', 'adjustment', 'expired', 'damaged'
    )),
    quantity INTEGER NOT NULL,
    previous_stock INTEGER NOT NULL,
    new_stock INTEGER NOT NULL,
    unit_cost DECIMAL(10,2),
    total_cost DECIMAL(10,2),
    reason TEXT NOT NULL,
    reference_id UUID, -- Appointment ID, Restock Request ID, etc.
    reference_type VARCHAR(50), -- 'appointment', 'restock_request', etc.
    performed_by UUID REFERENCES users(id),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Restock Requests
```sql
CREATE TABLE restock_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_item_id UUID REFERENCES inventory(id),
    requested_quantity INTEGER NOT NULL,
    current_stock INTEGER NOT NULL,
    min_stock INTEGER NOT NULL,
    urgency VARCHAR(20) DEFAULT 'medium' CHECK (urgency IN (
        'low', 'medium', 'high', 'critical'
    )),
    reason TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
        'pending', 'approved', 'ordered', 'received', 'cancelled'
    )),
    requested_by UUID REFERENCES users(id),
    request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_by UUID REFERENCES users(id),
    approval_date TIMESTAMP,
    order_date DATE,
    expected_delivery DATE,
    actual_delivery DATE,
    supplier_order_id VARCHAR(100),
    notes TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## KV Store Data Models

### Patient Tooth Chart
```typescript
interface PatientToothChart {
  id: string;
  patientId: string;
  missingTeeth: string[]; // FDI tooth numbers
  treatedTeeth: string[]; // FDI tooth numbers
  disabledTeeth: string[]; // FDI tooth numbers
  treatments: ToothTreatment[];
  lastUpdated: string;
}

interface ToothTreatment {
  id: string;
  service_name: string;
  date: string;
  detail: string;
  teeth_fdi: string[]; // FDI tooth numbers
  appointment_id: string;
  completed_by: string;
}
```

### Appointment Cache
```typescript
interface AppointmentCache {
  id: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  dentistId: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  serviceDetails: ServiceDetail[];
  lastUpdated: string;
}
```

### Service Cache
```typescript
interface ServiceCache {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  duration: number;
  pricing_model: PricingModel;
  tooth_chart_use: ToothChartUsage;
  isActive: boolean;
  lastUpdated: string;
}
```

## Indexes for Performance

### Users Table Indexes
```sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active);
CREATE INDEX idx_users_email_verified ON users(is_email_verified);
```

### Appointments Table Indexes
```sql
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_dentist ON appointments(dentist_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_patient_email ON appointments(patient_email);
CREATE INDEX idx_appointments_date_status ON appointments(appointment_date, status);
```

### Services Table Indexes
```sql
CREATE INDEX idx_services_category ON services(category);
CREATE INDEX idx_services_active ON services(is_active);
CREATE INDEX idx_services_pricing_model ON services(pricing_model);
```

### Inventory Table Indexes
```sql
CREATE INDEX idx_inventory_category ON inventory(category);
CREATE INDEX idx_inventory_low_stock ON inventory(current_stock, min_stock);
CREATE INDEX idx_inventory_active ON inventory(is_active);
```

### Bills Table Indexes
```sql
CREATE INDEX idx_bills_patient ON bills(patient_id);
CREATE INDEX idx_bills_appointment ON bills(appointment_id);
CREATE INDEX idx_bills_status ON bills(status);
CREATE INDEX idx_bills_date ON bills(appointment_date);
CREATE INDEX idx_bills_patient_email ON bills(patient_email);
```

### Medical Records Indexes
```sql
CREATE INDEX idx_medical_records_patient ON medical_records(patient_id);
CREATE INDEX idx_medical_records_appointment ON medical_records(appointment_id);
CREATE INDEX idx_medical_records_category ON medical_records(category);
CREATE INDEX idx_medical_records_access ON medical_records(access_level);
```

## Data Validation Rules

### Business Rules
```sql
-- Appointment time constraints
ALTER TABLE appointments ADD CONSTRAINT no_past_appointments 
CHECK (appointment_date >= CURRENT_DATE);

-- Stock level validation
ALTER TABLE inventory ADD CONSTRAINT positive_min_stock 
CHECK (min_stock >= 0);

-- Bill amount validation
ALTER TABLE bills ADD CONSTRAINT positive_total 
CHECK (total_amount >= 0);

-- Service duration validation
ALTER TABLE services ADD CONSTRAINT valid_duration 
CHECK (duration > 0 AND duration <= 480); -- Max 8 hours
```

### Data Integrity
```sql
-- Prevent orphaned records
ALTER TABLE appointment_services 
ADD CONSTRAINT fk_appointment_services_appointment 
FOREIGN KEY (appointment_id) REFERENCES appointments(id) 
ON DELETE CASCADE;

-- Ensure bill items have valid bills
ALTER TABLE bill_items 
ADD CONSTRAINT fk_bill_items_bill 
FOREIGN KEY (bill_id) REFERENCES bills(id) 
ON DELETE CASCADE;
```

## Triggers and Functions

### Update Timestamps
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to relevant tables
CREATE TRIGGER update_users_updated_at 
BEFORE UPDATE ON users 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at 
BEFORE UPDATE ON appointments 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Inventory Stock Updates
```sql
CREATE OR REPLACE FUNCTION update_inventory_stock()
RETURNS TRIGGER AS $$
BEGIN
    -- Update current stock based on stock movement
    UPDATE inventory 
    SET current_stock = NEW.new_stock,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.inventory_item_id;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_update_inventory_stock
AFTER INSERT ON stock_movements
FOR EACH ROW EXECUTE FUNCTION update_inventory_stock();
```

## Views for Common Queries

### Patient Summary View
```sql
CREATE VIEW patient_summary AS
SELECT 
    u.id,
    u.first_name,
    u.last_name,
    u.email,
    u.phone,
    COUNT(a.id) as total_appointments,
    COUNT(CASE WHEN a.status = 'completed' THEN 1 END) as completed_appointments,
    MAX(a.appointment_date) as last_visit,
    COALESCE(SUM(b.total_amount), 0) as total_billed,
    COALESCE(SUM(CASE WHEN b.status = 'paid' THEN b.total_amount ELSE 0 END), 0) as total_paid
FROM users u
LEFT JOIN appointments a ON u.id = a.patient_id
LEFT JOIN bills b ON a.id = b.appointment_id
WHERE u.role = 'patient'
GROUP BY u.id, u.first_name, u.last_name, u.email, u.phone;
```

### Low Stock Alert View
```sql
CREATE VIEW low_stock_alerts AS
SELECT 
    i.*,
    CASE 
        WHEN current_stock = 0 THEN 'critical'
        WHEN current_stock <= min_stock * 0.5 THEN 'urgent'
        WHEN current_stock <= min_stock THEN 'low'
        ELSE 'normal'
    END as alert_level
FROM inventory i
WHERE i.is_active = true 
AND i.current_stock <= i.min_stock;
```

### Revenue Summary View
```sql
CREATE VIEW revenue_summary AS
SELECT 
    DATE_TRUNC('month', appointment_date) as month,
    COUNT(*) as total_bills,
    SUM(total_amount) as total_revenue,
    SUM(CASE WHEN status = 'paid' THEN total_amount ELSE 0 END) as paid_revenue,
    SUM(CASE WHEN status = 'pending' THEN total_amount ELSE 0 END) as pending_revenue
FROM bills
GROUP BY DATE_TRUNC('month', appointment_date)
ORDER BY month DESC;
```

## Backup and Recovery

### Backup Strategy
- **Daily Backups**: Full database backup
- **Transaction Log Backup**: Every 15 minutes
- **Point-in-Time Recovery**: Available for last 30 days
- **Cross-Region Replication**: Geographic redundancy

### Data Retention Policy
- **User Data**: Retain indefinitely (until user deletion)
- **Appointment Data**: Retain for 7 years (legal requirement)
- **Medical Records**: Retain for 10 years
- **Billing Data**: Retain for 7 years
- **Audit Logs**: Retain for 3 years

## Related Documentation

- [API Reference](./api-reference.md) - Database API integration
- [Authentication System](./authentication.md) - User management
- [Patients](./patients.md) - Patient data models
- [Appointments](./appointments.md) - Appointment data flow
- [Billing & Pricing](./billing.md) - Financial data models