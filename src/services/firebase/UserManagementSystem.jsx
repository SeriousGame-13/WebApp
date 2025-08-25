/**
 * @fileoverview User Management System Service
 * 
 * This module provides comprehensive user management functionality for the fitness application.
 * It handles user authentication, profile management, friendship systems, blocking functionality,
 * and user data operations using Firebase Authentication and Firestore as the backend.
 * The system supports user registration, login, profile updates, social features, and administrative operations.
 * 
 * @author Igor, Alexander, Hyunu, Robert
 * @version 1.0.0
 */

import FirebaseManager from './FirestoreManager';
import FireAuthManager from './FirebaseAuthenticationManager';
import WorkoutManager from './WorkoutManagement.jsx';
import User from '../interfaces/user.jsx';
import { Workout } from '../interfaces/workout.jsx';
import { USERS_COLLECTION, FRIENDS_COLLECTION, BLOCKS_COLLECTION, BADGES_USER_COLLECTION, BADGES_COLLECTION } from './collections.jsx'
import { UserBadge } from '../interfaces/badge.jsx';
import FirestoreManager from './FirestoreManager';
import BadgeManagement from './BadgeManagement.jsx';


/**
 * Authenticates a user with email and password
 * @param {string} email - User's email address
 * @param {string} password - User's password
 * @returns {Promise<object>} Firebase user object
 * @throws {Error} If authentication fails
 */
const loginUser = async (email, password) => {
    const userCredential = await FireAuthManager.signInUser(email, password);
    return userCredential.user;
};

/**
 * Retrieves a user's data from Firestore including their workout history.
 * Converts raw Firestore data to User instances with full validation.
 * @param {string} uid - User ID to retrieve data for
 * @returns {Promise<User|null>} User data object or null if not found/invalid
 */
const getUser = async (uid) => {
    try {
        const data = await FirebaseManager.readDocument(USERS_COLLECTION, uid);

        if (!data) return null;

        const userWorkouts = await WorkoutManager.loadWorkouts(uid);
        data.workouts = userWorkouts.map(entry => (Workout.fromJSON(entry)));
        if (!data) return null;

        const user = User.fromJSON(data);
        return user.validate() ? user : null;
    } catch (error) {
        console.error('Failed to get user data for uid:', uid, error);
        return null;
    }
};


/**
 * Signs out the currently authenticated user
 * @returns {Promise<void>}
 * @throws {Error} If logout fails
 */
const logoutUser = async () => {
    try {
        await FireAuthManager.signOutUser();
    } catch (error) {
        console.error('Logout failed:', error);
        alert('An error occurred during logout.');
    }
};

/**
 * Creates a new user account with email and password.
 * Automatically creates user profile and initializes user data in Firestore.
 * @param {string} nickname - User's display name
 * @param {string} email - User's email address
 * @param {string} password - User's password
 * @returns {Promise<Object>} Firebase user object from authentication
 * @throws {Error} If account creation fails
 */
const signupUser = async (nickname, email, password) => {
    const userCredential = await FireAuthManager.createUser(email, password);
    const userLogin = userCredential.user;

    await FireAuthManager.updateUserProfile(userLogin, { displayName: nickname });

    const newUser = new User({
        uid: userLogin.uid,
        email: email,
        displayName: nickname,
        isAdmin: false,
    });

    // Remove arrays
    const { goals, badges, workouts, friends, ...updateData } = newUser;

    await FirebaseManager.createDocument(USERS_COLLECTION, updateData, userLogin.uid);

    return userLogin;
};

/**
 * Updates a user's profile and data in both Authentication and Firestore.
 * Supports updating display name, email, level, points, and other user fields.
 * @param {string} uid - User ID to update
 * @param {Object} userData - Object containing subset of fields to update (displayName, email, level, points, etc.)
 * @returns {Promise<User>} Updated user data object
 * @throws {Error} If user is not authenticated or update fails
 */
