const { processData, calculateTotal } = require('./utils');

// Simple test runner
function test(description, fn) {
    try {
        fn();
        console.log(`✅ ${description}`);
    } catch (error) {
        console.error(`❌ ${description}`);
        console.error(`   ${error.message}`);
        process.exit(1);
    }
}

function assertEqual(actual, expected, message) {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`${message}\nExpected: ${JSON.stringify(expected)}\nActual: ${JSON.stringify(actual)}`);
    }
}

console.log('Running unit tests for utils.js\n');

// Test processData with various scenarios
test('processData handles empty array', () => {
    const result = processData([]);
    assertEqual(result, [], 'Should return empty array for empty input');
});

test('processData handles array with no relationships', () => {
    const data = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
        { id: 3, name: 'Item 3' }
    ];
    const result = processData(data);
    assertEqual(result, [], 'Should return empty array when no parentId exists');
});

test('processData finds single parent-child relationship', () => {
    const data = [
        { id: 1, name: 'Parent' },
        { id: 2, name: 'Child', parentId: 1 }
    ];
    const result = processData(data);
    assertEqual(result.length, 1, 'Should find one relationship');
    assertEqual(result[0].parent.id, 1, 'Parent should have id 1');
    assertEqual(result[0].child.id, 2, 'Child should have id 2');
});

test('processData handles multiple children', () => {
    const data = [
        { id: 1, name: 'Parent' },
        { id: 2, name: 'Child 1', parentId: 1 },
        { id: 3, name: 'Child 2', parentId: 1 },
        { id: 4, name: 'Child 3', parentId: 1 }
    ];
    const result = processData(data);
    assertEqual(result.length, 3, 'Should find three relationships');
    
    // Verify all children have the same parent
    const parentIds = result.map(r => r.parent.id);
    assertEqual(parentIds, [1, 1, 1], 'All children should have parent id 1');
});

test('processData handles nested relationships', () => {
    const data = [
        { id: 1, name: 'Grandparent' },
        { id: 2, name: 'Parent', parentId: 1 },
        { id: 3, name: 'Child', parentId: 2 }
    ];
    const result = processData(data);
    assertEqual(result.length, 2, 'Should find two relationships');
    
    // Sort by child id for consistent testing
    result.sort((a, b) => a.child.id - b.child.id);
    
    assertEqual(result[0].parent.id, 1, 'First relationship: parent should be 1');
    assertEqual(result[0].child.id, 2, 'First relationship: child should be 2');
    assertEqual(result[1].parent.id, 2, 'Second relationship: parent should be 2');
    assertEqual(result[1].child.id, 3, 'Second relationship: child should be 3');
});

test('processData ignores orphaned items', () => {
    const data = [
        { id: 1, name: 'Parent' },
        { id: 2, name: 'Orphan', parentId: 999 } // Non-existent parent
    ];
    const result = processData(data);
    assertEqual(result.length, 0, 'Should not include orphaned items');
});

test('processData handles null and undefined parentId', () => {
    const data = [
        { id: 1, name: 'Item 1', parentId: null },
        { id: 2, name: 'Item 2', parentId: undefined },
        { id: 3, name: 'Item 3' } // No parentId property
    ];
    const result = processData(data);
    assertEqual(result.length, 0, 'Should ignore items with null/undefined/missing parentId');
});

test('processData handles complex data structure', () => {
    const data = [
        { id: 'a', name: 'Root A', type: 'folder' },
        { id: 'b', name: 'Root B', type: 'folder' },
        { id: 'a1', name: 'Child A1', parentId: 'a', type: 'file' },
        { id: 'a2', name: 'Child A2', parentId: 'a', type: 'file' },
        { id: 'b1', name: 'Child B1', parentId: 'b', type: 'folder' },
        { id: 'b1-1', name: 'Grandchild B1-1', parentId: 'b1', type: 'file' }
    ];
    const result = processData(data);
    
    // Debug: Let's see what relationships were found
    // console.log('Found relationships:', result.map(r => `${r.parent.id} -> ${r.child.id}`));
    
    assertEqual(result.length, 4, 'Should find four relationships');
    
    // Verify string IDs work correctly
    const a1Relation = result.find(r => r.child.id === 'a1');
    assertEqual(a1Relation.parent.id, 'a', 'String IDs should work correctly');
});

test('processData preserves original object references', () => {
    const parent = { id: 1, name: 'Parent', metadata: { created: '2024-01-01' } };
    const child = { id: 2, name: 'Child', parentId: 1, metadata: { created: '2024-01-02' } };
    const data = [parent, child];
    
    const result = processData(data);
    assertEqual(result[0].parent === parent, true, 'Should preserve parent object reference');
    assertEqual(result[0].child === child, true, 'Should preserve child object reference');
});

// Test calculateTotal function
test('calculateTotal handles empty array', () => {
    const result = calculateTotal([]);
    assertEqual(result, 0, 'Should return 0 for empty array');
});

test('calculateTotal calculates single item', () => {
    const items = [{ price: 10, quantity: 2 }];
    const result = calculateTotal(items);
    assertEqual(result, 20, 'Should calculate 10 * 2 = 20');
});

test('calculateTotal calculates multiple items', () => {
    const items = [
        { price: 10, quantity: 2 },
        { price: 5, quantity: 3 },
        { price: 20, quantity: 1 }
    ];
    const result = calculateTotal(items);
    assertEqual(result, 55, 'Should calculate (10*2) + (5*3) + (20*1) = 55');
});

console.log('\n✨ All tests passed!');