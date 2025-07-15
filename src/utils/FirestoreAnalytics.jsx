import FirestoreManager from '../services/firebase/FirestoreManager';

/**
 * Abstract Firestore Analytics Engine
 * Allows complete control over collection structure and field targeting
 */
class FirestoreAnalytics {
    constructor() {
        this.structure = [];
        this.fieldMappings = {};
        this.cache = new Map();
        this.cacheEnabled = true;
    }

    /**
     * Define the collection structure
     * @param {Array} structure - Array of collection level definitions
     * Structure format: [
     *   { name: 'users', idField: 'uid' },
     *   { name: 'workouts', idField: 'uid' },
     *   { name: 'stations', idField: 'uid' }
     * ]
     */
    setStructure(structure) {
        this.structure = structure;
        this.cache.clear();
        return this;
    }

    /**
     * Define field mappings for each depth level
     * @param {Object} mappings - Object mapping depth to available fields
     * Format: {
     *   0: ['uid', 'userName'], // fields at users level
     *   1: ['uid', 'workoutDate', 'duration'], // fields at workouts level
     *   2: ['uid', 'calories', 'points', 'heartRateAvg'] // fields at stations level
     * }
     */
    setFieldMappings(mappings) {
        this.fieldMappings = mappings;
        return this;
    }

    /**
     * Enable/disable caching
     * @param {boolean} enabled - Whether to enable caching
     */
    setCaching(enabled) {
        this.cacheEnabled = enabled;
        if (!enabled) {
            this.cache.clear();
        }
        return this;
    }

    /**
     * Build collection path for a specific depth
     * @param {Array} ids - Array of IDs for each level
     * @param {number} depth - Target depth level
     * @returns {string} Collection path
     */
    buildPath(ids, depth) {
        let path = '';
        for (let i = 0; i <= depth; i++) {
            if (i > 0) path += '/';
            path += this.structure[i].name;
            if (ids[i] && i < depth) {
                path += '/' + ids[i];
            }
        }
        return path;
    }

