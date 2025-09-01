import { v4 as uuidv4 } from 'uuid';
import FirebaseManager from './FirestoreManager';
import { serverTimestamp, Timestamp } from 'firebase/firestore';
import UserManagement from './UserManagementSystem';
import { UserGoal } from '../interfaces/goal';
import { GOALS_COLLECTION } from './collections';


/**
 * Creates a new user goal
 * @param {string} userId - ID of user creating the goal
 * @param {object} goalData - Goal details
 * @returns {Promise<UserGoal>} Created goal object
 * @throws {Error} If creation fails
 */
const createGoal = async (userId, goalData) => {
    try {
        const goalId = uuidv4();
        const goal = new UserGoal({
            goalId,
            userId,
            title: goalData.title,
            description: goalData.description || '',
            targetValue: goalData.targetValue,
            currentValue: 0,
            unit: goalData.unit,
            exerciseDefId: goalData.exerciseDefId || null,
            // Normalize deadline to Firestore Timestamp if provided
            deadline: goalData.deadline?.toDate ? goalData.deadline : (goalData.deadline ? Timestamp.fromDate(new Date(goalData.deadline)) : null),
            isCompleted: false,
            completedAt: null
        });

        if (!goal.validate()) {
            throw new Error('Invalid goal data provided');
        }

        await FirebaseManager.createDocument(GOALS_COLLECTION, goalId, goal.toJSON(), true);

        return await getGoal(goalId);
    } catch (error) {
        console.error('Failed to create goal:', error);
        throw error;
    }
};

/**
 * Retrieves a goal by ID
 * @param {string} goalId - ID of the goal
 * @returns {Promise<UserGoal|null>} Goal object or null if not found
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
 * Updates a goal's details
 * @param {string} goalId - ID of the goal
 * @param {string} userId - ID of user making the update
 * @param {object} updates - Fields to update
 * @returns {Promise<UserGoal>} Updated goal object
 * @throws {Error} If update fails or user doesn't have permission
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

        if (goal.isCompleted && updates.targetValue) {
            throw new Error('Cannot modify target value of completed goal');
        }

        // Normalize deadline if present in updates
        const normalized = { ...updates };
        if (normalized.deadline && !normalized.deadline?.toDate) {
            normalized.deadline = Timestamp.fromDate(new Date(normalized.deadline));
        }
        await FirebaseManager.updateDocument(GOALS_COLLECTION, goalId, normalized, true);

        return await getGoal(goalId);
    } catch (error) {
        console.error('Failed to update goal:', error);
        throw error;
    }
};

/**
 * Updates progress towards a goal
 * @param {string} goalId - ID of the goal
 * @param {string} userId - ID of the user
 * @param {number} progressValue - New progress value
 * @returns {Promise<UserGoal>} Updated goal object
 * @throws {Error} If update fails
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
                completedAt: serverTimestamp()
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
 * Awards points for completing a goal
 * @param {string} userId - ID of the user
 * @param {UserGoal} goal - Completed goal
 * @returns {Promise<void>}
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
 * Deletes a goal
 * @param {string} goalId - ID of the goal
 * @param {string} userId - ID of user deleting the goal
 * @returns {Promise<void>}
 * @throws {Error} If deletion fails or user doesn't have permission
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
 * Gets all goals for a user
 * @param {string} userId - ID of the user
 * @param {object} filters - Optional filters (isCompleted, exerciseDefId, etc.)
 * @returns {Promise<Array>} Array of goal objects
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

        if (filters.exerciseDefId) {
            goals = goals.filter(g => g.exerciseDefId === filters.exerciseDefId);
        }

        if (filters.isActive) {
            goals = goals.filter(g => !g.isCompleted && !g.isExpired());
        }

        return goals.sort((a, b) => {
            const aMs = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt).getTime();
            const bMs = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt).getTime();
            return bMs - aMs;
        });
    } catch (error) {
        console.error('Failed to get user goals:', error);
        return [];
    }
};

/**
 * Gets active goals for a user (not completed and not expired)
 * @param {string} userId - ID of the user
 * @returns {Promise<Array>} Array of active goal objects
 */
const getActiveGoals = async (userId) => {
    return await getUserGoals(userId, { isActive: true });
};

/**
 * Gets completed goals for a user
 * @param {string} userId - ID of the user
 * @returns {Promise<Array>} Array of completed goal objects
 */
const getCompletedGoals = async (userId) => {
    return await getUserGoals(userId, { isCompleted: true });
};

