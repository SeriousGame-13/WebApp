/**
 * @fileoverview Tournament Management Module
 * 
 * This module provides tournament-specific functionality built on top of the Challenge Management system.
 * Tournaments are specialized challenges with specific tournament logic and workflow.
 * It handles tournament creation, management, and result calculation while leveraging
 * the underlying challenge infrastructure.
 * 
 * @author Igor, Alexander, Hyunu, Robert
 * @version 1.0.0
 */

import ChallengeManagement from './ChallengeManagement.jsx';
import { Challenge, ChallengeParticipant } from './interfaces/Challenge.jsx';
import { CHALLENGE_STYLE, CHALLENGE_VISIBILITY } from './interfaces/Constants.jsx';


/**
 * Creates a new tournament (specialized challenge) in the database.
 * Tournaments are challenges with specific tournament-style configuration and behavior.
 * @param {string} creatorId - The ID of the user creating the tournament
 * @param {Object} tournamentData - The tournament configuration data
 * @param {string} tournamentData.name - The name of the tournament
 * @param {string} tournamentData.description - The description of the tournament
 * @param {number} tournamentData.startDate - The start date timestamp
 * @param {number} tournamentData.endDate - The end date timestamp
 * @param {string} [tournamentData.visibility] - The visibility level (defaults to PUBLIC)
 * @param {string} [tournamentData.groupId] - The group ID if this is a group tournament
 * @param {string} [tournamentData.targetExerciseId] - The target exercise ID if applicable
 * @param {number} [tournamentData.targetValue] - The target value to achieve
 * @param {number} [tournamentData.rewardPoints] - The reward points (defaults to 100)
 * @returns {Promise<Challenge>} The created tournament Challenge object
 * @throws {Error} If tournament creation fails
 */
const createTournament = async (creatorId, tournamentData) => {
    try {
        const challengeData = {
            name: tournamentData.name,
            description: tournamentData.description,
            startDate: tournamentData.startDate,
            endDate: tournamentData.endDate,
            creatorId: creatorId,
            rewardPoints: tournamentData.rewardPoints || 100,
            challengeType: CHALLENGE_STYLE.TOURNAMENT,
            visibility: tournamentData.visibility || CHALLENGE_VISIBILITY.PUBLIC,
            groupId: tournamentData.groupId || null,
            targetExerciseId: tournamentData.targetExerciseId || null,
            targetValue: tournamentData.targetValue || null
        };
        
        return await ChallengeManagement.createChallenge(challengeData);
    } catch (error) {
        console.error('Failed to create tournament:', error);
        throw error;
    }
};

/**
 * Retrieves a tournament by its ID.
 * Validates that the challenge is actually a tournament type.
 * @param {string} tournamentId - The unique identifier of the tournament
 * @returns {Promise<Challenge|null>} The tournament Challenge object or null if not found or not a tournament
 */
const getTournament = async (tournamentId) => {
    try {
        const challenge = await ChallengeManagement.getChallenge(tournamentId);
        if (challenge && challenge.challengeType === CHALLENGE_STYLE.TOURNAMENT) {
            return challenge;
        }
        return null;
    } catch (error) {
        console.error('Failed to get tournament:', error);
        return null;
    }
};

/**
 * Updates tournament data in the database.
 * Wrapper around challenge update functionality specifically for tournaments.
 * @param {string} tournamentId - The unique identifier of the tournament
 * @param {Object} tournamentData - The tournament data to update
 * @param {string} [tournamentData.name] - The updated tournament name
 * @param {string} [tournamentData.description] - The updated tournament description
 * @param {number} [tournamentData.startDate] - The updated start date timestamp
 * @param {number} [tournamentData.endDate] - The updated end date timestamp
 * @param {number} [tournamentData.rewardPoints] - The updated reward points
 * @param {string} [tournamentData.visibility] - The updated visibility level
 * @returns {Promise<boolean>} True if update was successful
 * @throws {Error} If tournament update fails or tournament not found
 */
const updateTournament = async (tournamentId, tournamentData) => {
    try {
        const tournament = await getTournament(tournamentId);
        if (!tournament) {
            throw new Error('Tournament not found');
        }
        
        return await ChallengeManagement.updateChallenge(tournamentId, tournamentData);
    } catch (error) {
        console.error('Failed to update tournament:', error);
        throw error;
    }
};

