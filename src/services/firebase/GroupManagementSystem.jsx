/**
 * @fileoverview Group Management System Module
 * 
 * This module provides comprehensive group management functionality for the fitness application.
 * It handles group creation, membership management, role administration, and group operations.
 * The system supports group hierarchies with admin roles, member permissions, and automatic
 * group ownership transfer when admins leave.
 * 
 * Features include group discovery, membership validation, role management, and integration
 * with user authentication and challenge systems.
 * 
 * @author Igor, Alexander, Hyunu, Robert
 * @version 1.0.0
 */

import FirebaseManager from './FirestoreManager.jsx';
import FireAuthManager from './FirebaseAuthenticationManager.jsx';
import { Group, GroupMember } from '../interfaces/group.jsx';
import { GROUP_ROLE } from '../interfaces/constants.jsx';
import { GROUPS_COLLECTION, GROUP_MEMBERS_COLLECTION, USERS_COLLECTION } from './collections.jsx'
import { serverTimestamp } from 'firebase/firestore';

const GROUP_IMAGES_COLLECTION = 'groupimages';


/**
 * Generates a unique group ID in the format OG000001, OG000002, etc.
 * Checks existing groups in the database to ensure uniqueness.
 * @returns {Promise<string>} A unique group ID string
 * @throws {Error} If there's an error accessing the database
 */
const generateUniqueGroupId = async () => {
    let groupId;
    let isUnique = false;
    let counter = 1;

    while (!isUnique) {
        const paddedNumber = counter.toString().padStart(6, '0');
        groupId = `OG${paddedNumber}`;

        const existingGroup = await FirebaseManager.readDocument(GROUPS_COLLECTION, groupId);
        if (!existingGroup) {
            isUnique = true;
        } else {
            counter++;
        }
    }

    return groupId;
};

/**
 * Creates a new group with the specified parameters and automatically adds the creator as admin.
 * Validates user authentication and generates a unique group ID.
 * @param {string} userId - The unique identifier of the user creating the group
 * @param {string} name - The name of the group
 * @param {string} description - The description of the group
 * @param {number} [maxMembers=50] - The maximum number of members allowed in the group
 * @param {boolean} [isPrivate=false] - Whether the group is private (invite-only)
 * @returns {Promise<Group>} The created group object with the creator as admin member
 * @throws {Error} If creation fails, user is not authenticated, or database operations fail
 */
const createGroup = async (userId, name, description, maxMembers = 50, isPrivate = false) => {
    try {
        const currentUser = await FireAuthManager.getCurrentUser();
        if (!currentUser || currentUser.uid !== userId) {
            throw new Error('Permission denied: Must be logged in to create a group');
        }

        const groupId = await generateUniqueGroupId();

        const group = new Group({
            groupId,
            createdBy: userId,
            name,
            description,
            maxMembers,
            isPrivate,
            members: []
        });

        const { members, ...groupDataForFirebase } = group;
        await FirebaseManager.createDocument(GROUPS_COLLECTION, groupDataForFirebase, groupId, true);

        await addGroupMember(groupId, userId, GROUP_ROLE.ADMIN);

        return getGroupWithMembers(groupId);
    } catch (error) {
        console.error('Failed to create group:', error);
        throw error;
    }
};

/**
 * Retrieves the basic data for a specific group without member information.
 * Returns only the core group properties for lightweight operations.
 * @param {string} groupId - The unique identifier of the group to retrieve
 * @returns {Promise<Group|null>} The group object if found, null if not found or on error
 */
const getGroupData = async (groupId) => {
    try {
        const data = await FirebaseManager.readDocument(GROUPS_COLLECTION, groupId);
        if (!data) {
            return null;
        } else {
            return Group.fromJSON(data);
        }
    } catch (error) {
        console.error('Failed to get group data:', error);
        return null;
    }
};

/**
 * Retrieves a group with all its member information populated.
 * Includes both active and inactive members with their user data and roles.
 * @param {string} groupId - The unique identifier of the group to retrieve
 * @returns {Promise<Group|null>} The group object with members populated, null if not found or on error
 */
