import { v4 as uuidv4 } from 'uuid';
import FirebaseManager from './FirestoreManager';
import UserManagement from './UserManagementSystem';
import GroupManagementSystem from './GroupManagementSystem';
import RewardSystem from './RewardSystem';
import { Challenge, ChallengeParticipant } from '../interfaces/challenge';
import { CHALLENGE_STYLE, CHALLENGE_STATUS, CHALLENGE_PARTICIPATION_STATUS } from '../interfaces/constants';
import { CHALLENGES_COLLECTION, CHALLENGE_PARTICIPANTS_SUBCOLLECTION } from './collections.jsx'


/**
 * Creates a new challenge
 * @param {string} creatorId - ID of user creating the challenge
 * @param {object} challengeData - Challenge details
 * @returns {Promise<Challenge>} Created challenge object
 * @throws {Error} If creation fails
 */
const createChallenge = async (creatorId, challengeData) => {
    try {
        const challengeId = uuidv4();
        const challenge = new Challenge({
            challengeId: challengeId,
            name: challengeData.name,
            description: challengeData.description || '',
            startDate: challengeData.startDate,
            endDate: challengeData.endDate,
            creatorId: creatorId,
            rewardPoints: challengeData.rewardPoints || 0,
            challengeType: challengeData.challengeType || CHALLENGE_STYLE.INDIVIDUAL,
            targetExerciseId: challengeData.targetExerciseId || null,
            targetValue: challengeData.targetValue,
            participants: [],
        });

        if (!challenge.validate()) {
            throw new Error('Invalid challenge data provided');
        }

        await FirebaseManager.createDocument(CHALLENGES_COLLECTION, challenge.toJSON(), true);
        joinChallenge(challengeId, creatorId);
        
        return await getChallenge(challengeId);
    } catch (error) {
        console.error('Failed to create challenge:', error);
        throw error;
    }
};

/**
 * Retrieves a challenge by ID and converts to Challenge object
 * @param {string} challengeId - ID of the challenge
 * @returns {Promise<Challenge|null>} Challenge object or null if not found
 */
const getChallenge = async (challengeId) => {
    try {
        const data = await FirebaseManager.readDocument(CHALLENGES_COLLECTION, challengeId);
        if (!data) return null;
        
        return Challenge.fromJSON(data);
    } catch (error) {
        console.error('Failed to get challenge:', error);
        return null;
    }
};

/**
 * Validates challenge and user permissions
 * @param {string} challengeId - ID of the challenge
 * @param {string} userId - ID of the user
 * @returns {Promise<Challenge>} Challenge object
 * @throws {Error} If challenge not found or permission denied
 */
async function getValidChallenge(challengeId, userId) {
    const challenge = await getChallenge(challengeId);
    if (!challenge) {
        throw new Error('Challenge not found');
    }

    if (challenge.creatorId !== userId) {
        throw new Error('Permission denied: Only the creator can modify this challenge');
    }
    return challenge;
}

/**
 * Updates challenge details
 * @param {string} challengeId - ID of the challenge
 * @param {string} userId - ID of user making the update
 * @param {Challenge} challenge - Challenge to update
 * @returns {Promise<Challenge>} Updated challenge object
 * @throws {Error} If update fails or user doesn't have permission
 */
const updateChallenge = async (challengeId, userId, challenge) => {
    try {
        const challenge = await getValidChallenge(challengeId, userId);

        // Don't allow certain updates after challenge has started
        if (challenge.status === CHALLENGE_STATUS.RUNNING || 
            challenge.status === CHALLENGE_STATUS.FINISHED) {
            const restrictedFields = ['startDate', 'endDate', 'targetValue', 'challengeType'];
            const hasRestrictedUpdate = Object.keys(challenge).some(key => restrictedFields.includes(key));
            
            if (hasRestrictedUpdate) {
                throw new Error('Cannot update core challenge details after it has started');
            }
        }

        await FirebaseManager.updateDocument(CHALLENGES_COLLECTION, challengeId, challenge, true);
        
        return await getChallenge(challengeId);
    } catch (error) {
        console.error('Failed to update challenge:', error);
        throw error;
    }
};

/**
 * Starts a challenge (moves from OPEN to RUNNING)
 * @param {string} challengeId - ID of the challenge
 * @param {string} userId - ID of user starting the challenge
 * @returns {Promise<Challenge>} Updated challenge object
 * @throws {Error} If starting fails or user doesn't have permission
 */
