/**
 * @fileoverview Ranking System Module
 * 
 * This module provides ranking and leaderboard functionality for the fitness application.
 * It handles user rankings based on different metrics including points and levels.
 * The system retrieves user data and provides sorted rankings for competitive features.
 * 
 * Rankings are calculated in real-time from user data and support configurable limits
 * for leaderboard displays and individual rank lookups.
 * 
 * @author Igor, Alexander, Hyunu, Robert
 * @version 1.0.0
 */

import UserManagement from './UserManagementSystem.jsx'
import StationManager from './StationManagement.jsx';
import { HIGHSCORE_COLLECTION } from './collections.jsx';
import FirestoreManager from './FirestoreManager.jsx';

/**
 * Retrieves the points ranking position for a specific user.
 * Calculates the user's rank among all active users based on total points earned.
 * @param {string} userid - The unique identifier of the user to get the ranking for
 * @returns {Promise<number>} The user's ranking position (1-based) based on points, or 0 if user not found
 */
const getUserPointsRank = async (userid) => {
    try {
        const users = await UserManagement.getAllActiveUsers();
        users.sort((a, b) => b.points - a.points);
        return users.findIndex(user => user.uid === userid) + 1;
        return users.findIndex(user => user.uid === userid) + 1;
    } catch (error) {
        console.error('Failed to get top workout rankings:', error);
        return [];
        console.error('Failed to get top workout rankings:', error);
        return [];
    }
};





/**
 * Retrieves the top points rankings
 * @returns {Promise<object|null>} The ranking data for the users with highest points
 * Retrieves the top points rankings
 * @returns {Promise<object|null>} The ranking data for the users with highest points
 */
const getTopUsersPointsRankings = async (limit = 10) => {
    try {
        const users = await UserManagement.getAllActiveUsers();
        users.sort((a, b) => b.points - a.points);
        return users.slice(0, limit);
    } catch (error) {
        console.error('Failed to get top workout rankings:', error);
        console.error('Failed to get top workout rankings:', error);
        return [];
    }
};

/**
 * 
 * Retrieves the top level rankings
 * @returns {Promise<object|null>} The ranking data for the users with highest level
 * 
 * Retrieves the top level rankings
 * @returns {Promise<object|null>} The ranking data for the users with highest level
 */
const getTopUsersLevelRankings = async (limit = 10) => {
    try {
        const users = await UserManagement.getAllActiveUsers();
        users.sort((a, b) => b.level - a.level);
        return users.slice(0, limit);
    } catch (error) {
        console.error('Failed to get top workout rankings:', error);
        return [];
    }
};


/**
 * Retrieves the top users ranked by their performance at a specific station.
 * Returns a leaderboard of users sorted by their points at the specified station.
 * @param {string} stationId - The ID of the station to get rankings for
 * @param {number} [limit=10] - The maximum number of top users to return
 * @returns {Promise<Object[]>} Array of highscore objects with user information
 */
const getStationRankings = async (stationId, limit = 10) => {
    try {
        // Get all highscores for this station
        const snapshot = await FirestoreManager.queryDocumentsByFieldValue(HIGHSCORE_COLLECTION, 'stationId', stationId);

        // Filter only points metric and group by user
        const userScores = {};
        
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.metric === 'points') {
                const userId = data.userId;
                
                // Initialize user entry if it doesn't exist
                if (!userScores[userId]) {
                    userScores[userId] = {
                        userId: userId,
                        points: 0,
                        exerciseCount: 0
                    };
                }
                
                // Add this score to the user's total
                userScores[userId].points += data.score;
                userScores[userId].exerciseCount += 1;
            }
        });
        
        // Convert to array and sort by total points
        const rankedUsers = Object.values(userScores)
            .sort((a, b) => b.points - a.points)
            .slice(0, limit);
        
        // Get user details to add display names
        const users = await UserManagement.getAllActiveUsers();
        const userMap = {};
        users.forEach(user => {
            userMap[user.uid] = user;
        });
        
        // Map to final format expected by the UI
        return rankedUsers.map((score, index) => ({
            uid: score.userId,
            displayName: userMap[score.userId]?.displayName || 'Unknown User',
            stationId: stationId,
            points: score.points,
            exerciseCount: score.exerciseCount,
            rank: index + 1,
            level: userMap[score.userId]?.level || 0
        }));
    } catch (error) {
        console.error('Failed to get station rankings:', error);
        return [];
    }
};

const RankingSystem = {
    getUserPointsRank,
    getTopUsersPointsRankings,
    getTopUsersLevelRankings,
    getStationRankings,
}

export default RankingSystem;