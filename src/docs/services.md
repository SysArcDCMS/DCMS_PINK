# Services Management

## Overview

The services system manages the complete catalog of dental procedures with flexible pricing models, inventory integration, and tooth chart usage configuration.

## Core Features

- **Service Catalog Management**: Create, edit, and organize dental services
- **Flexible Pricing Models**: Support for multiple billing scenarios  
- **Tooth Chart Integration**: Configure tooth chart usage per service
- **Inventory Mapping**: Link services to required supplies
- **Service Suggestions**: AI-powered service recommendations
- **Duration Management**: Appointment scheduling integration

## Components

### Service Management Components
- Service catalog management interface (`/app/dashboard/services/page.tsx`)
- Service-inventory mapping management (`/app/dashboard/services/mappings/page.tsx`)
- `ServiceSuggestions.tsx` - AI-powered service recommendations

### Integration Components
- Service selection in appointment booking
- Service completion in appointment workflow
- Billing integration with pricing models

## Service Data Structure

### Core Service Information
```typescript
interface ServiceCatalogItem {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number; // minutes
  pricing_model: PricingModel;
  tooth_chart_use: ToothChartUsage;
  category: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

type PricingModel = 
  | 'Per Tooth' 
  | 'Per Tooth Package' 
  | 'Per Session' 
  | 'Per Film' 
  | 'Per Treatment Package';

type ToothChartUsage = 'required' | 'not needed' | 'optional';
```

## Pricing Models

### 1. Per Tooth
- **Use Case**: Individual tooth procedures (fillings, crowns, extractions)
- **Calculation**: `total_cost = base_price × number_of_teeth`
- **Tooth Chart**: Required - must select specific teeth
- **Example**: Tooth filling at ₱1,500 per tooth for 3 teeth = ₱4,500

### 2. Per Tooth Package  
- **Use Case**: Multiple tooth procedures with package pricing
- **Calculation**: `total_cost = fixed_package_price`
- **Tooth Chart**: Required - but price remains fixed regardless of count
- **Example**: Whitening package at ₱8,000 for any number of teeth

### 3. Per Session
- **Use Case**: General treatments not tied to specific teeth
- **Calculation**: `total_cost = session_price`
- **Tooth Chart**: Not needed or optional
- **Example**: Dental consultation at ₱500 per visit

### 4. Per Film
- **Use Case**: X-rays and diagnostic imaging
- **Calculation**: `total_cost = price_per_film × number_of_films`
- **Tooth Chart**: Not needed
- **Example**: Periapical X-ray at ₱300 per film for 2 films = ₱600

### 5. Per Treatment Package
- **Use Case**: Comprehensive treatment plans
- **Calculation**: `total_cost = package_price`
- **Tooth Chart**: Optional - may include multiple treatments
- **Example**: Complete orthodontic treatment at ₱50,000

## Service Categories

### Preventive Services
- Routine cleanings
- Fluoride treatments
- Sealants
- Oral hygiene education

### Restorative Services
- Fillings (composite, amalgam)
- Crowns and bridges
- Inlays and onlays
- Implants

### Surgical Services
- Extractions
- Root canal therapy
- Periodontal surgery
- Oral surgery procedures

### Cosmetic Services
- Teeth whitening
- Veneers
- Bonding
- Smile makeovers

### Diagnostic Services
- X-rays (periapical, bitewing, panoramic)
- Oral examinations
- Periodontal charting
- Diagnostic photography

## Service-Inventory Integration

### Inventory Mapping
Services can be linked to inventory items to enable automatic stock deductions:

```typescript
interface ServiceInventoryMapping {
  serviceId: string;
  inventoryItemId: string;
  quantityUsed: number;
  isRequired: boolean;
  alternativeItems?: string[];
}
```

### Mapping Configuration
- **Page**: `/app/dashboard/services/mappings/page.tsx`
- **Features**:
  - Link services to required supplies
  - Set standard usage quantities
  - Configure alternative materials
  - Manage cost allocation

### Automatic Deduction Workflow
1. **Service Completion**: Appointment marked as completed
2. **Mapping Lookup**: Find linked inventory items
3. **Quantity Calculation**: Determine usage based on service details
4. **Stock Deduction**: Automatically reduce inventory levels
5. **Cost Tracking**: Record material costs for profitability

## Service Suggestions

### AI-Powered Recommendations
- **Context**: Based on patient history and symptoms
- **Algorithm**: Machine learning recommendations
- **Integration**: Appointment booking and walk-in workflows
- **Customization**: Practice-specific suggestion rules