    /**
     * Get all documents at a specific depth
     * @param {Array} parentIds - Array of parent IDs
     * @param {number} depth - Target depth level
     * @returns {Promise<Array>} Array of documents with full context
     */
    async getDocumentsAtDepth(parentIds = [], depth = 0) {
        const cacheKey = `depth_${depth}_${parentIds.join('_')}`;

        if (this.cacheEnabled && this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        try {
            const path = this.buildPath(parentIds, depth);
            const querySnapshot = await FirestoreManager.getAllDocuments(path);
            const documents = [];

            querySnapshot.forEach((doc) => {
                const docData = {
                    id: doc.id,
                    depth: depth,
                    path: path,
                    parentIds: [...parentIds],
                    ...doc.data()
                };

                // Add ID field mapping
                if (this.structure[depth]) {
                    docData[this.structure[depth].idField] = doc.id;
                }

                documents.push(docData);
            });

            if (this.cacheEnabled) {
                this.cache.set(cacheKey, documents);
            }

            return documents;
        } catch (error) {
            console.error(`Error getting documents at depth ${depth}:`, error);
            return [];
        }
    }

    /**
     * Recursively traverse all documents to target depth
     * @param {number} targetDepth - Target depth to traverse to
     * @param {Array} currentIds - Current ID chain
     * @param {number} currentDepth - Current depth level
     * @returns {Promise<Array>} Array of all documents at target depth
     */
    async traverseToDepth(targetDepth, currentIds = [], currentDepth = 0) {
        if (currentDepth === targetDepth) {
            return await this.getDocumentsAtDepth(currentIds, currentDepth);
        }

        const currentLevelDocs = await this.getDocumentsAtDepth(currentIds, currentDepth);
        const allResults = [];

        for (const doc of currentLevelDocs) {
            const nextIds = [...currentIds, doc.id];
            const childResults = await this.traverseToDepth(targetDepth, nextIds, currentDepth + 1);

            // Enrich child documents with parent context
            childResults.forEach(child => {
                child.parentContext = child.parentContext || {};
                child.parentContext[`depth_${currentDepth}`] = doc;
            });

            allResults.push(...childResults);
        }

        return allResults;
    }

    /**
     * Query documents with field conditions and depth specification
     * @param {Object} config - Query configuration
     * @param {number} config.targetDepth - Depth level to query
     * @param {Array} config.conditions - Array of conditions
     * @param {string} config.sumField - Field to sum (optional)
     * @param {Array} config.filterPath - Specific path to filter by (optional)
     * @returns {Promise<{total: number, average: number, count: number, documents: Array}>}
     */
    async query(config) {
        const {
            targetDepth,
            conditions = [],
            sumField = null,
            filterPath = []
        } = config;

        try {
            let documents;

            if (filterPath.length > 0) {
                documents = await this.getDocumentsAtDepth(filterPath, targetDepth);
            } else {
                documents = await this.traverseToDepth(targetDepth);
            }

            let total = 0;
            let count = 0;
            const matchingDocs = [];

            documents.forEach(doc => {
                const matchesAllConditions = conditions.every(condition => {
                    const fieldValue = this.getFieldValue(doc, condition.field, condition.depth);
                    return this._evaluateCondition(fieldValue, condition.operator, condition.value);
                });

                if (matchesAllConditions) {
                    count++;
                    matchingDocs.push(doc);

                    if (sumField) {
                        const fieldValue = this.getFieldValue(doc, sumField, targetDepth) || 0;
                        total += fieldValue;
                    }
                }
            });

            const average = count > 0 && sumField ? total / count : 0;

            return {
                total,
                average: Math.round(average * 100) / 100,
                count,
                documents: matchingDocs
            };
        } catch (error) {
            console.error('Error executing query:', error);
            return { total: 0, average: 0, count: 0, documents: [] };
        }
    }

    /**
     * Get field value from document considering depth and parent context
     * @param {Object} doc - Document object
     * @param {string} field - Field name
     * @param {number} depth - Depth level to look for field
     * @returns {any} Field value
     */
    getFieldValue(doc, field, depth) {
        // Check current document first
        if (doc.hasOwnProperty(field) && depth == doc.depth) {
            return doc[field];
        }

        // Check parent context if depth is specified
        if (depth !== undefined && doc.parentContext && doc.parentContext[`depth_${depth}`]) {
            return doc.parentContext[`depth_${depth}`][field];
        }

        // Search through all parent contexts
        if (doc.parentContext) {
            for (const [key, parentDoc] of Object.entries(doc.parentContext)) {
                if (parentDoc.hasOwnProperty(field)) {
                    return parentDoc[field];
                }
            }
        }

        return undefined;
    }

    /**
     * Aggregate data by grouping field
     * @param {Object} config - Aggregation configuration
     * @param {number} config.targetDepth - Depth level to aggregate
     * @param {string} config.groupByField - Field to group by
     * @param {number} config.groupByDepth - Depth level of grouping field
     * @param {string} config.sumField - Field to sum
     * @param {Array} config.conditions - Conditions to filter by
     * @returns {Promise<Array>} Array of aggregated results
     */
    async aggregate(config) {
        const {
            targetDepth,
            groupByField,
            groupByDepth,
            sumField,
            conditions = []
        } = config;

        try {
            const queryResult = await this.query({
                targetDepth,
                conditions,
                sumField
            });

            const grouped = {};

            queryResult.documents.forEach(doc => {
                const groupValue = this.getFieldValue(doc, groupByField, groupByDepth);

                if (!grouped[groupValue]) {
                    grouped[groupValue] = {
                        [groupByField]: groupValue,
                        total: 0,
                        count: 0,
                        average: 0,
                        documents: []
                    };
                }

                const fieldValue = this.getFieldValue(doc, sumField, targetDepth) || 0;
                grouped[groupValue].total += fieldValue;
                grouped[groupValue].count++;
                grouped[groupValue].documents.push(doc);
            });

            // Calculate averages and sort
            const results = Object.values(grouped)
                .map(group => ({
                    ...group,
                    average: Math.round((group.total / group.count) * 100) / 100
                }))
                .sort((a, b) => b.total - a.total);

            return results;
        } catch (error) {
            console.error('Error executing aggregation:', error);
            return [];
        }
    }

    /**
     * Get statistics for a field at specific depth
     * @param {string} field - Field name
     * @param {number} fieldDepth - Depth level of the field
     * @param {number} targetDepth - Depth level to traverse to
     * @param {Array} conditions - Conditions to filter by
     * @returns {Promise<Object>} Statistics object
     */
    async getFieldStats(field, fieldDepth, targetDepth, conditions = []) {
        try {
            const queryResult = await this.query({
                targetDepth,
                conditions,
                sumField: field
            });

            if (queryResult.documents.length === 0) {
                return { min: 0, max: 0, average: 0, total: 0, count: 0 };
            }

            const values = queryResult.documents
                .map(doc => this.getFieldValue(doc, field, fieldDepth) || 0)
                .filter(val => val !== undefined);

            const min = Math.min(...values);
            const max = Math.max(...values);

            return {
                min,
                max,
                average: queryResult.average,
                total: queryResult.total,
                count: queryResult.count
            };
        } catch (error) {
            console.error(`Error getting stats for field ${field}:`, error);
            return { min: 0, max: 0, average: 0, total: 0, count: 0 };
        }
    }

    /**
     * Helper method to evaluate conditions
     * @private
     */
    _evaluateCondition(fieldValue, operator, value) {
        switch (operator) {
            case '==':
                return fieldValue === value;
            case '!=':
                return fieldValue !== value;
            case '>':
                return fieldValue > value;
            case '>=':
                return fieldValue >= value;
            case '<':
                return fieldValue < value;
            case '<=':
                return fieldValue <= value;
            case 'in':
                return Array.isArray(value) && value.includes(fieldValue);
            case 'contains':
                return typeof fieldValue === 'string' && fieldValue.includes(value);
            case 'array-contains':
                return Array.isArray(fieldValue) && fieldValue.includes(value);
            default:
                return false;
        }
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
    }

    /**
     * Get cache size
     */
    getCacheSize() {
        return this.cache.size;
    }
}

// Usage Examples and Helper Functions:

/**
 * Factory function to create a workout analytics instance
 */
function createWorkoutAnalytics() {
    const analytics = new FirestoreAnalytics();

    // Define structure
    analytics.setStructure([
        { name: 'users', idField: 'uid' },
        { name: 'workouts', idField: 'uid' },
        { name: 'stations', idField: 'uid' }
    ]);

    // Define field mappings
    analytics.setFieldMappings({
        0: ['uid', 'createdAt'],
        1: ['uid', 'duration'],
        2: ['uid', 'calories', 'points', 'heartRateAvg', 'startTime', 'endTime']
    });

    return analytics;
}

/**
 * Factory function for different structures
 */
function createCustomAnalytics(structure, fieldMappings) {
    const analytics = new FirestoreAnalytics();
    analytics.setStructure(structure);
    analytics.setFieldMappings(fieldMappings);
    return analytics;
}

/*
// Usage Examples:

// Create workout analytics
const analytics = createWorkoutAnalytics();

// Get total calories from all users (depth 2 = stations)
const totalCalories = await analytics.query({
    targetDepth: 2,
    sumField: 'calories'
});

// Get calories for specific user
const userCalories = await analytics.query({
    targetDepth: 2,
    sumField: 'calories',
    filterPath: ['specificUserId']
});

// Query high-intensity stations with heart rate > 150
const highIntensity = await analytics.query({
    targetDepth: 2,
    conditions: [
        { field: 'heartRateAvg', operator: '>', value: 150, depth: 2 }
    ],
    sumField: 'calories'
});

// Aggregate calories by user
const userLeaderboard = await analytics.aggregate({
    targetDepth: 2,
    groupByField: 'userId',
    groupByDepth: 0,
    sumField: 'calories'
});

// Get stats for calories field
const caloriesStats = await analytics.getFieldStats('calories', 2, 2);

// Custom structure example - simple blogs
const blogAnalytics = createCustomAnalytics([
    { name: 'blogs', idField: 'blogId' },
    { name: 'posts', idField: 'postId' },
    { name: 'comments', idField: 'commentId' }
], {
    0: ['blogId', 'blogName', 'owner'],
    1: ['postId', 'title', 'views', 'likes'],
    2: ['commentId', 'content', 'author', 'timestamp']
});

// Query total views across all blogs
const totalViews = await blogAnalytics.query({
    targetDepth: 1,
    sumField: 'views'
});

// Group posts by blog
const postsByBlog = await blogAnalytics.aggregate({
    targetDepth: 1,
    groupByField: 'blogId',
    groupByDepth: 0,
    sumField: 'views'
});
*/

export { FirestoreAnalytics, createWorkoutAnalytics, createCustomAnalytics };
export default FirestoreAnalytics;