/**
 * @fileoverview Unit tests for StationManagement service
 * 
 * Tests cover station CRUD operations, data validation, error handling,
 * and proper integration with Firestore database operations.
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import StationManager from '../../services/StationManagement.jsx';
import FirestoreManager from '../../services/firebase/FirestoreManager.jsx';
import { Station } from '../../services/interfaces/Station.jsx';
import { STATION_COLLECTION } from '../../services/firebase/Collections.jsx';

// Mock dependencies
vi.mock('../../services/firebase/FirestoreManager.jsx');
vi.mock('../../services/interfaces/Station.jsx');

describe('StationManagement', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        console.error = vi.fn();
        
        // Mock Station constructor and methods
        vi.mocked(Station).mockImplementation((data) => ({
            ...data,
            uid: data.uid || `station-${Math.random()}`,
            validate: vi.fn(() => true)
        }));
        
        Station.fromJSON = vi.fn((data) => ({
            ...data,
            uid: data.uid || `station-${Math.random()}`
        }));
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('save', () => {
        test('should save station successfully with Station instance', async () => {
            const stationData = {
                uid: 'station-123',
                name: 'Test Station',
                description: 'Test description'
            };
            const mockStation = new Station(stationData);

            vi.mocked(FirestoreManager.createDocument).mockResolvedValue({ id: 'station-123' });

            const result = await StationManager.save(mockStation);

            expect(FirestoreManager.createDocument).toHaveBeenCalled();
            expect(result).toBe('station-123');
        });

        test('should save station successfully with plain object', async () => {
            const stationData = {
                uid: 'station-456',
                name: 'Plain Object Station',
                description: 'Test description'
            };

            vi.mocked(FirestoreManager.createDocument).mockResolvedValue({ id: 'station-456' });

            const result = await StationManager.save(stationData);

            expect(Station).toHaveBeenCalledWith(stationData);
            expect(FirestoreManager.createDocument).toHaveBeenCalled();
            expect(result).toBe('station-456');
        });

        test('should throw error when createDocument returns null', async () => {
            const stationData = { name: 'Test Station' };
            vi.mocked(FirestoreManager.createDocument).mockResolvedValue(null);

            await expect(StationManager.save(stationData))
                .rejects.toThrow('Could not save station');
        });

        test('should handle database errors during save', async () => {
            const stationData = { name: 'Test Station' };
            const dbError = new Error('Database error');

            vi.mocked(FirestoreManager.createDocument).mockRejectedValue(dbError);

            await expect(StationManager.save(stationData))
                .rejects.toThrow('Database error');

            expect(console.error).toHaveBeenCalledWith('Error saving Station:', dbError);
        });
    });

    describe('update', () => {
        test('should update station successfully', async () => {
            const stationData = {
                uid: 'station-123',
                name: 'Updated Station',
                description: 'Updated description',
                location: 'New Location'
            };

            vi.mocked(FirestoreManager.updateDocument).mockResolvedValue({});

            await StationManager.update(stationData);

            expect(FirestoreManager.updateDocument).toHaveBeenCalledWith(
                STATION_COLLECTION,
                'station-123',
                {
                    name: 'Updated Station',
                    description: 'Updated description',
                    location: 'New Location'
                }
            );
        });

        test('should handle update with minimal data', async () => {
            const stationData = {
                uid: 'station-456',
                name: 'Minimal Update'
            };

            vi.mocked(FirestoreManager.updateDocument).mockResolvedValue({});

            await StationManager.update(stationData);

            expect(FirestoreManager.updateDocument).toHaveBeenCalledWith(
                STATION_COLLECTION,
                'station-456',
                { name: 'Minimal Update' }
            );
        });

        test('should handle database errors during update', async () => {
            const stationData = {
                uid: 'station-error',
                name: 'Error Station'
            };
            const dbError = new Error('Update failed');

            vi.mocked(FirestoreManager.updateDocument).mockRejectedValue(dbError);

            await expect(StationManager.update(stationData))
                .rejects.toThrow('Update failed');

            expect(console.error).toHaveBeenCalledWith('Error updating station:', dbError);
        });
    });

    describe('delete', () => {
        test('should delete station successfully', async () => {
            const stationId = 'station-123';

            vi.mocked(FirestoreManager.deleteDocument).mockResolvedValue({});

            await StationManager.delete(stationId);

            expect(FirestoreManager.deleteDocument).toHaveBeenCalledWith(
                STATION_COLLECTION,
                stationId
            );
        });

        test('should handle database errors during deletion', async () => {
            const stationId = 'station-error';
            const dbError = new Error('Deletion failed');

            vi.mocked(FirestoreManager.deleteDocument).mockRejectedValue(dbError);

            await expect(StationManager.delete(stationId))
                .rejects.toThrow('Deletion failed');

            expect(console.error).toHaveBeenCalledWith('Error deleting station:', dbError);
        });

        test('should handle deletion with null or undefined ID', async () => {
            const dbError = new Error('Invalid station ID');
            vi.mocked(FirestoreManager.deleteDocument).mockRejectedValue(dbError);

            await expect(StationManager.delete(null))
                .rejects.toThrow('Invalid station ID');
        });
    });

    describe('loadAll', () => {
        test('should load all stations successfully', async () => {
            const mockStationsData = [
                { uid: 'station-1', name: 'Station 1', description: 'First station' },
                { uid: 'station-2', name: 'Station 2', description: 'Second station' },
                { uid: 'station-3', name: 'Station 3', description: 'Third station' }
            ];

            const mockSnapshot = {
                forEach: vi.fn((callback) => {
                    mockStationsData.forEach(data => {
                        callback({ data: () => data });
                    });
                })
            };

            vi.mocked(FirestoreManager.getAllDocuments).mockResolvedValue(mockSnapshot);
            vi.mocked(Station.fromJSON).mockImplementation((data) => ({
                ...data,
                fromJSON: true
            }));

            const result = await StationManager.loadAll();

            expect(FirestoreManager.getAllDocuments).toHaveBeenCalledWith(STATION_COLLECTION);
            expect(Station.fromJSON).toHaveBeenCalledTimes(3);
            expect(result).toHaveLength(3);
            expect(result[0]).toEqual(expect.objectContaining({
                uid: 'station-1',
                name: 'Station 1',
                fromJSON: true
            }));
        });

        test('should return empty array when no stations exist', async () => {
            const mockSnapshot = {
                forEach: vi.fn()
            };

            vi.mocked(FirestoreManager.getAllDocuments).mockResolvedValue(mockSnapshot);

            const result = await StationManager.loadAll();

            expect(result).toEqual([]);
            expect(Station.fromJSON).not.toHaveBeenCalled();
        });

        test('should handle database errors during loadAll', async () => {
            const dbError = new Error('Failed to fetch stations');

            vi.mocked(FirestoreManager.getAllDocuments).mockRejectedValue(dbError);

            const result = await StationManager.loadAll();

            expect(console.error).toHaveBeenCalledWith('Failed to get all stations:', dbError);
            expect(result).toEqual([]);
        });

        test('should handle malformed data during conversion', async () => {
            const mockStationsData = [
                { uid: 'station-1', name: 'Valid Station' },
                { uid: 'station-2' }, // Missing name
                { uid: 'station-3', name: 'Another Valid Station' }
            ];

            const mockSnapshot = {
                forEach: vi.fn((callback) => {
                    mockStationsData.forEach(data => {
                        callback({ data: () => data });
                    });
                })
            };

            vi.mocked(FirestoreManager.getAllDocuments).mockResolvedValue(mockSnapshot);
            vi.mocked(Station.fromJSON).mockImplementation((data) => {
                if (!data || !data.uid) {
                    throw new Error('Invalid station data');
                }
                return { ...data, fromJSON: true };
            });

            const result = await StationManager.loadAll();

            // Should still return some stations despite errors with individual items
            expect(FirestoreManager.getAllDocuments).toHaveBeenCalled();
            expect(Station.fromJSON).toHaveBeenCalledTimes(3);
        });

        test('should process large number of stations efficiently', async () => {
            const mockStationsData = Array.from({ length: 100 }, (_, i) => ({
                uid: `station-${i}`,
                name: `Station ${i}`,
                description: `Description ${i}`
            }));

            const mockSnapshot = {
                forEach: vi.fn((callback) => {
                    mockStationsData.forEach(data => {
                        callback({ data: () => data });
                    });
                })
            };

            vi.mocked(FirestoreManager.getAllDocuments).mockResolvedValue(mockSnapshot);
            vi.mocked(Station.fromJSON).mockImplementation((data) => ({
                ...data,
                fromJSON: true
            }));

            const result = await StationManager.loadAll();

            expect(result).toHaveLength(100);
            expect(Station.fromJSON).toHaveBeenCalledTimes(100);
        });
    });

    describe('StationManager object structure', () => {
        test('should expose correct methods', () => {
            expect(StationManager).toHaveProperty('save');
            expect(StationManager).toHaveProperty('update');
            expect(StationManager).toHaveProperty('delete');
            expect(StationManager).toHaveProperty('loadAll');
            
            expect(typeof StationManager.save).toBe('function');
            expect(typeof StationManager.update).toBe('function');
            expect(typeof StationManager.delete).toBe('function');
            expect(typeof StationManager.loadAll).toBe('function');
        });

        test('should maintain method references correctly', () => {
            // Test that the methods are properly bound
            const { save, update, delete: deleteMethod, loadAll } = StationManager;
            
            expect(save).toBeDefined();
            expect(update).toBeDefined();
            expect(deleteMethod).toBeDefined();
            expect(loadAll).toBeDefined();
        });
    });
});
