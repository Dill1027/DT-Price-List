# Phase-Based Product Management

## Overview
The system now supports the same model number with different phases (1 Phase and 3 Phase). This allows for more flexible product management where the same motor model can exist in both single-phase and three-phase variants.

## Key Changes

### 1. Database Schema Update
- **Before**: Model numbers were globally unique
- **After**: Model number + Phase combination is unique
- **Example**: "SUB-001" can now exist as both "1 Phase" and "3 Phase" products

### 2. Bulk Upload Enhancement
The bulk upload functionality now handles phase variations intelligently:

#### Smart Duplicate Detection
- Checks for existing products using **model number + phase** combination
- If same model + phase exists: Updates price/details
- If same model with different phase: Creates new product

#### Example Scenarios

**Scenario 1: New Phase Variant**
```
Existing: SUB-001 (1 Phase) - Price: 15,000
Upload:   SUB-001 (3 Phase) - Price: 17,000
Result:   Creates new product (different phase)
```

**Scenario 2: Price Update**
```
Existing: SUB-001 (1 Phase) - Price: 15,000
Upload:   SUB-001 (1 Phase) - Price: 16,000
Result:   Updates price from 15,000 to 16,000
```

**Scenario 3: Both Phases**
```
Upload Sheet:
- SUB-001 (1 Phase) - Price: 15,000
- SUB-001 (3 Phase) - Price: 17,000
Result: Creates both variants
```

### 3. Excel Template Updates
- **Instructions**: Updated to explain phase-based uniqueness
- **Sample Data**: Shows same model number with different phases
- **Validation**: Phase dropdown remains the same

### 4. API Changes

#### New Endpoint
```
GET /api/products/check-model/:modelNumber/:phase
```
Checks if specific model + phase combination exists.

#### Updated Endpoint
```
GET /api/products/check-model/:modelNumber
```
Now returns all phases for a given model number.

### 5. Error Handling
Updated error messages to include both model number and phase:
```
"Product with model number 'SUB-001' and phase '1 Phase' already exists"
```

## Benefits

### 1. Real-World Alignment
- Matches how motor manufacturers actually organize products
- Same motor model often available in both 1-Phase and 3-Phase variants
- Different specifications (wattage, price) for different phases

### 2. Flexible Pricing
- Admin can set different prices for different phase variants
- Project users can update technical specifications independently

### 3. Better Organization
- Clear distinction between phase variants
- Easier inventory management
- More accurate product catalogs

## Usage Examples

### Excel Upload Format
```
Model Number | Phase    | HP | Watt | Price
SUB-001     | 1 Phase  | 1  | 750  | 15000
SUB-001     | 3 Phase  | 1  | 1100 | 17000
CENT-002    | 3 Phase  | 2  | 1500 | 25000
```

### Search and Filter
- Users can filter by phase in the product listing
- Search results show phase information
- Export includes phase data

## Migration Notes

### Database Migration
- Executed: `update-product-indexes.js`
- Dropped: Single `modelNumber` unique index
- Created: Compound `modelNumber + phase` unique index
- **Status**: ✅ Completed successfully

### Backward Compatibility
- Existing products remain unchanged
- Old API endpoints still work with updated behavior
- Frontend continues to function normally

## Testing Scenarios

### Test Case 1: Create Phase Variants
1. Upload Excel with same model number, different phases
2. Verify both products are created
3. Check different prices/specifications

### Test Case 2: Update Existing Phase
1. Upload Excel with existing model + phase combination
2. Verify price updates (admin only)
3. Verify detail updates (project users)

### Test Case 3: Mixed Operations
1. Upload Excel with mix of new models and phase variants
2. Verify correct categorization in results
3. Check detailed success messages

## Success Metrics
- ✅ Same model numbers with different phases allowed
- ✅ Bulk upload handles phase variants correctly
- ✅ Database indexes updated successfully
- ✅ Error messages include phase information
- ✅ Excel template reflects new capabilities
- ✅ API endpoints support phase-based queries

## Future Enhancements
1. **Phase-based reporting**: Generate reports by phase type
2. **Advanced filtering**: Multiple phase selection in filters
3. **Inventory tracking**: Track stock by model + phase combination
4. **Price comparison**: Compare prices between phase variants