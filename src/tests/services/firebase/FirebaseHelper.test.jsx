/**
 * @fileoverview Unit tests for FirebaseHelper utility functions
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { serverTimestamp, Timestamp, aggregate, buildConditions } from '../../../services/firebase/FirebaseHelper.jsx';

// Mock Firebase functions
vi.mock('firebase/firestore', () => ({
    serverTimestamp: vi.fn(() => ({ isEqual: () => true, _methodName: 'serverTimestamp' })),
    Timestamp: {
        fromDate: vi.fn((date) => ({ seconds: Math.floor(date.getTime() / 1000), nanoseconds: 0 })),
        fromMillis: vi.fn((millis) => ({ seconds: Math.floor(millis / 1000), nanoseconds: 0 })),
        now: vi.fn(() => ({ seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 }))
    }
}));

describe('FirebaseHelper', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('serverTimestamp', () => {
        test('should return server timestamp', () => {
            const result = serverTimestamp();
            expect(result).toEqual({ isEqual: expect.any(Function), _methodName: 'serverTimestamp' });
        });
    });

    describe('Timestamp', () => {
        test('should export Timestamp from firebase', () => {
            expect(Timestamp).toBeDefined();
            expect(Timestamp.fromDate).toBeDefined();
            expect(Timestamp.fromMillis).toBeDefined();
            expect(Timestamp.now).toBeDefined();
        });
    });

    describe('aggregate', () => {
        const mockDocs = [
            { data: () => ({ value: 10, score: 5 }) },
            { data: () => ({ value: 20, score: 15 }) },
            { data: () => ({ value: 30, score: 25 }) },
            { data: () => ({ value: 'invalid', score: 10 }) }
        ];

        test('should count documents', () => {
            const aggregates = [{ function: 'count', field: 'value' }];
            const result = aggregate(aggregates, mockDocs);
            
            expect(result.countvalue).toBe(4);
        });

        test('should sum numeric values only', () => {
            const aggregates = [{ function: 'sum', field: 'value' }];
            const result = aggregate(aggregates, mockDocs);
            
            expect(result.sumvalue).toBe(60); // 10 + 20 + 30 + 0 (invalid becomes 0)
        });

        test('should calculate average', () => {
            const aggregates = [{ function: 'average', field: 'score' }];
            const result = aggregate(aggregates, mockDocs);
            
            expect(result.averagescore).toBe(13.75); // (5 + 15 + 25 + 10) / 4
        });

        test('should handle multiple aggregations', () => {
            const aggregates = [
                { function: 'count', field: 'value' },
                { function: 'sum', field: 'score' },
                { function: 'average', field: 'value' }
            ];
            const result = aggregate(aggregates, mockDocs);
            
            expect(result.countvalue).toBe(4);
            expect(result.sumscore).toBe(55);
            expect(result.averagevalue).toBe(15); // (10 + 20 + 30 + 0) / 4
        });

        test('should handle empty document array', () => {
            const aggregates = [{ function: 'count', field: 'value' }];
            const result = aggregate(aggregates, []);
            
            expect(result.countvalue).toBe(0);
        });

        test('should handle unsupported aggregation function', () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            const aggregates = [{ function: 'unsupported', field: 'value' }];
            const result = aggregate(aggregates, mockDocs);
            
            expect(consoleSpy).toHaveBeenCalledWith('Nicht unterstützter Aggregationstyp: unsupported');
            expect(result).toEqual({});
            
            consoleSpy.mockRestore();
        });

        test('should handle missing field in documents', () => {
            const docsWithMissingField = [
                { data: () => ({ value: 10 }) },
                { data: () => ({}) }, // missing value field
                { data: () => ({ value: 20 }) }
            ];
            
            const aggregates = [{ function: 'sum', field: 'value' }];
            const result = aggregate(aggregates, docsWithMissingField);
            
            expect(result.sumvalue).toBe(30); // 10 + 0 + 20
        });
    });

    describe('buildConditions', () => {
        const mockMappingData = {
            user: {
                id: 'user123',
                name: 'John Doe'
            },
            session: {
                score: 100
            }
        };

        test('should parse simple conditions', () => {
            const rawConditions = ['field:value,operator:==,value:test'];
            const result = buildConditions(rawConditions, mockMappingData);
            
            expect(result).toEqual([
                { field: 'value', operator: '==', value: 'test' }
            ]);
        });

        test('should parse conditions with mapped values', () => {
            const rawConditions = ['field:userId,operator:==,value:{user.id}'];
            const result = buildConditions(rawConditions, mockMappingData);
            
            expect(result).toEqual([
                { field: 'userId', operator: '==', value: 'user123' }
            ]);
        });

        test('should parse nested mapping values', () => {
            const rawConditions = [
                'field:score,operator:>,value:{session.score}',
                'field:name,operator:==,value:{user.name}'
            ];
            const result = buildConditions(rawConditions, mockMappingData);
            
            expect(result).toEqual([
                { field: 'score', operator: '>', value: 100 },
                { field: 'name', operator: '==', value: 'John Doe' }
            ]);
        });

        test('should handle multiple key-value pairs', () => {
            const rawConditions = ['field:status,operator:==,value:active,type:string'];
            const result = buildConditions(rawConditions, mockMappingData);
            
            expect(result).toEqual([
                { field: 'status', operator: '==', value: 'active', type: 'string' }
            ]);
        });

        test('should ignore invalid condition strings', () => {
            const rawConditions = [
                'validfield:value,operator:==,value:test',
                'invalidstring',
                'field:another,operator:!=,value:test2'
            ];
            const result = buildConditions(rawConditions, mockMappingData);
            
            expect(result).toHaveLength(2);
            expect(result).toEqual([
                { validfield: 'value', operator: '==', value: 'test' },
                { field: 'another', operator: '!=', value: 'test2' }
            ]);
        });

        test('should handle empty conditions array', () => {
            const result = buildConditions([], mockMappingData);
            expect(result).toEqual([]);
        });

        test('should handle conditions without commas', () => {
            const rawConditions = ['singlevalue'];
            const result = buildConditions(rawConditions, mockMappingData);
            expect(result).toEqual([]);
        });

        test('should handle complex nested mapping', () => {
            const complexMapping = {
                level1: {
                    level2: {
                        level3: 'deepValue'
                    }
                }
            };
            
            const rawConditions = ['field:deep,operator:==,value:{level1.level2.level3}'];
            const result = buildConditions(rawConditions, complexMapping);
            
            expect(result).toEqual([
                { field: 'deep', operator: '==', value: 'deepValue' }
            ]);
        });

        test('should handle mapping with multiple brackets', () => {
            const rawConditions = ['field:test,operator:==,value:{user.id},extra:{session.score}'];
            const result = buildConditions(rawConditions, mockMappingData);
            
            expect(result).toEqual([
                { field: 'test', operator: '==', value: 'user123', extra: 100 }
            ]);
        });
    });
});
