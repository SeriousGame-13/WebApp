import { aggregate, buildConditions } from './firebase/FirebaseHelper.jsx';
import BadgeManagement from "./BadgeManagement.jsx";
import ChallengeManagement from './ChallengeManagement.jsx';
import FirestoreManager from './firebase/FirestoreManager.jsx';
import { CHALLENGE_STATUS, CHALLENGE_STYLE } from './interfaces/Constants.jsx';
import TournamentManagement from './TournamentManagement.jsx';
import UserManagement from './UserManagementSystem.jsx';

/**
 * Awards rewards to challenge participants
 * @param {string} challengeId - ID of the challenge
 * @returns {Promise<void>}
 */
const awardChallengeRewards = async (challengeId) => {
    try {
        const challenge = await ChallengeManagement.getChallenge(challengeId);
        if (!challenge || challenge.rewardPoints <= 0) {
            return;
        }

        const participants = await ChallengeManagement.getChallengeParticipants(challengeId);

        let setFinished = false;
        for (const participant of participants) {
            switch (challenge.challengeStyle) {
                case CHALLENGE_STYLE.GROUP:
                    UserManagement.addPoints(participant.userId, challenge.rewardPoints);
                    setFinished = true;
                    break;
                case CHALLENGE_STYLE.INDIVIDUAL:
                    if (participant.completed) {
                        UserManagement.addPoints(participant.userId, challenge.rewardPoints);
                    }
                    break;
                case CHALLENGE_STYLE.TOURNAMENT:
                    await awardTournamentRewards(challengeId);
                    break;
            }
        }

        if (setFinished) {
            await ChallengeManagement.updateChallenge(challengeId, { status: CHALLENGE_STATUS.FINISHED });
        }
    } catch (error) {
        console.error('Failed to award challenge rewards:', error);
    }
};

/**
 * Awards rewards to tournament winners. TOP 5 participants receive multiplied points based on their rank.
 * @param {string} tournamentId - ID of the tournament
 * @returns {Promise<void>}
 */
const awardTournamentRewards = async (tournamentId) => {
    try {
        const tournament = await TournamentManagement.getTournament(tournamentId);
        if (!tournament || tournament.challengeType !== CHALLENGE_STYLE.TOURNAMENT) {
            return;
        }

        const participants = await TournamentManagement.getTournamentParticipants(tournamentId);
        
        // Sort participants by their progress/score (assuming higher is better)
        const sortedParticipants = participants
            .filter(p => p.completed) // Only include completed participants
            .sort((a, b) => (b.progress || 0) - (a.progress || 0));

        // Award different points based on ranking
        const rewardStructure = {
            1: tournament.rewardPoints * 5,
            2: tournament.rewardPoints * 4,
            3: tournament.rewardPoints * 3,
            4: tournament.rewardPoints * 2,
            5: tournament.rewardPoints * 1.5,
        };

        for (let i = 0; i < sortedParticipants.length && i < 5; i++) {
            const participant = sortedParticipants[i];
            const rank = i + 1;
            const reward = rewardStructure[rank] || tournament.rewardPoints;
            
            if (reward > 0) {
                await UserManagement.addPoints(participant.userId, Math.floor(reward));
            }
        }

        // Mark tournament as finished after awarding rewards
        await ChallengeManagement.updateChallenge(tournamentId, { status: CHALLENGE_STATUS.FINISHED });
    } catch (error) {
        console.error('Failed to award tournament rewards:', error);
    }
};

/**
 * Awards badges to a user based on their activities and achievements.
 * 
 * This function retrieves a user's data and processes all available badges to determine if the user
 * qualifies for any of them.  * 
 * @function awardBadges
 * @param {string} userId - The unique identifier of the user to award badges to
 * @returns {Promise<void>} - A promise that resolves when the badge awarding process is complete
 * 
 * @example
 * // Award badges to a specific user
 * await awardBadges('user123');
 */
const awardBadges = async (userId) => {
    const user = await UserManagement.getUser(userId);
    const mappingData = { user: user };

    const badges = await BadgeManagement.getAllBadges();

    for (let badge of badges) {
        const rawConditions = badge.conditions.split('\n');
        const conditions = buildConditions(rawConditions, mappingData);

        const docs = await FirestoreManager.queryDocuments(badge.collection, conditions);
        if (!docs) {
            continue;
        }
        const result = aggregate([{ function: badge.aggregate, field: badge.field }], docs.docs);
        if (result[Object.keys(result)[0]] >= badge.valueToReach) {
            UserManagement.awardBadge(userId, badge.uid);
        }
    }
};



const RewardSystem = {
    awardChallengeRewards,
    awardTournamentRewards,
    awardBadges,
};

export default RewardSystem;