const startChallenge = async (challengeId, userId) => {
    try {
        const challenge = await getValidChallenge(challengeId, userId);

        if (challenge.status !== CHALLENGE_STATUS.OPEN) {
            throw new Error('Challenge must be open to start');
        }

        // TODO: CRON JOB?
        if (challenge.hasNotStarted()) {
            throw new Error('Challenge start date has not been reached');
        }

        return await updateChallenge(challengeId, userId, {
            status: CHALLENGE_STATUS.RUNNING,
        });
    } catch (error) {
        console.error('Failed to start challenge:', error);
        throw error;
    }
};

/**
 * Finishes a challenge and awards rewards
 * @param {string} challengeId - ID of the challenge
 * @param {string} userId - ID of user finishing the challenge
 * @returns {Promise<Array>} Challenge results
 * @throws {Error} If finishing fails or user doesn't have permission
 */
const finishChallenge = async (challengeId, userId) => {
    try {
        const challenge = await getValidChallenge(challengeId, userId);

        if (challenge.status !== CHALLENGE_STATUS.RUNNING) {
            throw new Error('Challenge must be running to finish it');
        }

        if (challenge.isActive()) {
            console.warn('Challenge is being finished before end date');
        }

        if (challenge.challengeType === CHALLENGE_STYLE.TOURNAMENT) {
            await RewardSystem.awardTournamentRewards(challengeId);
        } else {
            await RewardSystem.awardChallengeRewards(challengeId);
        }

        await updateChallenge(challengeId, userId, {
            status: CHALLENGE_STATUS.FINISHED,
        });

        return await getChallengeResults(challengeId);
    } catch (error) {
        console.error('Failed to finish challenge:', error);
        throw error;
    }
};

/**
 * Joins a challenge as an individual participant
 * @param {string} challengeId - ID of the challenge
 * @param {string} userId - ID of user joining
 * @returns {Promise<ChallengeParticipant>} Participant object
 * @throws {Error} If joining fails
 */
const joinChallenge = async (challengeId, userId) => {
    try {
        const challenge = await getChallenge(challengeId);
        if (!challenge) {
            throw new Error('Challenge not found');
        }

        if (challenge.status !== CHALLENGE_STATUS.OPEN) {
            throw new Error('Challenge is not open for participation');
        }
        if (challenge.hasParticipant(userId)) {
            throw new Error('User is already participating in this challenge');
        }

        const participantId = `${challengeId}_${userId}`;
        const participant = new ChallengeParticipant({
            participantId,
            challengeId,
            userId,
            completed: false,
            completedAt: null,
        });

        if (!participant.validate()) {
            throw new Error('Invalid participant data');
        }

        await FirebaseManager.createDocument(CHALLENGE_PARTICIPANTS_SUBCOLLECTION, participant.toJSON(), true);

        challenge.addParticipant(participant);
        await FirebaseManager.updateDocument(CHALLENGES_COLLECTION, challengeId, { 
                participants: challenge.participants.map(p => p.toJSON ? p.toJSON() : p)
        }, true);

        return participant;
    } catch (error) {
        console.error('Failed to join challenge:', error);
        throw error;
    }
};

/**
 * Joins a challenge as a group
 * @param {string} challengeId - ID of the challenge
 * @param {string} groupId - ID of the group joining
 * @param {string} userId - ID of user representing the group
 * @returns {Promise<Array>} Array of participant objects for group members
 * @throws {Error} If joining fails
 */
const joinChallengeAsGroup = async (challengeId, groupId, userId) => {
    try {
        const challenge = await getChallenge(challengeId);
        if (!challenge) {
            throw new Error('Challenge not found');
        }

        const group = await GroupManagementSystem.getGroupWithMembers(groupId);
        if (!group || !group.isUserAdmin(userId)) {
            throw new Error('Permission denied: Only group admins can join challenges for the group');
        }

        const activeMembers = group.getActiveMembers();
        const participants = [];
        
        for (const member of activeMembers) {
            try {
                const participant = await joinChallenge(challengeId, member.userId);
                participants.push(participant);
            } catch (error) {
                console.warn(`Failed to add member ${member.userId} to challenge:`, error.message);
            }
        }

        return participants;
    } catch (error) {
        console.error('Failed to join challenge as group:', error);
        throw error;
    }
};