const getGroupWithMembers = async (groupId) => {
    try {
        const group = await getGroupData(groupId);
        if (!group) {
            return null;
        }

        const members = await getGroupMembers(groupId);
        group.members = members;

        return group;
    } catch (error) {
        console.error('Failed to get group with members:', error);
        return null;
    }
};

/**
 * Retrieves a group with members and throws an error if not found.
 * Convenience function for operations that require the group to exist.
 * @param {string} groupId - The unique identifier of the group
 * @returns {Promise<Group>} The group object with members populated
 * @throws {Error} If group is not found
 */
async function getGroup(groupId) {
    const group = await getGroupWithMembers(groupId);
    if (!group) {
        throw new Error('Group not found');
    }
    return group;
}

/**
 * Validates that a user has admin permissions for a group.
 * Throws an error if the user is not an admin.
 * @param {Group} group - The group object to check permissions for
 * @param {string} userId - The unique identifier of the user
 * @throws {Error} If user is not an admin
 */
function validateUserPermission(group, userId) {
    if (!group.isUserAdmin(userId)) {
        throw new Error('Permission denied: Only admins can manage group details');
    }
}

/**
 * Saves group image to Firebase
 * @param {string} base64Data - Base64 encoded image data
 * @param {string} groupId - ID of the group
 * @returns {Promise<Object>} Success object with group ID and size
 * @throws {Error} If saving fails
 */
const saveGroupImage = async (base64Data, groupId) => {
    try {
        const imageData = {
            groupId,
            imageData: base64Data,
            updatedAt: serverTimestamp()
        };

        await FirebaseManager.createDocument(GROUP_IMAGES_COLLECTION, imageData, groupId, true);

        return {
            success: true,
            groupId,
            size: base64Data.length
        };
    } catch (error) {
        console.error('Failed to save group image:', error);
        throw error;
    }
};

/**
 * Gets group image from Firebase
 * @param {string} groupId - ID of the group
 * @returns {Promise<string|null>} Base64 image data or null if not found
 */
const getGroupImage = async (groupId) => {
    try {
        const imageDoc = await FirebaseManager.readDocument(GROUP_IMAGES_COLLECTION, groupId);
        return imageDoc?.imageData || null;
    } catch (error) {
        console.error('Failed to get group image:', error);
        return null;
    }
};

/**
 * Updates specific fields of a group's information.
 * Validates admin permissions before allowing updates unless permission check is skipped.
 * @param {string} groupId - The unique identifier of the group to update
 * @param {string} requesterId - The unique identifier of the user requesting the update
 * @param {Object} groupData - The fields to update in the group
 * @param {string} [groupData.name] - Updated group name
 * @param {string} [groupData.description] - Updated group description
 * @param {number} [groupData.maxMembers] - Updated maximum member limit
 * @param {boolean} [groupData.isPrivate] - Updated privacy setting
 * @param {boolean} [skipPermissionCheck=false] - Whether to skip admin permission validation
 * @returns {Promise<boolean>} True if update was successful
 * @throws {Error} If update fails or user lacks permission
 */
const updateGroup = async (groupId, requesterId, groupData, skipPermissionCheck = false) => {
    try {
        if (!skipPermissionCheck) {
            const group = await getGroup(groupId);

            if (group.createdBy !== requesterId) {
                const member = group.members.find(m => m.userId === requesterId && m.leftAt === null);
                if (!member || member.role !== 'admin') {
                    throw new Error('Permission denied: Only admins can manage group details');
                }
            }
        }

        await FirebaseManager.updateDocument(GROUPS_COLLECTION, groupId, groupData, true);
        return true;
    } catch (error) {
        console.error('Failed to update group:', error);
        throw error;
    }
};

