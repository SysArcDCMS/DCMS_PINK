# Billing & Pricing System

## Overview

The billing system provides flexible pricing models with automated bill generation, supporting multiple billing scenarios from simple per-session to complex per-tooth calculations.

## Pricing Models

### Supported Models
1. **Per Tooth** - Individual tooth-based pricing
2. **Per Tooth Package** - Fixed package price regardless of tooth count
3. **Per Session** - Standard per-appointment pricing
4. **Per Film** - X-ray and diagnostic imaging pricing
5. **Per Treatment Package** - Comprehensive treatment bundles

### Pricing Logic
```typescript
switch (pricing_model) {
  case 'Per Tooth':
    quantity = total_teeth_count;
    price = base_price * quantity;
    break;
  case 'Per Tooth Package':
    quantity = 1;
    price = final_price; // Fixed regardless of teeth
    break;
  case 'Per Session':
    quantity = 1;
    price = final_price;
    break;
  case 'Per Film':
    quantity = treatment_count;
    price = base_price * quantity;
    break;
  case 'Per Treatment Package':
    quantity = 1;
    price = final_price; // Covers all treatments
    break;
}
```

## Components

### Billing Components
- `GenerateBillDialog.tsx` - Main bill generation interface
- `ViewBillDialog.tsx` - Bill viewing and printing
- `PatientBillingHistory.tsx` - Patient billing history display

### Supporting Components
- `DashboardStats.tsx` - Revenue analytics and billing statistics
- Print-optimized bill layouts with CSS print styles

## Pages & User Flows

### Bill Management
1. **Main Billing**: `/app/dashboard/billing/page.tsx`
2. **Billing Reports**: `/app/dashboard/billing/reports/page.tsx`
3. **Patient Billing History**: `/app/dashboard/billing-history/page.tsx`

### Bill Generation Workflow
1. **Trigger**: Appointment completion
2. **Service Analysis**: Determine pricing model for each service
3. **Calculation**: Apply pricing logic based on model
4. **Generation**: Create itemized bill
5. **Presentation**: Display bill for review/printing

## Billing Integration

### Appointment Completion Integration
When an appointment is completed:
1. **Service Processing**: Extract services and treatments
2. **Tooth Chart Analysis**: Count teeth for per-tooth services
3. **Pricing Application**: Apply appropriate pricing model
4. **Bill Creation**: Generate detailed bill with line items
5. **Inventory Deduction**: Automatic stock updates

### Tooth Chart Integration
- **Per Tooth Services**: Count selected teeth for pricing
- **Tooth Chart Updates**: Mark treated teeth automatically
- **Treatment History**: Record treatment details for billing audit

## Bill Structure

### Bill Components
```typescript
interface Bill {
  id: string;
  appointmentId: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  appointmentDate: string;
  services: BillItem[];
  subtotal: number;
  total: number;
  status: 'pending' | 'paid' | 'overdue';
  generatedAt: string;
  generatedBy: string;
}

interface BillItem {
  serviceId: string;
  serviceName: string;
  description: string;
  pricingModel: PricingModel;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  teethTreated?: string[];
  notes?: string;
}
```

### Bill Display Features
- **Itemized Services**: Detailed breakdown of each service
- **Teeth Information**: Show treated teeth for per-tooth services
- **Pricing Transparency**: Display pricing model used
- **Professional Layout**: Print-ready formatting
- **Payment Tracking**: Status and payment history

## Payment Management

### Payment Status Tracking
- **Pending**: Bill generated but not paid
- **Paid**: Payment received and recorded
- **Overdue**: Past due date
- **Partial**: Partial payment received

### Payment Recording
- Manual payment entry by staff
- Payment date and method tracking
- Payment receipt generation
- Balance calculation

## Billing Reports

### Revenue Analytics
1. **Daily Revenue**: Daily billing totals
2. **Service Performance**: Revenue by service type
3. **Payment Status**: Outstanding balances
4. **Dentist Performance**: Revenue by treating dentist

### Report Features
- **Date Range Filtering**: Custom reporting periods
- **Export Capabilities**: CSV export for accounting
- **Visual Charts**: Revenue trends and analytics
- **Print Reports**: Professional report layouts

## API Integration

### Billing APIs
- `GET /api/billing` - List bills with filtering
- `POST /api/billing` - Generate new bill
- `GET /api/billing/[id]` - Get specific bill details
- `PUT /api/billing/[id]` - Update bill or payment status
- `GET /api/billing/stats` - Billing statistics and analytics

### Patient Billing APIs
- `GET /api/patients/[id]/billing-history` - Patient billing history
- Role-based access control for patient data

## Service-Inventory Integration

### Automatic Inventory Deduction
During bill generation:
1. **Service Mapping**: Identify inventory items for each service
2. **Quantity Calculation**: Determine usage based on service details
3. **Stock Deduction**: Automatically reduce inventory levels
4. **Cost Tracking**: Record inventory costs for profitability analysis

### Mapping Configuration
- **Service Mappings**: `/app/dashboard/services/mappings/page.tsx`
- **Inventory Items**: Link services to required supplies
- **Usage Quantities**: Define standard usage per service
- **Cost Allocation**: Track material costs per treatment

## Advanced Features

### Multi-Service Billing
- Handle appointments with multiple services
- Different pricing models per service
- Comprehensive bill totaling
- Service interaction tracking

### Tooth-Specific Billing
- Per-tooth price calculation
- Visual tooth chart integration
- Treatment mapping to specific teeth
- Historical treatment cost tracking

### Package Billing
- Treatment package pricing
- Multiple services under one package
- Package discount application
- Comprehensive care billing

## Print & Export Features

### Print Optimization
```css
@media print {
  .print-content {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    font-size: 12pt;
    line-height: 1.4;
  }
  
  button, .no-print {
    display: none !important;
  }
}
```

### Export Capabilities
- **PDF Generation**: Professional bill PDFs
- **CSV Export**: Billing data for accounting software
- **Print-Ready Layout**: Optimized for paper printing
- **Email Integration**: Send bills via email (future feature)

## Data Validation

### Billing Validation
- Service pricing validation
- Tooth count verification
- Payment amount validation
- Date consistency checks

### Error Handling
- Invalid pricing model handling
- Missing service data recovery
- Calculation error prevention
- Graceful degradation on failures

## Performance Optimizations

### Calculation Optimization
- Efficient pricing model calculations
- Cached service pricing data
- Optimized tooth counting algorithms
- Background bill generation

### Data Loading
- Lazy loading for billing history
- Pagination for large datasets
- Efficient database queries
- Real-time updates for bill status

## Integration Points

### Appointment System
- Automatic bill generation on completion
- Service data extraction
- Treatment detail integration
- Real-time billing updates

### Patient Management
- Patient billing history access
- Payment tracking per patient
- Insurance information integration
- Financial status indicators

### Inventory System
- Automatic stock deductions
- Cost allocation tracking
- Supply usage monitoring
- Profitability analysis

### Reporting System
- Revenue analytics integration
- Performance metrics
- Financial dashboard updates
- Accounting system preparation

## Related Documentation

- [Appointments](./appointments.md) - Appointment completion workflow
- [Tooth Chart System](./tooth-chart.md) - Tooth chart integration
- [Services](./services.md) - Service catalog and pricing
- [Inventory Management](./inventory.md) - Stock integration
- [API Reference](./api-reference.md#billing) - API documentation