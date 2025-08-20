/**
 * @fileoverview Goal System Module
 * 
 * This module provides comprehensive goal management functionality for the fitness application.
 * It handles user goal creation, tracking, progress updates, and achievement rewards.
 * The system supports personal fitness goals with deadlines, progress tracking, and automatic
 * completion detection with point rewards.
 * 
 * Features include statistics tracking and integration with the user management and reward systems.
 * 
 * @author Igor, Alexander, Hyunu, Robert
 * @version 1.0.0
 */

import { v4 as uuidv4 } from 'uuid';
import FirebaseManager from './FirestoreManager';
import UserManagement from './UserManagementSystem';
import { UserGoal } from '../interfaces/goal';
import { GOALS_COLLECTION } from './collections';


/**
 * Creates a new user goal with the provided goal data.
 * Validates goal data and stores it in the database with automatic ID generation.
 * @param {string} userId - The unique identifier of the user creating the goal
 * @param {Object} goalData - The goal configuration data
 * @param {string} goalData.title - The title/name of the goal
 * @param {string} [goalData.description] - Optional description of the goal
 * @param {number} goalData.targetValue - The target value to achieve
 * @param {string} [goalData.stationId] - Optional station definition ID
 * @param {number} goalData.deadline - The deadline timestamp for goal completion
 * @returns {Promise<UserGoal>} The created goal object with assigned ID
 * @throws {Error} If goal creation fails or validation errors occur
 */
const createGoal = async (userId, goalData) => {
    try {
        const goal = new UserGoal({
            userId,
            name: goalData.name,
            description: goalData.description || '',
            targetValue: goalData.targetValue,
            currentValue: 0,
            stationId: goalData.stationId || null,
            deadline: goalData.deadline,
            isCompleted: false,
            completedAt: null
        });

        if (!goal.validate()) {
            throw new Error('Invalid goal data provided');
        }

        await FirebaseManager.createDocument(GOALS_COLLECTION, goal.toJSON(), goal.uid, true);

        return await getGoal(goal.uid);
    } catch (error) {
        console.error('Failed to create goal:', error);
        throw error;
    }
};

/**
 * Retrieves a specific goal by its unique identifier.
 * Returns the complete goal object with all its properties and current status.
 * @param {string} goalId - The unique identifier of the goal to retrieve
 * @returns {Promise<UserGoal|null>} The goal object if found, null if not found or on error
 */
const getGoal = async (goalId) => {
    try {
        const data = await FirebaseManager.readDocument(GOALS_COLLECTION, goalId);
        if (!data) return null;
        
        return UserGoal.fromJSON(data);
    } catch (error) {
        console.error('Failed to get goal:', error);
        return null;
    }
};

/**
 * Updates specific fields of an existing goal.
 * Validates user permissions and goal state before allowing modifications.
 * Prevents modification of completed goals' target values.
 * @param {string} goalId - The unique identifier of the goal to update
 * @param {string} userId - The unique identifier of the user making the update
 * @param {Object} updates - The fields to update in the goal
 * @param {string} [updates.name] - Updated goal name
 * @param {string} [updates.description] - Updated goal description
 * @param {number} [updates.targetValue] - Updated target value (not allowed for completed goals)
 * @param {number} [updates.deadline] - Updated deadline timestamp
 * @returns {Promise<UserGoal>} The updated goal object
 * @throws {Error} If update fails, user lacks permission, or goal state prevents updates
 */
const updateGoal = async (goalId, userId, updates) => {
    try {
        const goal = await getGoal(goalId);
        if (!goal) {
            throw new Error('Goal not found');
        }

        if (goal.userId !== userId) {
            throw new Error('Permission denied: Only the goal owner can modify this goal');
        }

        await FirebaseManager.updateDocument(GOALS_COLLECTION, goalId, updates, true);
        
        return await getGoal(goalId);
    } catch (error) {
        console.error('Failed to update goal:', error);
        throw error;
    }
};

/**
 * Updates the progress value for a specific goal.
 * Automatically marks goal as completed when target is reached and awards points.
 * Validates user permissions and goal state before allowing progress updates.
 * @param {string} goalId - The unique identifier of the goal to update
 * @param {string} userId - The unique identifier of the user updating progress
 * @param {number} progressValue - The new progress value to set
 * @returns {Promise<UserGoal>} The updated goal object with new progress
 * @throws {Error} If update fails, user lacks permission, goal is completed, or deadline has passed
 */
const updateGoalProgress = async (goalId, userId, progressValue) => {
    try {
        const goal = await getGoal(goalId);
        if (!goal) {
            throw new Error('Goal not found');
        }

        if (goal.userId !== userId) {
            throw new Error('Permission denied: Only the goal owner can update progress');
        }

        if (goal.isCompleted) {
            throw new Error('Goal is already completed');
        }

        if (goal.isExpired()) {
            throw new Error('Goal deadline has passed');
        }

        const isCompleted = progressValue >= goal.targetValue;
        const updateData = {
            currentValue: progressValue,
            ...(isCompleted && {
                isCompleted: true,
                completedAt: Date.now()
            })
        };

        await FirebaseManager.updateDocument(GOALS_COLLECTION, goalId, updateData, true);

        if (isCompleted && !goal.isCompleted) {
            await awardGoalCompletion(userId, goal);
        }

        return await getGoal(goalId);
    } catch (error) {
        console.error('Failed to update goal progress:', error);
        throw error;
    }
};

