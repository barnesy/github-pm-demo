// Utility functions without documentation

function calculateTotal(items) {
    let total = 0;
    for (let i = 0; i < items.length; i++) {
        total += items[i].price * items[i].quantity;
    }
    return total;
}

/**
 * Processes data to find parent-child relationships
 * Optimized from O(n²) to O(n) using Map for constant-time lookups
 * 
 * @param {Array} data - Array of objects with id and parentId properties
 * @returns {Array} Array of parent-child relationship objects
 */
function processData(data) {
    // Create a Map for O(1) lookups by ID
    const itemsById = new Map();
    
    // First pass: populate the Map (O(n))
    for (const item of data) {
        itemsById.set(item.id, item);
    }
    
    // Second pass: find parent-child relationships (O(n))
    const results = [];
    for (const item of data) {
        if (item.parentId !== undefined && item.parentId !== null) {
            const parent = itemsById.get(item.parentId);
            if (parent) {
                results.push({
                    parent: parent,
                    child: item
                });
            }
        }
    }
    
    return results;
}

/**
 * Original O(n²) implementation kept for comparison
 * DO NOT USE IN PRODUCTION
 */
function processDataOld(data) {
    // Inefficient nested loops - performance issue
    const results = [];
    for (let i = 0; i < data.length; i++) {
        for (let j = 0; j < data.length; j++) {
            if (data[i].id === data[j].parentId) {
                results.push({
                    parent: data[i],
                    child: data[j]
                });
            }
        }
    }
    return results;
}

module.exports = { calculateTotal, processData, processDataOld };