/**
 * @fileoverview Unit tests for FirestoreAnalytics class and related functions
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import FirestoreAnalytics, { createWorkoutAnalytics, createCustomAnalytics } from '../../../services/firebase/FirestoreAnalytics.jsx';
import FirestoreManager from '../../../services/firebase/FirestoreManager.jsx';

// Mock FirestoreManager
vi.mock('../../../services/firebase/FirestoreManager.jsx', () => ({
    default: {
        getAllDocuments: vi.fn()
    }
}));

describe('FirestoreAnalytics', () => {
    let analytics;
    let mockSnapshot;

    beforeEach(() => {
        vi.clearAllMocks();
        analytics = new FirestoreAnalytics();
        
        // Mock document snapshot
        mockSnapshot = {
            forEach: vi.fn((callback) => {
                const mockDocs = [
                    { id: 'doc1', data: () => ({ field1: 'value1', calories: 100, points: 50 }) },
                    { id: 'doc2', data: () => ({ field1: 'value2', calories: 200, points: 75 }) },
                    { id: 'doc3', data: () => ({ field1: 'value1', calories: 150, points: 60 }) }
                ];
                mockDocs.forEach(callback);
            })
        };

        vi.mocked(FirestoreManager.getAllDocuments).mockResolvedValue(mockSnapshot);
    });

    afterEach(() => {
        vi.clearAllTimers();
    });

    describe('Constructor and Configuration', () => {
        test('should initialize with default values', () => {
            const newAnalytics = new FirestoreAnalytics();
            expect(newAnalytics.structure).toEqual([]);
            expect(newAnalytics.fieldMappings).toEqual({});
            expect(newAnalytics.cacheEnabled).toBe(true);
            expect(newAnalytics.cache).toBeInstanceOf(Map);
        });

        test('should set structure correctly', () => {
            const structure = [
                { name: 'users', idField: 'uid' },
                { name: 'workouts', idField: 'workoutId' }
            ];
            
            const result = analytics.setStructure(structure);
            expect(analytics.structure).toEqual(structure);
            expect(result).toBe(analytics); // Should return this for chaining
        });

        test('should set field mappings correctly', () => {
            const mappings = {
                0: ['uid', 'userName'],
                1: ['workoutId', 'duration']
            };
            
            const result = analytics.setFieldMappings(mappings);
            expect(analytics.fieldMappings).toEqual(mappings);
            expect(result).toBe(analytics);
        });

        test('should enable/disable caching', () => {
            analytics.cache.set('test', 'value');
            expect(analytics.cache.size).toBe(1);
            
            const result = analytics.setCaching(false);
            expect(analytics.cacheEnabled).toBe(false);
            expect(analytics.cache.size).toBe(0);
            expect(result).toBe(analytics);
        });
    });

    describe('Path Building', () => {
        beforeEach(() => {
            analytics.setStructure([
                { name: 'users', idField: 'uid' },
                { name: 'workouts', idField: 'workoutId' },
                { name: 'exercises', idField: 'exerciseId' }
            ]);
        });

        test('should build path for depth 0', () => {
            const path = analytics.buildPath([], 0);
            expect(path).toBe('users');
        });

        test('should build path for depth 1', () => {
            const path = analytics.buildPath(['user1'], 1);
            expect(path).toBe('users/user1/workouts');
        });

        test('should build path for depth 2', () => {
            const path = analytics.buildPath(['user1', 'workout1'], 2);
            expect(path).toBe('users/user1/workouts/workout1/exercises');
        });

        test('should handle empty ids array', () => {
            const path = analytics.buildPath([], 2);
            expect(path).toBe('users/workouts/exercises');
        });
    });

    describe('Document Retrieval', () => {
        beforeEach(() => {
            analytics.setStructure([
                { name: 'users', idField: 'uid' },
                { name: 'workouts', idField: 'workoutId' }
            ]);
        });

        test('should get documents at specific depth', async () => {
            const docs = await analytics.getDocumentsAtDepth(['user1'], 1);
            
            expect(FirestoreManager.getAllDocuments).toHaveBeenCalledWith('users/user1/workouts');
            expect(docs).toHaveLength(3);
            expect(docs[0]).toEqual({
                id: 'doc1',
                depth: 1,
                path: 'users/user1/workouts',
                parentIds: ['user1'],
                workoutId: 'doc1',
                field1: 'value1',
                calories: 100,
                points: 50
            });
        });

        test('should use cache when enabled', async () => {
            analytics.setCaching(true);
            
            // First call
            const docs1 = await analytics.getDocumentsAtDepth(['user1'], 1);
            expect(FirestoreManager.getAllDocuments).toHaveBeenCalledTimes(1);
            
            // Second call should use cache
            const docs2 = await analytics.getDocumentsAtDepth(['user1'], 1);
            expect(FirestoreManager.getAllDocuments).toHaveBeenCalledTimes(1);
            expect(docs2).toEqual(docs1);
        });

        test('should not use cache when disabled', async () => {
            analytics.setCaching(false);
            
            // First call
            await analytics.getDocumentsAtDepth(['user1'], 1);
            expect(FirestoreManager.getAllDocuments).toHaveBeenCalledTimes(1);
            
            // Second call should not use cache
            await analytics.getDocumentsAtDepth(['user1'], 1);
            expect(FirestoreManager.getAllDocuments).toHaveBeenCalledTimes(2);
        });

        test('should handle errors gracefully', async () => {
            vi.mocked(FirestoreManager.getAllDocuments).mockRejectedValue(new Error('Firestore error'));
            
            const docs = await analytics.getDocumentsAtDepth(['user1'], 1);
            expect(docs).toEqual([]);
        });
    });

    describe('Condition Evaluation', () => {
        test('should evaluate == condition', () => {
            expect(analytics._evaluateCondition('test', '==', 'test')).toBe(true);
            expect(analytics._evaluateCondition('test', '==', 'other')).toBe(false);
        });

        test('should evaluate != condition', () => {
            expect(analytics._evaluateCondition('test', '!=', 'other')).toBe(true);
            expect(analytics._evaluateCondition('test', '!=', 'test')).toBe(false);
        });

        test('should evaluate numeric comparisons', () => {
            expect(analytics._evaluateCondition(10, '>', 5)).toBe(true);
            expect(analytics._evaluateCondition(10, '>', 15)).toBe(false);
            expect(analytics._evaluateCondition(10, '>=', 10)).toBe(true);
            expect(analytics._evaluateCondition(10, '<', 15)).toBe(true);
            expect(analytics._evaluateCondition(10, '<=', 10)).toBe(true);
        });

        test('should evaluate in condition', () => {
            expect(analytics._evaluateCondition('apple', 'in', ['apple', 'banana'])).toBe(true);
            expect(analytics._evaluateCondition('orange', 'in', ['apple', 'banana'])).toBe(false);
        });

        test('should evaluate contains condition', () => {
            expect(analytics._evaluateCondition('hello world', 'contains', 'world')).toBe(true);
            expect(analytics._evaluateCondition('hello world', 'contains', 'foo')).toBe(false);
        });

        test('should evaluate array-contains condition', () => {
            expect(analytics._evaluateCondition(['a', 'b', 'c'], 'array-contains', 'b')).toBe(true);
            expect(analytics._evaluateCondition(['a', 'b', 'c'], 'array-contains', 'd')).toBe(false);
        });

        test('should return false for unknown operator', () => {
            expect(analytics._evaluateCondition('test', 'unknown', 'value')).toBe(false);
        });
    });

    describe('Field Value Retrieval', () => {
        const mockDoc = {
            depth: 2,
            calories: 100,
            parentContext: {
                'depth_0': { uid: 'user1', userName: 'John' },
                'depth_1': { workoutId: 'workout1', duration: 60 }
            }
        };

        test('should get field from current document', () => {
            const value = analytics.getFieldValue(mockDoc, 'calories', 2);
            expect(value).toBe(100);
        });

        test('should get field from parent context by depth', () => {
            const value = analytics.getFieldValue(mockDoc, 'userName', 0);
            expect(value).toBe('John');
        });

        test('should search through parent contexts', () => {
            const value = analytics.getFieldValue(mockDoc, 'duration', undefined);
            expect(value).toBe(60);
        });

        test('should return undefined for non-existent field', () => {
            const value = analytics.getFieldValue(mockDoc, 'nonExistent', 2);
            expect(value).toBeUndefined();
        });
    });

    describe('Query Functionality', () => {
        beforeEach(() => {
            analytics.setStructure([{ name: 'exercises', idField: 'id' }]);
            
            // Mock traverseToDepth to return sample documents
            vi.spyOn(analytics, 'traverseToDepth').mockResolvedValue([
                { id: 'ex1', depth: 0, calories: 100, type: 'cardio' },
                { id: 'ex2', depth: 0, calories: 150, type: 'strength' },
                { id: 'ex3', depth: 0, calories: 200, type: 'cardio' }
            ]);
        });

        test('should query without conditions', async () => {
            const result = await analytics.query({
                targetDepth: 0,
                sumField: 'calories'
            });

            expect(result.total).toBe(450);
            expect(result.count).toBe(3);
            expect(result.average).toBe(150);
            expect(result.documents).toHaveLength(3);
        });

        test('should query with conditions', async () => {
            const result = await analytics.query({
                targetDepth: 0,
                conditions: [
                    { field: 'type', operator: '==', value: 'cardio', depth: 0 }
                ],
                sumField: 'calories'
            });

            expect(result.total).toBe(300);
            expect(result.count).toBe(2);
            expect(result.average).toBe(150);
            expect(result.documents).toHaveLength(2);
        });

        test('should use filter path when provided', async () => {
            vi.spyOn(analytics, 'getDocumentsAtDepth').mockResolvedValue([
                { id: 'ex1', depth: 0, calories: 100 }
            ]);

            const result = await analytics.query({
                targetDepth: 0,
                filterPath: ['user1'],
                sumField: 'calories'
            });

            expect(analytics.getDocumentsAtDepth).toHaveBeenCalledWith(['user1'], 0);
            expect(result.total).toBe(100);
        });

        test('should handle query errors', async () => {
            vi.spyOn(analytics, 'traverseToDepth').mockRejectedValue(new Error('Query failed'));

            const result = await analytics.query({
                targetDepth: 0,
                sumField: 'calories'
            });

            expect(result).toEqual({ total: 0, average: 0, count: 0, documents: [] });
        });
    });

    describe('Aggregation', () => {
        beforeEach(() => {
            vi.spyOn(analytics, 'query').mockResolvedValue({
                total: 450,
                count: 3,
                documents: [
                    { id: 'ex1', calories: 100, type: 'cardio' },
                    { id: 'ex2', calories: 150, type: 'strength' },
                    { id: 'ex3', calories: 200, type: 'cardio' }
                ]
            });

            vi.spyOn(analytics, 'getFieldValue')
                .mockImplementation((doc, field) => doc[field]);
        });

        test('should aggregate by field', async () => {
            const result = await analytics.aggregate({
                targetDepth: 0,
                groupByField: 'type',
                groupByDepth: 0,
                sumField: 'calories'
            });

            expect(result).toHaveLength(2);
            expect(result[0]).toEqual({
                type: 'cardio',
                total: 300,
                count: 2,
                average: 150,
                documents: expect.arrayContaining([
                    expect.objectContaining({ type: 'cardio', calories: 100 }),
                    expect.objectContaining({ type: 'cardio', calories: 200 })
                ])
            });
        });

        test('should handle aggregation errors', async () => {
            vi.spyOn(analytics, 'query').mockRejectedValue(new Error('Aggregation failed'));

            const result = await analytics.aggregate({
                targetDepth: 0,
                groupByField: 'type',
                groupByDepth: 0,
                sumField: 'calories'
            });

            expect(result).toEqual([]);
        });
    });

    describe('Field Statistics', () => {
        beforeEach(() => {
            vi.spyOn(analytics, 'query').mockResolvedValue({
                total: 450,
                average: 150,
                count: 3,
                documents: [
                    { calories: 100 },
                    { calories: 150 },
                    { calories: 200 }
                ]
            });

            vi.spyOn(analytics, 'getFieldValue')
                .mockImplementation((doc, field) => doc[field]);
        });

        test('should calculate field statistics', async () => {
            const stats = await analytics.getFieldStats('calories', 0, 0);

            expect(stats).toEqual({
                min: 100,
                max: 200,
                average: 150,
                total: 450,
                count: 3
            });
        });

        test('should handle empty results', async () => {
            vi.spyOn(analytics, 'query').mockResolvedValue({
                total: 0,
                average: 0,
                count: 0,
                documents: []
            });

            const stats = await analytics.getFieldStats('calories', 0, 0);

            expect(stats).toEqual({
                min: 0,
                max: 0,
                average: 0,
                total: 0,
                count: 0
            });
        });

        test('should handle statistics errors', async () => {
            vi.spyOn(analytics, 'query').mockRejectedValue(new Error('Stats failed'));

            const stats = await analytics.getFieldStats('calories', 0, 0);

            expect(stats).toEqual({
                min: 0,
                max: 0,
                average: 0,
                total: 0,
                count: 0
            });
        });
    });

    describe('Cache Management', () => {
        test('should clear cache', () => {
            analytics.cache.set('test', 'value');
            expect(analytics.cache.size).toBe(1);

            analytics.clearCache();
            expect(analytics.cache.size).toBe(0);
        });

        test('should return cache size', () => {
            analytics.cache.set('test1', 'value1');
            analytics.cache.set('test2', 'value2');

            expect(analytics.getCacheSize()).toBe(2);
        });
    });

    describe('Factory Functions', () => {
        test('createWorkoutAnalytics should create properly configured instance', () => {
            const workoutAnalytics = createWorkoutAnalytics();

            expect(workoutAnalytics).toBeInstanceOf(FirestoreAnalytics);
            expect(workoutAnalytics.structure).toEqual([
                { name: 'users', idField: 'uid' },
                { name: 'workouts', idField: 'uid' },
                { name: 'exercises', idField: 'uid' }
            ]);
            expect(workoutAnalytics.fieldMappings).toEqual({
                0: ['uid', 'createdAt'],
                1: ['uid', 'duration'],
                2: ['uid', 'calories', 'points', 'heartRateAvg', 'startTime', 'endTime']
            });
        });

        test('createCustomAnalytics should create instance with custom config', () => {
            const structure = [{ name: 'custom', idField: 'customId' }];
            const fieldMappings = { 0: ['customField'] };

            const customAnalytics = createCustomAnalytics(structure, fieldMappings);

            expect(customAnalytics).toBeInstanceOf(FirestoreAnalytics);
            expect(customAnalytics.structure).toEqual(structure);
            expect(customAnalytics.fieldMappings).toEqual(fieldMappings);
        });
    });

    describe('Traversal', () => {
        beforeEach(() => {
            analytics.setStructure([
                { name: 'users', idField: 'uid' },
                { name: 'workouts', idField: 'workoutId' }
            ]);

            // Mock getDocumentsAtDepth for different depths
            vi.spyOn(analytics, 'getDocumentsAtDepth')
                .mockImplementation(async (ids, depth) => {
                    if (depth === 0) {
                        return [{ id: 'user1', depth: 0 }, { id: 'user2', depth: 0 }];
                    } else if (depth === 1) {
                        return [
                            { id: 'workout1', depth: 1, calories: 100 },
                            { id: 'workout2', depth: 1, calories: 200 }
                        ];
                    }
                    return [];
                });
        });

        test('should traverse to target depth', async () => {
            const result = await analytics.traverseToDepth(1);

            expect(result).toHaveLength(4); // 2 users × 2 workouts each
            expect(result[0]).toEqual(expect.objectContaining({
                id: 'workout1',
                depth: 1,
                calories: 100,
                parentContext: {
                    'depth_0': { id: 'user1', depth: 0 }
                }
            }));
        });

        test('should return documents at target depth when currentDepth equals targetDepth', async () => {
            const result = await analytics.traverseToDepth(0);

            expect(result).toHaveLength(2);
            expect(result[0]).toEqual({ id: 'user1', depth: 0 });
        });
    });
});
