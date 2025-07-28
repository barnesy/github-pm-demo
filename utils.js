// Utility functions without documentation

function calculateTotal(items) {
    let total = 0;
    for (let i = 0; i < items.length; i++) {
        total += items[i].price * items[i].quantity;
    }
    return total;
}

function processData(data) {
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

module.exports = { calculateTotal, processData };