/**
 * Withdraws from a challenge
 * @param {string} challengeId - ID of the challenge
 * @param {string} userId - ID of user withdrawing
 * @returns {Promise<void>}
 * @throws {Error} If withdrawal fails
 */
const withdrawFromChallenge = async (challengeId, userId) => {
    try {
        const participant = await getChallengeParticipant(challengeId, userId);
        if (!participant) {
            throw new Error('Participant not found');
        }

        if (participant.completed) {
            throw new Error('Cannot withdraw from a completed challenge');
        }

        await FirebaseManager.updateDocument(
            CHALLENGE_PARTICIPANTS_SUBCOLLECTION,
            participant.participantId,
            { status: CHALLENGE_PARTICIPATION_STATUS.WITHDRAWN },
            true
        );

        const challenge = await getChallenge(challengeId);
        if (challenge) {
            challenge.removeParticipant(participant.participantId);
            await FirebaseManager.updateDocument(CHALLENGES_COLLECTION, challengeId, { 
                participants: challenge.participants.map(p => p.toJSON ? p.toJSON() : p)
            }, true);
        }
    } catch (error) {
        console.error('Failed to withdraw from challenge:', error);
        throw error;
    }
};

/**
 * Updates challenge progress for a participant
 * @param {string} challengeId - ID of the challenge
 * @param {string} userId - ID of the participant
 * @param {number} progress - Progress value
 * @returns {Promise<ChallengeParticipant>} Updated participant object
 * @throws {Error} If update fails
 */
const updateChallengeProgress = async (challengeId, userId, progress) => {
    try {
        const challenge = await getChallenge(challengeId);
        if (!challenge) {
            throw new Error('Challenge not found');
        }

        if (challenge.status !== CHALLENGE_STATUS.RUNNING) {
            throw new Error('Challenge is not currently running');
        }

        const participant = await getChallengeParticipant(challengeId, userId);
        if (!participant) {
            throw new Error('Participant not found');
        }

        if (participant.completed) {
            throw new Error('Challenge already completed by this participant');
        }

        const isCompleted = progress >= challenge.targetValue;
        const updateData = {
            progress,
            ...(isCompleted && {
                completed: true,
                completedAt: Date.now(),
                status: CHALLENGE_PARTICIPATION_STATUS.COMPLETED
            })
        };

        await FirebaseManager.updateDocument(
            CHALLENGE_PARTICIPANTS_SUBCOLLECTION,
            participant.participantId,
            updateData,
            true
        );

        if (isCompleted && !participant.completed) {
            participant.complete();            
            const challengeParticipant = challenge.getParticipant(userId);
            if (challengeParticipant) {
                challengeParticipant.complete();
                await FirebaseManager.updateDocument(CHALLENGES_COLLECTION, challengeId, { 
                    participants: challenge.participants.map(p => p.toJSON ? p.toJSON() : p)
                }, true);
            }
        }

        return await getChallengeParticipant(challengeId, userId);
    } catch (error) {
        console.error('Failed to update challenge progress:', error);
        throw error;
    }
};

/**
 * Gets a specific challenge participant
 * @param {string} challengeId - ID of the challenge
 * @param {string} userId - ID of the user
 * @returns {Promise<ChallengeParticipant|null>} Participant object or null if not found
 */
const getChallengeParticipant = async (challengeId, userId) => {
    try {
        const participantId = `${challengeId}_${userId}`;
        const data = await FirebaseManager.readDocument(CHALLENGE_PARTICIPANTS_SUBCOLLECTION, participantId);
        if (!data) return null;
        
        return ChallengeParticipant.fromJSON(data);
    } catch (error) {
        console.error('Failed to get challenge participant:', error);
        return null;
    }
};

/**
 * Gets all participants for a challenge
 * @param {string} challengeId - ID of the challenge
 * @returns {Promise<Array>} Array of participant objects with user data
 */
const getChallengeParticipants = async (challengeId) => {
    try {
        const snapshot = await FirebaseManager.queryDocumentsByFieldValue(
            CHALLENGE_PARTICIPANTS_SUBCOLLECTION,
            'challengeId',
            challengeId
        );

        const participants = [];
        const userPromises = [];

        snapshot.forEach(doc => {
            const participantData = doc.data();
            const participant = ChallengeParticipant.fromJSON(participantData);
            
            const userPromise = UserManagement.getUserData(participant.userId)
                .then(userData => {
                    participants.push({
                        ...participant,
                        userData: userData ? {
                            displayName: userData.displayName,
                            level: userData.level,
                            email: userData.email
                        } : null
                    });
                });
            
            userPromises.push(userPromise);
        });

        await Promise.all(userPromises);
        return participants;
    } catch (error) {
        console.error('Failed to get challenge participants:', error);
        return [];
    }
};