const updateUser = async (uid, userData) => {
    try {
        const user = await getCurrentUser(uid);

        // Update Authentication profile if needed
        if (userData.displayName) {
            await FireAuthManager.updateUserProfile(user, { displayName: userData.displayName });
        }
        if (userData.email) {
            await FireAuthManager.updateEmail(user, userData.email);
        }

        // Remove arrays
        const { goals, badges, workouts, friends, ...updateData } = userData;

        await FirebaseManager.updateDocument(USERS_COLLECTION, uid, updateData, true);

        // Re-Get and return the updated user data
        return getUser(uid);
    } catch (error) {
        console.error('Failed to update user:', error);
        throw error;
    }
};

/**
 * Adds points to a user's total score and updates their level progression.
 * Automatically handles level calculations and data persistence.
 * @param {string} uid - User ID to add points to
 * @param {number} points - Number of points to add to the user's total
 * @returns {Promise<User>} Updated user data with new points and level
 * @throws {Error} If user update fails or user not found
 */
const addPoints = async (uid, points) => {
    try {
        const user = await getCurrentUser(uid);

        user.addPoints(points);

        user.workouts = []; // Firebase cannot handle custom objects

        const { goals, badges, workouts, friends, ...updateData } = user;

        await FirebaseManager.updateDocument(USERS_COLLECTION, uid, updateData, true);
        return getUser(uid);
    } catch (error) {
        console.error('Failed to update user:', error);
        throw error;
    }
}

/**
 * Gets and validates the current authenticated user's data.
 * Retrieves full user profile from Firestore for the currently logged-in user.
 * @returns {Promise<User>} Current user's complete profile data
 * @throws {Error} If no user is logged in or user data cannot be retrieved
 */
const getCurrentUser = async () => {
    const currentUser = FireAuthManager.getCurrentUser();
    if (!currentUser) {
        throw new Error('No user is currently logged in');
    }
    return getUser(currentUser.uid);
}

/**
 * Deletes a user authentication account and deactivates associated data.
 * Preserves user data for historical purposes by setting isActive to false.
 * @param {string} uid - User ID to delete
 * @returns {Promise<void>}
 * @throws {Error} If user is not authenticated or deletion fails
 */
const deleteUser = async (uid) => {
    try {
        const user = getCurrentUser(uid);

        // Deactivate user document from Firestore, but keep it for historical/restoration purposes
        await FirebaseManager.updateDocument(USERS_COLLECTION, uid, { isActive: false }, true);

        await user.delete();
    } catch (error) {
        console.error('Failed to delete user:', error);
        throw error;
    }
};

/**
 * Creates a friendship request between two users.
 * Validates both users exist and handles duplicate request prevention.
 * @param {string} requesterId - ID of user sending the friend request
 * @param {string} recipientId - ID of user receiving the friend request
 * @returns {Promise<Object>} Created friendship object with PENDING status
 * @throws {Error} If creation fails or friendship already exists
 */
const addFriend = async (requesterId, recipientId) => {
    try {
        validateUsersExist(requesterId, recipientId);

        const friendshipId = resolveFriendshipId(requesterId, recipientId);
        const existingFriendship = await getFriendshipData(friendshipId);
        if (existingFriendship && (existingFriendship.status === 'ACCEPTED' || existingFriendship.status === 'PENDING')) {
            throw new Error('Friendship already exists');
        }

        const friendshipData = {
            friendshipId,
            user1Id: requesterId, // Requester
            user2Id: recipientId, // Recipient
            status: 'PENDING',
        };

        await FirebaseManager.createDocument(FRIENDS_COLLECTION, friendshipData);

        return getFriendshipData(friendshipId);
    } catch (error) {
        console.error('Failed to add friend:', error);
        throw error;
    }
};

/**
 * Validates that both users exist in the database
 * @param {string} user1Id - First user ID to validate
 * @param {string} user2Id - Second user ID to validate
 * @throws {Error} If either user does not exist
 */