/**
 * Deletes a group and all its associated memberships.
 * Only the group creator can delete the group. Removes all member records before deleting the group.
 * @param {string} groupId - The unique identifier of the group to delete
 * @param {string} userId - The unique identifier of the user requesting deletion
 * @returns {Promise<void>} Resolves when group and all memberships are deleted
 * @throws {Error} If deletion fails or user is not the group creator
 */
const deleteGroup = async (groupId, userId) => {
    try {
        const group = await getGroup(groupId);

        if (group.createdBy !== userId) {
            throw new Error('Permission denied: Only the group creator can delete the group');
        }

        const memberships = await getGroupMembers(groupId);

        for (const member of memberships) {
            await FirebaseManager.deleteDocument(GROUP_MEMBERS_COLLECTION, member.membershipId);
        }

        // 그룹과 함께 이미지도 삭제
        await FirebaseManager.deleteDocument(GROUP_IMAGES_COLLECTION, groupId);

        await FirebaseManager.deleteDocument(GROUPS_COLLECTION, groupId);
    } catch (error) {
        console.error('Failed to delete group:', error);
        throw error;
    }
};

/**
 * Retrieves all active groups from the database with member information.
 * Returns groups populated with their member data, limited to the specified number.
 * @param {number} [limit=50] - The maximum number of groups to retrieve
 * @returns {Promise<Group[]>} Array of group objects with members populated
 */
const getAllGroups = async (limit = 50) => {
    try {
        const snapshot = await FirebaseManager.getAllDocuments(GROUPS_COLLECTION);

        const groups = [];
        const promises = [];
        let count = 0;

        snapshot.forEach(doc => {
            if (count < limit) {
                const groupData = doc.data();
                const group = Group.fromJSON(groupData);

                const promise = getGroupMembers(group.groupId).then(members => {
                    group.members = members;
                    groups.push(group);
                });

                promises.push(promise);
                count++;
            }
        });

        await Promise.all(promises);

        return groups;
    } catch (error) {
        console.error('Failed to get all groups:', error);
        return [];
    }
};

/**
 * Retrieves all groups that a specific user is an active member of.
 * Returns groups with full member information where the user has not left.
 * @param {string} userId - The unique identifier of the user
 * @returns {Promise<Group[]>} Array of group objects where the user is an active member
 */
const getUserGroups = async (userId) => {
    try {
        const snapshot = await FirebaseManager.queryDocumentsByFieldValue(
            GROUP_MEMBERS_COLLECTION,
            'userId',
            userId
        );

        const groups = [];
        const promises = [];

        snapshot.forEach(doc => {
            const membership = GroupMember.fromJSON(doc.data());

            if (membership.isActive()) {
                const promise = getGroupWithMembers(membership.groupId).then(group => {
                    if (group) {
                        groups.push(group);
                    }
                });
                promises.push(promise);
            }
        });

        await Promise.all(promises);
        return groups;
    } catch (error) {
        console.error('Failed to get user groups:', error);
        return [];
    }
};

/**
 * Adds a user to a group with the specified role.
 * Validates group capacity and existing membership before adding the user.
 * @param {string} groupId - The unique identifier of the group
 * @param {string} userId - The unique identifier of the user to add
 * @param {string} [role=GROUP_ROLE.MEMBER] - The role to assign to the user in the group
 * @returns {Promise<GroupMember>} The created membership object
 * @throws {Error} If addition fails, user is already a member, or group is full
 */
const addGroupMember = async (groupId, userId, role = GROUP_ROLE.MEMBER) => {
    try {
        const group = await getGroup(groupId);

        if (group.hasMember(userId)) {
            throw new Error('User is already a member of this group');
        }

        if (group.isFull()) {
            throw new Error('Group has reached maximum capacity');
        }

        const membershipId = `${groupId}_${userId}`;

        const membership = new GroupMember({
            membershipId,
            groupId,
            userId,
            role,
            joinedAt: serverTimestamp()
        });

        await FirebaseManager.createDocument(GROUP_MEMBERS_COLLECTION, membership, membershipId, true);

        return membership;
    } catch (error) {
        console.error('Failed to add group member:', error);
        throw error;
    }
};