/**
 * Gets challenge results with rankings
 * @param {string} challengeId - ID of the challenge
 * @returns {Promise<Array>} Array of ranked results
 */
const getChallengeResults = async (challengeId) => {
    try {
        const challenge = await getChallenge(challengeId);
        const participants = await getChallengeParticipants(challengeId);
        
        let sortedParticipants;
        if (challenge.challengeType === CHALLENGE_STYLE.TOURNAMENT) {
            sortedParticipants = participants.sort((a, b) => {
                return (b.progress || 0) - (a.progress || 0);
            });
        } else {
            sortedParticipants = participants.sort((a, b) => {
                if (a.completed && !b.completed) return -1;
                if (!a.completed && b.completed) return 1;
                return (b.progress || 0) - (a.progress || 0);
            });
        }

        const results = sortedParticipants.map((participant, index) => ({
            rank: index + 1,
            userId: participant.userId,
            userData: participant.userData,
            progress: participant.progress || 0,
            completed: participant.completed,
            completedAt: participant.completedAt,
            joinedAt: participant.joinedAt
        }));

        return results;
    } catch (error) {
        console.error('Failed to get challenge results:', error);
        return [];
    }
};


/**
 * Gets all challenges with optional filtering
 * @param {object} filters - Optional filters (status, creatorId, challengeType, etc.)
 * @param {number} limit - Maximum number of results
 * @returns {Promise<Array<Challenge>>} Array of challenge objects
 */
const getChallenges = async (filters = {}, limit = 50) => {
    try {
        let challenges = [];
        
        if (filters.status) {
            const snapshot = await FirebaseManager.queryDocumentsByFieldValue(
                CHALLENGES_COLLECTION,
                'status',
                filters.status
            );
            snapshot.forEach(doc => challenges.push(Challenge.fromJSON(doc.data())));
        } else if (filters.creatorId) {
            const snapshot = await FirebaseManager.queryDocumentsByFieldValue(
                CHALLENGES_COLLECTION,
                'creatorId',
                filters.creatorId
            );
            snapshot.forEach(doc => challenges.push(Challenge.fromJSON(doc.data())));
        } else {
            const snapshot = await FirebaseManager.getAllDocuments(CHALLENGES_COLLECTION);
            snapshot.forEach(doc => challenges.push(Challenge.fromJSON(doc.data())));
        }

        if (filters.challengeType) {
            challenges = challenges.filter(c => c.challengeType === filters.challengeType);
        }

        return challenges.slice(0, limit);
    } catch (error) {
        console.error('Failed to get challenges:', error);
        return [];
    }
};

/**
 * Gets available challenges for a user
 * @param {string} userId - ID of the user
 * @returns {Promise<Array<Challenge>>} Array of available challenges
 */
const getAvailableChallenges = async (userId) => {
    try {
        const openChallenges = await getChallenges({ status: CHALLENGE_STATUS.OPEN });
        const runningChallenges = await getChallenges({ status: CHALLENGE_STATUS.RUNNING });
        const allChallenges = [...openChallenges, ...runningChallenges];

        return allChallenges.filter(challenge => !challenge.hasParticipant(userId));
    } catch (error) {
        console.error('Failed to get available challenges:', error);
        return [];
    }
};

/**
 * Gets user's challenge history
 * @param {string} userId - ID of the user
 * @returns {Promise<Array>} Array of user's challenge participations
 */
const getUserChallengeHistory = async (userId) => {
    try {
        const snapshot = await FirebaseManager.queryDocumentsByFieldValue(
            CHALLENGE_PARTICIPANTS_SUBCOLLECTION,
            'userId',
            userId
        );

        const participations = [];
        const challengePromises = [];

        snapshot.forEach(doc => {
            const participationData = doc.data();
            const participation = ChallengeParticipant.fromJSON(participationData);
            
            const challengePromise = getChallenge(participation.challengeId)
                .then(challenge => {
                    participations.push({
                        ...participation,
                        challenge
                    });
                });
            
            challengePromises.push(challengePromise);
        });

        await Promise.all(challengePromises);
        return participations;
    } catch (error) {
        console.error('Failed to get user challenge history:', error);
        return [];
    }
};


