/**
 * @fileoverview Test suite for WorkoutManagement
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';

// Mock Firebase configuration first
vi.mock('../../services/firebase/FirebaseAppConfiguration', () => ({
    firebaseApp: {}
}));

// Mock Firebase/Firestore
vi.mock('firebase/firestore', () => ({
    getFirestore: vi.fn(() => ({})),
    doc: vi.fn(() => 'mock-doc-reference'),
    setDoc: vi.fn(),
    getDoc: vi.fn(),
    deleteDoc: vi.fn(),
    query: vi.fn(() => 'mock-query'),
    where: vi.fn(() => 'mock-where-clause'),
    collection: vi.fn(() => 'mock-collection'),
    getDocs: vi.fn(),
    serverTimestamp: vi.fn(() => ({ type: 'timestamp' })),
    Timestamp: {
        now: vi.fn(() => ({ type: 'timestamp' })),
        fromDate: vi.fn((date) => ({ type: 'timestamp', date })),
        toDate: vi.fn(() => new Date())
    },
    addDoc: vi.fn(),
    limit: vi.fn(() => 'mock-limit'),
}));

// Mock all services
vi.mock('../../services/firebase/FirestoreManager', () => ({
    default: {
        createDocument: vi.fn(),
        readDocument: vi.fn(),
        updateDocument: vi.fn(),
        deleteDocument: vi.fn(),
        getAllDocuments: vi.fn()
    }
}));

vi.mock('../../services/UserManagementSystem', () => ({
    default: {
        getUserDatabasePath: vi.fn((userId) => `users/${userId}/`),
        addPoints: vi.fn(),
        getAllActiveUsers: vi.fn()
    }
}));

vi.mock('../../services/ChallengeManagement', () => ({
    default: {
        getUserChallenges: vi.fn(),
        updateProgress: vi.fn()
    }
}));

vi.mock('../../services/GoalSystem', () => ({
    default: {
        updateGoalsFromWorkout: vi.fn()
    }
}));

vi.mock('../../services/HighscoreManager', () => ({
    default: {
        create: vi.fn()
    }
}));

vi.mock('../../services/RewardSystem', () => ({
    default: {
        awardBadges: vi.fn()
    }
}));

vi.mock('../../services/firebase/Collections', () => ({
    WORKOUT_COLLECTION: 'workouts/',
    EXERCISE_COLLECTION: 'exercises/'
}));

// Mock interfaces
vi.mock('../../services/interfaces/Workout', () => ({
    Workout: vi.fn().mockImplementation((data = {}) => ({
        uid: data.uid || 'mock-workout-id',
        userId: data.userId || 'mock-user-id',
        name: data.name || 'Mock Workout',
        description: data.description || 'Mock Description',
        exercises: data.exercises || [],
        recalculateProperties: vi.fn(),
        addExercise: vi.fn()
    }))
}));

vi.mock('../../services/interfaces/Exercise', () => {
    const ExerciseMock = vi.fn().mockImplementation((data = {}) => ({
        uid: data.uid || 'mock-exercise-id',
        userId: data.userId || 'mock-user-id',
        stationId: data.stationId,
        points: data.points || 0,
        calories: data.calories || 0
    }));
    
    ExerciseMock.fromJSON = vi.fn((data) => ({ ...data, fromJSON: true }));
    
    return {
        Exercise: ExerciseMock,
        fromJSON: vi.fn((data) => ({ ...data, fromJSON: true }))
    };
});

// Import WorkoutManagement after mocks
import WorkoutManagement from '../../services/WorkoutManagement';
import FirestoreManager from '../../services/firebase/FirestoreManager';
import UserManagement from '../../services/UserManagementSystem';
import ChallengeManagement from '../../services/ChallengeManagement';
import GoalSystem from '../../services/GoalSystem';
import HighscoreManager from '../../services/HighscoreManager';
import RewardSystem from '../../services/RewardSystem';
import { Workout } from '../../services/interfaces/Workout';
import { Exercise, fromJSON } from '../../services/interfaces/Exercise';

describe('WorkoutManagement', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        console.error = vi.fn();
        console.warn = vi.fn();

        // Set up default mock return values
        FirestoreManager.createDocument.mockResolvedValue({ id: 'new-doc-id' });
        FirestoreManager.readDocument.mockResolvedValue({
            uid: 'workout-123',
            userId: 'user-123',
            name: 'Test Workout'
        });
        FirestoreManager.updateDocument.mockResolvedValue('updated');
        FirestoreManager.deleteDocument.mockResolvedValue('deleted');
        FirestoreManager.getAllDocuments.mockResolvedValue({
            docs: [
                {
                    id: 'doc1',
                    data: () => ({ uid: 'workout-123', userId: 'user-123', name: 'Test Workout' })
                }
            ]
        });

        UserManagement.getAllActiveUsers.mockResolvedValue([
            { uid: 'user-1', displayName: 'User One', email: 'user1@test.com' },
            { uid: 'user-2', displayName: 'User Two', email: 'user2@test.com' }
        ]);

        ChallengeManagement.getUserChallenges.mockResolvedValue([
            { uid: 'challenge-1', name: 'Test Challenge' }
        ]);
    });

    describe('saveWorkout', () => {
        test('should save workout successfully', async () => {
            const mockWorkoutData = {
                userId: 'user-123',
                name: 'Test Workout',
                description: 'A test workout',
                exercises: [
                    { uid: 'exercise-1', points: 50 },
                    { uid: 'exercise-2', points: 30 }
                ]
            };

            const result = await WorkoutManagement.saveWorkout(mockWorkoutData);

            expect(Workout).toHaveBeenCalledWith(mockWorkoutData);
            expect(FirestoreManager.createDocument).toHaveBeenCalledTimes(3); // 1 workout + 2 exercises
            expect(result).toBe('new-doc-id');
        });

        test('should handle workout save failure', async () => {
            FirestoreManager.createDocument.mockResolvedValue(null);
            
            const mockWorkoutData = {
                userId: 'user-123',
                name: 'Test Workout'
            };

            await expect(WorkoutManagement.saveWorkout(mockWorkoutData))
                .rejects.toThrow('Could not save workout');
        });
    });

    describe('loadWorkouts', () => {
        test('should load all workouts for a user', async () => {
            const userId = 'user-123';
            
            const result = await WorkoutManagement.loadWorkouts(userId);

            expect(FirestoreManager.getAllDocuments).toHaveBeenCalledWith('users/user-123/workouts/');
            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
        });
    });

    describe('loadWorkoutById', () => {
        test('should load specific workout', async () => {
            const userId = 'user-123';
            const workoutId = 'workout-123';

            const result = await WorkoutManagement.loadWorkoutById(userId, workoutId);

            expect(FirestoreManager.readDocument).toHaveBeenCalledWith(
                'users/user-123/workouts/', 
                workoutId
            );
            expect(Workout).toHaveBeenCalled();
            expect(result).toBeDefined();
        });

        test('should throw error when workout not found', async () => {
            const userId = 'user-123';
            const workoutId = 'nonexistent-workout';
            FirestoreManager.readDocument.mockResolvedValue(null);

            await expect(WorkoutManagement.loadWorkoutById(userId, workoutId))
                .rejects.toThrow('Workout not found');
        });
    });

    describe('addExercise', () => {
        test('should add exercise successfully', async () => {
            const userId = 'user-123';
            const workoutId = 'workout-123';
            const exerciseData = {
                points: 50,
                stationId: 'station-123',
                calories: 100
            };

            const result = await WorkoutManagement.addExercise(userId, workoutId, exerciseData);

            expect(Exercise).toHaveBeenCalledWith(expect.objectContaining({
                ...exerciseData,
                userId
            }));
            expect(FirestoreManager.createDocument).toHaveBeenCalled();
            expect(UserManagement.addPoints).toHaveBeenCalledWith(userId, 50); // Exercise should return the points passed to it
            expect(RewardSystem.awardBadges).toHaveBeenCalledWith(userId);
            expect(result).toBe('mock-exercise-id');
        });
    });

    describe('updateExercise', () => {
        test('should update exercise', async () => {
            const userId = 'user-123';
            const workoutId = 'workout-123';
            const exerciseData = {
                uid: 'exercise-123',
                points: 75
            };

            // Mock old exercise data
            FirestoreManager.readDocument.mockResolvedValue({ points: 50 });

            await WorkoutManagement.updateExercise(userId, workoutId, exerciseData);

            expect(UserManagement.addPoints).toHaveBeenCalledWith(userId, -50); // Remove old points
            expect(FirestoreManager.updateDocument).toHaveBeenCalled();
            expect(UserManagement.addPoints).toHaveBeenCalledWith(userId, 75); // Add new points
        });
    });

    describe('deleteExercise', () => {
        test('should delete exercise', async () => {
            const userId = 'user-123';
            const workoutId = 'workout-123';
            const exerciseId = 'exercise-123';

            // Mock old exercise data
            FirestoreManager.readDocument.mockResolvedValue({ points: 50 });

            await WorkoutManagement.deleteExercise(userId, workoutId, exerciseId);

            expect(UserManagement.addPoints).toHaveBeenCalledWith(userId, -50); // Remove points
            expect(FirestoreManager.deleteDocument).toHaveBeenCalledWith(
                'users/user-123/workouts//workout-123/exercises/',
                exerciseId
            );
        });
    });
});
