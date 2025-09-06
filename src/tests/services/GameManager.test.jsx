/**
 * @fileoverview Unit tests for GameManager service
 * 
 * These tests cover all CRUD operations and error handling scenarios
 * for the GameManager service including save, update, delete, and loadAll functionality.
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import GameManager from '../../services/GameManager.jsx';
import FirestoreManager from '../../services/firebase/FirestoreManager.jsx';
import { STATION_GAMES_COLLECTION } from '../../services/firebase/Collections.jsx';
import { StationGame } from '../../services/interfaces/Station.jsx';

// Mock FirestoreManager
vi.mock('../services/firebase/FirestoreManager.jsx');

// Mock StationGame
vi.mock('../services/interfaces/Station.jsx', () => ({
    StationGame: vi.fn().mockImplementation((data) => ({
        ...data,
        uid: data?.uid || 'station-game-123'
    }))
}));

describe('GameManager', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        console.error = vi.fn();
        
        // Setup default mock implementations
        StationGame.fromJSON = vi.fn().mockImplementation((data) => data);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('save', () => {
        test('should save StationGame object successfully', async () => {
            const mockStationGame = {
                uid: 'station-game-123',
                name: 'Test Station',
                type: 'FITNESS'
            };
            
            const mockDocRef = { id: 'station-game-123' };
            vi.mocked(FirestoreManager.createDocument).mockResolvedValue(mockDocRef);

            const result = await GameManager.save(mockStationGame);

            expect(FirestoreManager.createDocument).toHaveBeenCalledWith(
                STATION_GAMES_COLLECTION,
                expect.any(Object),
                mockStationGame.uid
            );
            expect(result).toBe(mockDocRef.id);
        });

        test('should convert plain object to StationGame instance before saving', async () => {
            const plainObject = {
                uid: 'station-game-456',
                name: 'Plain Object Station',
                type: 'CARDIO'
            };
            
            // Mock StationGame constructor to return object with proper uid
            const mockStationGameInstance = {
                ...plainObject,
                uid: plainObject.uid
            };
            vi.mocked(StationGame).mockReturnValue(mockStationGameInstance);
            
            const mockDocRef = { id: 'station-game-456' };
            vi.mocked(FirestoreManager.createDocument).mockResolvedValue(mockDocRef);

            await GameManager.save(plainObject);

            expect(StationGame).toHaveBeenCalledWith(plainObject);
            expect(FirestoreManager.createDocument).toHaveBeenCalledWith(
                STATION_GAMES_COLLECTION,
                mockStationGameInstance,
                plainObject.uid
            );
        });

        test('should throw error when document creation fails', async () => {
            const mockStationGame = {
                uid: 'station-game-789',
                name: 'Failed Station'
            };
            
            vi.mocked(FirestoreManager.createDocument).mockResolvedValue(null);

            await expect(GameManager.save(mockStationGame))
                .rejects.toThrow('Could not save object');

            expect(console.error).toHaveBeenCalledWith(
                'Error saving object:',
                expect.any(Error)
            );
        });

        test('should handle database errors during save', async () => {
            const mockStationGame = {
                uid: 'station-game-error',
                name: 'Error Station'
            };
            
            const dbError = new Error('Database connection failed');
            vi.mocked(FirestoreManager.createDocument).mockRejectedValue(dbError);

            await expect(GameManager.save(mockStationGame))
                .rejects.toThrow('Database connection failed');

            expect(console.error).toHaveBeenCalledWith(
                'Error saving object:',
                dbError
            );
        });
    });

    describe('update', () => {
        test('should update station game successfully', async () => {
            const updateData = {
                uid: 'station-game-123',
                name: 'Updated Station',
                type: 'STRENGTH'
            };

            vi.mocked(FirestoreManager.updateDocument).mockResolvedValue({});

            await GameManager.update(updateData);

            expect(FirestoreManager.updateDocument).toHaveBeenCalledWith(
                STATION_GAMES_COLLECTION,
                updateData.uid,
                {
                    name: updateData.name,
                    type: updateData.type
                }
            );
        });

        test('should exclude uid from update data', async () => {
            const updateData = {
                uid: 'station-game-456',
                name: 'Updated Station',
                type: 'FITNESS',
                extraField: 'should be included'
            };

            vi.mocked(FirestoreManager.updateDocument).mockResolvedValue({});

            await GameManager.update(updateData);

            expect(FirestoreManager.updateDocument).toHaveBeenCalledWith(
                STATION_GAMES_COLLECTION,
                updateData.uid,
                {
                    name: updateData.name,
                    type: updateData.type,
                    extraField: updateData.extraField
                }
            );
        });

        test('should handle update errors', async () => {
            const updateData = {
                uid: 'station-game-error',
                name: 'Error Station'
            };
            
            const dbError = new Error('Update failed');
            vi.mocked(FirestoreManager.updateDocument).mockRejectedValue(dbError);

            await expect(GameManager.update(updateData))
                .rejects.toThrow('Update failed');

            expect(console.error).toHaveBeenCalledWith(
                'Error updating:',
                dbError
            );
        });
    });

    describe('deleteObject', () => {
        test('should delete station game successfully', async () => {
            const uid = 'station-game-to-delete';
            
            vi.mocked(FirestoreManager.deleteDocument).mockResolvedValue({});

            await GameManager.deleteObject(uid);

            expect(FirestoreManager.deleteDocument).toHaveBeenCalledWith(
                STATION_GAMES_COLLECTION,
                uid
            );
        });

        test('should handle delete errors', async () => {
            const uid = 'station-game-error';
            const dbError = new Error('Delete failed');
            
            vi.mocked(FirestoreManager.deleteDocument).mockRejectedValue(dbError);

            await expect(GameManager.deleteObject(uid))
                .rejects.toThrow('Delete failed');

            expect(console.error).toHaveBeenCalledWith(
                'Error deleting:',
                dbError
            );
        });
    });

    describe('loadAll', () => {
        test('should load all station games successfully', async () => {
            const mockStationGames = [
                {
                    uid: 'station-1',
                    name: 'Station 1',
                    type: 'FITNESS'
                },
                {
                    uid: 'station-2',
                    name: 'Station 2',
                    type: 'CARDIO'
                }
            ];

            const mockSnapshot = {
                forEach: vi.fn((callback) => {
                    mockStationGames.forEach(station => {
                        callback({ data: () => station });
                    });
                })
            };

            vi.mocked(FirestoreManager.getAllDocuments).mockResolvedValue(mockSnapshot);
            vi.mocked(StationGame.fromJSON).mockImplementation((data) => data);

            const result = await GameManager.loadAll();

            expect(FirestoreManager.getAllDocuments).toHaveBeenCalledWith(STATION_GAMES_COLLECTION);
            expect(StationGame.fromJSON).toHaveBeenCalledTimes(2);
            expect(result).toEqual(mockStationGames);
        });

        test('should return empty array when no station games exist', async () => {
            const mockSnapshot = {
                forEach: vi.fn()
            };

            vi.mocked(FirestoreManager.getAllDocuments).mockResolvedValue(mockSnapshot);

            const result = await GameManager.loadAll();

            expect(result).toEqual([]);
        });

        test('should handle errors and return empty array', async () => {
            const dbError = new Error('Failed to fetch documents');
            vi.mocked(FirestoreManager.getAllDocuments).mockRejectedValue(dbError);

            const result = await GameManager.loadAll();

            expect(console.error).toHaveBeenCalledWith(
                'Failed to get all:',
                dbError
            );
            expect(result).toEqual([]);
        });

        test('should process station games with StationGame.fromJSON', async () => {
            const rawStationData = {
                name: 'Raw Station',
                type: 'STRENGTH',
                timestamp: { seconds: 1234567890 }
            };

            const processedStationData = {
                name: 'Raw Station',
                type: 'STRENGTH',
                createdAt: new Date(1234567890 * 1000)
            };

            const mockSnapshot = {
                forEach: vi.fn((callback) => {
                    callback({ data: () => rawStationData });
                })
            };

            vi.mocked(FirestoreManager.getAllDocuments).mockResolvedValue(mockSnapshot);
            vi.mocked(StationGame.fromJSON).mockReturnValue(processedStationData);

            const result = await GameManager.loadAll();

            expect(StationGame.fromJSON).toHaveBeenCalledWith(rawStationData);
            expect(result).toEqual([processedStationData]);
        });
    });
});
