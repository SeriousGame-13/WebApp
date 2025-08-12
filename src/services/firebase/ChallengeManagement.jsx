/**
 * @fileoverview Challenge Management Module
 * 
 * This module provides comprehensive challenge management functionality for the fitness application.
 * It handles all CRUD operations for challenges including creation, retrieval, updating, and deletion.
 * Additionally, it manages challenge participation, user assignments, and group-based challenges.
 * 
 * The module supports different challenge types and visibility levels (public, private, group-based)
 * and provides proper error handling for all database operations.
 * 
 * @author Igor, Alexander, Hyunu, Robert
 * @version 1.0.0
 */

import FirebaseManager from './FirestoreManager.jsx';
import { Challenge, ChallengeParticipant } from '../interfaces/challenge.jsx';
import { CHALLENGE_VISIBILITY } from '../interfaces/constants.jsx';
import UserManagement from './UserManagementSystem.jsx';
import GroupManagement from './GroupManagementSystem.jsx';
import { CHALLENGES_COLLECTION, CHALLENGE_PARTICIPANTS_SUBCOLLECTION } from './collections';

/**
 * Creates a new challenge in the database with the provided challenge data.
 * Automatically assigns participants based on challenge visibility and type.
 * @param {Object} challengeData - The challenge data object
 * @param {string} challengeData.name - The name of the challenge
 * @param {string} challengeData.description - The description of the challenge
 * @param {number} challengeData.startDate - The start date timestamp
 * @param {number} challengeData.endDate - The end date timestamp
 * @param {string} challengeData.creatorId - The ID of the user creating the challenge
 * @param {number} challengeData.rewardPoints - The reward points for completing the challenge
 * @param {string} challengeData.challengeType - The type of challenge
 * @param {string} challengeData.visibility - The visibility level (PUBLIC, PRIVATE, GROUP, HIDDEN)
 * @param {string} [challengeData.groupId] - The group ID if this is a group challenge
 * @param {string} [challengeData.targetExerciseId] - The target exercise ID if applicable
 * @param {number} [challengeData.targetValue] - The target value to achieve
 * @returns {Promise<Challenge>} The created Challenge object with assigned challengeId
 * @throws {Error} If challenge creation fails or document creation fails
 */
const createChallenge = async (challengeData) => {
    try {
        const challenge = new Challenge({
            name: challengeData.name,
            description: challengeData.description,
            startDate: challengeData.startDate,
            endDate: challengeData.endDate,
            creatorId: challengeData.creatorId,
            rewardPoints: challengeData.rewardPoints,
            challengeType: challengeData.challengeType,
            visibility: challengeData.visibility,
            groupId: challengeData.groupId || null,
            targetExerciseId: challengeData.targetExerciseId || null,
            targetValue: challengeData.targetValue || null
        });
        
        const { challengeId, participants, creator, targetExercise, ...challengeDataForFirebase } = challenge;
        
        const docRef = await FirebaseManager.createDocument(CHALLENGES_COLLECTION, challengeDataForFirebase);
        
        if (!docRef || !docRef.id) {
            throw new Error('Failed to create challenge document');
        }
        
        challenge.challengeId = docRef.id;
        
        if (challenge.visibility === CHALLENGE_VISIBILITY.PUBLIC || 
            challenge.visibility === CHALLENGE_VISIBILITY.HIDDEN) {
            
            const allUsers = await UserManagement.getAllActiveUsers();
            for (const user of allUsers) {
                await joinChallenge(challenge.challengeId, user.uid);
            }
            
        } else if (challenge.visibility === CHALLENGE_VISIBILITY.GROUP && challenge.groupId) {
            
            const groupData = await GroupManagement.getGroup(challenge.groupId);
            const activeMembers = groupData.members.filter(member => member.isActive());
            
            for (const member of activeMembers) {
                await joinChallenge(challenge.challengeId, member.userId);
            }
        }
        
        return challenge;
    } catch (error) {
        console.error('Failed to create challenge:', error);
        throw error;
    }
};

/**
 * Adds a user to all active and upcoming group challenges when they join a group.
 * @param {string} groupId - The ID of the group
 * @param {string} userId - The ID of the user to add to challenges
 */