/**
 * Gets expired goals for a user
 * @param {string} userId - ID of the user
 * @returns {Promise<Array>} Array of expired goal objects
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
 * Gets goal statistics for a user
 * @param {string} userId - ID of the user
 * @returns {Promise<object>} Goal statistics
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
                const completedAtMs = goal.completedAt?.toDate ? goal.completedAt.toDate().getTime() : new Date(goal.completedAt).getTime();
                const createdAtMs = goal.createdAt?.toDate ? goal.createdAt.toDate().getTime() : new Date(goal.createdAt).getTime();
                return sum + (completedAtMs - createdAtMs);
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
 * Creates a goal from workout data automatically
 * @param {string} userId - ID of the user
 * @param {string} exerciseDefId - ID of the exercise
 * @param {number} currentBest - User's current best performance
 * @param {number} improvementPercentage - Percentage improvement target (default 10%)
 * @param {number} daysToComplete - Days to complete the goal (default 30)
 * @returns {Promise<UserGoal>} Created goal object
 */
const createGoalFromWorkout = async (userId, exerciseDefId, currentBest, improvementPercentage = 10, daysToComplete = 30) => {
    try {
        const targetValue = Math.ceil(currentBest * (1 + improvementPercentage / 100));
        // Default recommendation: 30 days from now unless overridden by daysToComplete
        const now = new Date();
        const deadlineDate = new Date(now.getTime() + daysToComplete * 24 * 60 * 60 * 1000);
        const deadline = Timestamp.fromDate(deadlineDate);

        const goalData = {
            title: `Improve Personal Best by ${improvementPercentage}%`,
            description: `Reach ${targetValue} from current best of ${currentBest}`,
            targetValue,
            exerciseDefId,
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
 * Updates goal progress from workout completion
 * @param {string} userId - ID of the user
 * @param {string} exerciseDefId - ID of the exercise
 * @param {number} performanceValue - Performance value from workout
 * @returns {Promise<Array>} Array of updated goals
 */
const updateGoalsFromWorkout = async (userId, exerciseDefId, performanceValue) => {
    try {
        const activeGoals = await getActiveGoals(userId);
        const relevantGoals = activeGoals.filter(goal =>
            goal.exerciseDefId === exerciseDefId && performanceValue > goal.currentValue
        );

        const updatedGoals = [];
        for (const goal of relevantGoals) {
            const updatedGoal = await updateGoalProgress(goal.goalId, userId, performanceValue);
            updatedGoals.push(updatedGoal);
        }

        return updatedGoals;
    } catch (error) {
        console.error('Failed to update goals from workout:', error);
        return [];
    }
};

/**
 * Gets goal recommendations for a user based on their workout history
 * @param {string} userId - ID of the user
 * @returns {Promise<Array>} Array of recommended goal objects
 */
const getGoalRecommendations = async (userId) => {
    try {
        const user = await UserManagement.getUser(userId);
        if (!user || !user.workouts || user.workouts.length === 0) {
            return [];
        }

        const recommendations = [];
        const exerciseStats = {};

        user.workouts.forEach(workout => {
            workout.exercises.forEach(exercise => {
                if (exercise.exerciseDefId) {
                    if (!exerciseStats[exercise.exerciseDefId]) {
                        exerciseStats[exercise.exerciseDefId] = {
                            count: 0,
                            bestScore: 0,
                            totalPoints: 0
                        };
                    }
                    exerciseStats[exercise.exerciseDefId].count++;
                    exerciseStats[exercise.exerciseDefId].bestScore = Math.max(
                        exerciseStats[exercise.exerciseDefId].bestScore,
                        exercise.points || 0
                    );
                    exerciseStats[exercise.exerciseDefId].totalPoints += exercise.points || 0;
                }
            });
        });

        for (const [exerciseDefId, stats] of Object.entries(exerciseStats)) {
            if (stats.count >= 3) {
                const activeGoals = await getActiveGoals(userId);
                const hasActiveGoal = activeGoals.some(goal => goal.exerciseDefId === exerciseDefId);

                if (!hasActiveGoal) {
                    recommendations.push({
                        exerciseDefId,
                        currentBest: stats.bestScore,
                        recommendedTarget: Math.ceil(stats.bestScore * 1.15),
                        workoutCount: stats.count,
                        avgPoints: Math.floor(stats.totalPoints / stats.count)
                    });
                }
            }
        }

        return recommendations.slice(0, 5);
    } catch (error) {
        console.error('Failed to get goal recommendations:', error);
        return [];
    }
};

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
    getGoalRecommendations,
}

export default GoalSystem