/**
 * @fileoverview Unit tests for RewardSystem service
 * 
 * Tests cover reward distribution for challenges, tournaments, and badge awarding
 * including different challenge styles and error handling scenarios.
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import RewardSystem from '../../services/RewardSystem.jsx';
import ChallengeManagement from '../../services/ChallengeManagement.jsx';
import TournamentManagement from '../../services/TournamentManagement.jsx';
import UserManagement from '../../services/UserManagementSystem.jsx';
import BadgeManagement from '../../services/BadgeManagement.jsx';
import FirestoreManager from '../../services/firebase/FirestoreManager.jsx';
import { aggregate, buildConditions } from '../../services/firebase/FirebaseHelper.jsx';
import { CHALLENGE_STATUS, CHALLENGE_STYLE } from '../../services/interfaces/Constants.jsx';

// Mock dependencies
vi.mock('../services/ChallengeManagement.jsx');
vi.mock('../services/TournamentManagement.jsx');
vi.mock('../services/UserManagementSystem.jsx');
vi.mock('../services/BadgeManagement.jsx');
vi.mock('../services/firebase/FirestoreManager.jsx');
vi.mock('../services/firebase/FirebaseHelper.jsx');

describe('RewardSystem', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        console.error = vi.fn();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('awardChallengeRewards', () => {
        test('should award rewards for GROUP challenge style', async () => {
            const mockChallenge = {
                challengeStyle: CHALLENGE_STYLE.GROUP,
                rewardPoints: 100
            };

            const mockParticipants = [
                { userId: 'user-1', completed: false },
                { userId: 'user-2', completed: true }
            ];

            vi.mocked(ChallengeManagement.getChallenge).mockResolvedValue(mockChallenge);
            vi.mocked(ChallengeManagement.getChallengeParticipants).mockResolvedValue(mockParticipants);
            vi.mocked(UserManagement.addPoints).mockResolvedValue();
            vi.mocked(ChallengeManagement.updateChallenge).mockResolvedValue();

            await RewardSystem.awardChallengeRewards('challenge-1');

            expect(UserManagement.addPoints).toHaveBeenCalledWith('user-1', 100);
            expect(UserManagement.addPoints).toHaveBeenCalledWith('user-2', 100);
            expect(ChallengeManagement.updateChallenge).toHaveBeenCalledWith(
                'challenge-1',
                { status: CHALLENGE_STATUS.FINISHED }
            );
        });

        test('should award rewards for INDIVIDUAL challenge style only to completed participants', async () => {
            const mockChallenge = {
                challengeStyle: CHALLENGE_STYLE.INDIVIDUAL,
                rewardPoints: 150
            };

            const mockParticipants = [
                { userId: 'user-1', completed: false },
                { userId: 'user-2', completed: true },
                { userId: 'user-3', completed: true }
            ];

            vi.mocked(ChallengeManagement.getChallenge).mockResolvedValue(mockChallenge);
            vi.mocked(ChallengeManagement.getChallengeParticipants).mockResolvedValue(mockParticipants);
            vi.mocked(UserManagement.addPoints).mockResolvedValue();

            await RewardSystem.awardChallengeRewards('challenge-2');

            expect(UserManagement.addPoints).not.toHaveBeenCalledWith('user-1', expect.any(Number));
            expect(UserManagement.addPoints).toHaveBeenCalledWith('user-2', 150);
            expect(UserManagement.addPoints).toHaveBeenCalledWith('user-3', 150);
            expect(ChallengeManagement.updateChallenge).not.toHaveBeenCalled();
        });

        test('should handle TOURNAMENT challenge style by calling awardTournamentRewards', async () => {
            const mockChallenge = {
                challengeStyle: CHALLENGE_STYLE.TOURNAMENT,
                rewardPoints: 200
            };

            const mockParticipants = [
                { userId: 'user-1', completed: true }
            ];

            const mockTournament = {
                challengeType: CHALLENGE_STYLE.TOURNAMENT,
                rewardPoints: 200
            };

            vi.mocked(ChallengeManagement.getChallenge).mockResolvedValue(mockChallenge);
            vi.mocked(ChallengeManagement.getChallengeParticipants).mockResolvedValue(mockParticipants);
            vi.mocked(TournamentManagement.getTournament).mockResolvedValue(mockTournament);
            vi.mocked(TournamentManagement.getTournamentParticipants).mockResolvedValue([]);
            vi.mocked(ChallengeManagement.updateChallenge).mockResolvedValue();

            await RewardSystem.awardChallengeRewards('tournament-1');

            expect(TournamentManagement.getTournament).toHaveBeenCalledWith('tournament-1');
        });

        test('should not award rewards when challenge has no reward points', async () => {
            const mockChallenge = {
                challengeStyle: CHALLENGE_STYLE.INDIVIDUAL,
                rewardPoints: 0
            };

            vi.mocked(ChallengeManagement.getChallenge).mockResolvedValue(mockChallenge);

            await RewardSystem.awardChallengeRewards('challenge-3');

            expect(ChallengeManagement.getChallengeParticipants).not.toHaveBeenCalled();
            expect(UserManagement.addPoints).not.toHaveBeenCalled();
        });

        test('should handle missing challenge gracefully', async () => {
            vi.mocked(ChallengeManagement.getChallenge).mockResolvedValue(null);

            await RewardSystem.awardChallengeRewards('nonexistent-challenge');

            expect(ChallengeManagement.getChallengeParticipants).not.toHaveBeenCalled();
        });

        test('should handle errors gracefully', async () => {
            const error = new Error('Database error');
            vi.mocked(ChallengeManagement.getChallenge).mockRejectedValue(error);

            await RewardSystem.awardChallengeRewards('error-challenge');

            expect(console.error).toHaveBeenCalledWith('Failed to award challenge rewards:', error);
        });
    });

    describe('awardTournamentRewards', () => {
        test('should award ranked rewards to tournament participants', async () => {
            const mockTournament = {
                challengeType: CHALLENGE_STYLE.TOURNAMENT,
                rewardPoints: 100
            };

            const mockParticipants = [
                { userId: 'user-1', completed: true, progress: 150 },
                { userId: 'user-2', completed: true, progress: 200 },
                { userId: 'user-3', completed: true, progress: 100 },
                { userId: 'user-4', completed: false, progress: 80 }
            ];

            vi.mocked(TournamentManagement.getTournament).mockResolvedValue(mockTournament);
            vi.mocked(TournamentManagement.getTournamentParticipants).mockResolvedValue(mockParticipants);
            vi.mocked(UserManagement.addPoints).mockResolvedValue();
            vi.mocked(ChallengeManagement.updateChallenge).mockResolvedValue();

            await RewardSystem.awardTournamentRewards('tournament-1');

            // Check rewards based on ranking (sorted by progress: user-2: 200, user-1: 150, user-3: 100)
            expect(UserManagement.addPoints).toHaveBeenCalledWith('user-2', 500); // 1st place: 100 * 5
            expect(UserManagement.addPoints).toHaveBeenCalledWith('user-1', 400); // 2nd place: 100 * 4
            expect(UserManagement.addPoints).toHaveBeenCalledWith('user-3', 300); // 3rd place: 100 * 3
            expect(UserManagement.addPoints).not.toHaveBeenCalledWith('user-4', expect.any(Number)); // Not completed

            expect(ChallengeManagement.updateChallenge).toHaveBeenCalledWith(
                'tournament-1',
                { status: CHALLENGE_STATUS.FINISHED }
            );
        });

        test('should handle tournament with more than 5 participants', async () => {
            const mockTournament = {
                challengeType: CHALLENGE_STYLE.TOURNAMENT,
                rewardPoints: 50
            };

            const mockParticipants = Array.from({ length: 8 }, (_, i) => ({
                userId: `user-${i + 1}`,
                completed: true,
                progress: 100 - i * 10
            }));

            vi.mocked(TournamentManagement.getTournament).mockResolvedValue(mockTournament);
            vi.mocked(TournamentManagement.getTournamentParticipants).mockResolvedValue(mockParticipants);
            vi.mocked(UserManagement.addPoints).mockResolvedValue();

            await RewardSystem.awardTournamentRewards('tournament-2');

            // Only top 5 should receive rewards
            expect(UserManagement.addPoints).toHaveBeenCalledTimes(5);
            expect(UserManagement.addPoints).toHaveBeenCalledWith('user-1', 250); // 1st: 50 * 5
            expect(UserManagement.addPoints).toHaveBeenCalledWith('user-5', 75);   // 5th: 50 * 1.5
        });

        test('should handle tournament with no completed participants', async () => {
            const mockTournament = {
                challengeType: CHALLENGE_STYLE.TOURNAMENT,
                rewardPoints: 100
            };

            const mockParticipants = [
                { userId: 'user-1', completed: false, progress: 50 },
                { userId: 'user-2', completed: false, progress: 30 }
            ];

            vi.mocked(TournamentManagement.getTournament).mockResolvedValue(mockTournament);
            vi.mocked(TournamentManagement.getTournamentParticipants).mockResolvedValue(mockParticipants);

            await RewardSystem.awardTournamentRewards('tournament-3');

            expect(UserManagement.addPoints).not.toHaveBeenCalled();
        });

        test('should not award rewards for non-tournament challenge', async () => {
            const mockChallenge = {
                challengeType: CHALLENGE_STYLE.INDIVIDUAL,
                rewardPoints: 100
            };

            vi.mocked(TournamentManagement.getTournament).mockResolvedValue(mockChallenge);

            await RewardSystem.awardTournamentRewards('not-tournament');

            expect(TournamentManagement.getTournamentParticipants).not.toHaveBeenCalled();
        });

        test('should handle errors gracefully', async () => {
            const error = new Error('Tournament error');
            vi.mocked(TournamentManagement.getTournament).mockRejectedValue(error);

            await RewardSystem.awardTournamentRewards('error-tournament');

            expect(console.error).toHaveBeenCalledWith('Failed to award tournament rewards:', error);
        });
    });

    describe('awardBadges', () => {
        test('should award badges when user meets criteria', async () => {
            const mockUser = {
                uid: 'user-1',
                points: 500,
                level: 5
            };

            const mockBadges = [
                {
                    uid: 'badge-1',
                    conditions: 'field:points,operator:>=,value:400',
                    collection: 'exercises',
                    aggregate: 'sum',
                    field: 'points',
                    valueToReach: 400
                },
                {
                    uid: 'badge-2',
                    conditions: 'field:level,operator:>=,value:10',
                    collection: 'exercises',
                    aggregate: 'count',
                    field: 'id',
                    valueToReach: 10
                }
            ];

            const mockConditions = [{ field: 'points', operator: '>=', value: 400 }];
            const mockQueryResult = { docs: [{ points: 450 }, { points: 350 }] };
            const mockAggregateResult = { sum_points: 800 };

            vi.mocked(UserManagement.getUser).mockResolvedValue(mockUser);
            vi.mocked(BadgeManagement.getAllBadges).mockResolvedValue(mockBadges);
            vi.mocked(buildConditions).mockReturnValue(mockConditions);
            vi.mocked(FirestoreManager.queryDocuments).mockResolvedValue(mockQueryResult);
            vi.mocked(aggregate).mockReturnValue(mockAggregateResult);
            vi.mocked(UserManagement.awardBadge).mockResolvedValue();

            await RewardSystem.awardBadges('user-1');

            expect(UserManagement.getUser).toHaveBeenCalledWith('user-1');
            expect(BadgeManagement.getAllBadges).toHaveBeenCalled();
            expect(UserManagement.awardBadge).toHaveBeenCalledWith('user-1', 'badge-1');
        });

        test('should not award badges when criteria not met', async () => {
            const mockUser = { uid: 'user-1', points: 100 };
            const mockBadges = [{
                uid: 'badge-1',
                conditions: 'field:points,operator:>=,value:500',
                collection: 'exercises',
                aggregate: 'sum',
                field: 'points',
                valueToReach: 500
            }];

            const mockAggregateResult = { sum_points: 300 };

            vi.mocked(UserManagement.getUser).mockResolvedValue(mockUser);
            vi.mocked(BadgeManagement.getAllBadges).mockResolvedValue(mockBadges);
            vi.mocked(buildConditions).mockReturnValue([]);
            vi.mocked(FirestoreManager.queryDocuments).mockResolvedValue({ docs: [] });
            vi.mocked(aggregate).mockReturnValue(mockAggregateResult);

            await RewardSystem.awardBadges('user-1');

            expect(UserManagement.awardBadge).not.toHaveBeenCalled();
        });

        test('should handle badges with no query results', async () => {
            const mockUser = { uid: 'user-1' };
            const mockBadges = [{
                uid: 'badge-1',
                conditions: 'field:points,operator:>=,value:100',
                collection: 'exercises',
                aggregate: 'sum',
                field: 'points',
                valueToReach: 100
            }];

            vi.mocked(UserManagement.getUser).mockResolvedValue(mockUser);
            vi.mocked(BadgeManagement.getAllBadges).mockResolvedValue(mockBadges);
            vi.mocked(buildConditions).mockReturnValue([]);
            vi.mocked(FirestoreManager.queryDocuments).mockResolvedValue(null);

            await RewardSystem.awardBadges('user-1');

            expect(UserManagement.awardBadge).not.toHaveBeenCalled();
        });

        test('should handle multiple badges correctly', async () => {
            const mockUser = { uid: 'user-1', points: 1000 };
            const mockBadges = [
                {
                    uid: 'badge-1',
                    conditions: 'field:points,operator:>=,value:500',
                    collection: 'exercises',
                    aggregate: 'sum',
                    field: 'points',
                    valueToReach: 500
                },
                {
                    uid: 'badge-2',
                    conditions: 'field:points,operator:>=,value:200',
                    collection: 'exercises',
                    aggregate: 'sum',
                    field: 'points',
                    valueToReach: 200
                }
            ];

            vi.mocked(UserManagement.getUser).mockResolvedValue(mockUser);
            vi.mocked(BadgeManagement.getAllBadges).mockResolvedValue(mockBadges);
            vi.mocked(buildConditions).mockReturnValue([]);
            vi.mocked(FirestoreManager.queryDocuments).mockResolvedValue({ docs: [] });
            vi.mocked(aggregate).mockReturnValue({ sum_points: 800 });

            await RewardSystem.awardBadges('user-1');

            expect(UserManagement.awardBadge).toHaveBeenCalledWith('user-1', 'badge-1');
            expect(UserManagement.awardBadge).toHaveBeenCalledWith('user-1', 'badge-2');
            expect(UserManagement.awardBadge).toHaveBeenCalledTimes(2);
        });
    });
});