function validateUsersExist(user1Id, user2Id) {
    const user = getUser(user1Id);
    const user2 = getUser(user2Id);

    if (!user) {
        throw new Error('Requester User does not exist');
    }
    if (!user2) {
        throw new Error('Recipient User does not exist');
    }
}

/**
 * Creates a unique friendship ID from two user IDs
 * @param {string} requesterId - ID of the user sending the request
 * @param {string} recipientId - ID of the user receiving the request
 * @returns {string} Unique friendship ID (alphabetically sorted user IDs joined with underscore)
 */
function resolveFriendshipId(requesterId, recipientId) {
    // friendship ID => Combination of both user IDs, alphabetically sorted
    const userIds = [requesterId, recipientId].sort();
    return `${userIds[0]}_${userIds[1]}`;
}

/**
 * Accepts a pending friendship request.
 * Only the recipient of the original request can accept it.
 * @param {string} userId - ID of user accepting the request (must be the recipient)
 * @param {string} friendId - ID of user who sent the request
 * @returns {Promise<Object>} Updated friendship object with ACCEPTED status
 * @throws {Error} If acceptance fails or user lacks permission
 */
const acceptFriendRequest = async (userId, friendId) => {
    try {
        const friendshipId = resolveFriendshipId(userId, friendId);
        const friendship = await getFriendshipData(friendshipId);

        if (!friendship) {
            throw new Error('Friendship request not found');
        }

        if (friendship.status !== 'PENDING') {
            throw new Error(`Cannot accept friendship with status: ${friendship.status}`);
        }

        if (friendship.user2Id !== userId) {
            throw new Error('Only the recipient can accept a friend request');
        }

        await FirebaseManager.updateDocument(FRIENDS_COLLECTION, friendshipId, { status: 'ACCEPTED' }, true);

        // Re-get updated friendship
        return await getFriendshipData(friendshipId);
    } catch (error) {
        console.error('Failed to accept friend request:', error);
        throw error;
    }
};

/**
 * Removes a friendship between two users.
 * Either user in the friendship can initiate removal.
 * @param {string} userId - ID of user removing the friendship
 * @param {string} friendId - ID of the other user in the friendship
 * @returns {Promise<void>}
 * @throws {Error} If removal fails or user is not part of the friendship
 */
const removeFriend = async (userId, friendId) => {
    try {
        const friendshipId = resolveFriendshipId(userId, friendId);
        const friendship = await getFriendshipData(friendshipId);

        if (!friendship) {
            throw new Error('Friendship not found');
        }

        // Verify user is part of the friendship
        if (friendship.user1Id !== userId && friendship.user2Id !== userId) {
            throw new Error('You are not part of this friendship');
        }

        await FirebaseManager.deleteDocument(FRIENDS_COLLECTION, friendshipId);
    } catch (error) {
        console.error('Failed to remove friend:', error);
        throw error;
    }
};

/**
 * Helper function to retrieve friendship data by friendship ID.
 * Used internally by other friendship management functions.
 * @param {string} friendshipId - Friendship ID (combination of user IDs)
 * @returns {Promise<Object|null>} Friendship object or null if not found
 */
const getFriendshipData = async (friendshipId) => {
    try {
        return await FirebaseManager.readDocument(FRIENDS_COLLECTION, friendshipId);
    } catch (error) {
        console.error('Failed to get friendship:', error);
        return null;
    }
};

/**
 * Gets all friendships for a user with optional status filtering.
 * Searches both user1Id and user2Id fields to find all friendships.
 * @param {string} userId - User ID to get friendships for
 * @param {string} [status] - Optional status filter (PENDING, ACCEPTED, etc.)
 * @returns {Promise<Object[]>} Array of friendship objects matching criteria
 */
