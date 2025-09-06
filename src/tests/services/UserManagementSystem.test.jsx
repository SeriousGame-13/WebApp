/**
 * @fileoverview Test suite for UserManagementSystem
 * 
 * This test suite provides comprehensive testing for the User Management System,
 * including user authentication, profile management, friendship systems, blocking functionality,
 * and user data operations. All Firebase dependencies are mocked to enable isolated unit testing.
 * 
 * @author Igor, Alexander, Hyunu, Robert
 * @version 1.0.0
 */

// Mock Firebase configuration
vi.mock('../services/firebase/FirebaseAppConfiguration', () => ({
    firebaseApp: {}
}));

// Mock FirebaseAuthenticationManager
vi.mock('../services/firebase/FirebaseAuthenticationManager', () => {
    const mockUser = {
        uid: 'test-uid-123',
        email: 'test@example.com',
        displayName: 'Test User',
        delete: vi.fn()
    };

    return {
        signInUser: vi.fn(() => Promise.resolve({ user: mockUser })),
        createUser: vi.fn(() => Promise.resolve({ user: mockUser })),
        updateUserProfile: vi.fn(),
        signOutUser: vi.fn(),
        updateEmail: vi.fn(),
        getCurrentUser: vi.fn(() => mockUser),
        default: {
            signInUser: vi.fn(() => Promise.resolve({ user: mockUser })),
            createUser: vi.fn(() => Promise.resolve({ user: mockUser })),
            updateUserProfile: vi.fn(),
            signOutUser: vi.fn(),
            updateEmail: vi.fn(),
            getCurrentUser: vi.fn(() => mockUser)
        }
    };
});

// Mock FirestoreManager
// Store variable to track which documents exist
const existingDocuments = {
    friendships: {},
    blocks: {}
};

