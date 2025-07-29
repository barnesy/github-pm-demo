# processData Performance Optimization

## Overview
The `processData` function in `utils.js` has been optimized from O(n²) to O(n) time complexity, resulting in significant performance improvements for large datasets.

## Changes Made

### Before (O(n²))
The original implementation used nested loops to find parent-child relationships:
```javascript
for (let i = 0; i < data.length; i++) {
    for (let j = 0; j < data.length; j++) {
        if (data[i].id === data[j].parentId) {
            // Found relationship
        }
    }
}
```

### After (O(n))
The optimized implementation uses a Map for constant-time lookups:
```javascript
// First pass: Build Map (O(n))
const itemsById = new Map();
for (const item of data) {
    itemsById.set(item.id, item);
}

// Second pass: Find relationships (O(n))
for (const item of data) {
    if (item.parentId) {
        const parent = itemsById.get(item.parentId); // O(1) lookup
        // Found relationship
    }
}
```

## Performance Results

| Dataset Size | Old (ms) | New (ms) | Speedup |
|--------------|----------|----------|---------|
| 100 items    | 0.36     | 0.03     | 10x     |
| 500 items    | 0.75     | 0.17     | 4x      |
| 1,000 items  | 3.42     | 0.19     | 18x     |
| 2,000 items  | 13.40    | 0.23     | 58x     |
| 5,000 items  | 84.74    | 1.56     | 54x     |
| 10,000 items | ~340     | 1.02     | ~333x   |
| 20,000 items | ~1,360   | 2.23     | ~610x   |

## Key Benefits

1. **Linear Scaling**: The new implementation scales linearly with input size
2. **Memory Efficient**: Only requires one additional Map structure
3. **Maintains Functionality**: All existing behavior preserved
4. **Better for Large Data**: Performance gap increases with dataset size

## Testing

Run the test suite to verify correctness:
```bash
node utils.unit.test.js  # Unit tests
node utils.test.js       # Performance comparison
node benchmark.js        # Comprehensive benchmark
```

## Algorithm Complexity

- **Time Complexity**: Reduced from O(n²) to O(n)
- **Space Complexity**: Increased from O(1) to O(n) for the Map
- **Trade-off**: Minor memory increase for massive performance gain