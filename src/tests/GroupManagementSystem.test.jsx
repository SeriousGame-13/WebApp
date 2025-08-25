/**
 * @fileoverview Test suite for GroupManagementSystem
 * 
 * This test suite provides comprehensive testing for the Group Management System,
 * including group creation, membership management, role administration, 
 * and group operations. All Firebase dependencies are mocked to enable isolated unit testing.
 * 
 * @author Igor, Alexander, Hyunu, Robert
 * @version 1.0.0
 */
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { Group, GroupMember } from '../services/interfaces/group.jsx';
import { GROUP_ROLE } from '../services/interfaces/constants.jsx';
import { GROUPS_COLLECTION, GROUP_MEMBERS_COLLECTION, USERS_COLLECTION } from '../services/firebase/collections.jsx';

// Mock Firebase configuration
vi.mock('../services/firebase/FirebaseAppConfiguration', () => ({
    firebaseApp: {}
}));

// Mock FirebaseAuthenticationManager
vi.mock('../services/firebase/FirebaseAuthenticationManager', () => {
    const mockUser = {
        uid: 'test-user-id',
        email: 'test@example.com',
        displayName: 'Test User'
    };

    return {
        default: {
            getCurrentUser: vi.fn(() => mockUser)
        }
    };
});

// Mock FirestoreManager
const mockedDocuments = {
    [GROUPS_COLLECTION]: {},
    [GROUP_MEMBERS_COLLECTION]: {},
    'groupimages': {},
    [USERS_COLLECTION]: {
        'test-user-id': {
            userId: 'test-user-id',
            displayName: 'Test User',
            email: 'test@example.com'
        },
        'member-user-id': {
            userId: 'member-user-id',
            displayName: 'Member User',
            email: 'member@example.com'
        },
        'admin-user-id': {
            userId: 'admin-user-id',
            displayName: 'Admin User',
            email: 'admin@example.com'
        }
    }
};

let documentIdCounter = 1;

vi.mock('../services/firebase/FirestoreManager', () => ({
    default: {
        createDocument: vi.fn((collection, data, id, overwrite = false) => {
            if (!mockedDocuments[collection]) {
                mockedDocuments[collection] = {};
            }
            
            const docId = id || `doc-${documentIdCounter++}`;
            mockedDocuments[collection][docId] = { ...data };
            return Promise.resolve(docId);
        }),
        
        readDocument: vi.fn((collection, id) => {
            if (!mockedDocuments[collection] || !mockedDocuments[collection][id]) {
                return Promise.resolve(null);
            }
            return Promise.resolve({ ...mockedDocuments[collection][id] });
        }),
        
        updateDocument: vi.fn((collection, id, data, merge = false) => {
            if (!mockedDocuments[collection] || !mockedDocuments[collection][id]) {
                return Promise.resolve(false);
            }
            
            if (merge) {
                mockedDocuments[collection][id] = {
                    ...mockedDocuments[collection][id],
                    ...data
                };
            } else {
                mockedDocuments[collection][id] = { ...data };
            }
            
            return Promise.resolve(true);
        }),
        
        deleteDocument: vi.fn((collection, id) => {
            if (!mockedDocuments[collection] || !mockedDocuments[collection][id]) {
                return Promise.resolve(false);
            }
            
            delete mockedDocuments[collection][id];
            return Promise.resolve(true);
        }),
        
        getAllDocuments: vi.fn((collection) => {
            if (!mockedDocuments[collection]) {
                return Promise.resolve({
                    forEach: () => {}
                });
            }
            
            const docs = Object.entries(mockedDocuments[collection]).map(([id, data]) => ({
                id,
                data: () => ({ ...data })
            }));
            
            return Promise.resolve({
                forEach: (callback) => docs.forEach(callback)
            });
        }),
        
        queryDocumentsByFieldValue: vi.fn((collection, field, value) => {
            if (!mockedDocuments[collection]) {
                return Promise.resolve({
                    forEach: () => {}
                });
            }
            
            const docs = Object.entries(mockedDocuments[collection])
                .filter(([_, data]) => data[field] === value)
                .map(([id, data]) => ({
                    id,
                    data: () => ({ ...data })
                }));
            
            return Promise.resolve({
                forEach: (callback) => docs.forEach(callback)
            });
        })
    }
}));