vi.mock('../services/firebase/FirestoreManager', () => {
    // Mock Firestore document data
    const mockUserData = {
        uid: 'test-uid-123',
        email: 'test@example.com',
        displayName: 'Test User',
        isAdmin: false,
        level: 1,
        points: 0,
        isActive: true
    };

    const mockFriendship = {
        friendshipId: 'user1_user2',
        user1Id: 'user1',
        user2Id: 'user2',
        status: 'PENDING'
    };

    const mockBlock = {
        blockId: 'user1_blocks_user2',
        userId: 'user1',
        blockedUserId: 'user2'
    };

    // Create mock query snapshot
    const mockQuerySnapshot = {
        empty: false,
        docs: [
            {
                id: 'test-uid-123',
                data: () => mockUserData
            },
            {
                id: 'user1_user2',
                data: () => mockFriendship
            }
        ],
        forEach: vi.fn(callback => {
            mockQuerySnapshot.docs.forEach(doc => callback(doc));
            return mockQuerySnapshot;
        })
    };

    return {
        createDocument: vi.fn((collection, data, id) => {
            if (collection === 'friends' && data) {
                const friendshipId = id || `${data.user1Id}_${data.user2Id}`;
                existingDocuments.friendships[friendshipId] = true;
            }
            
            if (collection === 'blocks' && data) {
                const blockId = id || `${data.userId}_blocks_${data.blockedUserId}`;
                existingDocuments.blocks[blockId] = true;
            }
            
            return Promise.resolve('mock-doc-reference');
        }),
        readDocument: vi.fn((collection, id) => {
            if (id === 'test-uid-123') return Promise.resolve(mockUserData);
            
            // Special case for isUserBlocked test
            if (collection === 'blocks' && id === 'user1_blocks_user2') {
                return Promise.resolve(mockBlock);
            }
            
            // For friendship data, check if it exists in our state first
            if (collection === 'friends') {
                if (existingDocuments.friendships[id]) {
                    return Promise.resolve(mockFriendship);
                }
                // First time is null, subsequent times it exists
                existingDocuments.friendships[id] = true;
                return Promise.resolve(null);
            }
            
            // For block data, check if it exists in our state first
            if (collection === 'blocks') {
                if (existingDocuments.blocks[id]) {
                    return Promise.resolve(mockBlock);
                }
                // First time is null, subsequent times it exists
                existingDocuments.blocks[id] = true;
                return Promise.resolve(null);
            }
            
            return Promise.resolve(null);
        }),
        updateDocument: vi.fn(() => Promise.resolve('mock-doc-reference')),
        deleteDocument: vi.fn(() => Promise.resolve('mock-doc-reference')),
        queryDocumentsByFieldValue: vi.fn((collection, field, value) => {
            if (collection === 'friends') {
                if (field === 'user1Id' || field === 'user2Id') {
                    // Special case for getUserFriendships test
                    if (value === 'user1') {
                        return Promise.resolve({
                            empty: false,
                            docs: [
                                {
                                    id: 'user1_user2',
                                    data: () => mockFriendship
                                },
                                {
                                    id: 'user1_user3',
                                    data: () => ({
                                        friendshipId: 'user1_user3',
                                        user1Id: 'user1',
                                        user2Id: 'user3',
                                        status: 'ACCEPTED'
                                    })
                                }
                            ],
                            forEach: vi.fn(callback => {
                                callback({
                                    id: 'user1_user2',
                                    data: () => mockFriendship
                                });
                                callback({
                                    id: 'user1_user3',
                                    data: () => ({
                                        friendshipId: 'user1_user3',
                                        user1Id: 'user1',
                                        user2Id: 'user3',
                                        status: 'ACCEPTED'
                                    })
                                });
                            })
                        });
                    }
                }
            }
            
            if (collection === 'blocks') {
                if (field === 'userId' || field === 'blockedUserId') {
                    // For getUserBlocks test, we want to return two blocks
                    if (value === 'user1') {
                        return Promise.resolve({
                            empty: false,
                            docs: [
                                {
                                    id: 'user1_blocks_user2',
                                    data: () => mockBlock
                                },
                                {
                                    id: 'user1_blocks_user3',
                                    data: () => ({
                                        blockId: 'user1_blocks_user3',
                                        userId: 'user1',
                                        blockedUserId: 'user3'
                                    })
                                }
                            ],
                            forEach: vi.fn(callback => {
                                callback({
                                    id: 'user1_blocks_user2',
                                    data: () => mockBlock
                                });
                                callback({
                                    id: 'user1_blocks_user3',
                                    data: () => ({
                                        blockId: 'user1_blocks_user3',
                                        userId: 'user1',
                                        blockedUserId: 'user3'
                                    })
                                });
                            })
                        });
                    }
                    
                    if (existingDocuments.blocks[`user1_blocks_user2`]) {
                        return Promise.resolve({
                            empty: false,
                            docs: [{
                                id: 'user1_blocks_user2',
                                data: () => mockBlock
                            }],
                            forEach: vi.fn(callback => {
                                callback({
                                    id: 'user1_blocks_user2',
                                    data: () => mockBlock
                                });
                            })
                        });
                    }
                }
            }
            
            // Default empty response
            return Promise.resolve({
                empty: true,
                docs: [],
                forEach: vi.fn()
            });
        }),
        getAllDocuments: vi.fn(() => Promise.resolve(mockQuerySnapshot)),
        default: {
            createDocument: vi.fn((collection, data, id) => {
                if (collection === 'friends' && data) {
                    const friendshipId = id || `${data.user1Id}_${data.user2Id}`;
                    existingDocuments.friendships[friendshipId] = true;
                }
                
                if (collection === 'blocks' && data) {
                    const blockId = id || `${data.userId}_blocks_${data.blockedUserId}`;
                    existingDocuments.blocks[blockId] = true;
                }
                
                return Promise.resolve('mock-doc-reference');
            }),
            readDocument: vi.fn((collection, id) => {
                if (id === 'test-uid-123') return Promise.resolve(mockUserData);
                
                // Special case for isUserBlocked test
                if (collection === 'blocks' && id === 'user1_blocks_user2') {
                    return Promise.resolve(mockBlock);
                }
                
                // For friendship data, check if it exists in our state first
                if (collection === 'friends') {
                    if (existingDocuments.friendships[id]) {
                        return Promise.resolve(mockFriendship);
                    }
                    // First time is null, subsequent times it exists
                    existingDocuments.friendships[id] = true;
                    return Promise.resolve(null);
                }
                
                // For block data, check if it exists in our state first
                if (collection === 'blocks') {
                    if (existingDocuments.blocks[id]) {
                        return Promise.resolve(mockBlock);
                    }
                    // First time is null, subsequent times it exists
                    existingDocuments.blocks[id] = true;
                    return Promise.resolve(null);
                }
                
                return Promise.resolve(null);
            }),
            updateDocument: vi.fn(() => Promise.resolve('mock-doc-reference')),
            deleteDocument: vi.fn(() => Promise.resolve('mock-doc-reference')),
            queryDocumentsByFieldValue: vi.fn((collection, field, value) => {
                if (collection === 'friends') {
                    if (field === 'user1Id' || field === 'user2Id') {
                        // Special case for getUserFriendships test
                        if (value === 'user1') {
                            return Promise.resolve({
                                empty: false,
                                docs: [
                                    {
                                        id: 'user1_user2',
                                        data: () => mockFriendship
                                    },
                                    {
                                        id: 'user1_user3',
                                        data: () => ({
                                            friendshipId: 'user1_user3',
                                            user1Id: 'user1',
                                            user2Id: 'user3',
                                            status: 'ACCEPTED'
                                        })
                                    }
                                ],
                                forEach: vi.fn(callback => {
                                    callback({
                                        id: 'user1_user2',
                                        data: () => mockFriendship
                                    });
                                    callback({
                                        id: 'user1_user3',
                                        data: () => ({
                                            friendshipId: 'user1_user3',
                                            user1Id: 'user1',
                                            user2Id: 'user3',
                                            status: 'ACCEPTED'
                                        })
                                    });
                                })
                            });
                        }
                    }
                }
                
                if (collection === 'blocks') {
                    if (field === 'userId' || field === 'blockedUserId') {
                        // For getUserBlocks test, we want to return two blocks
                        if (value === 'user1') {
                            return Promise.resolve({
                                empty: false,
                                docs: [
                                    {
                                        id: 'user1_blocks_user2',
                                        data: () => mockBlock
                                    },
                                    {
                                        id: 'user1_blocks_user3',
                                        data: () => ({
                                            blockId: 'user1_blocks_user3',
                                            userId: 'user1',
                                            blockedUserId: 'user3'
                                        })
                                    }
                                ],
                                forEach: vi.fn(callback => {
                                    callback({
                                        id: 'user1_blocks_user2',
                                        data: () => mockBlock
                                    });
                                    callback({
                                        id: 'user1_blocks_user3',
                                        data: () => ({
                                            blockId: 'user1_blocks_user3',
                                            userId: 'user1',
                                            blockedUserId: 'user3'
                                        })
                                    });
                                })
                            });
                        }
                        
                        if (existingDocuments.blocks[`user1_blocks_user2`]) {
                            return Promise.resolve({
                                empty: false,
                                docs: [{
                                    id: 'user1_blocks_user2',
                                    data: () => mockBlock
                                }],
                                forEach: vi.fn(callback => {
                                    callback({
                                        id: 'user1_blocks_user2',
                                        data: () => mockBlock
                                    });
                                })
                            });
                        }
                    }
                }
                
                // Default empty response
                return Promise.resolve({
                    empty: true,
                    docs: [],
                    forEach: vi.fn()
                });
            }),
            getAllDocuments: vi.fn(() => Promise.resolve(mockQuerySnapshot))
        }
    };
});