const getUserFriendships = async (userId, status = null) => {
    try {
        const friendships = [];

        const snapshot1 = await FirebaseManager.queryDocumentsByFieldValue(FRIENDS_COLLECTION, 'user1Id', userId);
        const snapshot2 = await FirebaseManager.queryDocumentsByFieldValue(FRIENDS_COLLECTION, 'user2Id', userId);

        snapshot1.forEach(doc => {
            const friendship = doc.data();
            if (!status || friendship.status === status) {
                friendships.push(friendship);
            }
        });

        snapshot2.forEach(doc => {
            const friendship = doc.data();
            if (!status || friendship.status === status) {
                friendships.push(friendship);
            }
        });

        return friendships;
    } catch (error) {
        console.error('Failed to get user friendships:', error);
        return [];
    }
};

/**
 * Blocks a user and automatically removes any existing friendship.
 * Validates both users exist before creating the block relationship.
 * @param {string} userId - ID of user creating the block
 * @param {string} blockedUserId - ID of user being blocked
 * @returns {Promise<Object>} Created block object
 * @throws {Error} If block creation fails or user is already blocked
 */
const blockUser = async (userId, blockedUserId) => {
    try {
        validateUsersExist(userId, blockedUserId);

        const blockId = resolveBlockId(userId, blockedUserId);
        const existingBlock = await getBlockData(blockId);
        if (existingBlock) {
            throw new Error('User is already blocked');
        }

        const blockData = {
            blockId,
            userId,
            blockedUserId,
        };

        try {
            await removeFriend(userId, blockedUserId);
            // eslint-disable-next-line no-unused-vars
        } catch (error) {
            // Ignore errors if no friendship exists
        }

        await FirebaseManager.createDocument(BLOCKS_COLLECTION, blockData);

        // Re-get the block data
        return getBlockData(blockId);
    } catch (error) {
        console.error('Failed to block user:', error);
        throw error;
    }
};

/**
 * Creates a unique block ID from user IDs
 * @param {string} userId - ID of user creating the block
 * @param {string} blockedUserId - ID of user being blocked
 * @returns {string} Unique block ID in format "userId_blocks_blockedUserId"
 */
function resolveBlockId(userId, blockedUserId) {
    return `${userId}_blocks_${blockedUserId}`;
}

/**
 * Removes a block between users.
 * Only the user who created the block has permission to remove it.
 * @param {string} userId - ID of user who created the block
 * @param {string} blockedUserId - ID of user who was blocked
 * @returns {Promise<void>}
 * @throws {Error} If unblock fails or user lacks permission
 */
const unblockUser = async (userId, blockedUserId) => {
    try {
        const blockId = resolveBlockId(userId, blockedUserId);
        const block = await getBlockData(blockId);

        if (!block) {
            throw new Error('Block not found');
        }

        // Verify user has permission to unblock (only the blocker can unblock)
        if (block.userId !== userId) {
            throw new Error('Permission denied: Only the blocker can unblock');
        }

        await FirebaseManager.deleteDocument(BLOCKS_COLLECTION, blockId);

    } catch (error) {
        console.error('Failed to unblock user:', error);
        throw error;
    }
};

/**
 * Helper function to retrieve block data by block ID.
 * Used internally by other blocking management functions.
 * @param {string} blockId - The block ID to look up
 * @returns {Promise<Object|null>} Block object or null if not found
 */
const getBlockData = async (blockId) => {
    try {
        return await FirebaseManager.readDocument(BLOCKS_COLLECTION, blockId);
    } catch (error) {
        console.error('Failed to get block:', error);
        return null;
    }
};

/**
 * Checks if a user is blocked by another user.
 * Returns true if an active block relationship exists.
 * @param {string} userId - ID of potential blocker
 * @param {string} targetUserId - ID of potentially blocked user
 * @returns {Promise<boolean>} True if blocked, false otherwise
 */
const isUserBlocked = async (userId, targetUserId) => {
    const blockId = resolveBlockId(userId, targetUserId);
    const block = await getBlockData(blockId);
    return block !== null;
};

/**
 * Gets all users blocked by a specific user.
 * Returns complete list of block relationships created by the user.
 * @param {string} userId - User ID to get blocks for
 * @returns {Promise<Object[]>} Array of block objects
 */
