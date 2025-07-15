import CompetitonSystem from './CompetitionSystem';
import UserManagement from './UserManagementSystem';


/**
 * Awards rewards to challenge participants
 * @param {string} challengeId - ID of the challenge
 * @returns {Promise<void>}
 */
const awardChallengeRewards = async (challengeId) => {
    try {
        const challenge = await CompetitonSystem.getChallenge(challengeId);
        if (!challenge || challenge.rewardPoints <= 0) {
            return;
        }

        const participants = await CompetitonSystem.getChallengeParticipants(challengeId);
        
        for (const participant of participants) {
            if (participant.completed) {
                await UserManagement.addPoints(participant.userId, challenge.rewardPoints);
            }
        }
    } catch (error) {
        console.error('Failed to award challenge rewards:', error);
    }
};

/**
 * Awards rewards to tournament winners. TOP 5 participants receive multiplied points based on their rank.
 * @param {string} challengeId - ID of the tournament
 * @returns {Promise<void>}
 */
const awardTournamentRewards = async (challengeId) => {
    try {
        const challenge = await CompetitonSystem.getChallenge(challengeId);
        if (!challenge || challenge.challengeType !== CHALLENGE_TYPE.TOURNAMENT) {
            return;
        }

        const results = await CompetitonSystem.getChallengeResults(challengeId);
        
        // TODO: Award different points based on ranking?
        const rewardStructure = {
            1: challenge.rewardPoints * 5,
            2: challenge.rewardPoints * 4, 
            3: challenge.rewardPoints * 3, 
            4: challenge.rewardPoints * 2, 
            5: challenge.rewardPoints * 1.5, 
        };

        for (const result of results) {
            const reward = rewardStructure[result.rank] || challenge.rewardPoints;
            if (reward > 0) {
                await UserManagement.addPoints(result.userId, Math.floor(reward));
            }
        }
    } catch (error) {
        console.error('Failed to award tournament rewards:', error);
    }
};


const RewardSystem = {    
    awardChallengeRewards,
    awardTournamentRewards,
};

export default RewardSystem;