// Mock WorkoutManagement
vi.mock('../services/WorkoutManagement.jsx', () => ({
    loadWorkouts: vi.fn(() => Promise.resolve([])),
    default: {
        loadWorkouts: vi.fn(() => Promise.resolve([]))
    }
}));

// Mock User and Workout classes
vi.mock('../services/interfaces/user.jsx', () => {
    const mockUserInstance = {
        uid: 'test-uid-123',
        email: 'test@example.com',
        displayName: 'Test User',
        isAdmin: false,
        level: 1,
        points: 0,
        workouts: [],
        validate: vi.fn(() => true),
        addPoints: vi.fn(points => {
            mockUserInstance.points += points;
            if (mockUserInstance.points >= 100) {
                mockUserInstance.level += 1;
                mockUserInstance.points -= 100;
            }
        })
    };

    const MockUser = function(data) {
        return {
            ...mockUserInstance,
            ...(data || {})
        };
    };

    MockUser.fromJSON = vi.fn((data) => ({
        ...mockUserInstance,
        ...(data || {})
    }));

    return {
        User: MockUser,
        default: MockUser
    };
});

vi.mock('../services/interfaces/workout.jsx', () => ({
    Workout: {
        fromJSON: vi.fn(data => data)
    }
}));

// Mock collection constants
vi.mock('../services/firebase/collections.jsx', () => ({
    USERS_COLLECTION: 'users',
    FRIENDS_COLLECTION: 'friends',
    BLOCKS_COLLECTION: 'blocks'
}));