/**
 * Updates a member's role within a group.
 * Validates admin permissions and prevents role changes for group creators.
 * @param {string} groupId - The unique identifier of the group
 * @param {string} adminId - The unique identifier of the admin user performing the update
 * @param {string} targetUserId - The unique identifier of the user whose role is being updated
 * @param {string} newRole - The new role to assign (from GROUP_ROLE constants)
 * @returns {Promise<GroupMember>} The updated membership object
 * @throws {Error} If update fails, user lacks permission, or trying to change creator's role
 */
const updateMemberRole = async (groupId, adminId, targetUserId, newRole) => {
    try {
        const group = await getGroup(groupId);

        validateUserPermission(groupId, adminId);

        const targetMember = getTargetMember(group, targetUserId);

        if (group.createdBy === targetUserId && newRole !== GROUP_ROLE.ADMIN) {
            throw new Error('Cannot change group creator\'s role from ADMIN');
        }

        targetMember.role = newRole;

        await FirebaseManager.updateDocument(
            GROUP_MEMBERS_COLLECTION,
            targetMember.membershipId,
            { role: newRole },
            true
        );

        return targetMember;
    } catch (error) {
        console.error('Failed to update member role:', error);
        throw error;
    }
};

/**
 * Helper function to get and validate a target member exists in the group.
 * @param {Group} group - The group object to search in
 * @param {string} targetUserId - The unique identifier of the target user
 * @returns {GroupMember} The target member object
 * @throws {Error} If target user is not a member of the group
 */
function getTargetMember(group, targetUserId) {
    const targetMember = group.getMember(targetUserId);
    if (!targetMember) {
        throw new Error('Target user is not a member of this group');
    }
    return targetMember;
}

/**
 * Removes a user from a group with automatic admin transfer if needed.
 * Handles self-removal and admin-initiated removal with different permission rules.
 * Automatically transfers group ownership to the oldest member if creator leaves.
 * @param {string} groupId - The unique identifier of the group
 * @param {string} userId - The unique identifier of the user performing the removal
 * @param {string} targetUserId - The unique identifier of the user to remove
 * @returns {Promise<void>} Resolves when removal is complete
 * @throws {Error} If removal fails, user lacks permission, or trying to remove group creator
 */
const removeGroupMember = async (groupId, userId, targetUserId) => {
    try {
        const group = await getGroup(groupId);

        const targetMember = getTargetMember(group, targetUserId);

        const isSelf = userId === targetUserId;
        const isAdmin = group.isUserAdmin(userId);

        if (!isAdmin && !isSelf) {
            throw new Error('Permission denied: Only admins can remove other members');
        }

        if (group.createdBy === targetUserId && !isSelf) {
            throw new Error('Cannot remove the group creator');
        }

        if (isSelf) {
            targetMember.leave();
            await FirebaseManager.updateDocument(
                GROUP_MEMBERS_COLLECTION,
                targetMember.membershipId,
                { leftAt: serverTimestamp() },
                true
            );

            if (group.createdBy === userId) {
                const remainingMembers = group.members.filter(member =>
                    member.userId !== userId && member.isActive()
                );

                if (remainingMembers.length > 0) {
                    const oldestMember = remainingMembers.reduce((oldest, current) =>
                        current.joinedAt < oldest.joinedAt ? current : oldest
                    );

                    await FirebaseManager.updateDocument(
                        GROUP_MEMBERS_COLLECTION,
                        oldestMember.membershipId,
                        { role: GROUP_ROLE.ADMIN },
                        true
                    );

                    await FirebaseManager.updateDocument(
                        GROUPS_COLLECTION,
                        groupId,
                        { createdBy: oldestMember.userId },
                        true
                    );

                    console.log(`Group ownership transferred to ${oldestMember.userId}`);
                } else {
                    await deleteGroup(groupId, userId);
                    console.log('Group deleted as no members remain');
                }
            }
        } else {
            targetMember.leave();
            await FirebaseManager.updateDocument(
                GROUP_MEMBERS_COLLECTION,
                targetMember.membershipId,
                { leftAt: serverTimestamp() },
                true
            );
        }
    } catch (error) {
        console.error('Failed to remove group member:', error);
        throw error;
    }
};

