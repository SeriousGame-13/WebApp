/**
 * @fileoverview Unit tests for HighscoreManager service
 * 
 * Tests cover highscore creation, updating, and retrieval functionality
 * including metric processing, score comparison, and error handling.
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import HighscoreManager from '../../services/HighscoreManager.jsx';
import FirestoreManager from '../../services/firebase/FirestoreManager.jsx';
import UserManagement from '../../services/UserManagementSystem.jsx';
import { HIGHSCORE_COLLECTION } from '../../services/firebase/Collections.jsx';
import { Highscore } from '../../services/interfaces/Highscore.jsx';

// Mock dependencies
vi.mock('../services/firebase/FirestoreManager.jsx');
vi.mock('../services/UserManagementSystem.jsx');
vi.mock('../services/interfaces/Highscore.jsx');

describe('HighscoreManager', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        console.error = vi.fn();
        
        // Mock Highscore constructor
        vi.mocked(Highscore).mockImplementation((data) => ({
            ...data,
            uid: `highscore-${Math.random()}`
        }));
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('create', () => {
        test('should create highscore for new exercise with all metrics', async () => {
            const exercise = {
                stationId: 'station-1',
                userId: 'user-1',
                uid: 'exercise-1',
                points: 100,
                calories: 250,
                heartRateAvg: 140
            };

            const mockExistingScores = { forEach: vi.fn() };
            vi.mocked(FirestoreManager.queryDocumentsByFieldValue).mockResolvedValue(mockExistingScores);
            vi.mocked(FirestoreManager.createDocument).mockResolvedValue({ id: 'highscore-id' });

            await HighscoreManager.create(exercise);

            expect(Highscore).toHaveBeenCalledTimes(3);
            expect(Highscore).toHaveBeenCalledWith({ userId: 'user-1', metric: 'points', score: 100 });
            expect(Highscore).toHaveBeenCalledWith({ userId: 'user-1', metric: 'calories', score: 250 });
            expect(Highscore).toHaveBeenCalledWith({ userId: 'user-1', metric: 'heartRateAvg', score: 140 });
            
            expect(FirestoreManager.queryDocumentsByFieldValue).toHaveBeenCalledWith(
                HIGHSCORE_COLLECTION,
                'userId',
                'user-1'
            );
            expect(FirestoreManager.createDocument).toHaveBeenCalledTimes(3);
        });

        test('should update existing highscore when better score achieved', async () => {
            const exercise = {
                stationId: 'station-1',
                userId: 'user-1',
                uid: 'exercise-1',
                points: 150,
                calories: 300,
                heartRateAvg: 160
            };

            const mockExistingScore = {
                data: () => ({
                    uid: 'existing-highscore',
                    metric: 'points',
                    exerciseId: 'exercise-1',
                    score: 100
                })
            };

            const mockExistingScores = {
                forEach: vi.fn((callback) => {
                    callback(mockExistingScore);
                })
            };

            vi.mocked(FirestoreManager.queryDocumentsByFieldValue).mockResolvedValue(mockExistingScores);
            vi.mocked(FirestoreManager.updateDocument).mockResolvedValue({});
            vi.mocked(FirestoreManager.createDocument).mockResolvedValue({ id: 'new-highscore' });

            await HighscoreManager.create(exercise);

            expect(FirestoreManager.updateDocument).toHaveBeenCalledWith(
                HIGHSCORE_COLLECTION,
                'existing-highscore',
                expect.objectContaining({
                    userId: 'user-1',
                    stationId: 'station-1',
                    exerciseId: 'exercise-1',
                    metric: 'points',
                    score: 150
                }),
                true
            );
        });

        test('should not create highscore for zero scores', async () => {
            const exercise = {
                stationId: 'station-1',
                userId: 'user-1',
                uid: 'exercise-1',
                points: 0,
                calories: 0,
                heartRateAvg: 0
            };

            const mockExistingScores = { forEach: vi.fn() };
            vi.mocked(FirestoreManager.queryDocumentsByFieldValue).mockResolvedValue(mockExistingScores);

            await HighscoreManager.create(exercise);

            expect(FirestoreManager.createDocument).not.toHaveBeenCalled();
        });

        test('should throw error when required IDs are missing', async () => {
            const exercise = {
                uid: 'exercise-1',
                points: 100
            };

            await HighscoreManager.create(exercise);

            expect(console.error).toHaveBeenCalledWith(
                'Error updating highscore:',
                expect.any(Error)
            );
        });

        test('should handle database errors gracefully', async () => {
            const exercise = {
                stationId: 'station-1',
                userId: 'user-1',
                uid: 'exercise-1',
                points: 100,
                calories: 250,
                heartRateAvg: 140
            };

            const dbError = new Error('Database connection failed');
            vi.mocked(FirestoreManager.queryDocumentsByFieldValue).mockRejectedValue(dbError);

            await HighscoreManager.create(exercise);

            expect(console.error).toHaveBeenCalledWith('Error updating highscore:', dbError);
        });

        test('should handle mixed existing and new scores', async () => {
            const exercise = {
                stationId: 'station-1',
                userId: 'user-1',
                uid: 'exercise-1',
                points: 150,
                calories: 300,
                heartRateAvg: 160
            };

            const mockExistingPointsScore = {
                data: () => ({
                    uid: 'existing-points',
                    metric: 'points',
                    exerciseId: 'exercise-1',
                    score: 100
                })
            };

            const mockExistingScores = {
                forEach: vi.fn((callback) => {
                    callback(mockExistingPointsScore);
                })
            };

            vi.mocked(FirestoreManager.queryDocumentsByFieldValue).mockResolvedValue(mockExistingScores);
            vi.mocked(FirestoreManager.updateDocument).mockResolvedValue({});
            vi.mocked(FirestoreManager.createDocument).mockResolvedValue({ id: 'new-highscore' });

            await HighscoreManager.create(exercise);

            // Should update points and create new for calories and heartRateAvg
            expect(FirestoreManager.updateDocument).toHaveBeenCalledTimes(1);
            expect(FirestoreManager.createDocument).toHaveBeenCalledTimes(2);
        });
    });

    describe('loadHighscoresForStation', () => {
        test('should load and return highest scores per metric for station', async () => {
            const mockHighscores = [
                { metric: 'points', score: 100, userId: 'user-1', exerciseId: 'ex-1' },
                { metric: 'points', score: 150, userId: 'user-2', exerciseId: 'ex-2' },
                { metric: 'calories', score: 200, userId: 'user-1', exerciseId: 'ex-1' },
                { metric: 'calories', score: 180, userId: 'user-3', exerciseId: 'ex-3' },
                { metric: 'heartRateAvg', score: 160, userId: 'user-2', exerciseId: 'ex-2' }
            ];

            const mockSnapshot = {
                forEach: vi.fn((callback) => {
                    mockHighscores.forEach(score => {
                        callback({ data: () => score });
                    });
                })
            };

            const mockUsers = [
                { uid: 'user-1', displayName: 'User One' },
                { uid: 'user-2', displayName: 'User Two' },
                { uid: 'user-3', displayName: 'User Three' }
            ];

            vi.mocked(FirestoreManager.queryDocumentsByFieldValue).mockResolvedValue(mockSnapshot);
            vi.mocked(UserManagement.getAllActiveUsers).mockResolvedValue(mockUsers);

            const result = await HighscoreManager.loadHighscoresForStation('station-1');

            expect(FirestoreManager.queryDocumentsByFieldValue).toHaveBeenCalledWith(
                HIGHSCORE_COLLECTION,
                'stationId',
                'station-1'
            );

            expect(result).toHaveLength(3);
            
            // Check that highest scores per metric are returned
            const pointsHighscore = result.find(h => h.metric === 'points');
            expect(pointsHighscore.score).toBe(150);
            expect(pointsHighscore.userId).toBe('user-2');
            expect(pointsHighscore.userName).toBe('User Two');

            const caloriesHighscore = result.find(h => h.metric === 'calories');
            expect(caloriesHighscore.score).toBe(200);
            expect(caloriesHighscore.userId).toBe('user-1');
            expect(caloriesHighscore.userName).toBe('User One');

            const heartRateHighscore = result.find(h => h.metric === 'heartRateAvg');
            expect(heartRateHighscore.score).toBe(160);
            expect(heartRateHighscore.userId).toBe('user-2');
            expect(heartRateHighscore.userName).toBe('User Two');
        });

        test('should return empty array when no highscores found', async () => {
            const mockSnapshot = { forEach: vi.fn() };
            
            vi.mocked(FirestoreManager.queryDocumentsByFieldValue).mockResolvedValue(mockSnapshot);
            vi.mocked(UserManagement.getAllActiveUsers).mockResolvedValue([]);

            const result = await HighscoreManager.loadHighscoresForStation('station-1');

            expect(result).toEqual([]);
        });

        test('should handle single metric highscores', async () => {
            const mockHighscore = { metric: 'points', score: 100, userId: 'user-1', exerciseId: 'ex-1' };

            const mockSnapshot = {
                forEach: vi.fn((callback) => {
                    callback({ data: () => mockHighscore });
                })
            };

            const mockUsers = [{ uid: 'user-1', displayName: 'User One' }];

            vi.mocked(FirestoreManager.queryDocumentsByFieldValue).mockResolvedValue(mockSnapshot);
            vi.mocked(UserManagement.getAllActiveUsers).mockResolvedValue(mockUsers);

            const result = await HighscoreManager.loadHighscoresForStation('station-1');

            expect(result).toHaveLength(1);
            expect(result[0].metric).toBe('points');
            expect(result[0].score).toBe(100);
            expect(result[0].userName).toBe('User One');
        });

        test('should handle database errors gracefully', async () => {
            const dbError = new Error('Database connection failed');
            vi.mocked(FirestoreManager.queryDocumentsByFieldValue).mockRejectedValue(dbError);

            const result = await HighscoreManager.loadHighscoresForStation('station-1');

            expect(console.error).toHaveBeenCalledWith(
                'Failed to load highscores for station:',
                dbError
            );
            expect(result).toEqual([]);
        });

        test('should handle user lookup errors gracefully', async () => {
            const mockHighscore = { metric: 'points', score: 100, userId: 'user-1', exerciseId: 'ex-1' };

            const mockSnapshot = {
                forEach: vi.fn((callback) => {
                    callback({ data: () => mockHighscore });
                })
            };

            vi.mocked(FirestoreManager.queryDocumentsByFieldValue).mockResolvedValue(mockSnapshot);
            vi.mocked(UserManagement.getAllActiveUsers).mockRejectedValue(new Error('User fetch failed'));

            const result = await HighscoreManager.loadHighscoresForStation('station-1');

            expect(console.error).toHaveBeenCalledWith(
                'Failed to load highscores for station:',
                expect.any(Error)
            );
            expect(result).toEqual([]);
        });

        test('should select highest score when multiple scores exist for same metric', async () => {
            const mockHighscores = [
                { metric: 'points', score: 100, userId: 'user-1', exerciseId: 'ex-1' },
                { metric: 'points', score: 80, userId: 'user-2', exerciseId: 'ex-2' },
                { metric: 'points', score: 120, userId: 'user-3', exerciseId: 'ex-3' }
            ];

            const mockSnapshot = {
                forEach: vi.fn((callback) => {
                    mockHighscores.forEach(score => {
                        callback({ data: () => score });
                    });
                })
            };

            const mockUsers = [
                { uid: 'user-1', displayName: 'User One' },
                { uid: 'user-2', displayName: 'User Two' },
                { uid: 'user-3', displayName: 'User Three' }
            ];

            vi.mocked(FirestoreManager.queryDocumentsByFieldValue).mockResolvedValue(mockSnapshot);
            vi.mocked(UserManagement.getAllActiveUsers).mockResolvedValue(mockUsers);

            const result = await HighscoreManager.loadHighscoresForStation('station-1');

            expect(result).toHaveLength(1);
            expect(result[0].score).toBe(120);
            expect(result[0].userId).toBe('user-3');
            expect(result[0].userName).toBe('User Three');
        });
    });
});