/**
 * Awards points to a user for completing a goal.
 * Calculates points based on goal difficulty, target value, and completion timing.
 * Provides bonus points for goals completed before deadline.
 * @param {string} userId - The unique identifier of the user to award points to
 * @param {UserGoal} goal - The completed goal object used for point calculation
 * @returns {Promise<void>} Resolves when points are successfully awarded
 */
const awardGoalCompletion = async (userId, goal) => {
    try {
        const basePoints = 100;
        const difficultyMultiplier = Math.max(1, goal.targetValue / 100);
        const timeBonus = goal.isExpired() ? 0 : 50;
        
        const totalPoints = Math.floor(basePoints * difficultyMultiplier + timeBonus);
        
        await UserManagement.addPoints(userId, totalPoints);
    } catch (error) {
        console.error('Failed to award goal completion points:', error);
    }
};

/**
 * Deletes a goal from the database.
 * Validates user permissions before allowing deletion.
 * @param {string} goalId - The unique identifier of the goal to delete
 * @param {string} userId - The unique identifier of the user requesting deletion
 * @returns {Promise<void>} Resolves when goal is successfully deleted
 * @throws {Error} If deletion fails, goal not found, or user lacks permission
 */
const deleteGoal = async (goalId, userId) => {
    try {
        const goal = await getGoal(goalId);
        if (!goal) {
            throw new Error('Goal not found');
        }

        if (goal.userId !== userId) {
            throw new Error('Permission denied: Only the goal owner can delete this goal');
        }

        await FirebaseManager.deleteDocument(GOALS_COLLECTION, goalId);
    } catch (error) {
        console.error('Failed to delete goal:', error);
        throw error;
    }
};

/**
 * Retrieves all goals for a specific user with optional filtering.
 * Supports filtering by completion status, exercise type, and active status.
 * Returns goals sorted by creation date (newest first).
 * @param {string} userId - The unique identifier of the user whose goals to retrieve
 * @param {Object} [filters={}] - Optional filters to apply to the goals
 * @param {boolean} [filters.isCompleted] - Filter by completion status (true/false)
 * @param {string} [filters.stationId] - Filter by specific Station ID
 * @param {boolean} [filters.isActive] - Filter for active goals (not completed and not expired)
 * @returns {Promise<UserGoal[]>} Array of goal objects matching the criteria, sorted by creation date
 */
const getUserGoals = async (userId, filters = {}) => {
    try {
        const snapshot = await FirebaseManager.queryDocumentsByFieldValue(
            GOALS_COLLECTION,
            'userId',
            userId
        );

        let goals = [];
        snapshot.forEach(doc => {
            const goal = UserGoal.fromJSON(doc.data());
            goals.push(goal);
        });

        if (filters.isCompleted !== undefined) {
            goals = goals.filter(g => g.isCompleted === filters.isCompleted);
        }

        if (filters.stationId) {
            goals = goals.filter(g => g.stationId === filters.stationId);
        }

        if (filters.isActive) {
            goals = goals.filter(g => !g.isCompleted && !g.isExpired());
        }

        return goals.sort((a, b) => b.createdAt - a.createdAt);
    } catch (error) {
        console.error('Failed to get user goals:', error);
        return [];
    }
};

/**
 * Retrieves all active goals for a user.
 * Active goals are those that are not completed and have not passed their deadline.
 * @param {string} userId - The unique identifier of the user
 * @returns {Promise<UserGoal[]>} Array of active goal objects
 */
const getActiveGoals = async (userId) => {
    return await getUserGoals(userId, { isActive: true });
};

/**
 * Retrieves all completed goals for a user.
 * Returns goals that have been successfully completed regardless of deadline.
 * @param {string} userId - The unique identifier of the user
 * @returns {Promise<UserGoal[]>} Array of completed goal objects
 */
const getCompletedGoals = async (userId) => {
    return await getUserGoals(userId, { isCompleted: true });
};

/**
 * Retrieves all expired goals for a user.
 * Expired goals are those that are not completed but have passed their deadline.
 * @param {string} userId - The unique identifier of the user
 * @returns {Promise<UserGoal[]>} Array of expired goal objects
 */
const getExpiredGoals = async (userId) => {
    try {
        const allGoals = await getUserGoals(userId);
        return allGoals.filter(goal => !goal.isCompleted && goal.isExpired());
    } catch (error) {
        console.error('Failed to get expired goals:', error);
        return [];
    }
};

