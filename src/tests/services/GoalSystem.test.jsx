/**
 * @fileoverview Unit tests for GoalSystem service
 * 
 * Tests cover goal CRUD operations, progress tracking, completion rewards,
 * statistics calculation, and workout-based goal management.
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import GoalSystem from '../../services/GoalSystem.jsx';
import FirestoreManager from '../../services/firebase/FirestoreManager.jsx';
import UserManagement from '../../services/UserManagementSystem.jsx';
import { UserGoal } from '../../services/interfaces/Goal.jsx';
import { GOALS_COLLECTION } from '../../services/firebase/Collections.jsx';
import { serverTimestamp } from '../../services/firebase/FirebaseHelper.jsx';

// Mock dependencies
vi.mock('../services/firebase/FirestoreManager.jsx');
vi.mock('../services/UserManagementSystem.jsx');
vi.mock('../services/interfaces/Goal.jsx');
vi.mock('../services/firebase/FirebaseHelper.jsx');

describe('GoalSystem', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        console.error = vi.fn();
        
        // Mock serverTimestamp
        vi.mocked(serverTimestamp).mockReturnValue(1234567890000);
        
        // Mock UserGoal constructor and methods
        vi.mocked(UserGoal).mockImplementation((data) => ({
            ...data,
            uid: `goal-${Math.random()}`,
            validate: vi.fn(() => true),
            toJSON: vi.fn(() => data),
            isExpired: vi.fn(() => false)
        }));
        
        UserGoal.fromJSON = vi.fn((data) => ({
            ...data,
            isExpired: vi.fn(() => false)
        }));
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('createGoal', () => {
        test('should create a new goal successfully', async () => {
            const userId = 'user-1';
            const goalData = {
                name: 'Test Goal',
                description: 'Test description',
                targetValue: 100,
                stationId: 'station-1',
                deadline: 1234567890000
            };

            const mockGoal = {
                uid: 'goal-123',
                userId,
                ...goalData,
                currentValue: 0,
                isCompleted: false,
                completedAt: null,
                validate: vi.fn(() => true),
                toJSON: vi.fn(() => ({ ...goalData, userId }))
            };

            vi.mocked(UserGoal).mockReturnValue(mockGoal);
            vi.mocked(FirestoreManager.createDocument).mockResolvedValue({ id: 'goal-123' });
            vi.mocked(FirestoreManager.readDocument).mockResolvedValue(mockGoal);
            vi.mocked(UserGoal.fromJSON).mockReturnValue(mockGoal);

            const result = await GoalSystem.createGoal(userId, goalData);

            expect(UserGoal).toHaveBeenCalledWith(expect.objectContaining({
                userId,
                name: goalData.name,
                targetValue: goalData.targetValue
            }));
            expect(FirestoreManager.createDocument).toHaveBeenCalledWith(
                GOALS_COLLECTION,
                expect.any(Object),
                mockGoal.uid,
                true
            );
            expect(result).toEqual(mockGoal);
        });

        test('should throw error when goal validation fails', async () => {
            const goalData = { name: 'Invalid Goal' };
            const mockGoal = {
                validate: vi.fn(() => false)
            };

            vi.mocked(UserGoal).mockReturnValue(mockGoal);

            await expect(GoalSystem.createGoal('user-1', goalData))
                .rejects.toThrow('Invalid goal data provided');
        });

        test('should handle database errors during creation', async () => {
            const goalData = { name: 'Test Goal', targetValue: 100 };
            const mockGoal = { validate: vi.fn(() => true), toJSON: vi.fn(() => ({})) };
            const dbError = new Error('Database error');

            vi.mocked(UserGoal).mockReturnValue(mockGoal);
            vi.mocked(FirestoreManager.createDocument).mockRejectedValue(dbError);

            await expect(GoalSystem.createGoal('user-1', goalData))
                .rejects.toThrow('Database error');

            expect(console.error).toHaveBeenCalledWith('Failed to create goal:', dbError);
        });
    });

    describe('getGoal', () => {
        test('should retrieve goal by ID successfully', async () => {
            const goalId = 'goal-123';
            const mockData = { uid: goalId, name: 'Test Goal' };
            const mockGoal = { ...mockData };

            vi.mocked(FirestoreManager.readDocument).mockResolvedValue(mockData);
            vi.mocked(UserGoal.fromJSON).mockReturnValue(mockGoal);

            const result = await GoalSystem.getGoal(goalId);

            expect(FirestoreManager.readDocument).toHaveBeenCalledWith(GOALS_COLLECTION, goalId);
            expect(UserGoal.fromJSON).toHaveBeenCalledWith(mockData);
            expect(result).toEqual(mockGoal);
        });

        test('should return null when goal not found', async () => {
            vi.mocked(FirestoreManager.readDocument).mockResolvedValue(null);

            const result = await GoalSystem.getGoal('nonexistent-goal');

            expect(result).toBeNull();
        });

        test('should handle database errors gracefully', async () => {
            const dbError = new Error('Database error');
            vi.mocked(FirestoreManager.readDocument).mockRejectedValue(dbError);

            const result = await GoalSystem.getGoal('error-goal');

            expect(console.error).toHaveBeenCalledWith('Failed to get goal:', dbError);
            expect(result).toBeNull();
        });
    });

    describe('updateGoal', () => {
        test('should update goal successfully when user is owner', async () => {
            const goalId = 'goal-123';
            const userId = 'user-1';
            const updates = { name: 'Updated Goal', description: 'Updated description' };
            const mockGoal = { uid: goalId, userId, name: 'Original Goal' };
            const mockUpdatedGoal = { ...mockGoal, ...updates };

            vi.mocked(FirestoreManager.readDocument)
                .mockResolvedValueOnce(mockGoal)
                .mockResolvedValueOnce(mockUpdatedGoal);
            vi.mocked(UserGoal.fromJSON)
                .mockReturnValueOnce(mockGoal)
                .mockReturnValueOnce(mockUpdatedGoal);
            vi.mocked(FirestoreManager.updateDocument).mockResolvedValue({});

            const result = await GoalSystem.updateGoal(goalId, userId, updates);

            expect(FirestoreManager.updateDocument).toHaveBeenCalledWith(
                GOALS_COLLECTION,
                goalId,
                updates,
                true
            );
            expect(result).toEqual(mockUpdatedGoal);
        });

        test('should throw error when goal not found', async () => {
            vi.mocked(FirestoreManager.readDocument).mockResolvedValue(null);
            vi.mocked(UserGoal.fromJSON).mockReturnValue(null);

            await expect(GoalSystem.updateGoal('nonexistent', 'user-1', {}))
                .rejects.toThrow('Goal not found');
        });

        test('should throw error when user is not goal owner', async () => {
            const mockGoal = { uid: 'goal-123', userId: 'user-1' };
            vi.mocked(FirestoreManager.readDocument).mockResolvedValue(mockGoal);
            vi.mocked(UserGoal.fromJSON).mockReturnValue(mockGoal);

            await expect(GoalSystem.updateGoal('goal-123', 'user-2', {}))
                .rejects.toThrow('Permission denied: Only the goal owner can modify this goal');
        });
    });

    describe('updateGoalProgress', () => {
        test('should update progress and mark as completed when target reached', async () => {
            const goalId = 'goal-123';
            const userId = 'user-1';
            const progressValue = 100;
            const mockGoal = {
                uid: goalId,
                userId,
                targetValue: 100,
                currentValue: 50,
                isCompleted: false,
                isExpired: vi.fn(() => false)
            };

            vi.mocked(FirestoreManager.readDocument)
                .mockResolvedValueOnce(mockGoal)
                .mockResolvedValueOnce({ ...mockGoal, currentValue: 100, isCompleted: true });
            vi.mocked(UserGoal.fromJSON)
                .mockReturnValueOnce(mockGoal)
                .mockReturnValueOnce({ ...mockGoal, isCompleted: true });
            vi.mocked(FirestoreManager.updateDocument).mockResolvedValue({});
            vi.mocked(UserManagement.addPoints).mockResolvedValue();

            const result = await GoalSystem.updateGoalProgress(goalId, userId, progressValue);

            expect(FirestoreManager.updateDocument).toHaveBeenCalledWith(
                GOALS_COLLECTION,
                goalId,
                {
                    currentValue: progressValue,
                    isCompleted: true,
                    completedAt: expect.any(Number)
                },
                true
            );
            expect(UserManagement.addPoints).toHaveBeenCalledWith(userId, expect.any(Number));
        });

        test('should throw error when goal is already completed', async () => {
            const mockGoal = {
                uid: 'goal-123',
                userId: 'user-1',
                isCompleted: true,
                isExpired: vi.fn(() => false)
            };

            vi.mocked(FirestoreManager.readDocument).mockResolvedValue(mockGoal);
            vi.mocked(UserGoal.fromJSON).mockReturnValue(mockGoal);

            await expect(GoalSystem.updateGoalProgress('goal-123', 'user-1', 50))
                .rejects.toThrow('Goal is already completed');
        });

        test('should throw error when goal deadline has passed', async () => {
            const mockGoal = {
                uid: 'goal-123',
                userId: 'user-1',
                isCompleted: false,
                isExpired: vi.fn(() => true)
            };

            vi.mocked(FirestoreManager.readDocument).mockResolvedValue(mockGoal);
            vi.mocked(UserGoal.fromJSON).mockReturnValue(mockGoal);

            await expect(GoalSystem.updateGoalProgress('goal-123', 'user-1', 50))
                .rejects.toThrow('Goal deadline has passed');
        });

        test('should throw error when user is not goal owner', async () => {
            const mockGoal = {
                uid: 'goal-123',
                userId: 'user-1',
                isCompleted: false,
                isExpired: vi.fn(() => false)
            };

            vi.mocked(FirestoreManager.readDocument).mockResolvedValue(mockGoal);
            vi.mocked(UserGoal.fromJSON).mockReturnValue(mockGoal);

            await expect(GoalSystem.updateGoalProgress('goal-123', 'user-2', 50))
                .rejects.toThrow('Permission denied: Only the goal owner can update progress');
        });
    });

    describe('deleteGoal', () => {
        test('should delete goal successfully when user is owner', async () => {
            const goalId = 'goal-123';
            const userId = 'user-1';
            const mockGoal = { uid: goalId, userId };

            vi.mocked(FirestoreManager.readDocument).mockResolvedValue(mockGoal);
            vi.mocked(UserGoal.fromJSON).mockReturnValue(mockGoal);
            vi.mocked(FirestoreManager.deleteDocument).mockResolvedValue({});

            await GoalSystem.deleteGoal(goalId, userId);

            expect(FirestoreManager.deleteDocument).toHaveBeenCalledWith(GOALS_COLLECTION, goalId);
        });

        test('should throw error when goal not found', async () => {
            vi.mocked(FirestoreManager.readDocument).mockResolvedValue(null);
            vi.mocked(UserGoal.fromJSON).mockReturnValue(null);

            await expect(GoalSystem.deleteGoal('nonexistent', 'user-1'))
                .rejects.toThrow('Goal not found');
        });

        test('should throw error when user is not goal owner', async () => {
            const mockGoal = { uid: 'goal-123', userId: 'user-1' };
            vi.mocked(FirestoreManager.readDocument).mockResolvedValue(mockGoal);
            vi.mocked(UserGoal.fromJSON).mockReturnValue(mockGoal);

            await expect(GoalSystem.deleteGoal('goal-123', 'user-2'))
                .rejects.toThrow('Permission denied: Only the goal owner can delete this goal');
        });
    });

    describe('getUserGoals', () => {
        test('should retrieve and filter user goals', async () => {
            const userId = 'user-1';
            const mockGoals = [
                { uid: 'goal-1', isCompleted: true, stationId: 'station-1', createdAt: 3 },
                { uid: 'goal-2', isCompleted: false, stationId: 'station-2', createdAt: 2 },
                { uid: 'goal-3', isCompleted: false, stationId: 'station-1', createdAt: 1 }
            ];

            const mockSnapshot = {
                forEach: vi.fn((callback) => {
                    mockGoals.forEach(goal => {
                        callback({ data: () => goal });
                    });
                })
            };

            vi.mocked(FirestoreManager.queryDocumentsByFieldValue).mockResolvedValue(mockSnapshot);
            vi.mocked(UserGoal.fromJSON).mockImplementation((data) => data);

            const result = await GoalSystem.getUserGoals(userId, { isCompleted: false });

            expect(FirestoreManager.queryDocumentsByFieldValue).toHaveBeenCalledWith(
                GOALS_COLLECTION,
                'userId',
                userId
            );
            expect(result).toHaveLength(2);
            expect(result[0].uid).toBe('goal-2'); // Sorted by createdAt desc
        });

        test('should filter by stationId', async () => {
            const mockGoals = [
                { uid: 'goal-1', stationId: 'station-1', createdAt: 1 },
                { uid: 'goal-2', stationId: 'station-2', createdAt: 2 }
            ];

            const mockSnapshot = {
                forEach: vi.fn((callback) => {
                    mockGoals.forEach(goal => {
                        callback({ data: () => goal });
                    });
                })
            };

            vi.mocked(FirestoreManager.queryDocumentsByFieldValue).mockResolvedValue(mockSnapshot);
            vi.mocked(UserGoal.fromJSON).mockImplementation((data) => data);

            const result = await GoalSystem.getUserGoals('user-1', { stationId: 'station-1' });

            expect(result).toHaveLength(1);
            expect(result[0].uid).toBe('goal-1');
        });

        test('should filter active goals', async () => {
            const mockGoals = [
                { uid: 'goal-1', isCompleted: false, isExpired: () => false },
                { uid: 'goal-2', isCompleted: true, isExpired: () => false },
                { uid: 'goal-3', isCompleted: false, isExpired: () => true }
            ];

            const mockSnapshot = {
                forEach: vi.fn((callback) => {
                    mockGoals.forEach(goal => {
                        callback({ data: () => goal });
                    });
                })
            };

            vi.mocked(FirestoreManager.queryDocumentsByFieldValue).mockResolvedValue(mockSnapshot);
            vi.mocked(UserGoal.fromJSON).mockImplementation((data) => ({
                ...data,
                isExpired: data.isExpired
            }));

            const result = await GoalSystem.getUserGoals('user-1', { isActive: true });

            expect(result).toHaveLength(1);
            expect(result[0].uid).toBe('goal-1');
        });

        test('should handle database errors gracefully', async () => {
            const dbError = new Error('Database error');
            vi.mocked(FirestoreManager.queryDocumentsByFieldValue).mockRejectedValue(dbError);

            const result = await GoalSystem.getUserGoals('user-1');

            expect(console.error).toHaveBeenCalledWith('Failed to get user goals:', dbError);
            expect(result).toEqual([]);
        });
    });

    describe('getGoalStatistics', () => {
        test('should calculate goal statistics correctly', async () => {
            const mockGoals = [
                { isCompleted: true, isExpired: () => false, createdAt: 1000, completedAt: 2000 },
                { isCompleted: true, isExpired: () => false, createdAt: 1500, completedAt: 2500 },
                { isCompleted: false, isExpired: () => false },
                { isCompleted: false, isExpired: () => true }
            ];

            const mockSnapshot = {
                forEach: vi.fn((callback) => {
                    mockGoals.forEach(goal => {
                        callback({ data: () => goal });
                    });
                })
            };

            vi.mocked(FirestoreManager.queryDocumentsByFieldValue).mockResolvedValue(mockSnapshot);
            vi.mocked(UserGoal.fromJSON).mockImplementation((data) => ({
                ...data,
                isExpired: data.isExpired
            }));

            const result = await GoalSystem.getGoalStatistics('user-1');

            expect(result.total).toBe(4);
            expect(result.completed).toBe(2);
            expect(result.active).toBe(1);
            expect(result.expired).toBe(1);
            expect(result.completionRate).toBe(50);
            expect(result.averageCompletionTime).toBe(1000); // (1000 + 1000) / 2
        });

        test('should handle empty goals list', async () => {
            const mockSnapshot = { forEach: vi.fn() };
            vi.mocked(FirestoreManager.queryDocumentsByFieldValue).mockResolvedValue(mockSnapshot);

            const result = await GoalSystem.getGoalStatistics('user-1');

            expect(result.total).toBe(0);
            expect(result.completionRate).toBe(0);
            expect(result.averageCompletionTime).toBe(0);
        });
    });

    describe('createGoalFromWorkout', () => {
        test('should create goal based on workout performance', async () => {
            const userId = 'user-1';
            const stationId = 'station-1';
            const currentBest = 100;
            const improvementPercentage = 20;
            const daysToComplete = 15;

            const mockGoal = { uid: 'workout-goal' };
            vi.mocked(UserGoal).mockReturnValue({
                validate: vi.fn(() => true),
                toJSON: vi.fn(() => ({})),
                uid: 'workout-goal'
            });
            vi.mocked(FirestoreManager.createDocument).mockResolvedValue({ id: 'workout-goal' });
            vi.mocked(FirestoreManager.readDocument).mockResolvedValue(mockGoal);
            vi.mocked(UserGoal.fromJSON).mockReturnValue(mockGoal);

            const result = await GoalSystem.createGoalFromWorkout(
                userId,
                stationId,
                currentBest,
                improvementPercentage,
                daysToComplete
            );

            expect(UserGoal).toHaveBeenCalledWith(expect.objectContaining({
                userId,
                targetValue: 120, // 100 * (1 + 20/100)
                stationId
            }));
            expect(result).toEqual(mockGoal);
        });
    });

    describe('updateGoalsFromWorkout', () => {
        test('should update relevant goals based on workout performance', async () => {
            const userId = 'user-1';
            const stationId = 'station-1';
            const performanceValue = 150;

            const mockGoals = [
                { uid: 'goal-1', stationId: 'station-1', currentValue: 100 },
                { uid: 'goal-2', stationId: 'station-2', currentValue: 120 },
                { uid: 'goal-3', stationId: 'station-1', currentValue: 160 }
            ];

            const mockSnapshot = {
                forEach: vi.fn((callback) => {
                    mockGoals.forEach(goal => {
                        callback({ data: () => goal });
                    });
                })
            };

            vi.mocked(FirestoreManager.queryDocumentsByFieldValue).mockResolvedValue(mockSnapshot);
            vi.mocked(UserGoal.fromJSON).mockImplementation((data) => ({
                ...data,
                isExpired: () => false
            }));

            // Mock the updateGoalProgress calls
            const updatedGoal = { uid: 'goal-1', currentValue: 150 };
            vi.mocked(FirestoreManager.readDocument)
                .mockResolvedValue({ ...mockGoals[0], userId, isCompleted: false });
            vi.mocked(FirestoreManager.updateDocument).mockResolvedValue({});

            // Only goal-1 should be updated (station matches and performance > current)
            const result = await GoalSystem.updateGoalsFromWorkout(userId, stationId, performanceValue);

            expect(result).toHaveLength(1);
        });

        test('should handle errors gracefully', async () => {
            const dbError = new Error('Database error');
            vi.mocked(FirestoreManager.queryDocumentsByFieldValue).mockRejectedValue(dbError);

            const result = await GoalSystem.updateGoalsFromWorkout('user-1', 'station-1', 100);

            expect(console.error).toHaveBeenCalledWith('Failed to get user goals:', dbError);
            expect(result).toEqual([]);
        });
    });
});
