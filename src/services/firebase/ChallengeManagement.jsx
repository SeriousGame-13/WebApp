import FirebaseManager from './FirestoreManager.jsx';
import { Challenge, ChallengeParticipant } from '../interfaces/challenge.jsx';
import { CHALLENGE_VISIBILITY, CHALLENGE_PARTICIPATION_STATUS } from '../interfaces/constants.jsx';
import UserManagement from './UserManagementSystem.jsx';
import GroupManagement from './GroupManagementSystem.jsx';
import { CHALLENGES_COLLECTION, CHALLENGE_PARTICIPANTS_SUBCOLLECTION, EXERCISE_COLLECTION } from './collections.jsx';
import { buildConditions } from '../../utils/helper.jsx';

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
            targetValue: challengeData.targetValue || null,
            // store targetField and conditions similar to badges so we can evaluate progress
            targetField: challengeData.targetField || null,
            conditions: challengeData.conditions || ''
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
 * Build analytics conditions from a challenge's conditions string, allowing {user.*} placeholders.
 * Falls back to filtering by current user at depth 0 if no uid filter is present.
 */
function buildChallengeConditions(challengeConditions, mappingData, userId) {
    try {
        const raw = typeof challengeConditions === 'string'
            ? challengeConditions.split('\n').filter(Boolean)
            : Array.isArray(challengeConditions)
                ? challengeConditions
                : [];

        let conditions = buildConditions(raw, mappingData);

        const hasUserFilter = conditions.some(c => (c.field === 'uid' || c.field === 'userId') && String(c.depth) === '0');
        if (!hasUserFilter && userId) {
            conditions.push({ field: 'uid', operator: '==', value: userId, depth: 0 });
        }
        return conditions;
    } catch (e) {
        console.error('Failed to build challenge conditions:', e);
        return userId ? [{ field: 'uid', operator: '==', value: userId, depth: 0 }] : [];
    }
}

/**
 * Evaluate a challenge for a specific user using the targetField and conditions.
 * This version uses Firestore collection group queries (exercises) instead of the deprecated analytics layer.
 * Updates the participant's currentValue and completion status accordingly.
 * @returns {Promise<{total:number, completed:boolean}>}
 */
const evaluateChallengeForUser = async (challengeId, userId) => {
    const challenge = await getChallenge(challengeId);
    if (!challenge) throw new Error('Challenge not found');

    if (!challenge.targetField || !challenge.targetValue) {
        return { total: 0, completed: false };
    }

    const user = await UserManagement.getUser(userId);
    const mappingData = { user };
    const parsedConds = buildChallengeConditions(challenge.conditions || '', mappingData, userId);

    // Translate our internal conditions to Firestore where filters for the exercises collection group.
    // Only conditions at depth 2 (exercises) or global (no depth) apply here directly.
    const groupFilters = parsedConds
        .filter(c => c.depth === undefined || c.depth === null || Number(c.depth) === 2)
        .map(c => ({ field: c.field, operator: c.operator || '==', value: c.value }));

    // Always ensure we're querying for the given user, even if depth metadata differs
    if (!groupFilters.some(f => f.field === 'userId' || f.field === 'uid')) {
        // Our exercise model uses userId, prefer it
        groupFilters.push({ field: 'userId', operator: '==', value: userId });
    }

    // Query all exercises matching conditions and sum the target field client-side
    const snap = await FirebaseManager.queryCollectionGroup(EXERCISE_COLLECTION, groupFilters);
    const total = Array.isArray(snap?.docs)
        ? snap.docs.reduce((acc, d) => {
            const v = d.data()?.[challenge.targetField];
            return acc + (typeof v === 'number' ? v : 0);
        }, 0)
        : 0;
    const isCompleted = total >= Number(challenge.targetValue || 0);

    // Update nested participant document
    const participantDocPath = `${CHALLENGES_COLLECTION}/${challengeId}/${CHALLENGE_PARTICIPANTS_SUBCOLLECTION}`;
    const participant = await FirebaseManager.readDocument(participantDocPath, userId);
    if (!participant) {
        // Not joined or participant missing; nothing to update
        return { total, completed: false };
    }

    const update = { currentValue: total };
    if (isCompleted && !participant.completedAt) {
        update.completedAt = Date.now();
        update.status = CHALLENGE_PARTICIPATION_STATUS.COMPLETED;
    }
    await FirebaseManager.updateDocument(participantDocPath, userId, update, true);

    return { total, completed: isCompleted };
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
            participant,
            userId,
            true
        );

        // Initialize progress using targetField/conditions if available
        try {
            await evaluateChallengeForUser(challengeId, userId);
        } catch (e) {
            console.warn('Failed to evaluate challenge upon join:', e?.message || e);
        }

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
    addNewUserToChallenges,
    evaluateChallengeForUser
};

export default ChallengeManagement;