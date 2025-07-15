import FirebaseManager from './FirestoreManager';
import { RANKINGS_COLLECTION } from './collections.jsx'

const RANKING_LEVEL_ID = 'level';
const RANKING_POINTS_ID = 'points';

/**
 * Retrieves the ranking data for a specific user level
 * @param {string} userId - The ID of the user
 * @returns {Promise<object|null>} The ranking data for the user level
 */
export const getUserLevelRanking = async (userId) => {
    return getUserWorkoutRanking(userId, RANKING_LEVEL_ID);
};

/**
 * Retrieves the top level rankings
 * @returns {Promise<object|null>} The ranking data for the users with highest level
 */
export const getTopUsersLevelRankings = async (limit = 10) => {
   return getTopWorkoutRankings(RANKING_LEVEL_ID, limit);
};

/**
 * Retrieves the ranking data for a specific user by points
 * @param {string} userId - The ID of the user
 * @returns {Promise<object|null>} The ranking data for the user points
 */
export const getUserPointsRanking = async (userId) => {
    return getUserWorkoutRanking(userId, RANKING_POINTS_ID);
};

/**
 * Retrieves the top points rankings
 * @returns {Promise<object|null>} The ranking data for the users with highest points
 */
export const getTopUsersPointsRankings = async (limit = 10) => {
   return getTopWorkoutRankings(RANKING_POINTS_ID, limit);
};

/**
 * Retrieves the ranking data for a specific user and workout
 * @param {string} userId - The ID of the user
 * @param {string} workoutId - The ID of the workout
 * @returns {Promise<object|null>} The ranking data for the user and workout or null if not found
 */
export const getUserWorkoutRanking = async (userId, workoutId) => {
    try {
        const docId = `${userId}_${workoutId}`;
        const data = await FirebaseManager.readDocument(RANKINGS_COLLECTION, docId);
        return data ? data : null;
    } catch (error) {
        console.error('Failed to get user workout ranking:', error);
        return null;
    }
};

/**
 * Retrieves the top rankings for a specific workout
 * @param {string} workoutId - The ID of the workout
 * @param {number} limit - The number of top rankings to retrieve
 * @returns {Promise<Array<object>>} An array of top ranking data for the workout
 */
export const getTopWorkoutRankings = async (workoutId, limit = 10) => {
    try {
        const snapshot = await FirebaseManager.queryDocumentsByFieldValue(RANKINGS_COLLECTION, 'workoutId', workoutId);
        const rankings = [];
        snapshot.forEach(doc => rankings.push(doc.data()));
        rankings.sort((a, b) => b.score - a.score);
        return rankings.slice(0, limit);
    } catch (error) {
        console.error('Failed to get top workout rankings:', error);
        return [];
    }
};

/**
 * Updates the ranking data for a specific user level.
 * If the new level is higher than the previous, it updates the record.
 * @param {string} userId - The ID of the user
 * @param {number} level - The new level to consider for ranking
 * @returns {Promise<void>}
 */
export const updateUserLevelRanking = async (userId, level) => {
    return updateUserWorkoutRanking(userId, RANKING_LEVEL_ID, level);
};

/**
 * Updates the ranking data for a specific user points.
 * If the new points are higher than the previous, it updates the record.
 * @param {string} userId - The ID of the user
 * @param {number} points - The new points to consider for ranking
 * @returns {Promise<void>}
 */
export const updateUserPointsRanking = async (userId, points) => {
    return updateUserWorkoutRanking(userId, RANKING_POINTS_ID, points);
};

/**
 * Updates the ranking data for a specific user and workout.
 * If the new score is higher than the previous, it updates the record.
 * @param {string} userId - The ID of the user
 * @param {string} workoutId - The ID of the workout
 * @param {number} score - The new score to consider for ranking
 * @returns {Promise<void>}
 */
export const updateUserWorkoutRanking = async (userId, workoutId, score) => {
    try {
        const docId = `${userId}_${workoutId}`;
        const existing = await FirebaseManager.readDocument(RANKINGS_COLLECTION, docId);

        if (!existing || score > (existing.score || 0)) {
            const rankingData = {
                userId,
                workoutId,
                score,
            };
            await FirebaseManager.updateDocument(RANKINGS_COLLECTION, docId, rankingData, true);
        }
    } catch (error) {
        console.error('Failed to update user workout ranking:', error);
    }
};

/**
 * Removes a user's ranking entry for a specific workout
 * @param {string} userId - The ID of the user
 * @param {string} workoutId - The ID of the workout (or use RANKING_LEVEL_ID/RANKING_POINTS_ID)
 * @returns {Promise<void>}
 */
export const deleteUserWorkoutRanking = async (userId, workoutId) => {
    try {
        const docId = `${userId}_${workoutId}`;
        await FirebaseManager.deleteDocument(RANKINGS_COLLECTION, docId);
    } catch (error) {
        console.error('Failed to remove user ranking:', error);
    }
};
    
/**
 * Removes all ranking entries for a specific user (across all workouts, levels, and points).
 * @param {string} userId - The ID of the user
 * @returns {Promise<void>}
 */
export const deleteAllUserRankings = async (userId) => {
    try {
        const snapshot = await FirebaseManager.queryDocumentsByFieldValue(RANKINGS_COLLECTION, 'userId', userId);
        const batchDelete = [];
        snapshot.forEach(doc => {
            batchDelete.push(FirebaseManager.deleteDocument(RANKINGS_COLLECTION, doc.id));
        });
        await Promise.all(batchDelete);
    } catch (error) {
        console.error('Failed to remove all user rankings:', error);
    }
};