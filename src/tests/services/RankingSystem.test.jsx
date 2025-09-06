/**
 * @fileoverview Unit tests for RankingSystem service
 * 
 * Tests cover ranking functionality including user points ranking, top users rankings,
 * level rankings, and station-specific rankings with error handling.
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import RankingSystem from '../../services/RankingSystem.jsx';
import UserManagement from '../../services/UserManagementSystem.jsx';
import FirestoreManager from '../../services/firebase/FirestoreManager.jsx';
import { HIGHSCORE_COLLECTION } from '../../services/firebase/Collections.jsx';

// Mock dependencies
vi.mock('../services/UserManagementSystem.jsx');
vi.mock('../services/firebase/FirestoreManager.jsx');

describe('RankingSystem', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        console.error = vi.fn();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('getUserPointsRank', () => {
        test('should return correct rank for user based on points', async () => {
            const mockUsers = [
                { uid: 'user-1', points: 100, level: 5 },
                { uid: 'user-2', points: 200, level: 7 },
                { uid: 'user-3', points: 150, level: 6 }
            ];

            vi.mocked(UserManagement.getAllActiveUsers).mockResolvedValue(mockUsers);

            const rank = await RankingSystem.getUserPointsRank('user-3');

            expect(rank).toBe(2); // user-3 should be 2nd (200, 150, 100)
        });

        test('should return 1 for top-ranked user', async () => {
            const mockUsers = [
                { uid: 'user-1', points: 100 },
                { uid: 'user-2', points: 300 },
                { uid: 'user-3', points: 200 }
            ];

            vi.mocked(UserManagement.getAllActiveUsers).mockResolvedValue(mockUsers);

            const rank = await RankingSystem.getUserPointsRank('user-2');

            expect(rank).toBe(1);
        });

        test('should return 0 when user not found', async () => {
            const mockUsers = [
                { uid: 'user-1', points: 100 },
                { uid: 'user-2', points: 200 }
            ];

            vi.mocked(UserManagement.getAllActiveUsers).mockResolvedValue(mockUsers);

            const rank = await RankingSystem.getUserPointsRank('non-existent-user');

            expect(rank).toBe(0);
        });

        test('should handle errors gracefully', async () => {
            const error = new Error('Database error');
            vi.mocked(UserManagement.getAllActiveUsers).mockRejectedValue(error);

            const rank = await RankingSystem.getUserPointsRank('user-1');

            expect(console.error).toHaveBeenCalledWith('Failed to get top workout rankings:', error);
            expect(rank).toEqual([]);
        });
    });

    describe('getTopUsersPointsRankings', () => {
        test('should return top users sorted by points with default limit', async () => {
            const mockUsers = [
                { uid: 'user-1', points: 100, displayName: 'User 1' },
                { uid: 'user-2', points: 300, displayName: 'User 2' },
                { uid: 'user-3', points: 200, displayName: 'User 3' },
                { uid: 'user-4', points: 50, displayName: 'User 4' }
            ];

            vi.mocked(UserManagement.getAllActiveUsers).mockResolvedValue(mockUsers);

            const rankings = await RankingSystem.getTopUsersPointsRankings();

            expect(rankings).toHaveLength(4);
            expect(rankings[0].uid).toBe('user-2'); // 300 points
            expect(rankings[1].uid).toBe('user-3'); // 200 points
            expect(rankings[2].uid).toBe('user-1'); // 100 points
            expect(rankings[3].uid).toBe('user-4'); // 50 points
        });

        test('should respect custom limit parameter', async () => {
            const mockUsers = Array.from({ length: 15 }, (_, i) => ({
                uid: `user-${i}`,
                points: 100 - i,
                displayName: `User ${i}`
            }));

            vi.mocked(UserManagement.getAllActiveUsers).mockResolvedValue(mockUsers);

            const rankings = await RankingSystem.getTopUsersPointsRankings(5);

            expect(rankings).toHaveLength(5);
            expect(rankings[0].points).toBe(100);
            expect(rankings[4].points).toBe(96);
        });

        test('should handle errors and return empty array', async () => {
            const error = new Error('Database error');
            vi.mocked(UserManagement.getAllActiveUsers).mockRejectedValue(error);

            const rankings = await RankingSystem.getTopUsersPointsRankings();

            expect(console.error).toHaveBeenCalledWith('Failed to get top workout rankings:', error);
            expect(rankings).toEqual([]);
        });
    });

    describe('getTopUsersLevelRankings', () => {
        test('should return top users sorted by level', async () => {
            const mockUsers = [
                { uid: 'user-1', level: 5, displayName: 'User 1' },
                { uid: 'user-2', level: 10, displayName: 'User 2' },
                { uid: 'user-3', level: 8, displayName: 'User 3' },
                { uid: 'user-4', level: 3, displayName: 'User 4' }
            ];

            vi.mocked(UserManagement.getAllActiveUsers).mockResolvedValue(mockUsers);

            const rankings = await RankingSystem.getTopUsersLevelRankings();

            expect(rankings).toHaveLength(4);
            expect(rankings[0].uid).toBe('user-2'); // level 10
            expect(rankings[1].uid).toBe('user-3'); // level 8
            expect(rankings[2].uid).toBe('user-1'); // level 5
            expect(rankings[3].uid).toBe('user-4'); // level 3
        });

        test('should respect custom limit parameter', async () => {
            const mockUsers = Array.from({ length: 12 }, (_, i) => ({
                uid: `user-${i}`,
                level: 20 - i,
                displayName: `User ${i}`
            }));

            vi.mocked(UserManagement.getAllActiveUsers).mockResolvedValue(mockUsers);

            const rankings = await RankingSystem.getTopUsersLevelRankings(3);

            expect(rankings).toHaveLength(3);
            expect(rankings[0].level).toBe(20);
            expect(rankings[2].level).toBe(18);
        });

        test('should handle errors and return empty array', async () => {
            const error = new Error('Database error');
            vi.mocked(UserManagement.getAllActiveUsers).mockRejectedValue(error);

            const rankings = await RankingSystem.getTopUsersLevelRankings();

            expect(console.error).toHaveBeenCalledWith('Failed to get top workout rankings:', error);
            expect(rankings).toEqual([]);
        });
    });

    describe('getStationRankings', () => {
        test('should return station rankings with aggregated user scores', async () => {
            const mockHighscores = [
                { userId: 'user-1', stationId: 'station-1', metric: 'points', score: 50 },
                { userId: 'user-2', stationId: 'station-1', metric: 'points', score: 80 },
                { userId: 'user-1', stationId: 'station-1', metric: 'points', score: 30 },
                { userId: 'user-3', stationId: 'station-1', metric: 'points', score: 60 }
            ];

            const mockSnapshot = {
                forEach: vi.fn((callback) => {
                    mockHighscores.forEach(score => {
                        callback({ data: () => score });
                    });
                })
            };

            const mockUsers = [
                { uid: 'user-1', displayName: 'User One', level: 5 },
                { uid: 'user-2', displayName: 'User Two', level: 7 },
                { uid: 'user-3', displayName: 'User Three', level: 6 }
            ];

            vi.mocked(FirestoreManager.queryDocumentsByFieldValue).mockResolvedValue(mockSnapshot);
            vi.mocked(UserManagement.getAllActiveUsers).mockResolvedValue(mockUsers);

            const rankings = await RankingSystem.getStationRankings('station-1');

            expect(FirestoreManager.queryDocumentsByFieldValue).toHaveBeenCalledWith(
                HIGHSCORE_COLLECTION,
                'stationId',
                'station-1'
            );
            
            expect(rankings).toHaveLength(3);
            expect(rankings[0]).toEqual({
                uid: 'user-1',
                displayName: 'User One',
                stationId: 'station-1',
                points: 80, // 50 + 30
                exerciseCount: 2,
                rank: 1,
                level: 5
            });
            expect(rankings[1].uid).toBe('user-2');
            expect(rankings[1].points).toBe(80);
            expect(rankings[2].uid).toBe('user-3');
            expect(rankings[2].points).toBe(60);
        });

        test('should filter only points metric scores', async () => {
            const mockHighscores = [
                { userId: 'user-1', stationId: 'station-1', metric: 'points', score: 50 },
                { userId: 'user-1', stationId: 'station-1', metric: 'time', score: 120 },
                { userId: 'user-2', stationId: 'station-1', metric: 'points', score: 80 }
            ];

            const mockSnapshot = {
                forEach: vi.fn((callback) => {
                    mockHighscores.forEach(score => {
                        callback({ data: () => score });
                    });
                })
            };

            const mockUsers = [
                { uid: 'user-1', displayName: 'User One', level: 5 },
                { uid: 'user-2', displayName: 'User Two', level: 7 }
            ];

            vi.mocked(FirestoreManager.queryDocumentsByFieldValue).mockResolvedValue(mockSnapshot);
            vi.mocked(UserManagement.getAllActiveUsers).mockResolvedValue(mockUsers);

            const rankings = await RankingSystem.getStationRankings('station-1');

            expect(rankings).toHaveLength(2);
            expect(rankings[0].points).toBe(80);
            expect(rankings[1].points).toBe(50);
        });

        test('should respect limit parameter', async () => {
            const mockHighscores = Array.from({ length: 15 }, (_, i) => ({
                userId: `user-${i}`,
                stationId: 'station-1',
                metric: 'points',
                score: 100 - i
            }));

            const mockSnapshot = {
                forEach: vi.fn((callback) => {
                    mockHighscores.forEach(score => {
                        callback({ data: () => score });
                    });
                })
            };

            const mockUsers = Array.from({ length: 15 }, (_, i) => ({
                uid: `user-${i}`,
                displayName: `User ${i}`,
                level: i + 1
            }));

            vi.mocked(FirestoreManager.queryDocumentsByFieldValue).mockResolvedValue(mockSnapshot);
            vi.mocked(UserManagement.getAllActiveUsers).mockResolvedValue(mockUsers);

            const rankings = await RankingSystem.getStationRankings('station-1', 5);

            expect(rankings).toHaveLength(5);
        });

        test('should handle unknown users gracefully', async () => {
            const mockHighscores = [
                { userId: 'unknown-user', stationId: 'station-1', metric: 'points', score: 50 }
            ];

            const mockSnapshot = {
                forEach: vi.fn((callback) => {
                    mockHighscores.forEach(score => {
                        callback({ data: () => score });
                    });
                })
            };

            vi.mocked(FirestoreManager.queryDocumentsByFieldValue).mockResolvedValue(mockSnapshot);
            vi.mocked(UserManagement.getAllActiveUsers).mockResolvedValue([]);

            const rankings = await RankingSystem.getStationRankings('station-1');

            expect(rankings).toHaveLength(1);
            expect(rankings[0].displayName).toBe('Unknown User');
            expect(rankings[0].level).toBe(0);
        });

        test('should handle errors and return empty array', async () => {
            const error = new Error('Database error');
            vi.mocked(FirestoreManager.queryDocumentsByFieldValue).mockRejectedValue(error);

            const rankings = await RankingSystem.getStationRankings('station-1');

            expect(console.error).toHaveBeenCalledWith('Failed to get station rankings:', error);
            expect(rankings).toEqual([]);
        });

        test('should return empty array when no highscores found', async () => {
            const mockSnapshot = {
                forEach: vi.fn()
            };

            vi.mocked(FirestoreManager.queryDocumentsByFieldValue).mockResolvedValue(mockSnapshot);
            vi.mocked(UserManagement.getAllActiveUsers).mockResolvedValue([]);

            const rankings = await RankingSystem.getStationRankings('station-1');

            expect(rankings).toEqual([]);
        });
    });
});