const addUserToGroupChallenges = async (groupId, userId) => {
    try {
        const groupChallenges = await getGroupChallenges(groupId);
        const activeChallenges = groupChallenges.filter(challenge => 
            challenge.isActive() || challenge.hasNotStarted()
        );

        for (const challenge of activeChallenges) {
            try {
                await joinChallenge(challenge.challengeId, userId);
            } catch (error) {
                console.error(`Failed to add user ${userId} to challenge ${challenge.challengeId}:`, error);
            }
        }
    } catch (error) {
        console.error('Failed to add user to group challenges:', error);
    }
};

/**
 * Removes a user from all group challenges when they leave a group.
 * @param {string} groupId - The ID of the group
 * @param {string} userId - The ID of the user to remove from challenges
 */
const removeUserFromGroupChallenges = async (groupId, userId) => {
    try {
        const groupChallenges = await getGroupChallenges(groupId);
        
        for (const challenge of groupChallenges) {
            try {
                await leaveChallenge(challenge.challengeId, userId);
            } catch (error) {
                console.error(`Failed to remove user ${userId} from challenge ${challenge.challengeId}:`, error);
            }
        }
    } catch (error) {
        console.error('Failed to remove user from group challenges:', error);
    }
};

/**
 * Adds a new user to all public and hidden challenges that are active or not yet started.
 * Called when a new user registers in the system.
 * @param {string} userId - The ID of the new user to add to challenges
 */
const addNewUserToChallenges = async (userId) => {
    try {
        const allChallenges = await getAllChallenges();
        
        const targetChallenges = allChallenges.filter(challenge => 
            (challenge.visibility === CHALLENGE_VISIBILITY.PUBLIC || 
             challenge.visibility === CHALLENGE_VISIBILITY.HIDDEN) &&
            (challenge.isActive() || challenge.hasNotStarted())
        );
        
        for (const challenge of targetChallenges) {
            try {
                await joinChallenge(challenge.challengeId, userId);
            } catch (error) {
                console.error(`Failed to add new user to challenge ${challenge.challengeId}:`, error);
            }
        }
    } catch (error) {
        console.error('Failed to add new user to challenges:', error);
    }
};

/**
 * Retrieves all challenges from the database.
 * Loads participants for each challenge and returns complete Challenge objects.
 * @returns {Promise<Challenge[]>} An array of Challenge objects with participants loaded, or empty array if retrieval fails
 */
const getAllChallenges = async () => {
    try {
        const snapshot = await FirebaseManager.getAllDocuments(CHALLENGES_COLLECTION);
        const challenges = [];
        
        for (const doc of snapshot.docs) {
            const challengeData = doc.data();
            const challenge = Challenge.fromJSON({
                ...challengeData,
                challengeId: doc.id
            });
            
            await loadChallengeParticipants(challenge);
            challenges.push(challenge);
        }
        
        return challenges;
    } catch (error) {
        console.error('Failed to get all challenges:', error);
        return [];
    }
};

/**
 * Retrieves all public challenges from the database.
 * Public challenges are visible to all users regardless of group membership.
 * @returns {Promise<Challenge[]>} An array of public Challenge objects with participants loaded, or empty array if retrieval fails
 */
const getPublicChallenges = async () => {
    try {
        const snapshot = await FirebaseManager.queryDocuments(
            CHALLENGES_COLLECTION,
            [['visibility', '==', CHALLENGE_VISIBILITY.PUBLIC]]
        );
        
        const challenges = [];
        for (const doc of snapshot.docs) {
            const challengeData = doc.data();
            const challenge = Challenge.fromJSON({
                ...challengeData,
                challengeId: doc.id
            });
            
            await loadChallengeParticipants(challenge);
            challenges.push(challenge);
        }
        
        return challenges;
    } catch (error) {
        console.error('Failed to get public challenges:', error);
        return [];
    }
};

/**
 * Retrieves all challenges associated with a specific group.
 * Only returns challenges with GROUP visibility that belong to the specified group.
 * @param {string} groupId - The ID of the group to get challenges for
 * @returns {Promise<Challenge[]>} An array of group Challenge objects, or empty array if retrieval fails
 */
const getGroupChallenges = async (groupId) => {
    try {
        const allChallenges = await getAllChallenges();
        
        const groupChallenges = allChallenges.filter(challenge => 
            challenge.visibility === CHALLENGE_VISIBILITY.GROUP && 
            challenge.groupId === groupId
        );
        
        return groupChallenges;
    } catch (error) {
        console.error('Failed to get group challenges:', error);
        return [];
    }
};

