import FirebaseManager from './FirestoreManager';
import UserManagement from './UserManagementSystem.jsx'


/**
 * Retrieves the top points rankings
 * @returns {Promise<object|null>} The ranking data for the users with highest points
 */
const getTopUsersPointsRankings = async (limit = 10) => {
    try {
        const users = await UserManagement.getAllUsers();
        users.sort((a, b) => b.points - a.points);
        return users.slice(0, limit);
    } catch (error) {
        console.error('Failed to get top workout rankings:', error);
        return [];
    }
};

/**
 * 
 * Retrieves the top level rankings
 * @returns {Promise<object|null>} The ranking data for the users with highest level
 */
const getTopUsersLevelRankings = async (limit = 10) => {
    try {
        const users = await UserManagement.getAllUsers();
        users.sort((a, b) => b.level - a.level);
        return users.slice(0, limit);
    } catch (error) {
        console.error('Failed to get top workout rankings:', error);
        return [];
    }
};

const RankingSystem = {
    getTopUsersPointsRankings,
    getTopUsersLevelRankings,
}

export default RankingSystem;