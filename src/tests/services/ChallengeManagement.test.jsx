/**
 * @fileoverview Test suite for ChallengeManagement
 * 
 * This test suite provides comprehensive testing for the Challenge Management system,
 * including challenge CRUD operations, participant management, group assignments,
 * and proper Firebase integration. All dependencies are mocked to enable isolated unit testing.
 * 
 * @author Igor, Alexander, Hyunu, Robert
 * @version 1.0.0
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';

// Mock Firebase configuration first
vi.mock('../../services/firebase/FirebaseAppConfiguration', () => ({
    firebaseApp: {}
}));

// Mock Firebase/Firestore
vi.mock('firebase/firestore', () => ({
    getFirestore: vi.fn(() => ({})),
    doc: vi.fn(() => 'mock-doc-reference'),
    setDoc: vi.fn(),
    getDoc: vi.fn(),
    deleteDoc: vi.fn(),
    query: vi.fn(() => 'mock-query'),
    where: vi.fn(() => 'mock-where-clause'),
    collection: vi.fn(() => 'mock-collection'),
    getDocs: vi.fn(),
    serverTimestamp: vi.fn(() => ({ type: 'timestamp' })),
    Timestamp: {
        now: vi.fn(() => ({ type: 'timestamp' })),
        fromDate: vi.fn((date) => ({ type: 'timestamp', date })),
        toDate: vi.fn(() => new Date()),
        fromMillis: vi.fn((millis) => ({ 
            type: 'timestamp', 
            millis, 
            toDate: () => new Date(millis),
            seconds: millis / 1000
        }))
    },
    addDoc: vi.fn(),
    limit: vi.fn(() => 'mock-limit'),
}));

// Mock FirebaseHelper
vi.mock('../../services/firebase/FirebaseHelper', () => ({
    serverTimestamp: vi.fn(() => ({ type: 'server_timestamp' })),
    Timestamp: {
        fromMillis: vi.fn((millis) => ({ 
            type: 'timestamp', 
            millis, 
            toDate: () => new Date(millis),
            seconds: millis / 1000
        }))
    },
    buildConditions: vi.fn((conditions, baseConditions) => [
        ...baseConditions,
        ...conditions.filter(c => c.trim()).map(c => ({ field: 'points', operator: '>=', value: 100 }))
    ]),
    aggregate: vi.fn((aggregates, docs) => ({ sumpoints: 150 }))
}));

// Mock FirestoreManager
vi.mock('../../services/firebase/FirestoreManager', () => ({
    default: {
        createDocument: vi.fn(),
        readDocument: vi.fn(),
        updateDocument: vi.fn(),
        deleteDocument: vi.fn(),
        getAllDocuments: vi.fn(),
        queryDocuments: vi.fn()
    }
}));

// Mock Collections
vi.mock('../../services/firebase/Collections', () => ({
    CHALLENGES_COLLECTION: 'challenges',
    CHALLENGE_PARTICIPANTS_SUBCOLLECTION: 'participants'
}));

// Mock UserManagementSystem
vi.mock('../../services/UserManagementSystem', () => ({
    default: {
        getAllActiveUsers: vi.fn(),
        getUser: vi.fn()
    }
}));

// Mock GroupManagementSystem  
vi.mock('../../services/GroupManagementSystem', () => ({
    default: {
        getGroup: vi.fn()
    }
}));

// Mock RewardSystem
vi.mock('../../services/RewardSystem', () => ({
    default: {
        awardChallengeRewards: vi.fn()
    }
}));

// Mock Challenge interfaces
vi.mock('../../services/interfaces/Challenge', () => {
    const ChallengeMock = vi.fn().mockImplementation((data = {}) => ({
        uid: data.uid || 'mock-challenge-uid',
        challengeId: data.challengeId || null,
        name: data.name || '',
        description: data.description || '',
        startDate: data.startDate || Date.now(),
        endDate: data.endDate || Date.now() + 86400000,
        creatorId: data.creatorId || '',
        rewardPoints: data.rewardPoints || 100,
        challengeType: data.challengeType || 'TARGET',
        visibility: data.visibility || 'PUBLIC',
        groupId: data.groupId || null,
        targetValue: data.targetValue || 1000,
        status: data.status || 'OPEN',
        progress: data.progress || 0,
        conditions: data.conditions || 'field:points,operator:>=,value:100',
        participants: data.participants || [],
        isActive: vi.fn(() => true),
        hasNotStarted: vi.fn(() => false),
        hasParticipant: vi.fn((userId) => false)
    }));
    
    const ChallengeParticipantMock = vi.fn().mockImplementation((data = {}) => ({
        uid: data.uid || data.userId || 'mock-participant-uid',
        challengeId: data.challengeId || '',
        userId: data.userId || '',
        joinedAt: data.joinedAt || { type: 'server_timestamp' },
        completedAt: data.completedAt || null,
        currentValue: data.currentValue || 0,
        status: data.status || 'ACTIVE',
        isCompleted: vi.fn(() => !!data.completedAt)
    }));
    
    ChallengeMock.fromJSON = vi.fn((data) => ({ ...data, fromJSON: true }));
    ChallengeParticipantMock.fromJSON = vi.fn((data) => ({ ...data, fromJSON: true }));
    
    return {
        Challenge: ChallengeMock,
        ChallengeParticipant: ChallengeParticipantMock
    };
});

// Mock Constants
vi.mock('../../services/interfaces/Constants', () => ({
    CHALLENGE_VISIBILITY: {
        PUBLIC: 'PUBLIC',
        HIDDEN: 'HIDDEN',
        GROUP: 'GROUP',
        PRIVATE: 'PRIVATE'
    },
    CHALLENGE_STATUS: {
        OPEN: 'OPEN',
        RUNNING: 'RUNNING', 
        FINISHED: 'FINISHED',
        CANCELLED: 'CANCELLED'
    },
    CHALLENGE_TYPE: {
        TARGET: 'TARGET',
        STREAK: 'STREAK'
    }
}));

// Import ChallengeManagement after mocks
import ChallengeManagement from '../../services/ChallengeManagement';
import FirestoreManager from '../../services/firebase/FirestoreManager';
import UserManagement from '../../services/UserManagementSystem';
import GroupManagement from '../../services/GroupManagementSystem';
import RewardSystem from '../../services/RewardSystem';
import { Challenge, ChallengeParticipant } from '../../services/interfaces/Challenge';
import { serverTimestamp } from '../../services/firebase/FirebaseHelper';

describe('ChallengeManagement', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        console.error = vi.fn();
        console.warn = vi.fn();
        console.log = vi.fn();

        // Set up default mock return values
        FirestoreManager.createDocument.mockResolvedValue({ id: 'new-challenge-id' });
        FirestoreManager.readDocument.mockResolvedValue({
            uid: 'challenge-123',
            name: 'Test Challenge',
            description: 'A test challenge',
            visibility: 'PUBLIC',
            startDate: Date.now(),
            endDate: Date.now() + 86400000,
            creatorId: 'creator-123',
            rewardPoints: 200
        });
        FirestoreManager.updateDocument.mockResolvedValue('updated');
        FirestoreManager.deleteDocument.mockResolvedValue('deleted');
        FirestoreManager.getAllDocuments.mockResolvedValue({
            docs: [
                {
                    id: 'challenge-1',
                    data: () => ({
                        uid: 'challenge-1',
                        name: 'First Challenge',
                        description: 'First test challenge',
                        visibility: 'PUBLIC'
                    })
                },
                {
                    id: 'challenge-2',
                    data: () => ({
                        uid: 'challenge-2', 
                        name: 'Second Challenge',
                        description: 'Second test challenge',
                        visibility: 'GROUP',
                        groupId: 'group-123'
                    })
                }
            ]
        });
        FirestoreManager.queryDocuments.mockResolvedValue({
            docs: [
                {
                    id: 'challenge-1',
                    data: () => ({
                        uid: 'challenge-1',
                        name: 'Public Challenge',
                        visibility: 'PUBLIC'
                    })
                }
            ]
        });

        UserManagement.getAllActiveUsers.mockResolvedValue([
            { uid: 'user-1', displayName: 'User One' },
            { uid: 'user-2', displayName: 'User Two' }
        ]);

        GroupManagement.getGroup.mockResolvedValue({
            groupId: 'group-123',
            members: [
                { userId: 'member-1', isActive: () => true },
                { userId: 'member-2', isActive: () => true },
                { userId: 'member-3', isActive: () => false }
            ]
        });

        serverTimestamp.mockReturnValue({ type: 'server_timestamp' });
    });

    describe('createChallenge', () => {
        test('should create public challenge successfully', async () => {
            const challengeData = {
                name: 'New Challenge',
                description: 'Challenge description',
                startDate: Date.now(),
                endDate: Date.now() + 86400000,
                creatorId: 'creator-123',
                rewardPoints: 300,
                visibility: 'PUBLIC'
            };

            const result = await ChallengeManagement.createChallenge(challengeData);

            expect(Challenge).toHaveBeenCalledWith(challengeData);
            expect(FirestoreManager.createDocument).toHaveBeenCalledWith(
                'challenges',
                expect.objectContaining({
                    name: challengeData.name,
                    description: challengeData.description,
                    visibility: challengeData.visibility
                }),
                'mock-challenge-uid'
            );
            expect(result.challengeId).toBe('new-challenge-id');
        });

        test('should create group challenge and add group members', async () => {
            const challengeData = {
                name: 'Group Challenge',
                description: 'Challenge for group',
                visibility: 'GROUP',
                groupId: 'group-123',
                creatorId: 'creator-123'
            };

            await ChallengeManagement.createChallenge(challengeData);

            expect(GroupManagement.getGroup).toHaveBeenCalledWith('group-123');
            // Should join active group members (member-1 and member-2, but not member-3)
            expect(FirestoreManager.createDocument).toHaveBeenCalledTimes(3); // 1 challenge + 2 participants
        });

        test('should handle challenge creation failure', async () => {
            FirestoreManager.createDocument.mockResolvedValue(null);
            
            const challengeData = {
                name: 'Test Challenge',
                description: 'Test description'
            };

            await expect(ChallengeManagement.createChallenge(challengeData))
                .rejects.toThrow('Failed to create challenge document');
        });

        test('should handle database errors during creation', async () => {
            const dbError = new Error('Database connection failed');
            FirestoreManager.createDocument.mockRejectedValue(dbError);
            
            const challengeData = {
                name: 'Test Challenge',
                description: 'Test description'
            };

            await expect(ChallengeManagement.createChallenge(challengeData))
                .rejects.toThrow('Database connection failed');
        });
    });

    describe('getAllChallenges', () => {
        test('should retrieve all challenges with participants', async () => {
            const result = await ChallengeManagement.getAllChallenges();

            expect(FirestoreManager.getAllDocuments).toHaveBeenCalledWith('challenges');
            expect(Challenge.fromJSON).toHaveBeenCalledTimes(2);
            expect(result).toHaveLength(2);
        });

        test('should return empty array on database error', async () => {
            const dbError = new Error('Database read failed');
            FirestoreManager.getAllDocuments.mockRejectedValue(dbError);

            const result = await ChallengeManagement.getAllChallenges();

            expect(result).toEqual([]);
            expect(console.error).toHaveBeenCalledWith('Failed to get all challenges:', dbError);
        });
    });

    describe('getPublicChallenges', () => {
        test('should retrieve only public challenges', async () => {
            const result = await ChallengeManagement.getPublicChallenges();

            expect(FirestoreManager.queryDocuments).toHaveBeenCalledWith(
                'challenges',
                [['visibility', '==', 'PUBLIC']]
            );
            expect(result).toHaveLength(1);
        });

        test('should return empty array when no public challenges', async () => {
            FirestoreManager.queryDocuments.mockResolvedValue(null);

            const result = await ChallengeManagement.getPublicChallenges();

            expect(result).toEqual([]);
        });

        test('should handle query errors', async () => {
            const dbError = new Error('Query failed');
            FirestoreManager.queryDocuments.mockRejectedValue(dbError);

            const result = await ChallengeManagement.getPublicChallenges();

            expect(result).toEqual([]);
        });
    });

    describe('getGroupChallenges', () => {
        test('should retrieve challenges for specific group', async () => {
            // Mock challenges with one being a group challenge
            const mockChallenges = [
                { 
                    visibility: 'GROUP', 
                    groupId: 'group-123',
                    name: 'Group Challenge'
                },
                { 
                    visibility: 'PUBLIC',
                    name: 'Public Challenge'
                }
            ];
            
            vi.spyOn(ChallengeManagement, 'getAllChallenges').mockResolvedValue(mockChallenges);

            const result = await ChallengeManagement.getGroupChallenges('group-123');

            expect(result).toHaveLength(1);
            expect(result[0].groupId).toBe('group-123');
        });

        test('should return empty array on error', async () => {
            const dbError = new Error('Failed to get all challenges');
            FirestoreManager.getAllDocuments.mockRejectedValue(dbError);

            const result = await ChallengeManagement.getGroupChallenges('group-123');

            expect(result).toEqual([]);
        });
    });

    describe('updateChallenge', () => {
        test('should update challenge successfully', async () => {
            const challengeId = 'challenge-123';
            const updateData = {
                name: 'Updated Challenge Name',
                description: 'Updated description'
            };

            const result = await ChallengeManagement.updateChallenge(challengeId, updateData);

            expect(FirestoreManager.updateDocument).toHaveBeenCalledWith(
                'challenges',
                challengeId,
                updateData,
                true
            );
            expect(result).toBe(true);
        });

        test('should handle update failure', async () => {
            const dbError = new Error('Update failed');
            const challengeId = 'challenge-123';
            const updateData = { name: 'New Name' };
            
            FirestoreManager.updateDocument.mockRejectedValue(dbError);

            await expect(ChallengeManagement.updateChallenge(challengeId, updateData))
                .rejects.toThrow('Update failed');
        });
    });

    describe('deleteChallenge', () => {
        test('should delete challenge and all participants', async () => {
            const challengeId = 'challenge-123';
            
            // Mock participants
            FirestoreManager.getAllDocuments.mockResolvedValue({
                docs: [
                    { id: 'participant-1' },
                    { id: 'participant-2' }
                ]
            });

            const result = await ChallengeManagement.deleteChallenge(challengeId);

            expect(FirestoreManager.getAllDocuments).toHaveBeenCalledWith(
                'challenges/challenge-123/participants'
            );
            expect(FirestoreManager.deleteDocument).toHaveBeenCalledTimes(3); // 2 participants + 1 challenge
            expect(result).toBe(true);
        });

        test('should handle deletion failure', async () => {
            const dbError = new Error('Delete failed');
            const challengeId = 'challenge-123';
            
            FirestoreManager.getAllDocuments.mockRejectedValue(dbError);

            await expect(ChallengeManagement.deleteChallenge(challengeId))
                .rejects.toThrow('Delete failed');
        });
    });

    describe('joinChallenge', () => {
        test('should add user to challenge as participant', async () => {
            const challengeId = 'challenge-123';
            const userId = 'user-123';

            const result = await ChallengeManagement.joinChallenge(challengeId, userId);

            expect(ChallengeParticipant).toHaveBeenCalledWith({
                uid: userId,
                challengeId: challengeId,
                userId: userId
            });
            expect(FirestoreManager.createDocument).toHaveBeenCalledWith(
                'challenges/challenge-123/participants',
                expect.objectContaining({ userId: userId }),
                userId
            );
            expect(result).toBeDefined();
        });

        test('should handle join failure', async () => {
            const dbError = new Error('Join failed');
            const challengeId = 'challenge-123';
            const userId = 'user-123';
            
            FirestoreManager.createDocument.mockRejectedValue(dbError);

            await expect(ChallengeManagement.joinChallenge(challengeId, userId))
                .rejects.toThrow('Join failed');
        });
    });

    describe('leaveChallenge', () => {
        test('should remove user from challenge', async () => {
            const challengeId = 'challenge-123';
            const userId = 'user-123';

            const result = await ChallengeManagement.leaveChallenge(challengeId, userId);

            expect(FirestoreManager.deleteDocument).toHaveBeenCalledWith(
                'challenges/challenge-123/participants',
                userId
            );
            expect(result).toBe(true);
        });

        test('should handle leave failure', async () => {
            const dbError = new Error('Leave failed');
            const challengeId = 'challenge-123';
            const userId = 'user-123';
            
            FirestoreManager.deleteDocument.mockRejectedValue(dbError);

            await expect(ChallengeManagement.leaveChallenge(challengeId, userId))
                .rejects.toThrow('Leave failed');
        });
    });

    describe('getChallengeParticipants', () => {
        test('should retrieve all participants for a challenge', async () => {
            const challengeId = 'challenge-123';
            
            const mockSnapshot = {
                forEach: vi.fn((callback) => {
                    callback({ data: () => ({ userId: 'user-1', challengeId }) });
                    callback({ data: () => ({ userId: 'user-2', challengeId }) });
                })
            };
            
            FirestoreManager.getAllDocuments.mockResolvedValue(mockSnapshot);

            const result = await ChallengeManagement.getChallengeParticipants(challengeId);

            expect(FirestoreManager.getAllDocuments).toHaveBeenCalledWith(
                'challenges/challenge-123/participants'
            );
            expect(result).toHaveLength(2);
        });

        test('should return empty array on error', async () => {
            const dbError = new Error('Get participants failed');
            const challengeId = 'challenge-123';
            
            FirestoreManager.getAllDocuments.mockRejectedValue(dbError);

            const result = await ChallengeManagement.getChallengeParticipants(challengeId);

            expect(result).toEqual([]);
        });
    });

    describe('getChallenge', () => {
        test('should retrieve specific challenge with participants', async () => {
            const challengeId = 'challenge-123';

            const result = await ChallengeManagement.getChallenge(challengeId);

            expect(FirestoreManager.readDocument).toHaveBeenCalledWith('challenges', challengeId);
            expect(Challenge.fromJSON).toHaveBeenCalled();
            expect(result).toBeDefined();
        });

        test('should throw error when challenge not found', async () => {
            const challengeId = 'nonexistent-challenge';
            FirestoreManager.readDocument.mockResolvedValue(null);

            await expect(ChallengeManagement.getChallenge(challengeId))
                .rejects.toThrow('Challenge not found');
        });
    });

    describe('getUserChallenges', () => {
        test('should retrieve challenges for specific user', async () => {
            const userId = 'user-123';
            
            // Mock getAllChallenges to return challenges
            FirestoreManager.getAllDocuments.mockResolvedValueOnce({
                docs: [
                    {
                        id: 'challenge-1',
                        data: () => ({
                            uid: 'challenge-1',
                            name: 'User Challenge',
                            visibility: 'PUBLIC'
                        })
                    }
                ]
            });
            
            // Mock the Challenge constructor to return an object with hasParticipant method
            Challenge.fromJSON.mockImplementation((data) => ({
                ...data,
                hasParticipant: (uid) => uid === userId // Return true for the correct user
            }));
            
            // Mock getChallengeParticipants for each challenge
            const mockParticipants = { forEach: vi.fn() };
            FirestoreManager.getAllDocuments.mockResolvedValueOnce(mockParticipants);

            const result = await ChallengeManagement.getUserChallenges(userId);

            expect(result).toHaveLength(1);
        });

        test('should return empty array on error', async () => {
            const dbError = new Error('Failed to get all challenges');
            FirestoreManager.getAllDocuments.mockRejectedValue(dbError);

            const result = await ChallengeManagement.getUserChallenges('user-123');

            expect(result).toEqual([]);
        });
    });

    describe('completeChallengeForUser', () => {
        test('should mark challenge as completed for user', async () => {
            const challengeId = 'challenge-123';
            const userId = 'user-123';
            
            FirestoreManager.readDocument.mockResolvedValue({
                userId: userId,
                challengeId: challengeId
            });

            const result = await ChallengeManagement.completeChallengeForUser(challengeId, userId);

            expect(FirestoreManager.readDocument).toHaveBeenCalledWith(
                'challenges/challenge-123/participants',
                userId
            );
            expect(FirestoreManager.updateDocument).toHaveBeenCalledWith(
                'challenges/challenge-123/participants',
                userId,
                { completedAt: { type: 'server_timestamp' } },
                true
            );
            expect(result).toBe(true);
        });

        test('should throw error when participant not found', async () => {
            const challengeId = 'challenge-123';
            const userId = 'nonexistent-user';
            
            FirestoreManager.readDocument.mockResolvedValue(null);

            await expect(ChallengeManagement.completeChallengeForUser(challengeId, userId))
                .rejects.toThrow('Participant not found');
        });
    });

    describe('Group challenge management', () => {
        test('should add user to group challenges', async () => {
            const groupId = 'group-123';
            const userId = 'new-user';
            
            // Mock getAllDocuments for getAllChallenges
            FirestoreManager.getAllDocuments.mockResolvedValueOnce({
                docs: [
                    {
                        id: 'challenge-1',
                        data: () => ({
                            uid: 'challenge-1',
                            visibility: 'GROUP',
                            groupId: 'group-123'
                        })
                    },
                    {
                        id: 'challenge-2',
                        data: () => ({
                            uid: 'challenge-2',
                            visibility: 'GROUP',
                            groupId: 'group-123'
                        })
                    }
                ]
            });
            
            // Mock Challenge.fromJSON to return objects with required methods
            Challenge.fromJSON.mockImplementation((data) => ({
                ...data,
                challengeId: data.uid,
                visibility: data.visibility,
                groupId: data.groupId,
                isActive: () => true,
                hasNotStarted: () => false
            }));
            
            // Mock getChallengeParticipants calls (one for each challenge)
            const mockSnapshot = { forEach: vi.fn() };
            FirestoreManager.getAllDocuments
                .mockResolvedValueOnce(mockSnapshot) // for challenge-1
                .mockResolvedValueOnce(mockSnapshot); // for challenge-2
            
            // Mock createDocument for joinChallenge calls
            FirestoreManager.createDocument.mockResolvedValue({ id: 'participant-id' });

            await ChallengeManagement.addUserToGroupChallenges(groupId, userId);

            // Should call createDocument for each challenge participant
            expect(FirestoreManager.createDocument).toHaveBeenCalledTimes(2);
        });

        test('should remove user from group challenges', async () => {
            const groupId = 'group-123';
            const userId = 'leaving-user';
            
            // Mock getAllDocuments for getAllChallenges
            FirestoreManager.getAllDocuments.mockResolvedValueOnce({
                docs: [
                    {
                        id: 'challenge-1',
                        data: () => ({
                            uid: 'challenge-1',
                            visibility: 'GROUP',
                            groupId: 'group-123'
                        })
                    }
                ]
            });
            
            // Mock Challenge.fromJSON
            Challenge.fromJSON.mockImplementation((data) => ({
                ...data,
                challengeId: data.uid,
                visibility: data.visibility,
                groupId: data.groupId
            }));
            
            // Mock getChallengeParticipants
            const mockSnapshot = { forEach: vi.fn() };
            FirestoreManager.getAllDocuments.mockResolvedValueOnce(mockSnapshot);
            
            // Mock deleteDocument for leaveChallenge
            FirestoreManager.deleteDocument.mockResolvedValue({});

            await ChallengeManagement.removeUserFromGroupChallenges(groupId, userId);

            // Should call deleteDocument for the challenge participant
            expect(FirestoreManager.deleteDocument).toHaveBeenCalledTimes(1);
        });
    });

    describe('updateProgress', () => {
        test('should update challenge progress and award rewards when target reached', async () => {
            const challengeId = 'challenge-123';
            
            // Mock challenge data with proper conditions string
            const mockChallenge = {
                challengeId: challengeId,
                startDate: { toDate: null, seconds: Date.now() / 1000 },
                conditions: 'field:points,operator:>=,value:100',
                targetValue: 100,
                status: 'OPEN'
            };
            
            const mockParticipants = [
                { userId: 'user-1' },
                { userId: 'user-2' }
            ];
            
            // Mock getChallenge to return the challenge
            FirestoreManager.readDocument.mockResolvedValue(mockChallenge);
            Challenge.fromJSON.mockReturnValue(mockChallenge);
            
            // Mock getChallengeParticipants
            const mockSnapshot = {
                forEach: vi.fn((callback) => {
                    mockParticipants.forEach(p => callback({ data: () => p }));
                })
            };
            FirestoreManager.getAllDocuments.mockResolvedValue(mockSnapshot);
            ChallengeParticipant.fromJSON.mockImplementation((data) => data);

            await ChallengeManagement.updateProgress(challengeId);

            expect(RewardSystem.awardChallengeRewards).toHaveBeenCalledWith(challengeId);
            expect(FirestoreManager.updateDocument).toHaveBeenCalledWith(
                'challenges',
                challengeId,
                { progress: 150 },
                true
            );
        });
    });

    describe('Error handling', () => {
        test('should handle errors gracefully in group operations', async () => {
            // Mock getAllDocuments to fail (simulates getAllChallenges failure)
            const dbError = new Error('Failed to get all challenges');
            FirestoreManager.getAllDocuments.mockRejectedValue(dbError);

            await expect(ChallengeManagement.addUserToGroupChallenges('group-123', 'user-123'))
                .resolves.not.toThrow();

            expect(console.error).toHaveBeenCalledWith(
                'Failed to get all challenges:', 
                expect.any(Error)
            );
        });

        test('should handle individual challenge join failures in batch operations', async () => {
            // Mock successful getAllChallenges
            FirestoreManager.getAllDocuments.mockResolvedValueOnce({
                docs: [
                    {
                        id: 'challenge-1',
                        data: () => ({
                            uid: 'challenge-1',
                            visibility: 'GROUP',
                            groupId: 'group-123'
                        })
                    }
                ]
            });
            
            // Mock Challenge.fromJSON
            Challenge.fromJSON.mockImplementation((data) => ({
                ...data,
                challengeId: data.uid,
                visibility: data.visibility,
                groupId: data.groupId,
                isActive: () => true,
                hasNotStarted: () => false
            }));
            
            // Mock getChallengeParticipants to succeed
            const mockSnapshot = { forEach: vi.fn() };
            FirestoreManager.getAllDocuments.mockResolvedValueOnce(mockSnapshot);
            
            // Mock createDocument to fail (simulates joinChallenge failure)
            const joinError = new Error('Join failed');
            FirestoreManager.createDocument.mockRejectedValue(joinError);

            await ChallengeManagement.addUserToGroupChallenges('group-123', 'user-123');

            expect(console.error).toHaveBeenCalledWith(
                expect.stringContaining('Failed to add user user-123 to challenge challenge-1'),
                expect.any(Error)
            );
        });
    });
});
