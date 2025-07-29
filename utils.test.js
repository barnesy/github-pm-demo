const { processData, processDataOld } = require('./utils');

// Test data generator
function generateTestData(size) {
    const data = [];
    // Create parent items
    for (let i = 0; i < size / 2; i++) {
        data.push({
            id: i,
            name: `Parent ${i}`,
            parentId: null
        });
    }
    // Create child items
    for (let i = size / 2; i < size; i++) {
        data.push({
            id: i,
            name: `Child ${i}`,
            parentId: Math.floor(Math.random() * (size / 2)) // Random parent
        });
    }
    return data;
}

// Verify both implementations produce the same results
function verifyCorrectness() {
    console.log('Verifying correctness...');
    const testData = [
        { id: 1, name: 'Root', parentId: null },
        { id: 2, name: 'Child 1', parentId: 1 },
        { id: 3, name: 'Child 2', parentId: 1 },
        { id: 4, name: 'Grandchild 1', parentId: 2 },
        { id: 5, name: 'Orphan', parentId: 999 } // Non-existent parent
    ];
    
    const oldResult = processDataOld(testData);
    const newResult = processData(testData);
    
    // Sort results for comparison (order might differ)
    const sortResults = (a, b) => {
        if (a.parent.id !== b.parent.id) return a.parent.id - b.parent.id;
        return a.child.id - b.child.id;
    };
    
    oldResult.sort(sortResults);
    newResult.sort(sortResults);
    
    const resultsMatch = JSON.stringify(oldResult) === JSON.stringify(newResult);
    console.log(`Results match: ${resultsMatch}`);
    console.log(`Found ${newResult.length} parent-child relationships`);
    
    if (!resultsMatch) {
        console.error('ERROR: Results do not match!');
        console.log('Old result:', oldResult);
        console.log('New result:', newResult);
        process.exit(1);
    }
    
    return resultsMatch;
}

// Performance benchmark
function benchmark(size) {
    console.log(`\nBenchmarking with ${size} items...`);
    const testData = generateTestData(size);
    
    // Benchmark old implementation
    const oldStart = process.hrtime.bigint();
    const oldResult = processDataOld(testData);
    const oldEnd = process.hrtime.bigint();
    const oldTime = Number(oldEnd - oldStart) / 1e6; // Convert to milliseconds
    
    // Benchmark new implementation
    const newStart = process.hrtime.bigint();
    const newResult = processData(testData);
    const newEnd = process.hrtime.bigint();
    const newTime = Number(newEnd - newStart) / 1e6; // Convert to milliseconds
    
    console.log(`Old implementation (O(n²)): ${oldTime.toFixed(2)}ms`);
    console.log(`New implementation (O(n)): ${newTime.toFixed(2)}ms`);
    console.log(`Speedup: ${(oldTime / newTime).toFixed(2)}x faster`);
    console.log(`Results count: ${newResult.length}`);
    
    return { oldTime, newTime, speedup: oldTime / newTime };
}

// Run tests
console.log('=== processData Performance Optimization Tests ===\n');

// Verify correctness first
if (!verifyCorrectness()) {
    console.error('Correctness verification failed!');
    process.exit(1);
}

// Run benchmarks with different sizes
const sizes = [100, 500, 1000, 2000, 5000];
const results = [];

for (const size of sizes) {
    results.push({ size, ...benchmark(size) });
}

// Summary
console.log('\n=== Performance Summary ===');
console.log('Size\tOld (ms)\tNew (ms)\tSpeedup');
console.log('----\t--------\t--------\t-------');
for (const result of results) {
    console.log(`${result.size}\t${result.oldTime.toFixed(2)}\t\t${result.newTime.toFixed(2)}\t\t${result.speedup.toFixed(2)}x`);
}

console.log('\n✅ All tests passed! The new implementation maintains correctness while significantly improving performance.');