/**
 * Updates an existing challenge with new data.
 * Merges the provided challenge data with the existing challenge document.
 * @param {string} challengeId - The unique identifier of the challenge to update
 * @param {Object} challengeData - The challenge data to update
 * @param {string} [challengeData.name] - The updated name of the challenge
 * @param {string} [challengeData.description] - The updated description of the challenge
 * @param {number} [challengeData.startDate] - The updated start date timestamp
 * @param {number} [challengeData.endDate] - The updated end date timestamp
 * @param {number} [challengeData.rewardPoints] - The updated reward points value
 * @param {string} [challengeData.challengeType] - The updated challenge type
 * @param {string} [challengeData.visibility] - The updated visibility level
 * @param {number} [challengeData.targetValue] - The updated target value
 * @returns {Promise<boolean>} True if update was successful
 * @throws {Error} If challenge update fails
 */
const updateChallenge = async (challengeId, challengeData) => {
    try {
        await FirebaseManager.updateDocument(CHALLENGES_COLLECTION, challengeId, challengeData, true);
        return true;
    } catch (error) {
        console.error('Failed to update challenge:', error);
        throw error;
    }
};

/**
 * Deletes a challenge and all its participants from the database.
 * Removes both the challenge document and all participant subcollection documents.
 * @param {string} challengeId - The unique identifier of the challenge to delete
 * @returns {Promise<boolean>} True if deletion was successful
 * @throws {Error} If challenge deletion fails
 */
const deleteChallenge = async (challengeId) => {
    try {
        const participantsSnapshot = await FirebaseManager.getAllDocuments(
            `${CHALLENGES_COLLECTION}/${challengeId}/${CHALLENGE_PARTICIPANTS_SUBCOLLECTION}`
        );
        
        for (const doc of participantsSnapshot.docs) {
            await FirebaseManager.deleteDocument(
                `${CHALLENGES_COLLECTION}/${challengeId}/${CHALLENGE_PARTICIPANTS_SUBCOLLECTION}`,
                doc.id
            );
        }
        
        await FirebaseManager.deleteDocument(CHALLENGES_COLLECTION, challengeId);
        
        return true;
    } catch (error) {
        console.error('Failed to delete challenge:', error);
        throw error;
    }
};

/**
 * Adds a user as a participant to a specific challenge.
 * Creates a new participant record with user information and join timestamp.
 * @param {string} challengeId - The unique identifier of the challenge to join
 * @param {string} userId - The unique identifier of the user joining the challenge
 * @returns {Promise<ChallengeParticipant>} The created ChallengeParticipant object
 * @throws {Error} If joining the challenge fails
 */
const joinChallenge = async (challengeId, userId) => {
    try {

        const userData = await UserManagement.getUser(userId);

        const participant = new ChallengeParticipant({
            participantId: userId,
            challengeId: challengeId,
            userId: userId,
            joinedAt: Date.now(),
            completedAt: null,
            user: userData.displayName || 'Unknown User'
        });
        
        await FirebaseManager.createDocument(
            `${CHALLENGES_COLLECTION}/${challengeId}/${CHALLENGE_PARTICIPANTS_SUBCOLLECTION}`,
            userId,
            participant,
            true
        );
        
        return participant;
    } catch (error) {
        console.error('Failed to join challenge:', error);
        throw error;
    }
};

/**
 * Removes a user from a specific challenge.
 * Deletes the participant record from the challenge's participants subcollection.
 * @param {string} challengeId - The unique identifier of the challenge to leave
 * @param {string} userId - The unique identifier of the user leaving the challenge
 * @returns {Promise<boolean>} True if leaving the challenge was successful
 * @throws {Error} If leaving the challenge fails
 */
const leaveChallenge = async (challengeId, userId) => {
    try {
        await FirebaseManager.deleteDocument(
            `${CHALLENGES_COLLECTION}/${challengeId}/${CHALLENGE_PARTICIPANTS_SUBCOLLECTION}`,
            userId
        );
        
        return true;
    } catch (error) {
        console.error('Failed to leave challenge:', error);
        throw error;
    }
};

/**
 * Retrieves all participants of a specific challenge.
 * Returns an array of ChallengeParticipant objects for the given challenge.
 * @param {string} challengeId - The unique identifier of the challenge
 * @returns {Promise<ChallengeParticipant[]>} An array of ChallengeParticipant objects, or empty array if retrieval fails
 */