// Import the system under test
import GroupManagementSystem from '../services/firebase/GroupManagementSystem.jsx';

describe('GroupManagementSystem', () => {
    beforeEach(() => {
        // Reset mocked documents before each test
        Object.keys(mockedDocuments).forEach(collection => {
            if (collection !== 'users') {
                mockedDocuments[collection] = {};
            }
        });
        
        // Reset counters
        documentIdCounter = 1;
        
        // Clear mock call history
        vi.clearAllMocks();
    });
    
    describe('createGroup', () => {
        test('should create a new group and add creator as admin', async () => {
            const userId = 'test-user-id';
            const groupName = 'Test Group';
            const description = 'Test Description';
            
            // Mock the generateUniqueGroupId function
            const originalGenerateId = GroupManagementSystem.generateUniqueGroupId;
            GroupManagementSystem.generateUniqueGroupId = vi.fn(() => Promise.resolve('OG000001'));
            
            const result = await GroupManagementSystem.createGroup(userId, groupName, description);
            
            // Restore original function
            GroupManagementSystem.generateUniqueGroupId = originalGenerateId;
            
            // Verify group creation
            expect(result).toBeDefined();
            expect(result.groupId).toBe('OG000001');
            expect(result.name).toBe(groupName);
            expect(result.description).toBe(description);
            expect(result.createdBy).toBe(userId);
            
            // Verify creator was added as admin
            const membership = await GroupManagementSystem.getMembershipData('OG000001', userId);
            expect(membership).toBeDefined();
            expect(membership.role).toBe(GROUP_ROLE.ADMIN);
        });
        
        test('should throw an error if user is not authenticated', async () => {
            const userId = 'non-authenticated-user';
            const groupName = 'Test Group';
            const description = 'Test Description';
            
            // Mock getCurrentUser to return null (not authenticated)
            const FireAuthManager = await import('../services/firebase/FirebaseAuthenticationManager.jsx');
            const originalGetCurrentUser = FireAuthManager.default.getCurrentUser;
            FireAuthManager.default.getCurrentUser = vi.fn(() => null);
            
            await expect(GroupManagementSystem.createGroup(userId, groupName, description))
                .rejects.toThrow('Permission denied');
            
            // Restore original function
            FireAuthManager.default.getCurrentUser = originalGetCurrentUser;
        });
    });
    
    describe('getGroupData and getGroupWithMembers', () => {
        test('should retrieve group data without members', async () => {
            // Create a test group
            mockedDocuments[GROUPS_COLLECTION]['OG000001'] = {
                groupId: 'OG000001',
                name: 'Test Group',
                description: 'Test Description',
                createdBy: 'test-user-id',
                maxMembers: 50,
                isPrivate: false
            };
            
            const result = await GroupManagementSystem.getGroupData('OG000001');
            
            expect(result).toBeDefined();
            expect(result.groupId).toBe('OG000001');
            expect(result.name).toBe('Test Group');
            expect(result.members).toEqual([]);
        });
        
        test('should retrieve group with members', async () => {
            // Create a test group
            mockedDocuments[GROUPS_COLLECTION]['OG000001'] = {
                groupId: 'OG000001',
                name: 'Test Group',
                description: 'Test Description',
                createdBy: 'test-user-id',
                maxMembers: 50,
                isPrivate: false
            };
            
            // Add a test member
            mockedDocuments[GROUP_MEMBERS_COLLECTION]['OG000001_test-user-id'] = {
                membershipId: 'OG000001_test-user-id',
                groupId: 'OG000001',
                userId: 'test-user-id',
                role: GROUP_ROLE.ADMIN,
                joinedAt: Date.now(),
                leftAt: null
            };
            
            const result = await GroupManagementSystem.getGroupWithMembers('OG000001');
            
            expect(result).toBeDefined();
            expect(result.groupId).toBe('OG000001');
            expect(result.members).toHaveLength(1);
            expect(result.members[0].userId).toBe('test-user-id');
            expect(result.members[0].role).toBe(GROUP_ROLE.ADMIN);
        });
        
        test('should return null for non-existent group', async () => {
            const result = await GroupManagementSystem.getGroupData('non-existent-group');
            expect(result).toBeNull();
        });
    });
    
    describe('updateGroup', () => {
        beforeEach(async () => {
            // Create a test group
            mockedDocuments[GROUPS_COLLECTION]['OG000001'] = {
                groupId: 'OG000001',
                name: 'Test Group',
                description: 'Test Description',
                createdBy: 'test-user-id',
                maxMembers: 50,
                isPrivate: false
            };
            
            // Add admin member
            mockedDocuments[GROUP_MEMBERS_COLLECTION]['OG000001_test-user-id'] = {
                membershipId: 'OG000001_test-user-id',
                groupId: 'OG000001',
                userId: 'test-user-id',
                role: GROUP_ROLE.ADMIN,
                joinedAt: Date.now(),
                leftAt: null
            };
        });
        
        test('should update group properties', async () => {
            const updatedData = {
                name: 'Updated Group Name',
                description: 'Updated Description',
                isPrivate: true
            };
            
            const result = await GroupManagementSystem.updateGroup(
                'OG000001', 
                'test-user-id', 
                updatedData,
                true // Skip permission check for this test
            );
            
            expect(result).toBe(true);
            
            // Verify group was updated
            const updatedGroup = await GroupManagementSystem.getGroupData('OG000001');
            expect(updatedGroup.name).toBe('Updated Group Name');
            expect(updatedGroup.description).toBe('Updated Description');
            expect(updatedGroup.isPrivate).toBe(true);
        });
        
        test('should throw error if non-admin tries to update group', async () => {
            // Add a regular member
            mockedDocuments[GROUP_MEMBERS_COLLECTION]['OG000001_member-user-id'] = {
                membershipId: 'OG000001_member-user-id',
                groupId: 'OG000001',
                userId: 'member-user-id',
                role: GROUP_ROLE.MEMBER,
                joinedAt: Date.now(),
                leftAt: null
            };
            
            const updatedData = {
                name: 'Unauthorized Update'
            };
            
            // Override getGroup to properly return members for permission check
            const originalGetGroup = GroupManagementSystem.getGroup;
            GroupManagementSystem.getGroup = vi.fn(async (groupId) => {
                const group = await GroupManagementSystem.getGroupWithMembers(groupId);
                if (!group) {
                    throw new Error('Group not found');
                }
                return group;
            });
            
            await expect(GroupManagementSystem.updateGroup(
                'OG000001', 
                'member-user-id', 
                updatedData
            )).rejects.toThrow('Permission denied');
            
            // Restore original function
            GroupManagementSystem.getGroup = originalGetGroup;
        });
    });
    
    describe('addGroupMember', () => {
        beforeEach(async () => {
            // Create a test group
            mockedDocuments[GROUPS_COLLECTION]['OG000001'] = {
                groupId: 'OG000001',
                name: 'Test Group',
                description: 'Test Description',
                createdBy: 'test-user-id',
                maxMembers: 50,
                isPrivate: false
            };
            
            // Add admin member
            mockedDocuments[GROUP_MEMBERS_COLLECTION]['OG000001_test-user-id'] = {
                membershipId: 'OG000001_test-user-id',
                groupId: 'OG000001',
                userId: 'test-user-id',
                role: GROUP_ROLE.ADMIN,
                joinedAt: Date.now(),
                leftAt: null
            };
        });
        
        test('should add a new member to the group', async () => {
            const result = await GroupManagementSystem.addGroupMember(
                'OG000001',
                'member-user-id',
                GROUP_ROLE.MEMBER
            );
            
            expect(result).toBeDefined();
            expect(result.userId).toBe('member-user-id');
            expect(result.groupId).toBe('OG000001');
            expect(result.role).toBe(GROUP_ROLE.MEMBER);
            
            // Verify member was added
            const group = await GroupManagementSystem.getGroupWithMembers('OG000001');
            const memberExists = group.members.some(m => m.userId === 'member-user-id');
            expect(memberExists).toBe(true);
        });
        
        test('should throw error if user is already a member', async () => {
            // First add the member
            await GroupManagementSystem.addGroupMember(
                'OG000001',
                'member-user-id',
                GROUP_ROLE.MEMBER
            );
            
            // Try to add the same member again
            await expect(GroupManagementSystem.addGroupMember(
                'OG000001',
                'member-user-id',
                GROUP_ROLE.MEMBER
            )).rejects.toThrow('User is already a member');
        });
        
        test('should throw error if group is full', async () => {
            // Update group to be at capacity
            mockedDocuments[GROUPS_COLLECTION]['OG000001'].maxMembers = 1;
            
            // Try to add a new member
            await expect(GroupManagementSystem.addGroupMember(
                'OG000001',
                'member-user-id',
                GROUP_ROLE.MEMBER
            )).rejects.toThrow('Group has reached maximum capacity');
        });
    });
    
    describe('removeGroupMember', () => {
        beforeEach(async () => {
            // Create a test group
            mockedDocuments[GROUPS_COLLECTION]['OG000001'] = {
                groupId: 'OG000001',
                name: 'Test Group',
                description: 'Test Description',
                createdBy: 'test-user-id',
                maxMembers: 50,
                isPrivate: false
            };
            
            // Add admin member
            mockedDocuments[GROUP_MEMBERS_COLLECTION]['OG000001_test-user-id'] = {
                membershipId: 'OG000001_test-user-id',
                groupId: 'OG000001',
                userId: 'test-user-id',
                role: GROUP_ROLE.ADMIN,
                joinedAt: Date.now(),
                leftAt: null
            };
            
            // Add regular member
            mockedDocuments[GROUP_MEMBERS_COLLECTION]['OG000001_member-user-id'] = {
                membershipId: 'OG000001_member-user-id',
                groupId: 'OG000001',
                userId: 'member-user-id',
                role: GROUP_ROLE.MEMBER,
                joinedAt: Date.now(),
                leftAt: null
            };
        });
        
        test('admin should be able to remove a member', async () => {
            await GroupManagementSystem.removeGroupMember(
                'OG000001',
                'test-user-id', // Admin doing the removal
                'member-user-id' // User being removed
            );
            
            // Verify member was marked as left
            const membership = await GroupManagementSystem.getMembershipData('OG000001', 'member-user-id');
            expect(membership.leftAt).not.toBeNull();
        });
        
        test('member should be able to remove themselves', async () => {
            await GroupManagementSystem.removeGroupMember(
                'OG000001',
                'member-user-id', // Member removing themselves
                'member-user-id'
            );
            
            // Verify member was marked as left
            const membership = await GroupManagementSystem.getMembershipData('OG000001', 'member-user-id');
            expect(membership.leftAt).not.toBeNull();
        });
        
        test('non-admin should not be able to remove other members', async () => {
            // Add another regular member
            mockedDocuments[GROUP_MEMBERS_COLLECTION]['OG000001_another-user-id'] = {
                membershipId: 'OG000001_another-user-id',
                groupId: 'OG000001',
                userId: 'another-user-id',
                role: GROUP_ROLE.MEMBER,
                joinedAt: Date.now(),
                leftAt: null
            };
            
            await expect(GroupManagementSystem.removeGroupMember(
                'OG000001',
                'member-user-id', // Regular member trying to remove someone else
                'another-user-id'
            )).rejects.toThrow('Permission denied');
        });
        
        test('should transfer ownership when group creator leaves', async () => {
            // Ensure target member was added before admin leaves
            await GroupManagementSystem.removeGroupMember(
                'OG000001',
                'test-user-id', // Admin removing themselves
                'test-user-id'
            );
            
            // Verify ownership was transferred
            const updatedGroup = await GroupManagementSystem.getGroupData('OG000001');
            expect(updatedGroup.createdBy).toBe('member-user-id');
            
            // Verify new admin role
            const newAdminMembership = await GroupManagementSystem.getMembershipData('OG000001', 'member-user-id');
            expect(newAdminMembership.role).toBe(GROUP_ROLE.ADMIN);
        });
    });
    
    describe('getUserGroups', () => {
        beforeEach(async () => {
            // Create test groups
            mockedDocuments[GROUPS_COLLECTION]['OG000001'] = {
                groupId: 'OG000001',
                name: 'Group 1',
                description: 'Test Description',
                createdBy: 'test-user-id',
                maxMembers: 50,
                isPrivate: false
            };
            
            mockedDocuments[GROUPS_COLLECTION]['OG000002'] = {
                groupId: 'OG000002',
                name: 'Group 2',
                description: 'Test Description',
                createdBy: 'admin-user-id',
                maxMembers: 50,
                isPrivate: false
            };
            
            // Add memberships
            mockedDocuments[GROUP_MEMBERS_COLLECTION]['OG000001_test-user-id'] = {
                membershipId: 'OG000001_test-user-id',
                groupId: 'OG000001',
                userId: 'test-user-id',
                role: GROUP_ROLE.ADMIN,
                joinedAt: Date.now(),
                leftAt: null
            };
            
            mockedDocuments[GROUP_MEMBERS_COLLECTION]['OG000002_test-user-id'] = {
                membershipId: 'OG000002_test-user-id',
                groupId: 'OG000002',
                userId: 'test-user-id',
                role: GROUP_ROLE.MEMBER,
                joinedAt: Date.now(),
                leftAt: null
            };
            
            // Add an inactive membership
            mockedDocuments[GROUP_MEMBERS_COLLECTION]['OG000003_test-user-id'] = {
                membershipId: 'OG000003_test-user-id',
                groupId: 'OG000003',
                userId: 'test-user-id',
                role: GROUP_ROLE.MEMBER,
                joinedAt: Date.now() - 10000,
                leftAt: Date.now() // User left this group
            };
        });
        
        test('should return all active groups for a user', async () => {
            const result = await GroupManagementSystem.getUserGroups('test-user-id');
            
            expect(result).toHaveLength(2);
            expect(result.map(g => g.groupId)).toContain('OG000001');
            expect(result.map(g => g.groupId)).toContain('OG000002');
            expect(result.map(g => g.groupId)).not.toContain('OG000003');
        });
    });
    
    describe('changeGroupAdmin', () => {
        beforeEach(async () => {
            // Create a test group
            mockedDocuments[GROUPS_COLLECTION]['OG000001'] = {
                groupId: 'OG000001',
                name: 'Test Group',
                description: 'Test Description',
                createdBy: 'test-user-id',
                maxMembers: 50,
                isPrivate: false
            };
            
            // Add admin and member
            mockedDocuments[GROUP_MEMBERS_COLLECTION]['OG000001_test-user-id'] = {
                membershipId: 'OG000001_test-user-id',
                groupId: 'OG000001',
                userId: 'test-user-id',
                role: GROUP_ROLE.ADMIN,
                joinedAt: Date.now(),
                leftAt: null
            };
            
            mockedDocuments[GROUP_MEMBERS_COLLECTION]['OG000001_member-user-id'] = {
                membershipId: 'OG000001_member-user-id',
                groupId: 'OG000001',
                userId: 'member-user-id',
                role: GROUP_ROLE.MEMBER,
                joinedAt: Date.now(),
                leftAt: null
            };
        });
        
        test('should transfer admin role to another member', async () => {
            const result = await GroupManagementSystem.changeGroupAdmin(
                'OG000001',
                'test-user-id', // Current admin
                'member-user-id' // New admin
            );
            
            expect(result).toBe(true);
            
            // Verify group ownership changed
            const updatedGroup = await GroupManagementSystem.getGroupData('OG000001');
            expect(updatedGroup.createdBy).toBe('member-user-id');
            
            // Verify role changes
            const formerAdminMembership = await GroupManagementSystem.getMembershipData('OG000001', 'test-user-id');
            const newAdminMembership = await GroupManagementSystem.getMembershipData('OG000001', 'member-user-id');
            
            expect(formerAdminMembership.role).toBe(GROUP_ROLE.MEMBER);
            expect(newAdminMembership.role).toBe(GROUP_ROLE.ADMIN);
        });
        
        test('should throw error if non-admin tries to change admin', async () => {
            await expect(GroupManagementSystem.changeGroupAdmin(
                'OG000001',
                'member-user-id', // Non-admin trying to change
                'test-user-id'
            )).rejects.toThrow('Permission denied');
        });
    });
    
    describe('Group Image Management', () => {
        test('should save and retrieve group image', async () => {
            const groupId = 'OG000001';
            const imageData = 'base64-encoded-image-data';
            
            // Save image
            const saveResult = await GroupManagementSystem.saveGroupImage(imageData, groupId);
            expect(saveResult.success).toBe(true);
            expect(saveResult.groupId).toBe(groupId);
            
            // Retrieve image
            const retrievedImage = await GroupManagementSystem.getGroupImage(groupId);
            expect(retrievedImage).toBe(imageData);
        });
    });
    
    describe('canUserJoinGroup', () => {
        beforeEach(async () => {
            // Create test group
            mockedDocuments[GROUPS_COLLECTION]['OG000001'] = {
                groupId: 'OG000001',
                name: 'Test Group',
                description: 'Test Description',
                createdBy: 'test-user-id',
                maxMembers: 2,
                isPrivate: false
            };
            
            // Add one member
            mockedDocuments[GROUP_MEMBERS_COLLECTION]['OG000001_test-user-id'] = {
                membershipId: 'OG000001_test-user-id',
                groupId: 'OG000001',
                userId: 'test-user-id',
                role: GROUP_ROLE.ADMIN,
                joinedAt: Date.now(),
                leftAt: null
            };
        });
        
        test('should allow a new user to join when group has capacity', async () => {
            const result = await GroupManagementSystem.canUserJoinGroup('OG000001', 'new-user-id');
            expect(result.canJoin).toBe(true);
            expect(result.reason).toBeNull();
        });
        
        test('should not allow existing member to join again', async () => {
            const result = await GroupManagementSystem.canUserJoinGroup('OG000001', 'test-user-id');
            expect(result.canJoin).toBe(false);
            expect(result.reason).toBe('Already a member');
        });
        
        test('should not allow joining a full group', async () => {
            // Add another member to reach capacity
            mockedDocuments[GROUP_MEMBERS_COLLECTION]['OG000001_member-user-id'] = {
                membershipId: 'OG000001_member-user-id',
                groupId: 'OG000001',
                userId: 'member-user-id',
                role: GROUP_ROLE.MEMBER,
                joinedAt: Date.now(),
                leftAt: null
            };
            
            const result = await GroupManagementSystem.canUserJoinGroup('OG000001', 'new-user-id');
            expect(result.canJoin).toBe(false);
            expect(result.reason).toBe('Group is full');
        });
    });
});