/**
 * Creates a new tournament (specialized challenge)
 * @param {string} creatorId - ID of user creating the tournament
 * @param {object} tournamentData - Tournament details
 * @returns {Promise<Challenge>} Created tournament challenge object
 * @throws {Error} If creation fails
 */
const createTournament = async (creatorId, tournamentData) => {
    const challengeData = {
        ...tournamentData,
        challengeType: CHALLENGE_STYLE.TOURNAMENT,
        rewardPoints: tournamentData.rewardPoints || 100
    };
    
    return await createChallenge(creatorId, challengeData);
};

/**
 * Gets a tournament by ID
 * @param {string} tournamentId - ID of the tournament
 * @returns {Promise<Challenge|null>} Tournament challenge object or null if not found
 */
const getTournament = async (tournamentId) => {
    const tournament = await getChallenge(tournamentId);
    if (tournament && tournament.challengeType === CHALLENGE_STYLE.TOURNAMENT) {
        return tournament;
    }
    return null;
};

/**
 * Opens tournament registration (alias for opening challenge)
 * @param {string} tournamentId - ID of the tournament
 * @param {string} userId - ID of user opening registration
 * @returns {Promise<Challenge>} Updated tournament object
 */
const openTournamentRegistration = async (tournamentId, userId) => {
    const tournament = await getTournament(tournamentId);
    if (!tournament) {
        throw new Error('Tournament not found');
    }
    
    return await updateChallenge(tournamentId, userId, {
        status: CHALLENGE_STATUS.OPEN
    });
};

/**
 * Starts a tournament (alias for starting challenge)
 * @param {string} tournamentId - ID of the tournament
 * @param {string} userId - ID of user starting the tournament
 * @returns {Promise<Challenge>} Updated tournament object
 */
const startTournament = async (tournamentId, userId) => {
    const tournament = await getTournament(tournamentId);
    if (!tournament) {
        throw new Error('Tournament not found');
    }
    
    return await startChallenge(tournamentId, userId);
};

/**
 * Finishes a tournament and calculates results
 * @param {string} tournamentId - ID of the tournament
 * @param {string} userId - ID of user finishing the tournament
 * @returns {Promise<Array>} Tournament results
 */
const finishTournament = async (tournamentId, userId) => {
    const tournament = await getTournament(tournamentId);
    if (!tournament) {
        throw new Error('Tournament not found');
    }
    
    return await finishChallenge(tournamentId, userId);
};

/**
 * Calculates tournament results (alias for challenge results with tournament-specific logic)
 * @param {string} tournamentId - ID of the tournament
 * @returns {Promise<Array>} Array of ranked tournament results
 */
const calculateTournamentResults = async (tournamentId) => {
    return await getChallengeResults(tournamentId);
};

/**
 * Gets tournament participants (alias for challenge participants)
 * @param {string} tournamentId - ID of the tournament
 * @returns {Promise<Array>} Array of tournament participants
 */
const getTournamentParticipants = async (tournamentId) => {
    return await getChallengeParticipants(tournamentId);
};

/**
 * Gets all tournaments (challenges with type TOURNAMENT)
 * @param {object} filters - Additional filters
 * @param {number} limit - Maximum number of results
 * @returns {Promise<Array<Challenge>>} Array of tournament objects
 */
const getTournaments = async (filters = {}, limit = 50) => {
    return await getChallenges({
        ...filters,
        challengeType: CHALLENGE_STYLE.TOURNAMENT
    }, limit);
};

const CompetitionSystem = {    
    // Challenge functions
    createChallenge,
    getChallenge,
    updateChallenge,
    startChallenge,
    finishChallenge,
    joinChallenge,
    joinChallengeAsGroup,
    withdrawFromChallenge,
    updateChallengeProgress,
    getChallengeParticipant,
    getChallengeParticipants,
    getChallengeResults,
    getChallenges,
    getAvailableChallenges,
    getUserChallengeHistory,
    
    // Tournament functions. TODO:? Maybe move to another class? for more SOLID
    createTournament,
    getTournament,
    getTournaments,
    openTournamentRegistration,
    startTournament,
    finishTournament,
    calculateTournamentResults,
    getTournamentParticipants
};

export default CompetitionSystem;