/**
 * Retrieves all members of a group with their user information.
 * Includes both active and inactive members with populated user data.
 * @param {string} groupId - The unique identifier of the group
 * @returns {Promise<GroupMember[]>} Array of group member objects with user data populated
 */
const getGroupMembers = async (groupId) => {
    try {
        const snapshot = await FirebaseManager.queryDocumentsByFieldValue(
            GROUP_MEMBERS_COLLECTION,
            'groupId',
            groupId
        );

        const members = [];
        const userPromises = [];

        snapshot.forEach(doc => {
            const memberData = doc.data();
            const member = GroupMember.fromJSON(memberData);

            // Get user data for each member
            const userPromise = FirebaseManager.readDocument(USERS_COLLECTION, member.userId)
                .then(userData => {
                    if (userData) {
                        member.user = userData;
                    }
                    members.push(member);
                });

            userPromises.push(userPromise);
        });

        await Promise.all(userPromises);
        return members;
    } catch (error) {
        console.error('Failed to get group members:', error);
        return [];
    }
};

/**
 * Checks whether a user can join a specific group.
 * Validates group existence, current membership, and capacity constraints.
 * @param {string} groupId - The unique identifier of the group
 * @param {string} userId - The unique identifier of the user
 * @returns {Promise<Object>} Result object with join eligibility
 * @returns {Promise<Object>} result.canJoin - Whether the user can join the group
 * @returns {Promise<Object>} result.reason - Reason why user cannot join (null if can join)
 */
const canUserJoinGroup = async (groupId, userId) => {
    try {
        const group = await getGroupWithMembers(groupId);
        if (!group) {
            return { canJoin: false, reason: 'Group not found' };
        }

        if (group.hasMember(userId)) {
            return { canJoin: false, reason: 'Already a member' };
        }

        if (group.isFull()) {
            return { canJoin: false, reason: 'Group is full' };
        }

        return { canJoin: true, reason: null };
    } catch (error) {
        console.error('Failed to check if user can join group:', error);
        return { canJoin: false, reason: 'Error checking group status' };
    }
};

/**
 * Retrieves membership information for a specific user in a specific group.
 * Returns the complete membership record including join/leave timestamps and role.
 * @param {string} groupId - The unique identifier of the group
 * @param {string} userId - The unique identifier of the user
 * @returns {Promise<GroupMember|null>} The group member object if found, null if not found or on error
 */
const getMembershipData = async (groupId, userId) => {
    try {
        const membershipId = `${groupId}_${userId}`;
        const data = await FirebaseManager.readDocument(GROUP_MEMBERS_COLLECTION, membershipId);

        if (!data) {
            return null;
        } else {
            return GroupMember.fromJSON(data);
        }
    } catch (error) {
        console.error('Failed to get membership data:', error);
        return null;
    }
};

/**
 * Allows a user to rejoin a group they previously left.
 * Validates group capacity and previous membership before allowing rejoin.
 * @param {string} groupId - The unique identifier of the group
 * @param {string} userId - The unique identifier of the user rejoining
 * @returns {Promise<GroupMember>} The updated membership object
 * @throws {Error} If rejoin fails, no previous membership exists, group is full, or user is already active
 */
const rejoinGroup = async (groupId, userId) => {
    try {
        const group = await getGroup(groupId);

        if (group.isFull()) {
            throw new Error('Group has reached maximum capacity');
        }

        const membershipId = `${groupId}_${userId}`;
        const membershipData = await FirebaseManager.readDocument(GROUP_MEMBERS_COLLECTION, membershipId);

        if (!membershipData) {
            throw new Error('No previous membership found');
        }

        const membership = GroupMember.fromJSON(membershipData);

        if (membership.isActive()) {
            throw new Error('Already an active member');
        }

        membership.rejoin();

        await FirebaseManager.updateDocument(
            GROUP_MEMBERS_COLLECTION,
            membershipId,
            {
                leftAt: null,
                joinedAt: serverTimestamp()
            },
            true
        );

        return membership;
    } catch (error) {
        console.error('Failed to rejoin group:', error);
        throw error;
    }
};

