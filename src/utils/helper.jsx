export const aggregate = (aggregates, docs) => {
    let results = {};
    aggregates.forEach(aggregation => {
        switch (aggregation.function) {
            case 'count':
                results[aggregation.function + aggregation.field] = docs.length;
                break;
            case 'sum':
                results[aggregation.function + aggregation.field] = docs.reduce((total, doc) => {
                    const value = doc.data()[aggregation.field];
                    // Stellt sicher, dass der Wert eine Zahl ist, bevor er addiert wird
                    return total + (typeof value === 'number' ? value : 0);
                }, 0);
                break;
            case 'average': {
                const sum = docs.reduce((total, doc) => {
                    const value = doc.data()[aggregation.field];
                    return total + (typeof value === 'number' ? value : 0);
                }, 0);
                results[aggregation.function + aggregation.field] = sum / docs.length;
            }
                break;
            default:
                console.error(`Nicht unterstützter Aggregationstyp: ${aggregation.function}`);
                break;
        }
    });
    return results;
}