### Suggestion Sources
- **Patient History**: Previous treatments and outcomes
- **Symptom Analysis**: Chief complaint matching
- **Treatment Patterns**: Common service combinations
- **Seasonal Trends**: Time-based service popularity

## Pages & User Flows

### Service Catalog Management
1. **Main Page**: `/app/dashboard/services/page.tsx`
2. **Features**:
   - Service list with search and filtering
   - Create new service dialog
   - Edit existing service dialog
   - Service activation/deactivation
   - Bulk operations

### Service-Inventory Mapping
1. **Mapping Page**: `/app/dashboard/services/mappings/page.tsx`
2. **Features**:
   - Service-inventory relationship management
   - Usage quantity configuration
   - Cost allocation setup
   - Alternative material configuration

### Service Selection Workflows
1. **Appointment Booking**: Service selection during booking
2. **Appointment Completion**: Service confirmation and billing
3. **Walk-in Patients**: Quick service selection for emergencies

## API Integration

### Service APIs
- `GET /api/services` - List all services with filtering
- `GET /api/services/[id]` - Get specific service details
- `POST /api/services` - Create new service
- `PUT /api/services/[id]` - Update existing service
- `DELETE /api/services/[id]` - Deactivate service

### Service Suggestion APIs
- `GET /api/services/suggest` - Get service recommendations
- `GET /api/services/suggestions` - Get suggestion history

### Service-Inventory APIs
- `GET /api/service-inventory-mappings` - List all mappings
- `POST /api/service-inventory-mappings` - Create new mapping
- `DELETE /api/service-inventory-mappings/[serviceId]/[inventoryItemId]` - Remove mapping

## Integration Points

### Appointment System
- **Service Selection**: Choose services during booking
- **Duration Calculation**: Automatic time slot calculation
- **Service Completion**: Mark services as completed
- **Treatment Notes**: Document service-specific details

### Billing System
- **Pricing Application**: Apply pricing model during billing
- **Cost Calculation**: Calculate total costs per service
- **Bill Generation**: Itemized billing with service details
- **Payment Tracking**: Track payments per service

### Tooth Chart System
- **Usage Validation**: Enforce tooth chart requirements
- **Tooth Selection**: Enable tooth selection for applicable services
- **Treatment Recording**: Record treatments on specific teeth
- **Visual Updates**: Update tooth chart after service completion

### Inventory System
- **Automatic Deduction**: Reduce stock after service completion
- **Cost Allocation**: Track material costs per service
- **Reorder Triggers**: Generate restock alerts based on usage
- **Profitability Analysis**: Calculate service profitability

## Service Categories & Examples

### Sample Service Catalog

#### Preventive Services
```typescript
{
  name: "Routine Dental Cleaning",
  price: 1500,
  duration: 45,
  pricing_model: "Per Session",
  tooth_chart_use: "optional",
  category: "Preventive"
}
```

#### Restorative Services
```typescript
{
  name: "Composite Filling",
  price: 1750,
  duration: 30,
  pricing_model: "Per Tooth",
  tooth_chart_use: "required",
  category: "Restorative"
}
```

#### Diagnostic Services
```typescript
{
  name: "Periapical X-ray",
  price: 350,
  duration: 10,
  pricing_model: "Per Film",
  tooth_chart_use: "not needed",
  category: "Diagnostic"
}
```

## Performance Optimizations

### Service Loading
- **Caching**: Cache service catalog for quick access
- **Lazy Loading**: Load service details on demand
- **Background Refresh**: Update catalog in background
- **Search Optimization**: Fast service search and filtering

### Suggestion Performance
- **Prediction Caching**: Cache common suggestions
- **Background Processing**: Process suggestions asynchronously
- **Result Optimization**: Optimize suggestion algorithms
- **Real-time Updates**: Update suggestions based on new data

## Error Handling

### Service Validation
- **Price Validation**: Ensure valid pricing information
- **Duration Validation**: Validate appointment duration
- **Model Validation**: Verify pricing model configuration
- **Chart Usage Validation**: Enforce tooth chart requirements

### Integration Errors
- **Inventory Mapping**: Handle missing inventory items
- **Billing Errors**: Graceful handling of pricing failures
- **Chart Errors**: Handle tooth chart integration issues
- **API Failures**: Retry mechanisms for service operations

## Related Documentation

- [Billing & Pricing](./billing.md) - Pricing model integration
- [Appointments](./appointments.md) - Service booking and completion
- [Tooth Chart System](./tooth-chart.md) - Tooth chart integration
- [Inventory Management](./inventory.md) - Service-inventory mapping
- [API Reference](./api-reference.md#services) - API documentation