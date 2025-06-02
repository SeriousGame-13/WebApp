import { 
    signOut,
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    updateProfile,
    updateEmail,
} from 'firebase/auth';
// #TODO REMOVE FirebaseAuth to use only FirebaseAuthenticationManager to avoid Spaghetti

import { auth, db } from './firebaseConfig';
import FirebaseManager from './FirestoreManager';

const USERS_COLLECTION = 'users';
const FRIENDS_COLLECTION = 'user_friends';
const BLOCKS_COLLECTION = 'user_blocks';

/**
 * Authenticates a user with email and password
 * @param {string} id - User's email address
 * @param {string} password - User's password
 * @returns {Promise<object>} Firebase user object
 * @throws {Error} If authentication fails
 */
const loginUser = async (id, password) => {
    const userCredential = await signInWithEmailAndPassword(auth, id, password);
    return userCredential.user;
};

/**
 * Retrieves a user's data from Firestore
 * @param {string} uid - User ID to retrieve data for
 * @returns {Promise<object|null>} User data object or null if not found
 */
const getUserData = async (uid) => {
    try {
        return await FirebaseManager.readDocument(USERS_COLLECTION, uid);
    } catch (error) {
        console.error('Failed to get user data:', error);
        return null;
    }
};

/**
 * Signs out the currently authenticated user
 * @returns {Promise<void>}
 */
const logoutUser = async () => {
    const auth = getAuth();
    try {
        await signOut(auth);
    } catch (error) {
        console.error('Logout failed:', error);
        alert('An error occurred during logout.');
    }
};

/**
 * Creates a new user account with email and password
 * @param {string} nickname - User's display name
 * @param {string} email - User's email address
 * @param {string} password - User's password
 * @returns {Promise<object>} Firebase user object
 * @throws {Error} If account creation fails
 */
const signupUser = async (nickname, email, password) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await updateProfile(userCredential.user, {
        displayName: nickname
    });

    const userData = {
        uid: user.uid,
        email: email,
        displayName: nickname,
        isActive: true,
        level: 1,
        points: 0,
        longestStreak: 0
    }   
    await FirebaseManager.createDocument(USERS_COLLECTION, user.uid, userData, addTimestamp = true);

    return user;
};

/**
 * Updates a user's profile and data
 * @param {string} uid - User ID to update
 * @param {object} userData - Object containing (sub-)set of fields to update (displayName, email, level, points, etc.)
 * @returns {Promise<object>} Updated user data
 */
const updateUser = async (uid, userData) => {
    try {
        const user = getCurrentAuthUser(uid);

        // Update Authentication profile if needed
        if (userData.displayName) {
            await updateProfile(user, { displayName: userData.displayName });
        }
        if (userData.email) {
            await updateEmail(user, userData.email);
        }
        
        
        // Execute update with merge: true to only update specified fields
        await FirebaseManager.updateDocument(USERS_COLLECTION, uid, updatedData, addTimestamp = true);
        
        // Re-Get and return the updated user data
        return getUserData(uid);
    } catch (error) {
        console.error('Failed to update user:', error);
        throw error;
    }
};


function getCurrentAuthUser(uid) {
    const user = auth.currentUser;

    if (!user) {
        throw new Error('No user is currently logged in');
    }
    // Check if this is the current user
    if (!user || user.uid !== uid) {
        throw new Error('Permission denied: Can only manage your own account');
    }
    return user;
}


/**
 * Deletes a user authentication account and deactivate associated data
 * @param {string} uid - User ID to delete
 * @returns {Promise<void>}
 */
const deleteUser = async (uid) => {
    try {
        const user = getCurrentAuthUser(uid);
        
        // Deactivate user document from Firestore, but keep it for historical/restoring purposes
        await FirebaseManager.updateDocument(USERS_COLLECTION, uid, { isActive: false }, addTimestamp = true);

        // Delete user authentication account
        await user.delete();        
    } catch (error) {
        console.error('Failed to delete user:', error);
        throw error;
    }
};

/**
 * Creates a friendship request between two users
 * @param {string} requesterId - ID of user sending the friend request
 * @param {string} recipientId - ID of user receiving the friend request
 * @returns {Promise<object>} Created friendship object
 * @throws {Error} If creation fails
 */
const addFriend = async (requesterId, recipientId) => {
    try {
        validateUsersExist(requesterId, recipientId);
        
        const friendshipId = resolveFriendshipId(requesterId, recipientId);
        const existingFriendship = await getFriendshipData(friendshipId);
        if (existingFriendship && (existingFriendship.status === 'ACCEPTED' || existingFriendship.status === 'PENDING')) {
            throw new Error('Friendship already exists');
        }

        // Create friendship document
        const friendshipData = {
            friendshipId,
            user1Id: requesterId, // Requester
            user2Id: recipientId, // Recipient
            status: 'PENDING',
        };
        
        await FirebaseManager.createDocument(FRIENDS_COLLECTION, friendshipId, friendshipData, addTimestamp = true);        
        
        return getFriendshipData(friendshipId);
    } catch (error) {
        console.error('Failed to add friend:', error);
        throw error;
    }
};

function validateUsersExist(user1Id, user2Id) {
    const user = getUserData(user1Id);
    const user2 = getUserData(user2Id);
    
    if (!user) {
        throw new Error('Requester User does not exist');
    }
    if (!user2) {
        throw new Error('Recipient User does not exist');
    }
}