const getChallengeParticipants = async (challengeId) => {
    try {
        const snapshot = await FirebaseManager.getAllDocuments(
            `${CHALLENGES_COLLECTION}/${challengeId}/${CHALLENGE_PARTICIPANTS_SUBCOLLECTION}`
        );
        
        const participants = [];
        snapshot.forEach(doc => {
            const participantData = doc.data();
            const participant = ChallengeParticipant.fromJSON(participantData);
            participants.push(participant);
        });
        
        return participants;
    } catch (error) {
        console.error('Failed to get challenge participants:', error);
        return [];
    }
};

/**
 * Loads participants for a challenge object.
 * Fetches and assigns participants to the challenge's participants property.
 * @param {Challenge} challenge - The Challenge object to load participants for
 */
const loadChallengeParticipants = async (challenge) => {
    try {
        const participants = await getChallengeParticipants(challenge.challengeId);
        challenge.participants = participants;
    } catch (error) {
        console.error('Failed to load participants for challenge:', challenge.challengeId);
        challenge.participants = [];
    }
};

/**
 * Retrieves a specific challenge by its ID.
 * Loads the challenge data and its participants from the database.
 * @param {string} challengeId - The unique identifier of the challenge to retrieve
 * @returns {Promise<Challenge>} The Challenge object with participants loaded
 * @throws {Error} If challenge retrieval fails or challenge is not found
 */
const getChallenge = async (challengeId) => {
    try {
        const challengeDoc = await FirebaseManager.readDocument(CHALLENGES_COLLECTION, challengeId);
        
        if (!challengeDoc) {
            throw new Error('Challenge not found');
        }
        
        const challenge = Challenge.fromJSON({
            ...challengeDoc,
            challengeId: challengeId
        });
        
        await loadChallengeParticipants(challenge);
        
        return challenge;
    } catch (error) {
        console.error('Failed to get challenge:', error);
        throw error;
    }
};

/**
 * Retrieves all challenges that a specific user is participating in.
 * Filters all challenges to return only those where the user is a participant.
 * @param {string} userId - The unique identifier of the user
 * @returns {Promise<Challenge[]>} An array of Challenge objects the user is participating in, or empty array if retrieval fails
 */
const getUserChallenges = async (userId) => {
    try {
        const allChallenges = await getAllChallenges();
        
        const userChallenges = allChallenges.filter(challenge => 
            challenge.hasParticipant(userId)
        );
        
        return userChallenges;
    } catch (error) {
        console.error('Failed to get user challenges:', error);
        return [];
    }
};

/**
 * Marks a challenge as completed for a specific user.
 * Updates the participant's record with a completion timestamp.
 * @param {string} challengeId - The unique identifier of the challenge
 * @param {string} userId - The unique identifier of the user completing the challenge
 * @returns {Promise<boolean>} True if completion was successful
 * @throws {Error} If challenge completion fails or participant is not found
 */
const completeChallengeForUser = async (challengeId, userId) => {
    try {
        const participant = await FirebaseManager.readDocument(
            `${CHALLENGES_COLLECTION}/${challengeId}/${CHALLENGE_PARTICIPANTS_SUBCOLLECTION}`,
            userId
        );
        
        if (!participant) {
            throw new Error('Participant not found');
        }
        
        await FirebaseManager.updateDocument(
            `${CHALLENGES_COLLECTION}/${challengeId}/${CHALLENGE_PARTICIPANTS_SUBCOLLECTION}`,
            userId,
            { completedAt: Date.now() },
            true
        );
        
        return true;
    } catch (error) {
        console.error('Failed to complete challenge:', error);
        throw error;
    }
};

/**
 * Challenge Management System
 * 
 * Provides comprehensive challenge management functionality including:
 * - Creating new challenges with automatic participant assignment
 * - Retrieving challenges by various filters (all, public, group-specific, user-specific)
 * - Managing challenge participation (join/leave)
 * - Updating and deleting challenges
 * - Handling challenge completion for users
 * - Managing group-based challenge assignments
 * 
 * Supports different challenge visibility levels and automatic user assignment
 * based on challenge type and user group memberships.
 * 
 * @namespace ChallengeManagement
 */
const ChallengeManagement = {
    createChallenge,
    getAllChallenges,
    getPublicChallenges,
    getGroupChallenges,
    updateChallenge,
    deleteChallenge,
    joinChallenge,
    leaveChallenge,
    getChallengeParticipants,
    getChallenge,
    getUserChallenges,
    completeChallengeForUser,
    addUserToGroupChallenges,
    removeUserFromGroupChallenges,
    addNewUserToChallenges
};

export default ChallengeManagement;