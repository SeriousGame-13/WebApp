/**
 * @fileoverview Unit tests for TournamentManagement service
 * 
 * Tests cover tournament CRUD operations, participant management, filtering,
 * and integration with the underlying ChallengeManagement system.
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import TournamentManagement from '../../services/TournamentManagement.jsx';
import ChallengeManagement from '../../services/ChallengeManagement.jsx';
import { Challenge, ChallengeParticipant } from '../../services/interfaces/Challenge.jsx';
import { CHALLENGE_STYLE, CHALLENGE_VISIBILITY } from '../../services/interfaces/Constants.jsx';

// Mock dependencies
vi.mock('../services/ChallengeManagement.jsx');

describe('TournamentManagement', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        console.error = vi.fn();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('createTournament', () => {
        test('should create tournament successfully with all fields', async () => {
            const creatorId = 'creator-1';
            const tournamentData = {
                name: 'Championship Tournament',
                description: 'Test tournament description',
                startDate: 1234567890000,
                endDate: 1234567890000 + 86400000,
                visibility: CHALLENGE_VISIBILITY.PUBLIC,
                groupId: 'group-1',
                targetExerciseId: 'exercise-1',
                targetValue: 100,
                rewardPoints: 500
            };

            const mockTournament = {
                uid: 'tournament-123',
                challengeType: CHALLENGE_STYLE.TOURNAMENT,
                ...tournamentData,
                creatorId
            };

            vi.mocked(ChallengeManagement.createChallenge).mockResolvedValue(mockTournament);

            const result = await TournamentManagement.createTournament(creatorId, tournamentData);

            expect(ChallengeManagement.createChallenge).toHaveBeenCalledWith({
                name: tournamentData.name,
                description: tournamentData.description,
                startDate: tournamentData.startDate,
                endDate: tournamentData.endDate,
                creatorId: creatorId,
                rewardPoints: 500,
                challengeType: CHALLENGE_STYLE.TOURNAMENT,
                visibility: CHALLENGE_VISIBILITY.PUBLIC,
                groupId: 'group-1',
                targetExerciseId: 'exercise-1',
                targetValue: 100
            });
            expect(result).toEqual(mockTournament);
        });

        test('should create tournament with default values', async () => {
            const creatorId = 'creator-1';
            const tournamentData = {
                name: 'Basic Tournament',
                description: 'Basic description',
                startDate: 1234567890000,
                endDate: 1234567890000 + 86400000
            };

            const mockTournament = { uid: 'tournament-456' };
            vi.mocked(ChallengeManagement.createChallenge).mockResolvedValue(mockTournament);

            const result = await TournamentManagement.createTournament(creatorId, tournamentData);

            expect(ChallengeManagement.createChallenge).toHaveBeenCalledWith(
                expect.objectContaining({
                    rewardPoints: 100,
                    challengeType: CHALLENGE_STYLE.TOURNAMENT,
                    visibility: CHALLENGE_VISIBILITY.PUBLIC,
                    groupId: null,
                    targetExerciseId: null,
                    targetValue: null
                })
            );
            expect(result).toEqual(mockTournament);
        });

        test('should handle tournament creation errors', async () => {
            const error = new Error('Creation failed');
            vi.mocked(ChallengeManagement.createChallenge).mockRejectedValue(error);

            await expect(TournamentManagement.createTournament('creator-1', {}))
                .rejects.toThrow('Creation failed');

            expect(console.error).toHaveBeenCalledWith('Failed to create tournament:', error);
        });
    });

    describe('getTournament', () => {
        test('should retrieve tournament successfully', async () => {
            const tournamentId = 'tournament-123';
            const mockTournament = {
                uid: tournamentId,
                challengeType: CHALLENGE_STYLE.TOURNAMENT,
                name: 'Test Tournament'
            };

            vi.mocked(ChallengeManagement.getChallenge).mockResolvedValue(mockTournament);

            const result = await TournamentManagement.getTournament(tournamentId);

            expect(ChallengeManagement.getChallenge).toHaveBeenCalledWith(tournamentId);
            expect(result).toEqual(mockTournament);
        });

        test('should return null for non-tournament challenge', async () => {
            const mockChallenge = {
                uid: 'challenge-123',
                challengeType: CHALLENGE_STYLE.INDIVIDUAL,
                name: 'Not a tournament'
            };

            vi.mocked(ChallengeManagement.getChallenge).mockResolvedValue(mockChallenge);

            const result = await TournamentManagement.getTournament('challenge-123');

            expect(result).toBeNull();
        });

        test('should handle retrieval errors', async () => {
            const error = new Error('Retrieval failed');
            vi.mocked(ChallengeManagement.getChallenge).mockRejectedValue(error);

            const result = await TournamentManagement.getTournament('tournament-error');

            expect(console.error).toHaveBeenCalledWith('Failed to get tournament:', error);
            expect(result).toBeNull();
        });
    });

    describe('updateTournament', () => {
        test('should update tournament successfully', async () => {
            const tournamentId = 'tournament-123';
            const updateData = { name: 'Updated Tournament', rewardPoints: 200 };
            const mockTournament = { uid: tournamentId, challengeType: CHALLENGE_STYLE.TOURNAMENT };

            vi.mocked(ChallengeManagement.getChallenge).mockResolvedValue(mockTournament);
            vi.mocked(ChallengeManagement.updateChallenge).mockResolvedValue(true);

            const result = await TournamentManagement.updateTournament(tournamentId, updateData);

            expect(ChallengeManagement.updateChallenge).toHaveBeenCalledWith(tournamentId, updateData);
            expect(result).toBe(true);
        });

        test('should throw error when tournament not found', async () => {
            vi.mocked(ChallengeManagement.getChallenge).mockResolvedValue(null);

            await expect(TournamentManagement.updateTournament('nonexistent', {}))
                .rejects.toThrow('Tournament not found');
        });

        test('should handle update errors', async () => {
            const mockTournament = { challengeType: CHALLENGE_STYLE.TOURNAMENT };
            const error = new Error('Update failed');

            vi.mocked(ChallengeManagement.getChallenge).mockResolvedValue(mockTournament);
            vi.mocked(ChallengeManagement.updateChallenge).mockRejectedValue(error);

            await expect(TournamentManagement.updateTournament('tournament-123', {}))
                .rejects.toThrow('Update failed');

            expect(console.error).toHaveBeenCalledWith('Failed to update tournament:', error);
        });
    });

    describe('deleteTournament', () => {
        test('should delete tournament successfully', async () => {
            const tournamentId = 'tournament-123';
            const mockTournament = { uid: tournamentId, challengeType: CHALLENGE_STYLE.TOURNAMENT };

            vi.mocked(ChallengeManagement.getChallenge).mockResolvedValue(mockTournament);
            vi.mocked(ChallengeManagement.deleteChallenge).mockResolvedValue(true);

            const result = await TournamentManagement.deleteTournament(tournamentId);

            expect(ChallengeManagement.deleteChallenge).toHaveBeenCalledWith(tournamentId);
            expect(result).toBe(true);
        });

        test('should throw error when tournament not found', async () => {
            vi.mocked(ChallengeManagement.getChallenge).mockResolvedValue(null);

            await expect(TournamentManagement.deleteTournament('nonexistent'))
                .rejects.toThrow('Tournament not found');
        });
    });

    describe('joinTournament', () => {
        test('should join tournament successfully', async () => {
            const tournamentId = 'tournament-123';
            const userId = 'user-1';
            const mockTournament = { uid: tournamentId, challengeType: CHALLENGE_STYLE.TOURNAMENT };
            const mockParticipant = { userId, challengeId: tournamentId };

            vi.mocked(ChallengeManagement.getChallenge).mockResolvedValue(mockTournament);
            vi.mocked(ChallengeManagement.joinChallenge).mockResolvedValue(mockParticipant);

            const result = await TournamentManagement.joinTournament(tournamentId, userId);

            expect(ChallengeManagement.joinChallenge).toHaveBeenCalledWith(tournamentId, userId);
            expect(result).toEqual(mockParticipant);
        });

        test('should throw error when tournament not found', async () => {
            vi.mocked(ChallengeManagement.getChallenge).mockResolvedValue(null);

            await expect(TournamentManagement.joinTournament('nonexistent', 'user-1'))
                .rejects.toThrow('Tournament not found');
        });
    });

    describe('leaveTournament', () => {
        test('should leave tournament successfully', async () => {
            const tournamentId = 'tournament-123';
            const userId = 'user-1';
            const mockTournament = { uid: tournamentId, challengeType: CHALLENGE_STYLE.TOURNAMENT };

            vi.mocked(ChallengeManagement.getChallenge).mockResolvedValue(mockTournament);
            vi.mocked(ChallengeManagement.leaveChallenge).mockResolvedValue(true);

            const result = await TournamentManagement.leaveTournament(tournamentId, userId);

            expect(ChallengeManagement.leaveChallenge).toHaveBeenCalledWith(tournamentId, userId);
            expect(result).toBe(true);
        });

        test('should throw error when tournament not found', async () => {
            vi.mocked(ChallengeManagement.getChallenge).mockResolvedValue(null);

            await expect(TournamentManagement.leaveTournament('nonexistent', 'user-1'))
                .rejects.toThrow('Tournament not found');
        });
    });

    describe('getTournamentParticipants', () => {
        test('should get tournament participants successfully', async () => {
            const tournamentId = 'tournament-123';
            const mockTournament = { uid: tournamentId, challengeType: CHALLENGE_STYLE.TOURNAMENT };
            const mockParticipants = [
                { userId: 'user-1', challengeId: tournamentId },
                { userId: 'user-2', challengeId: tournamentId }
            ];

            vi.mocked(ChallengeManagement.getChallenge).mockResolvedValue(mockTournament);
            vi.mocked(ChallengeManagement.getChallengeParticipants).mockResolvedValue(mockParticipants);

            const result = await TournamentManagement.getTournamentParticipants(tournamentId);

            expect(ChallengeManagement.getChallengeParticipants).toHaveBeenCalledWith(tournamentId);
            expect(result).toEqual(mockParticipants);
        });

        test('should return empty array when tournament not found', async () => {
            vi.mocked(ChallengeManagement.getChallenge).mockResolvedValue(null);

            const result = await TournamentManagement.getTournamentParticipants('nonexistent');

            expect(console.error).toHaveBeenCalledWith('Failed to get tournament participants:', expect.any(Error));
            expect(result).toEqual([]);
        });
    });

    describe('getTournaments', () => {
        test('should get tournaments with no filters', async () => {
            const mockChallenges = [
                { uid: 'tournament-1', challengeType: CHALLENGE_STYLE.TOURNAMENT, visibility: CHALLENGE_VISIBILITY.PUBLIC },
                { uid: 'challenge-1', challengeType: CHALLENGE_STYLE.INDIVIDUAL, visibility: CHALLENGE_VISIBILITY.PUBLIC },
                { uid: 'tournament-2', challengeType: CHALLENGE_STYLE.TOURNAMENT, visibility: CHALLENGE_VISIBILITY.GROUP }
            ];

            vi.mocked(ChallengeManagement.getAllChallenges).mockResolvedValue(mockChallenges);

            const result = await TournamentManagement.getTournaments();

            expect(result).toHaveLength(2);
            expect(result[0].uid).toBe('tournament-1');
            expect(result[1].uid).toBe('tournament-2');
        });

        test('should filter tournaments by visibility', async () => {
            const mockChallenges = [
                { uid: 'tournament-1', challengeType: CHALLENGE_STYLE.TOURNAMENT, visibility: CHALLENGE_VISIBILITY.PUBLIC },
                { uid: 'tournament-2', challengeType: CHALLENGE_STYLE.TOURNAMENT, visibility: CHALLENGE_VISIBILITY.GROUP }
            ];

            vi.mocked(ChallengeManagement.getAllChallenges).mockResolvedValue(mockChallenges);

            const result = await TournamentManagement.getTournaments({ visibility: CHALLENGE_VISIBILITY.PUBLIC });

            expect(result).toHaveLength(1);
            expect(result[0].uid).toBe('tournament-1');
        });

        test('should filter tournaments by groupId', async () => {
            const mockChallenges = [
                { uid: 'tournament-1', challengeType: CHALLENGE_STYLE.TOURNAMENT, groupId: 'group-1' },
                { uid: 'tournament-2', challengeType: CHALLENGE_STYLE.TOURNAMENT, groupId: 'group-2' }
            ];

            vi.mocked(ChallengeManagement.getAllChallenges).mockResolvedValue(mockChallenges);

            const result = await TournamentManagement.getTournaments({ groupId: 'group-1' });

            expect(result).toHaveLength(1);
            expect(result[0].uid).toBe('tournament-1');
        });

        test('should filter tournaments by creatorId', async () => {
            const mockChallenges = [
                { uid: 'tournament-1', challengeType: CHALLENGE_STYLE.TOURNAMENT, creatorId: 'creator-1' },
                { uid: 'tournament-2', challengeType: CHALLENGE_STYLE.TOURNAMENT, creatorId: 'creator-2' }
            ];

            vi.mocked(ChallengeManagement.getAllChallenges).mockResolvedValue(mockChallenges);

            const result = await TournamentManagement.getTournaments({ creatorId: 'creator-1' });

            expect(result).toHaveLength(1);
            expect(result[0].uid).toBe('tournament-1');
        });

        test('should apply limit to results', async () => {
            const mockChallenges = Array.from({ length: 10 }, (_, i) => ({
                uid: `tournament-${i}`,
                challengeType: CHALLENGE_STYLE.TOURNAMENT
            }));

            vi.mocked(ChallengeManagement.getAllChallenges).mockResolvedValue(mockChallenges);

            const result = await TournamentManagement.getTournaments({}, 5);

            expect(result).toHaveLength(5);
        });

        test('should handle errors gracefully', async () => {
            const error = new Error('Database error');
            vi.mocked(ChallengeManagement.getAllChallenges).mockRejectedValue(error);

            const result = await TournamentManagement.getTournaments();

            expect(console.error).toHaveBeenCalledWith('Failed to get tournaments:', error);
            expect(result).toEqual([]);
        });
    });

    describe('getPublicTournaments', () => {
        test('should get public tournaments', async () => {
            const mockTournaments = [
                { uid: 'tournament-1', challengeType: CHALLENGE_STYLE.TOURNAMENT, visibility: CHALLENGE_VISIBILITY.PUBLIC }
            ];

            vi.mocked(ChallengeManagement.getAllChallenges).mockResolvedValue(mockTournaments);

            const result = await TournamentManagement.getPublicTournaments();

            expect(result).toEqual(mockTournaments);
        });
    });

    describe('getGroupTournaments', () => {
        test('should get tournaments for specific group', async () => {
            const groupId = 'group-1';
            const mockTournaments = [
                { uid: 'tournament-1', challengeType: CHALLENGE_STYLE.TOURNAMENT, visibility: CHALLENGE_VISIBILITY.GROUP, groupId }
            ];

            vi.mocked(ChallengeManagement.getAllChallenges).mockResolvedValue(mockTournaments);

            const result = await TournamentManagement.getGroupTournaments(groupId);

            expect(result).toEqual(mockTournaments);
        });
    });

    describe('getUserCreatedTournaments', () => {
        test('should get tournaments created by user', async () => {
            const creatorId = 'creator-1';
            const mockTournaments = [
                { uid: 'tournament-1', challengeType: CHALLENGE_STYLE.TOURNAMENT, creatorId }
            ];

            vi.mocked(ChallengeManagement.getAllChallenges).mockResolvedValue(mockTournaments);

            const result = await TournamentManagement.getUserCreatedTournaments(creatorId);

            expect(result).toEqual(mockTournaments);
        });
    });

    describe('getUserTournaments', () => {
        test('should get tournaments user is participating in', async () => {
            const userId = 'user-1';
            const mockChallenges = [
                { uid: 'tournament-1', challengeType: CHALLENGE_STYLE.TOURNAMENT },
                { uid: 'challenge-1', challengeType: CHALLENGE_STYLE.INDIVIDUAL }
            ];

            vi.mocked(ChallengeManagement.getUserChallenges).mockResolvedValue(mockChallenges);

            const result = await TournamentManagement.getUserTournaments(userId);

            expect(ChallengeManagement.getUserChallenges).toHaveBeenCalledWith(userId);
            expect(result).toHaveLength(1);
            expect(result[0].uid).toBe('tournament-1');
        });

        test('should handle errors gracefully', async () => {
            const error = new Error('Database error');
            vi.mocked(ChallengeManagement.getUserChallenges).mockRejectedValue(error);

            const result = await TournamentManagement.getUserTournaments('user-1');

            expect(console.error).toHaveBeenCalledWith('Failed to get user tournaments:', error);
            expect(result).toEqual([]);
        });
    });

    describe('completeTournamentForUser', () => {
        test('should complete tournament for user successfully', async () => {
            const tournamentId = 'tournament-123';
            const userId = 'user-1';
            const mockTournament = { uid: tournamentId, challengeType: CHALLENGE_STYLE.TOURNAMENT };

            vi.mocked(ChallengeManagement.getChallenge).mockResolvedValue(mockTournament);
            vi.mocked(ChallengeManagement.completeChallengeForUser).mockResolvedValue(true);

            const result = await TournamentManagement.completeTournamentForUser(tournamentId, userId);

            expect(ChallengeManagement.completeChallengeForUser).toHaveBeenCalledWith(tournamentId, userId);
            expect(result).toBe(true);
        });

        test('should throw error when tournament not found', async () => {
            vi.mocked(ChallengeManagement.getChallenge).mockResolvedValue(null);

            await expect(TournamentManagement.completeTournamentForUser('nonexistent', 'user-1'))
                .rejects.toThrow('Tournament not found');
        });

        test('should handle completion errors', async () => {
            const mockTournament = { challengeType: CHALLENGE_STYLE.TOURNAMENT };
            const error = new Error('Completion failed');

            vi.mocked(ChallengeManagement.getChallenge).mockResolvedValue(mockTournament);
            vi.mocked(ChallengeManagement.completeChallengeForUser).mockRejectedValue(error);

            await expect(TournamentManagement.completeTournamentForUser('tournament-123', 'user-1'))
                .rejects.toThrow('Completion failed');

            expect(console.error).toHaveBeenCalledWith('Failed to complete tournament for user:', error);
        });
    });

    describe('TournamentManagement object structure', () => {
        test('should expose correct methods', () => {
            expect(TournamentManagement).toHaveProperty('createTournament');
            expect(TournamentManagement).toHaveProperty('getTournament');
            expect(TournamentManagement).toHaveProperty('updateTournament');
            expect(TournamentManagement).toHaveProperty('deleteTournament');
            expect(TournamentManagement).toHaveProperty('joinTournament');
            expect(TournamentManagement).toHaveProperty('leaveTournament');
            expect(TournamentManagement).toHaveProperty('getTournamentParticipants');
            expect(TournamentManagement).toHaveProperty('getTournaments');
            expect(TournamentManagement).toHaveProperty('getPublicTournaments');
            expect(TournamentManagement).toHaveProperty('getGroupTournaments');
            expect(TournamentManagement).toHaveProperty('getUserCreatedTournaments');
            expect(TournamentManagement).toHaveProperty('getUserTournaments');
            expect(TournamentManagement).toHaveProperty('completeTournamentForUser');
            
            // Verify all are functions
            Object.values(TournamentManagement).forEach(method => {
                expect(typeof method).toBe('function');
            });
        });
    });
});