/**
 * Deletes a tournament and all its participants from the database.
 * Wrapper around challenge deletion functionality specifically for tournaments.
 * @param {string} tournamentId - The unique identifier of the tournament to delete
 * @returns {Promise<boolean>} True if deletion was successful
 * @throws {Error} If tournament deletion fails or tournament not found
 */
const deleteTournament = async (tournamentId) => {
    try {
        const tournament = await getTournament(tournamentId);
        if (!tournament) {
            throw new Error('Tournament not found');
        }
        
        return await ChallengeManagement.deleteChallenge(tournamentId);
    } catch (error) {
        console.error('Failed to delete tournament:', error);
        throw error;
    }
};

/**
 * Adds a user as a participant to a tournament.
 * Wrapper around challenge join functionality specifically for tournaments.
 * @param {string} tournamentId - The unique identifier of the tournament to join
 * @param {string} userId - The unique identifier of the user joining the tournament
 * @returns {Promise<ChallengeParticipant>} The created tournament participant object
 * @throws {Error} If joining the tournament fails or tournament not found
 */
const joinTournament = async (tournamentId, userId) => {
    try {
        const tournament = await getTournament(tournamentId);
        if (!tournament) {
            throw new Error('Tournament not found');
        }
        
        return await ChallengeManagement.joinChallenge(tournamentId, userId);
    } catch (error) {
        console.error('Failed to join tournament:', error);
        throw error;
    }
};

/**
 * Removes a user from a tournament.
 * Wrapper around challenge leave functionality specifically for tournaments.
 * @param {string} tournamentId - The unique identifier of the tournament to leave
 * @param {string} userId - The unique identifier of the user leaving the tournament
 * @returns {Promise<boolean>} True if leaving the tournament was successful
 * @throws {Error} If leaving the tournament fails or tournament not found
 */
const leaveTournament = async (tournamentId, userId) => {
    try {
        const tournament = await getTournament(tournamentId);
        if (!tournament) {
            throw new Error('Tournament not found');
        }
        
        return await ChallengeManagement.leaveChallenge(tournamentId, userId);
    } catch (error) {
        console.error('Failed to leave tournament:', error);
        throw error;
    }
};

/**
 * Retrieves all participants of a specific tournament.
 * Wrapper around challenge participants functionality specifically for tournaments.
 * @param {string} tournamentId - The unique identifier of the tournament
 * @returns {Promise<ChallengeParticipant[]>} An array of tournament participants, or empty array if retrieval fails
 */
const getTournamentParticipants = async (tournamentId) => {
    try {
        const tournament = await getTournament(tournamentId);
        if (!tournament) {
            throw new Error('Tournament not found');
        }
        
        return await ChallengeManagement.getChallengeParticipants(tournamentId);
    } catch (error) {
        console.error('Failed to get tournament participants:', error);
        return [];
    }
};

/**
 * Retrieves all tournaments from the database.
 * Filters all challenges to return only those with tournament type.
 * @param {Object} [filters={}] - Additional filters to apply
 * @param {string} [filters.visibility] - Filter by visibility level
 * @param {string} [filters.groupId] - Filter by group ID
 * @param {string} [filters.creatorId] - Filter by creator ID
 * @param {number} [limit=50] - Maximum number of results to return
 * @returns {Promise<Challenge[]>} An array of tournament Challenge objects
 */
const getTournaments = async (filters = {}, limit = 50) => {
    try {
        const allChallenges = await ChallengeManagement.getAllChallenges();
        
        let tournaments = allChallenges.filter(challenge => 
            challenge.challengeType === CHALLENGE_STYLE.TOURNAMENT
        );
        
        // Apply additional filters
        if (filters.visibility) {
            tournaments = tournaments.filter(tournament => 
                tournament.visibility === filters.visibility
            );
        }
        
        if (filters.groupId) {
            tournaments = tournaments.filter(tournament => 
                tournament.groupId === filters.groupId
            );
        }
        
        if (filters.creatorId) {
            tournaments = tournaments.filter(tournament => 
                tournament.creatorId === filters.creatorId
            );
        }
        
        // Apply limit
        if (limit && tournaments.length > limit) {
            tournaments = tournaments.slice(0, limit);
        }
        
        return tournaments;
    } catch (error) {
        console.error('Failed to get tournaments:', error);
        return [];
    }
};