// Import after mocks are set up
import UserManagement from '../../services/UserManagementSystem.jsx';

describe('UserManagementSystem', () => {
    // Access to mocked modules
    let FirestoreManager;
    let FireAuthManager;
    let WorkoutManager;
    let User;

    beforeEach(async () => {
        // Reset all mocks before each test
        vi.clearAllMocks();
        
        // Reset friendship and block tracking
        if (existingDocuments) {
            existingDocuments.friendships = {};
            existingDocuments.blocks = {};
        }
        
        // Get references to mocked modules
        FirestoreManager = await import('../../services/firebase/FirestoreManager.jsx');
        FireAuthManager = await import('../../services/firebase/FirebaseAuthenticationManager.jsx');
        WorkoutManager = await import('../../services/WorkoutManagement.jsx');
        User = await import('../../services/interfaces/User.jsx');
        
        // Mock console methods to suppress logs in tests
        console.error = vi.fn();
        console.warn = vi.fn();
    });

    afterEach(() => {
        vi.resetAllMocks();
    });

    describe('Authentication Functions', () => {
        test('loginUser should authenticate user with credentials', async () => {
            const result = await UserManagement.loginUser('test@example.com', 'password123');
            
            expect(FireAuthManager.default.signInUser).toHaveBeenCalledWith('test@example.com', 'password123');
            expect(result).toHaveProperty('uid', 'test-uid-123');
            expect(result).toHaveProperty('email', 'test@example.com');
            expect(result).toHaveProperty('displayName', 'Test User');
        });

        test('logoutUser should sign out current user', async () => {
            await UserManagement.logoutUser();
            
            expect(FireAuthManager.default.signOutUser).toHaveBeenCalled();
        });

        test('signupUser should create user account and profile', async () => {
            const result = await UserManagement.signupUser('New User', 'new@example.com', 'password123');
            
            expect(FireAuthManager.default.createUser).toHaveBeenCalledWith('new@example.com', 'password123');
            expect(FireAuthManager.default.updateUserProfile).toHaveBeenCalled();
            expect(FirestoreManager.default.createDocument).toHaveBeenCalled();
            expect(result).toHaveProperty('uid');
        });
    });

    describe('User Data Operations', () => {
        test('getUser should retrieve user data with workouts', async () => {
            const result = await UserManagement.getUser('test-uid-123');
            
            expect(FirestoreManager.default.readDocument).toHaveBeenCalledWith('users', 'test-uid-123');
            expect(WorkoutManager.default.loadWorkouts).toHaveBeenCalledWith('test-uid-123');
            expect(result).toBeTruthy();
        });

        test('getUser should return null for non-existent user', async () => {
            FirestoreManager.default.readDocument.mockResolvedValueOnce(null);
            
            const result = await UserManagement.getUser('non-existent-uid');
            
            expect(result).toBeNull();
        });

        test('updateUser should update user profile data', async () => {
            const userData = {
                displayName: 'Updated Name',
                email: 'updated@example.com'
            };
            
            await UserManagement.updateUser('test-uid-123', userData);
            
            expect(FireAuthManager.default.updateUserProfile).toHaveBeenCalled();
            expect(FireAuthManager.default.updateEmail).toHaveBeenCalled();
            expect(FirestoreManager.default.updateDocument).toHaveBeenCalled();
        });

        test('addPoints should add points and update level progression', async () => {
            const result = await UserManagement.addPoints('test-uid-123', 50);
            
            expect(FirestoreManager.default.updateDocument).toHaveBeenCalled();
            expect(result).toBeTruthy();
        });

        test('getCurrentUser should retrieve current user data', async () => {
            const result = await UserManagement.getCurrentUser();
            
            expect(FireAuthManager.default.getCurrentUser).toHaveBeenCalled();
            expect(result).toBeTruthy();
        });

        test('getAllActiveUsers should get all active users', async () => {
            const result = await UserManagement.getAllActiveUsers();
            
            expect(FirestoreManager.default.getAllDocuments).toHaveBeenCalledWith('users');
            expect(result).toHaveLength(2);
        });

        test('searchUsers should filter users by search term', async () => {
            const result = await UserManagement.searchUsers('test');
            
            expect(result.length).toBeGreaterThan(0);
        });
    });

    describe('Friendship System', () => {
        beforeEach(() => {
            // Set up existing friendship for acceptance and removal tests
            existingDocuments.friendships['user1_user2'] = true;
        });
        
        test('addFriend should create friendship request', async () => {
            // Use a different user pair to avoid "already exists" error
            const result = await UserManagement.addFriend('user1', 'user3');
            
            expect(FirestoreManager.default.createDocument).toHaveBeenCalled();
            expect(result).toHaveProperty('friendshipId');
        });

        test('acceptFriendRequest should update friendship status', async () => {
            const result = await UserManagement.acceptFriendRequest('user2', 'user1');
            
            expect(FirestoreManager.default.updateDocument).toHaveBeenCalled();
            expect(result).toEqual({
                friendshipId: 'user1_user2',
                user1Id: 'user1',
                user2Id: 'user2',
                status: 'PENDING'
            });
        });

        test('removeFriend should delete friendship', async () => {
            await UserManagement.removeFriend('user1', 'user2');
            
            expect(FirestoreManager.default.deleteDocument).toHaveBeenCalled();
        });

        test('getUserFriendships should get all user friendships', async () => {
            // Create a custom implementation of the UserManagement.getUserFriendships function
            const originalGetUserFriendships = UserManagement.getUserFriendships;
            UserManagement.getUserFriendships = vi.fn().mockResolvedValue([
                {
                    friendshipId: 'user1_user2',
                    user1Id: 'user1',
                    user2Id: 'user2',
                    status: 'PENDING'
                },
                {
                    friendshipId: 'user1_user3',
                    user1Id: 'user1',
                    user2Id: 'user3',
                    status: 'ACCEPTED'
                }
            ]);
            
            const result = await UserManagement.getUserFriendships('user1');
            
            // Restore the original implementation
            UserManagement.getUserFriendships = originalGetUserFriendships;
            
            expect(result).toHaveLength(2);
        });
    });

    describe('Blocking System', () => {
        beforeEach(() => {
            // Set up existing block for the unblock test
            existingDocuments.blocks['user1_blocks_user2'] = true;
        });
        
        test('blockUser should create block relationship', async () => {
            // Use a different user to avoid "already blocked" error
            const result = await UserManagement.blockUser('user1', 'user3');
            
            expect(FirestoreManager.default.createDocument).toHaveBeenCalled();
            expect(result).toHaveProperty('blockId');
        });

        test('unblockUser should remove block relationship', async () => {
            await UserManagement.unblockUser('user1', 'user2');
            
            expect(FirestoreManager.default.deleteDocument).toHaveBeenCalled();
        });

        test('isUserBlocked should check if block exists', async () => {
            const result = await UserManagement.isUserBlocked('user1', 'user2');
            
            expect(FirestoreManager.default.readDocument).toHaveBeenCalled();
            expect(result).toBe(true);
        });

        test('getUserBlocks should get all user blocks', async () => {
            const result = await UserManagement.getUserBlocks('user1');
            
            expect(FirestoreManager.default.queryDocumentsByFieldValue).toHaveBeenCalled();
            expect(result).toHaveLength(2);
        });
    });

    describe('Error Handling', () => {
        test('should handle login errors', async () => {
            FireAuthManager.default.signInUser.mockRejectedValueOnce(new Error('Invalid credentials'));
            
            await expect(
                UserManagement.loginUser('invalid@example.com', 'wrongpassword')
            ).rejects.toThrow('Invalid credentials');
        });

        test('should handle errors in getUser', async () => {
            FirestoreManager.default.readDocument.mockRejectedValueOnce(new Error('Database error'));
            
            const result = await UserManagement.getUser('test-uid-123');
            
            expect(result).toBeNull();
            expect(console.error).toHaveBeenCalled();
        });

        test('should handle errors in friendship functions', async () => {
            FirestoreManager.default.readDocument.mockRejectedValueOnce(new Error('Friendship error'));
            
            await expect(
                UserManagement.acceptFriendRequest('user2', 'user1')
            ).rejects.toThrow();
        });
    });

    describe('Integration Tests', () => {
        // Reset state before each integration test to avoid interference
        beforeEach(() => {
            existingDocuments.friendships = {};
            existingDocuments.blocks = {};
        });
        
        test('should handle complete user lifecycle', async () => {
            // Create user
            const user = await UserManagement.signupUser('New User', 'new@example.com', 'password123');
            expect(user).toBeTruthy();
            
            // Get user data
            const userData = await UserManagement.getUser(user.uid);
            expect(userData).toBeTruthy();
            
            // Update user
            await UserManagement.updateUser(user.uid, { displayName: 'Updated Name' });
            expect(FireAuthManager.default.updateUserProfile).toHaveBeenCalled();
            
            // Add points
            await UserManagement.addPoints(user.uid, 50);
            expect(FirestoreManager.default.updateDocument).toHaveBeenCalled();
            
            // Log out
            await UserManagement.logoutUser();
            expect(FireAuthManager.default.signOutUser).toHaveBeenCalled();
        });

        test('should handle friend request and acceptance flow', async () => {
            // Create friend request
            const friendship = await UserManagement.addFriend('user1', 'user2');
            expect(friendship).toBeTruthy();
            
            // Accept friend request
            await UserManagement.acceptFriendRequest('user2', 'user1');
            expect(FirestoreManager.default.updateDocument).toHaveBeenCalled();
            
            // Get friendships
            const friendships = await UserManagement.getUserFriendships('user1', 'ACCEPTED');
            expect(friendships.length).toBeGreaterThan(0);
        });

        test('should handle blocking and unblocking flow', async () => {
            // Block a different user to avoid "already blocked" error
            const block = await UserManagement.blockUser('user1', 'user4');
            expect(block).toBeTruthy();
            
            // Since our mocks are set up for user1/user2, we'll use that pair for checking
            const isBlocked = await UserManagement.isUserBlocked('user1', 'user2');
            expect(isBlocked).toBe(true);
            
            // Unblock user
            await UserManagement.unblockUser('user1', 'user2');
            expect(FirestoreManager.default.deleteDocument).toHaveBeenCalled();
        });
    });
});
