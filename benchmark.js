const { processData, processDataOld } = require('./utils');

/**
 * Performance Benchmark for processData optimization
 * 
 * This benchmark demonstrates the performance improvement from O(n²) to O(n)
 * by testing with various dataset sizes and measuring execution time.
 */

// Generate realistic test data with complex relationships
function generateComplexTestData(size) {
    const data = [];
    const maxDepth = 5;
    
    // Create a hierarchical structure
    let id = 0;
    
    // Root level items (10% of total)
    const rootCount = Math.max(1, Math.floor(size * 0.1));
    for (let i = 0; i < rootCount; i++) {
        data.push({
            id: id++,
            name: `Root ${i}`,
            parentId: null,
            type: 'root'
        });
    }
    
    // Create remaining items with parent relationships
    while (id < size) {
        const parentId = Math.floor(Math.random() * id);
        data.push({
            id: id++,
            name: `Item ${id}`,
            parentId: parentId,
            type: 'child',
            metadata: {
                created: new Date().toISOString(),
                level: Math.floor(Math.random() * maxDepth)
            }
        });
    }
    
    // Add some orphans (items with non-existent parents)
    const orphanCount = Math.floor(size * 0.05);
    for (let i = 0; i < orphanCount; i++) {
        data.push({
            id: id++,
            name: `Orphan ${i}`,
            parentId: size + 1000 + i, // Non-existent parent
            type: 'orphan'
        });
    }
    
    return data;
}

// Memory usage helper
function getMemoryUsage() {
    const used = process.memoryUsage();
    return {
        rss: (used.rss / 1024 / 1024).toFixed(2),
        heapTotal: (used.heapTotal / 1024 / 1024).toFixed(2),
        heapUsed: (used.heapUsed / 1024 / 1024).toFixed(2),
        external: (used.external / 1024 / 1024).toFixed(2)
    };
}

// Single benchmark run
function runBenchmark(size, implementation, data) {
    const memBefore = getMemoryUsage();
    const start = process.hrtime.bigint();
    
    const result = implementation(data);
    
    const end = process.hrtime.bigint();
    const memAfter = getMemoryUsage();
    
    const timeMs = Number(end - start) / 1e6;
    const memoryDelta = parseFloat(memAfter.heapUsed) - parseFloat(memBefore.heapUsed);
    
    return {
        timeMs,
        memoryDelta,
        resultCount: result.length
    };
}

// Multiple runs for more accurate results
function benchmarkWithRuns(size, runs = 5) {
    console.log(`\n📊 Benchmarking with ${size} items (${runs} runs each)...`);
    
    // Generate data once for fair comparison
    const testData = generateComplexTestData(size);
    console.log(`  Generated ${testData.length} test items`);
    
    const oldResults = [];
    const newResults = [];
    
    // Run old implementation
    console.log('  Running O(n²) implementation...');
    for (let i = 0; i < runs; i++) {
        if (size <= 2000) { // Skip very large sizes for old implementation
            oldResults.push(runBenchmark(size, processDataOld, testData));
        }
    }
    
    // Run new implementation
    console.log('  Running O(n) implementation...');
    for (let i = 0; i < runs; i++) {
        newResults.push(runBenchmark(size, processData, testData));
    }
    
    // Calculate averages
    const avgOld = oldResults.length > 0 ? {
        timeMs: oldResults.reduce((sum, r) => sum + r.timeMs, 0) / oldResults.length,
        memoryDelta: oldResults.reduce((sum, r) => sum + r.memoryDelta, 0) / oldResults.length,
        resultCount: oldResults[0].resultCount
    } : null;
    
    const avgNew = {
        timeMs: newResults.reduce((sum, r) => sum + r.timeMs, 0) / newResults.length,
        memoryDelta: newResults.reduce((sum, r) => sum + r.memoryDelta, 0) / newResults.length,
        resultCount: newResults[0].resultCount
    };
    
    return { size, old: avgOld, new: avgNew };
}

// Main benchmark execution
console.log('🚀 processData Performance Benchmark\n');
console.log('This benchmark compares the O(n²) and O(n) implementations\n');

// Test sizes - exponential growth to show algorithmic difference
const testSizes = [100, 500, 1000, 2000, 5000, 10000, 20000];
const results = [];

for (const size of testSizes) {
    const result = benchmarkWithRuns(size, 3);
    results.push(result);
    
    if (result.old) {
        const speedup = result.old.timeMs / result.new.timeMs;
        console.log(`  ✅ Results: ${result.new.resultCount} relationships found`);
        console.log(`  ⏱️  Old: ${result.old.timeMs.toFixed(2)}ms | New: ${result.new.timeMs.toFixed(2)}ms`);
        console.log(`  🎯 Speedup: ${speedup.toFixed(2)}x faster`);
    } else {
        console.log(`  ⏱️  New: ${result.new.timeMs.toFixed(2)}ms (old implementation skipped for large dataset)`);
        console.log(`  ✅ Results: ${result.new.resultCount} relationships found`);
    }
}

// Print summary table
console.log('\n📈 Performance Summary\n');
console.log('| Size   | Old (ms)    | New (ms)  | Speedup   | Relationships |');
console.log('|--------|-------------|-----------|-----------|---------------|');

for (const result of results) {
    const oldTime = result.old ? result.old.timeMs.toFixed(2).padEnd(11) : 'N/A'.padEnd(11);
    const newTime = result.new.timeMs.toFixed(2).padEnd(9);
    const speedup = result.old ? `${(result.old.timeMs / result.new.timeMs).toFixed(2)}x`.padEnd(9) : 'N/A'.padEnd(9);
    const relationships = result.new.resultCount.toString().padEnd(13);
    
    console.log(`| ${result.size.toString().padEnd(6)} | ${oldTime} | ${newTime} | ${speedup} | ${relationships} |`);
}

// Theoretical complexity comparison
console.log('\n📐 Theoretical Complexity Analysis\n');
console.log('Old implementation: O(n²) - For each item, checks all items');
console.log('New implementation: O(n) - Two linear passes through the data');
console.log('\nAs n grows:');
console.log('- n=1,000: Old performs ~1,000,000 comparisons vs 2,000 for new');
console.log('- n=10,000: Old performs ~100,000,000 comparisons vs 20,000 for new');
console.log('- n=100,000: Old performs ~10,000,000,000 comparisons vs 200,000 for new');

console.log('\n✨ Optimization complete! The new implementation scales linearly with data size.');