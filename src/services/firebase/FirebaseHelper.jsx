import { serverTimestamp as fbServerTimestamp, Timestamp as fbTimestamp } from 'firebase/firestore';

export const serverTimestamp = () => {
    return fbServerTimestamp();
};

export const Timestamp = fbTimestamp;

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

export const buildConditions = (rawConditions, mappingData) => {
    const conditions = [];
    rawConditions.forEach(str => {
        const temp = str.split(',');
        let cond = {};
        if (temp.length > 1) {
            temp.forEach(x => {
                let t = x.split(':');
                cond[t[0]] = t[1];
            });
            if (cond['value'].includes('{')) {
                const tt = cond['value'].replaceAll('{', '').replaceAll('}', '').split('.');
                let curData = mappingData;
                for (let n of tt) {
                    curData = curData[n];
                }
                cond['value'] = curData;
            }
            conditions.push(cond);

        }
    });

    return conditions;
}