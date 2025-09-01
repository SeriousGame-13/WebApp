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

import FirebaseManager from './FirestoreManager';
import UserManagement from './UserManagementSystem.jsx'

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
        const userIndex = users.findIndex(user => user.uid === userid);
        return userIndex !== -1 ? userIndex + 1 : 0;
    } catch (error) {
        console.error('Failed to get user points rank:', error);
        return 0;
    }
};

/**
 * Retrieves the top users ranked by total points earned.
 * Returns a leaderboard of users sorted by their point totals in descending order.
 * @param {number} [limit=10] - The maximum number of top users to return
 * @returns {Promise<Object[]>} Array of user objects sorted by points (highest first), or empty array on error
 */
const getTopUsersPointsRankings = async (limit = 10) => {
    try {
        const users = await UserManagement.getAllActiveUsers();
        users.sort((a, b) => b.points - a.points);
        return users.slice(0, limit);
    } catch (error) {
        console.error('Failed to get top points rankings:', error);
        return [];
    }
};

/**
 * Retrieves the top users ranked by their level achievements.
 * Returns a leaderboard of users sorted by their level progress in descending order.
 * @param {number} [limit=10] - The maximum number of top users to return
 * @returns {Promise<Object[]>} Array of user objects sorted by level (highest first), or empty array on error
 */
const getTopUsersLevelRankings = async (limit = 10) => {
    try {
        const users = await UserManagement.getAllActiveUsers();
        users.sort((a, b) => b.level - a.level);
        return users.slice(0, limit);
    } catch (error) {
        console.error('Failed to get top level rankings:', error);
        return [];
    }
};

/**
 * @namespace RankingSystem
 * @description Firebase service module for user ranking and leaderboard functionality.
 * Provides methods to retrieve user rankings based on points and levels,
 * supporting leaderboard displays and competitive features in the fitness application.
 */
const RankingSystem = {
    getUserPointsRank,
    getTopUsersPointsRankings,
    getTopUsersLevelRankings,
}

export default RankingSystem;