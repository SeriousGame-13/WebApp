import CompetitonSystem from './CompetitionSystem';
import UserManagement from './UserManagementSystem';
import BadgeManagement from "./BadgeManagement";
import { CHALLENGE_STATUS, CHALLENGE_STYLE } from '../interfaces/constants';
import FirestoreManager from './FirestoreManager';
import { aggregate, buildConditions } from '../../utils/helper';
import ChallengeManagement from './ChallengeManagement';

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
        if (!challenge || challenge.challengeType !== CHALLENGE_STYLE.TOURNAMENT) {
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
        const rawstructure = badge.structure.replaceAll('\n', '').split(';');
        let structure = [];
        rawstructure.forEach(str => {
            const temp = str.split(',');
            if (temp.length == 2) {
                const first = temp[0].split(':');
                const second = temp[1].split(':');
                structure.push({ name: first[1], idField: second[1] });
            }
        });
        const rawmapping = badge.mapping.replaceAll('\n', '').split(';');

        let mapping = {};
        rawmapping.forEach(str => {
            const temp = str.split(':');
            if (temp.length == 2) {
                const fields = temp[1].split(',');
                mapping[temp[0]] = fields;
            }
        });

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