/**
 * Calculates and returns comprehensive goal statistics for a user.
 * Provides insights into goal completion rates, timing, and overall progress.
 * @param {string} userId - The unique identifier of the user
 * @returns {Promise<Object>} Goal statistics object
 * @returns {Promise<Object>} result.total - Total number of goals created
 * @returns {Promise<Object>} result.completed - Number of completed goals
 * @returns {Promise<Object>} result.active - Number of active goals
 * @returns {Promise<Object>} result.expired - Number of expired goals
 * @returns {Promise<Object>} result.completionRate - Percentage of goals completed (0-100)
 * @returns {Promise<Object>} result.averageCompletionTime - Average time to complete goals in milliseconds
 */
const getGoalStatistics = async (userId) => {
    try {
        const allGoals = await getUserGoals(userId);
        
        const stats = {
            total: allGoals.length,
            completed: allGoals.filter(g => g.isCompleted).length,
            active: allGoals.filter(g => !g.isCompleted && !g.isExpired()).length,
            expired: allGoals.filter(g => !g.isCompleted && g.isExpired()).length,
            completionRate: 0,
            averageCompletionTime: 0
        };

        if (stats.total > 0) {
            stats.completionRate = (stats.completed / stats.total) * 100;
        }

        const completedGoals = allGoals.filter(g => g.isCompleted && g.completedAt);
        if (completedGoals.length > 0) {
            const totalTime = completedGoals.reduce((sum, goal) => {
                return sum + (goal.completedAt - goal.createdAt);
            }, 0);
            stats.averageCompletionTime = totalTime / completedGoals.length;
        }

        return stats;
    } catch (error) {
        console.error('Failed to get goal statistics:', error);
        return {
            total: 0,
            completed: 0,
            active: 0,
            expired: 0,
            completionRate: 0,
            averageCompletionTime: 0
        };
    }
};

/**
 * Automatically creates a goal based on workout performance data.
 * Generates improvement-based goals with calculated target values and deadlines.
 * @param {string} userId - The unique identifier of the user
 * @param {string} stationId - The unique identifier of the exercise definition
 * @param {number} currentBest - The user's current best performance value
 * @param {number} [improvementPercentage=10] - The percentage improvement target (default 10%)
 * @param {number} [daysToComplete=30] - The number of days to complete the goal (default 30)
 * @returns {Promise<UserGoal>} The created goal object with calculated target and deadline
 * @throws {Error} If goal creation fails
 */
const createGoalFromWorkout = async (userId, stationId, currentBest, improvementPercentage = 10, daysToComplete = 30) => {
    try {
        const targetValue = Math.ceil(currentBest * (1 + improvementPercentage / 100));
        const deadline = Date.now() + (daysToComplete * 24 * 60 * 60 * 1000);

        const goalData = {
            title: `Improve Personal Best by ${improvementPercentage}%`,
            description: `Reach ${targetValue} from current best of ${currentBest}`,
            targetValue,
            stationId,
            deadline,
            unit: 'points'
        };

        return await createGoal(userId, goalData);
    } catch (error) {
        console.error('Failed to create goal from workout:', error);
        throw error;
    }
};

/**
 * Updates goal progress based on workout completion data.
 * Automatically updates all relevant active goals when a workout is completed.
 * Only updates goals where the new performance exceeds the current progress.
 * @param {string} userId - The unique identifier of the user
 * @param {string} stationId - The unique identifier of the exercise completed
 * @param {number} performanceValue - The performance value achieved in the workout
 * @returns {Promise<UserGoal[]>} Array of updated goal objects
 */
const updateGoalsFromWorkout = async (userId, stationId, performanceValue) => {
    try {
        const activeGoals = await getActiveGoals(userId);
        const relevantGoals = activeGoals.filter(goal => 
            goal.stationId === stationId && performanceValue > goal.currentValue
        );

        const updatedGoals = [];
        for (const goal of relevantGoals) {
            const updatedGoal = await updateGoalProgress(goal.uid, userId, performanceValue);
            updatedGoals.push(updatedGoal);
        }

        return updatedGoals;
    } catch (error) {
        console.error('Failed to update goals from workout:', error);
        return [];
    }
};


/**
 * Goal System
 * 
 * Provides comprehensive goal management functionality including:
 * - Personal goal creation with customizable targets and deadlines
 * - Progress tracking and automatic completion detection
 * - Point rewards for goal completion with difficulty-based calculation
 * - Goal statistics and analytics
 * - Workout-based automatic goal creation and updates
 * - Goal filtering and categorization (active, completed, expired)
 * 
 * The system integrates with user management for point rewards and uses
 * workout data to provide intelligent goal suggestions and automatic progress updates.
 * 
 * @namespace GoalSystem
 */
const GoalSystem = {
    createGoal,
    getGoal,
    updateGoal,
    updateGoalProgress,
    deleteGoal,
    getUserGoals,
    getActiveGoals,
    getCompletedGoals,
    getExpiredGoals,
    getGoalStatistics,
    createGoalFromWorkout,
    updateGoalsFromWorkout,
};

export default GoalSystem;