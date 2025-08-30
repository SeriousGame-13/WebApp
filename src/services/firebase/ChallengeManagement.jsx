import FirebaseManager from './FirestoreManager.jsx';
import { Challenge, ChallengeParticipant } from '../interfaces/challenge.jsx';
import { CHALLENGE_VISIBILITY } from '../interfaces/constants.jsx';
import UserManagement from './UserManagementSystem.jsx';
import GroupManagement from './GroupManagementSystem.jsx';
import { CHALLENGES_COLLECTION, CHALLENGE_PARTICIPANTS_SUBCOLLECTION } from './collections';

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

const updateChallenge = async (challengeId, challengeData) => {
    try {
        await FirebaseManager.updateDocument(CHALLENGES_COLLECTION, challengeId, challengeData, true);
        return true;
    } catch (error) {
        console.error('Failed to update challenge:', error);
        throw error;
    }
};

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

const loadChallengeParticipants = async (challenge) => {
    try {
        const participants = await getChallengeParticipants(challenge.challengeId);
        challenge.participants = participants;
    } catch (error) {
        console.error('Failed to load participants for challenge:', challenge.challengeId);
        challenge.participants = [];
    }
};

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

const getUserChallenges = async (userId) => {
    try {
        // 모든 챌린지를 조회한 후 해당 사용자가 참가한 것만 필터링
        // 더 효율적인 방법이 있다면 나중에 개선 가능
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