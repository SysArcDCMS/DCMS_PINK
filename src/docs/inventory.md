# Inventory Management

## Overview

The inventory management system provides comprehensive stock tracking with automatic deductions, reorder alerts, and integration with the service delivery workflow.

## Core Features

- **Real-time Stock Tracking**: Live inventory level monitoring
- **Automatic Deductions**: Stock reduction on service completion
- **Reorder Management**: Low stock alerts and restock requests
- **Service Integration**: Link inventory items to dental services
- **Cost Tracking**: Monitor inventory costs and profitability
- **Supplier Management**: Track suppliers and procurement

## Components

### Inventory Components
- Main inventory management interface (`/app/dashboard/inventory/page.tsx`)
- Real-time inventory updates (`useInventoryRealtime.ts`)
- Service-inventory mapping management

### Supporting Features
- Low stock alert system
- Restock request workflow
- Cost analysis and reporting

## Inventory Data Structure

### Core Inventory Item
```typescript
interface InventoryItem {
  id: string;
  name: string;
  description?: string;
  category: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  unit: string; // "box", "bottle", "piece", etc.
  costPerUnit: number;
  supplier?: string;
  supplierContact?: string;
  lastRestocked?: string;
  expirationDate?: string;
  storageLocation?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### Stock Movement Tracking
```typescript
interface StockMovement {
  id: string;
  inventoryItemId: string;
  type: 'restock' | 'deduction' | 'adjustment' | 'expired';
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  referenceId?: string; // Appointment ID, Service ID, etc.
  performedBy: string;
  timestamp: string;
}
```

## Inventory Categories

### Dental Materials
- **Restorative Materials**: Composite resins, amalgam, glass ionomer
- **Impression Materials**: Alginate, silicone, polyether
- **Cement and Bonding**: Dental cements, bonding agents
- **Endodontic Materials**: Gutta-percha, sealers, irrigants

### Disposable Supplies
- **Personal Protective Equipment**: Gloves, masks, gowns
- **Sterilization Supplies**: Pouches, indicators, solutions
- **Basic Supplies**: Cotton rolls, gauze, suction tips
- **Anesthetic Supplies**: Needles, cartridges, topical anesthetics

### Equipment & Instruments
- **Hand Instruments**: Probes, mirrors, excavators
- **Rotary Instruments**: Burs, discs, strips
- **Small Equipment**: Handpieces, scalers, curing lights
- **Maintenance Supplies**: Lubricants, cleaning solutions

### Office Supplies
- **Administrative**: Paper, forms, stationery
- **Patient Care**: Cups, bibs, headrest covers
- **Cleaning Supplies**: Disinfectants, surface cleaners
- **Laboratory**: Models, waxes, lab equipment

## Service-Inventory Integration

### Automatic Deduction Workflow
1. **Service Completion**: Appointment marked as completed
2. **Mapping Lookup**: Find linked inventory items for completed services
3. **Quantity Calculation**: Determine usage based on:
   - Service type and duration
   - Number of teeth treated
   - Predefined usage standards
4. **Stock Deduction**: Automatically reduce inventory levels
5. **Movement Logging**: Record stock movement with reference to appointment
6. **Alert Generation**: Trigger low stock alerts if needed

### Service-Inventory Mapping
```typescript
interface ServiceInventoryMapping {
  serviceId: string;
  serviceName: string;
  inventoryItemId: string;
  inventoryItemName: string;
  standardQuantity: number;
  perToothQuantity?: number; // For per-tooth services
  isRequired: boolean;
  alternativeItems?: string[];
}
```

### Usage Examples
- **Tooth Filling**: Composite resin (1 unit), bonding agent (0.5 unit), disposable brush (1 unit)
- **Extraction**: Anesthetic cartridge (1 unit), gauze (2 units), sutures (1 unit)
- **Cleaning**: Prophylaxis paste (1 unit), fluoride (1 unit), disposable cup (1 unit)

## Reorder Management

### Low Stock Alerts
- **Automatic Detection**: Monitor stock levels against minimum thresholds
- **Alert Generation**: Real-time notifications when stock is low
- **Priority Levels**: Critical, low, and warning levels
- **Multi-channel Alerts**: Dashboard notifications, email alerts

### Restock Request Workflow
1. **Alert Generation**: System detects low stock
2. **Request Creation**: Staff creates restock request
3. **Approval Process**: Manager/admin approves requests
4. **Order Placement**: Contact supplier for restocking
5. **Receipt Processing**: Update stock levels upon delivery
6. **Cost Recording**: Track procurement costs

### Request Management
```typescript
interface RestockRequest {
  id: string;
  inventoryItemId: string;
  requestedQuantity: number;
  currentStock: number;
  minStock: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  reason: string;
  requestedBy: string;
  requestDate: string;
  status: 'pending' | 'approved' | 'ordered' | 'received' | 'cancelled';
  approvedBy?: string;
  approvalDate?: string;
  orderDate?: string;
  expectedDelivery?: string;
  actualDelivery?: string;
  supplierOrderId?: string;
  notes?: string;
}
```

## Real-time Features

### Live Stock Updates
- **Real-time Synchronization**: Stock levels update across all user sessions
- **Instant Notifications**: Immediate alerts for stock changes
- **Concurrent Access**: Prevent conflicts during simultaneous updates
- **Background Refresh**: Periodic stock level verification

### Dashboard Integration
- **Live Inventory Widgets**: Real-time stock status on dashboard
- **Alert Counters**: Show number of low stock items
- **Quick Actions**: Fast access to reorder functions
- **Status Indicators**: Visual stock level indicators

## Cost Management

### Cost Tracking
- **Unit Cost Monitoring**: Track cost per unit for each item
- **Total Investment**: Calculate total inventory value
- **Usage Costs**: Monitor costs per service/appointment
- **Profitability Analysis**: Service profitability with material costs

### Financial Reporting
- **Inventory Valuation**: Current inventory value reports
- **Usage Reports**: Material consumption by service type
- **Cost per Service**: Material costs breakdown per dental service
- **Supplier Performance**: Cost analysis by supplier

## API Integration

### Inventory APIs
- `GET /api/inventory` - List inventory items with filtering
- `GET /api/inventory/[id]` - Get specific inventory item
- `POST /api/inventory` - Create new inventory item
- `PUT /api/inventory/[id]` - Update inventory item
- `POST /api/inventory/[id]/restock` - Process restock operation

### Restock Request APIs
- `GET /api/inventory/restock-requests` - List restock requests
- `POST /api/inventory/restock-requests` - Create restock request
- `PUT /api/inventory/restock-requests/[id]` - Update request status

### Service Integration APIs
- `GET /api/service-inventory-mappings` - Get service-inventory mappings
- `POST /api/service-inventory-mappings` - Create new mapping
- `DELETE /api/service-inventory-mappings/[serviceId]/[inventoryItemId]` - Remove mapping

## Performance Features

### Real-time Updates Hook
```typescript
const useInventoryRealtime = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [lowStockItems, setLowStockItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Real-time subscription to inventory changes
  // Automatic low stock detection
  // Background refresh mechanisms
};
```

### Optimization Strategies
- **Caching**: Cache frequently accessed inventory data
- **Lazy Loading**: Load inventory details on demand
- **Background Processing**: Process stock deductions asynchronously
- **Batch Operations**: Handle multiple stock movements efficiently

## Alert System

### Alert Types
1. **Low Stock Alert**: Item below minimum threshold
2. **Critical Stock Alert**: Item critically low or out of stock
3. **Expiration Alert**: Items nearing expiration date
4. **Reorder Point Alert**: Automatic reorder point reached

### Alert Management
- **Dashboard Notifications**: Real-time alerts on main dashboard
- **Email Notifications**: Automated email alerts for critical items
- **Alert History**: Track and review past alerts
- **Snooze Functionality**: Temporarily disable alerts for specific items

## Supplier Management

### Supplier Information
- **Contact Details**: Name, phone, email, address
- **Product Catalog**: Items supplied by each vendor
- **Pricing Information**: Current and historical pricing
- **Performance Metrics**: Delivery times, quality ratings

### Procurement Integration
- **Order Generation**: Create purchase orders from restock requests
- **Delivery Tracking**: Monitor expected vs actual delivery dates
- **Invoice Management**: Track supplier invoices and payments
- **Performance Analysis**: Supplier reliability and cost analysis

## Integration Points

### Service Delivery Integration
- **Automatic Deduction**: Stock reduction on service completion
- **Cost Allocation**: Track material costs per appointment
- **Profitability Analysis**: Calculate service margins including materials
- **Quality Control**: Ensure required materials are available

### Billing Integration
- **Material Costs**: Include material costs in service pricing
- **Cost Recovery**: Track material cost recovery in billing
- **Profitability Reports**: Service profitability including inventory costs
- **Cost Allocation**: Distribute inventory costs across services

### Reporting Integration
- **Usage Analytics**: Material consumption patterns
- **Cost Analysis**: Inventory cost trends and optimization
- **Efficiency Metrics**: Material utilization efficiency
- **Forecasting**: Predict future inventory needs

## Error Handling

### Stock Management Errors
- **Negative Stock Prevention**: Prevent stock from going below zero
- **Concurrent Update Handling**: Manage simultaneous stock updates
- **Data Validation**: Validate stock quantities and costs
- **Backup Procedures**: Recover from inventory data corruption

### Integration Errors
- **Service Mapping Failures**: Handle missing inventory mappings
- **Deduction Errors**: Graceful handling of automatic deduction failures
- **Supplier Communication**: Handle supplier system integration issues
- **Cost Calculation Errors**: Validate cost calculations and pricing

## Related Documentation

- [Services](./services.md) - Service-inventory mapping details
- [Billing & Pricing](./billing.md) - Cost integration and profitability
- [Appointments](./appointments.md) - Service completion integration
- [API Reference](./api-reference.md#inventory) - API documentation