/**
 * Transfers group admin privileges from the current admin to a new admin.
 * Only the current group creator/admin can initiate this transfer.
 * Updates both member roles and group ownership.
 * @param {string} groupId - The unique identifier of the group
 * @param {string} currentAdminId - The unique identifier of the current admin
 * @param {string} newAdminId - The unique identifier of the user to become the new admin
 * @returns {Promise<boolean>} True if admin change was successful
 * @throws {Error} If change fails, user lacks permission, or trying to set same user as admin
 */
const changeGroupAdmin = async (groupId, currentAdminId, newAdminId) => {
    try {
        const group = await getGroup(groupId);

        if (group.createdBy !== currentAdminId) {
            throw new Error('Permission denied: Only current admin can change admin');
        }

        if (currentAdminId === newAdminId) {
            throw new Error('Selected user is already the admin');
        }

        const currentAdminMember = group.members.find(m => m.userId === currentAdminId && m.leftAt === null);
        if (!currentAdminMember || currentAdminMember.role !== 'admin') {
            throw new Error('Permission denied: Only admins can change admin');
        }

        const newAdminMembershipId = `${groupId}_${newAdminId}`;
        await FirebaseManager.updateDocument(
            GROUP_MEMBERS_COLLECTION,
            newAdminMembershipId,
            { role: GROUP_ROLE.ADMIN },
            true
        );

        const currentAdminMembershipId = `${groupId}_${currentAdminId}`;
        await FirebaseManager.updateDocument(
            GROUP_MEMBERS_COLLECTION,
            currentAdminMembershipId,
            { role: GROUP_ROLE.MEMBER },
            true
        );

        await FirebaseManager.updateDocument(
            GROUPS_COLLECTION,
            groupId,
            { createdBy: newAdminId },
            true
        );

        return true;
    } catch (error) {
        console.error('Failed to change group admin:', error);
        throw error;
    }
};

const getPublicGroups = async () => {
    try {
        const snapshot = await FirebaseManager.queryDocumentsByFieldValue(
            GROUPS_COLLECTION,
            'isPrivate',
            false
        );

        const groups = [];
        for (const doc of snapshot.docs) {
            const groupData = doc.data();
            const group = Group.fromJSON({ ...groupData, groupId: doc.id });
            // We'll fetch members and image in the component to keep this generic
            groups.push(group);
        }
        return groups;
    } catch (error) {
        console.error('Failed to get public groups:', error);
        return [];
    }
};

/**
 * Group Management System
 * 
 * Provides comprehensive group management functionality including:
 * - Group creation with unique ID generation and admin assignment
 * - Group information management (update, delete, retrieve)
 * - Member management (add, remove, role updates, rejoin)
 * - Permission validation and role-based access control
 * - Automatic admin transfer when group creators leave
 * - Group discovery and user group listings
 * - Membership validation and capacity management
 * 
 * The system supports hierarchical group structures with admin roles,
 * automatic group cleanup, and integration with user authentication.
 * 
 * @namespace GroupManagementSystem
 */
const GroupManagementSystem = {
    createGroup,
    getGroupData,
    getGroupWithMembers,
    updateGroup,
    deleteGroup,
    getAllGroups,
    getUserGroups,
    getGroup,

    addGroupMember,
    updateMemberRole,
    removeGroupMember,
    getGroupMembers,
    getMembershipData,
    canUserJoinGroup,
    rejoinGroup,
    getPublicGroups,

    // Image operations
    saveGroupImage,
    getGroupImage,

    generateUniqueGroupId,
    changeGroupAdmin,
};

export default GroupManagementSystem;