/**
 * Retrieves all public tournaments.
 * Returns tournaments with PUBLIC visibility that are accessible to all users.
 * @returns {Promise<Challenge[]>} An array of public tournament Challenge objects
 */
const getPublicTournaments = async () => {
    try {
        return await getTournaments({ visibility: CHALLENGE_VISIBILITY.PUBLIC });
    } catch (error) {
        console.error('Failed to get public tournaments:', error);
        return [];
    }
};

/**
 * Retrieves all tournaments for a specific group.
 * Returns tournaments with GROUP visibility that belong to the specified group.
 * @param {string} groupId - The unique identifier of the group
 * @returns {Promise<Challenge[]>} An array of group tournament Challenge objects
 */
const getGroupTournaments = async (groupId) => {
    try {
        return await getTournaments({ 
            visibility: CHALLENGE_VISIBILITY.GROUP, 
            groupId: groupId 
        });
    } catch (error) {
        console.error('Failed to get group tournaments:', error);
        return [];
    }
};

/**
 * Retrieves all tournaments created by a specific user.
 * @param {string} creatorId - The unique identifier of the creator
 * @returns {Promise<Challenge[]>} An array of tournament Challenge objects created by the user
 */
const getUserCreatedTournaments = async (creatorId) => {
    try {
        return await getTournaments({ creatorId: creatorId });
    } catch (error) {
        console.error('Failed to get user created tournaments:', error);
        return [];
    }
};

/**
 * Retrieves all tournaments that a specific user is participating in.
 * @param {string} userId - The unique identifier of the user
 * @returns {Promise<Challenge[]>} An array of tournament Challenge objects the user is participating in
 */
const getUserTournaments = async (userId) => {
    try {
        const userChallenges = await ChallengeManagement.getUserChallenges(userId);
        
        const userTournaments = userChallenges.filter(challenge => 
            challenge.challengeType === CHALLENGE_STYLE.TOURNAMENT
        );
        
        return userTournaments;
    } catch (error) {
        console.error('Failed to get user tournaments:', error);
        return [];
    }
};

/**
 * Marks a tournament as completed for a specific user.
 * Updates the participant's record with a completion timestamp.
 * @param {string} tournamentId - The unique identifier of the tournament
 * @param {string} userId - The unique identifier of the user completing the tournament
 * @returns {Promise<boolean>} True if completion was successful
 * @throws {Error} If tournament completion fails or tournament/participant not found
 */
const completeTournamentForUser = async (tournamentId, userId) => {
    try {
        const tournament = await getTournament(tournamentId);
        if (!tournament) {
            throw new Error('Tournament not found');
        }
        
        return await ChallengeManagement.completeChallengeForUser(tournamentId, userId);
    } catch (error) {
        console.error('Failed to complete tournament for user:', error);
        throw error;
    }
};

/**
 * Tournament Management System
 * 
 * Provides tournament-specific functionality built on top of the Challenge Management system.
 * Tournaments are specialized challenges with tournament-style workflow and logic.
 * 
 * Key features include:
 * - Creating and managing tournaments as specialized challenges
 * - Tournament participant management (join/leave)
 * - Retrieving tournaments by various filters (public, group-based, user-specific)
 * - Tournament completion tracking
 * - Integration with the underlying challenge infrastructure
 * 
 * All tournament operations leverage the ChallengeManagement module while providing
 * tournament-specific validation and business logic.
 * 
 * @namespace TournamentManagement
 */
const TournamentManagement = {
    createTournament,
    getTournament,
    updateTournament,
    deleteTournament,
    joinTournament,
    leaveTournament,
    getTournamentParticipants,
    getTournaments,
    getPublicTournaments,
    getGroupTournaments,
    getUserCreatedTournaments,
    getUserTournaments,
    completeTournamentForUser
};

export default TournamentManagement;