const getUserBlocks = async (userId) => {
    try {
        const blocks = [];

        const snapshot = await FirebaseManager.queryDocumentsByFieldValue(BLOCKS_COLLECTION, 'userId', userId);

        snapshot.forEach(doc => {
            blocks.push(doc.data());
        });

        return blocks;
    } catch (error) {
        console.error('Failed to get user blocks:', error);
        return [];
    }
};

/**
 * Gets the Firestore database path for a specific user.
 * Used for constructing database references and queries.
 * @param {string} userId - User ID to get database path for
 * @returns {string} Firestore collection path for the user
 */
const getUserDatabasePath = (userId) => {
    return `${USERS_COLLECTION}/${userId}/`;
}

/**
 * Retrieves all active users from the database.
 * Filters out deactivated users and returns complete user data.
 * @returns {Promise<Object[]>} Array of active user objects with UID and profile data
 */
const getAllActiveUsers = async () => {
    try {
        const snapshot = await FirebaseManager.getAllDocuments(USERS_COLLECTION);
        const users = [];
        snapshot.forEach(doc => {
            const userData = doc.data();
            if (userData.isActive !== false) {
                users.push({
                    uid: doc.id,
                    ...userData
                });
            }
        });

        return users;
    } catch (error) {
        console.error('Failed to get all users:', error);
        return [];
    }
};

/**
 * Searches for users by display name or email address.
 * Performs case-insensitive partial matching on user profiles.
 * @param {string} searchTerm - Search term to match against display names and emails
 * @param {number} [limit=50] - Maximum number of results to return
 * @returns {Promise<Object[]>} Array of matching user objects (limited by specified count)
 */
const searchUsers = async (searchTerm, limit = 50) => {
    try {
        const allUsers = await getAllActiveUsers();

        const searchLower = searchTerm.toLowerCase();
        const matchingUsers = allUsers.filter(user =>
            user.displayName?.toLowerCase().includes(searchLower) ||
            user.email?.toLowerCase().includes(searchLower)
        ).slice(0, limit);

        return matchingUsers;
    } catch (error) {
        console.error('Failed to search users:', error);
        return [];
    }
};

const awardBadge = async (userId, badgeId) => {
    const path = getUserDatabasePath(userId);
    const badge = new UserBadge({ userId: userId, badgeId: badgeId });

    const exisiting = await FirestoreManager.findDocumentByField(path + `${BADGES_USER_COLLECTION}`, 'badgeId', badgeId);
    if (exisiting == null)
        await FirebaseManager.createDocument(path + `${BADGES_USER_COLLECTION}`, badge, badge.uid);
};

const getBadges = async (userId) => {
    const path = getUserDatabasePath(userId) + `${BADGES_USER_COLLECTION}`;
    const userBadges = await FirestoreManager.getAllDocuments(path);
    const badges = [];
    const promises = [];
    for (let index = 0; index < userBadges.docs.length; index++) {
        const element = userBadges.docs[index].data();
        const promise = FirestoreManager.readDocument(BADGES_COLLECTION, element.badgeId)
            .then(data => {
                if (data != null)
                    badges.push(data);
            });
        promises.push(promise);
    }
    await Promise.all(promises)
    return badges;
}

/**
 * @namespace UserManagement
 * @description Firebase service module for comprehensive user management functionality.
 * Provides authentication, user profiles, friendship systems, blocking capabilities,
 * user search, and social features for the fitness application. Integrates Firebase Auth
 * and Firestore for complete user lifecycle management including registration, login,
 * profile updates, social interactions, and administrative operations.
 */
const UserManagement = {
    getAllActiveUsers,
    searchUsers,
    getUserDatabasePath,
    loginUser,
    getUser,
    logoutUser,
    signupUser,
    getCurrentUser,
    updateUser,
    deleteUser,
    addFriend,
    acceptFriendRequest,
    removeFriend,
    getFriendshipData,
    getUserFriendships,
    blockUser,
    unblockUser,
    isUserBlocked,
    getUserBlocks,
    getBlockData,
    addPoints,
    awardBadge,
    getBadges
}

export default UserManagement;