function resolveFriendshipId(requesterId, recipientId) {
    // friendship ID => Combination of both user IDs, alphabetically sorted
    const userIds = [requesterId, recipientId].sort();
    return `${userIds[0]}_${userIds[1]}`;
}
/**
 * Accepts a pending friendship request
 * @param {string} userId - ID of user accepting the request
 * @param {string} friendId - ID of user who sent the request
 * @returns {Promise<object>} Updated friendship object
 * @throws {Error} If acceptance fails
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
        
        // Update friendship status
        await FirebaseManager.updateDocument(FRIENDS_COLLECTION, friendshipId, {status: 'ACCEPTED'}, addTimestamp = true);    
        
        // Re-Get updated friendship
        return await getFriendshipData(friendshipId);
    } catch (error) {
        console.error('Failed to accept friend request:', error);
        throw error;
    }
};

/**
 * Removes a friendship between two users
 * @param {string} userId - ID of user removing the friendship
 * @param {string} friendId - ID of the other user in the friendship
 * @returns {Promise<void>}
 * @throws {Error} If removal fails
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
        
        // Delete the friendship document
        await FirebaseManager.deleteDocument(FRIENDS_COLLECTION, friendshipId);
    } catch (error) {
        console.error('Failed to remove friend:', error);
        throw error;
    }
};

/**
 * Helper function to find a friendship between two users
 * @param {string} friendshipId - Friendship ID (combination of user IDs)
 * @returns {Promise<object|null>} Friendship object or null if not found
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
 * Gets all friendships for a user
 * @param {string} userId - User ID to get friendships for
 * @param {string} [status] - Optional status filter (PENDING, ACCEPTED, etc.)
 * @returns {Promise<Array>} Array of friendship objects
 */
const getUserFriendships = async (userId, status = null) => {
    try {
        const friendships = [];
        
        // Query where user is either user1 or user2
        const snapshot1 = await FirebaseManager.queryDocumentsByFieldValue(FRIENDS_COLLECTION, 'user1Id', userId);
        const snapshot2 = await FirebaseManager.queryDocumentsByFieldValue(FRIENDS_COLLECTION, 'user2Id', userId);

        // Process results
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
 * Blocks a user
 * @param {string} userId - ID of user creating the block
 * @param {string} blockedUserId - ID of user being blocked
 * @returns {Promise<object>} Created block object
 * @throws {Error} If block creation fails
 */
const blockUser = async (userId, blockedUserId) => {
    try {
        validateUsersExist(userId, blockedUserId);
        
        // Check if block already exists
        const blockId = resolveBlockId(userId, blockedUserId);
        const existingBlock = await getBlockData(blockId);
        if (existingBlock) {
            throw new Error('User is already blocked');
        }
                
        // Create block document
        const blockData = {
            blockId,
            userId,
            blockedUserId,
        };
        
        // Remove as Friends
        try {
            await removeFriend(userId, blockedUserId);
        } catch (error) {
            // Ignore errors if no friendship exists
            console.log('No friendship to remove when blocking user');
        }
        
        await FirebaseManager.createDocument(BLOCKS_COLLECTION, blockId, blockData, addTimestamp = true);
        
        // Re-Get the block data
        return getBlockData(blockId);
    } catch (error) {
        console.error('Failed to block user:', error);
        throw error;
    }
};


function resolveBlockId(userId, blockedUserId) {
    return `${userId}_blocks_${blockedUserId}`;
}

/**
 * Removes a block between users
 * @param {string} userId - ID of user who created the block
 * @param {string} blockedUserId - ID of user who was blocked
 * @returns {Promise<void>}
 * @throws {Error} If unblock fails
 */
const unblockUser = async (userId, blockedUserId) => {
    try {
        // Get the block record
        const blockId = resolveBlockId(userId, blockedUserId);
        const block = await getBlockData(blockId);
        
        if (!block) {
            throw new Error('Block not found');
        }
        
        // Verify user has permission to unblock (only the blocker can unblock)
        if (block.userId !== userId) {
            throw new Error('Permission denied: Only the blocker can unblock');
        }
        
        // Delete the block document
        await FirebaseManager.deleteDocument(BLOCKS_COLLECTION, blockId);

    } catch (error) {
        console.error('Failed to unblock user:', error);
        throw error;
    }
};

/**
 * Helper function to find a block between users
 * @param {string} userId - ID of user who created the block
 * @param {string} blockId - ID of user who was blocked
 * @returns {Promise<object|null>} Block object or null if not found
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
 * Checks if a user is blocked by another user
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
 * Gets all users blocked by a specific user
 * @param {string} userId - User ID to get blocks for
 * @returns {Promise<Array>} Array of block objects
 */
const getUserBlocks = async (userId) => {
    try {
        const blocks = [];
        
        // Query where user is the blocker

        const snapshot = await FirebaseManager.queryDocumentsByFieldValue(BLOCKS_COLLECTION, 'userId', userId);
        
        // Process results
        snapshot.forEach(doc => {
            blocks.push(doc.data());
        });
        
        return blocks;
    } catch (error) {
        console.error('Failed to get user blocks:', error);
        return [];
    }
};

const UserManagement = {
    loginUser,
    getUserData,
    logoutUser,
    signupUser,
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
    getBlockData
}

export default UserManagement;

