import FirebaseManager from './FirestoreManager.jsx';
import FireAuthManager from './FirebaseAuthenticationManager.jsx';
import { Group, GroupMember } from '../interfaces/group.jsx';
import { GROUP_ROLE } from '../interfaces/constants.jsx';
import {GROUPS_COLLECTION, GROUP_MEMBERS_COLLECTION, USERS_COLLECTION } from './collections.jsx'

const GROUP_IMAGES_COLLECTION = 'groupimages';


const generateUniqueGroupId = async () => {
    let groupId;
    let isUnique = false;
    let counter = 1;
    
    while (!isUnique) {
        // OG + 6 Nummern
        const paddedNumber = counter.toString().padStart(6, '0');
        groupId = `OG${paddedNumber}`;
        
        // Same ID check
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
 * Creates a new group
 * @param {string} userId - ID of user creating the group
 * @param {string} name - Name of the group
 * @param {string} description - Description of the group
 * @param {number} maxMembers - Maximum number of members allowed (default: 50)
 * @returns {Promise<Group>} Created group object
 * @throws {Error} If creation fails
 */
const createGroup = async (userId, name, description, maxMembers = 50, isPrivate = false) => {
    try {
        const currentUser = await FireAuthManager.getCurrentUser();
        if (!currentUser || currentUser.uid !== userId) {
            throw new Error('Permission denied: Must be logged in to create a group');
        }

        // Group ID subject to change later
        // const groupId = uuidv4();
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
 * Gets data for a specific group
 * @param {string} groupId - ID of the group to retrieve
 * @returns {Promise<Group|null>} Group data object or null if not found
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
 * Gets a group with all its members
 * @param {string} groupId - ID of the group to retrieve
 * @returns {Promise<Group|null>} Group with members populated or null if not found
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

async function getGroup(groupId) {
    const group = await getGroupWithMembers(groupId);
    if (!group) {
        throw new Error('Group not found');
    }
    return group;
}

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
            updatedAt: Date.now()
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
 * Updates group details
 * @param {string} groupId - ID of the group to update
 * @param {string} userId - ID of user performing the update
 * @param {object} groupData - Object containing fields to update (name, description, maxMembers)
 * @returns {Promise<Group>} Updated group data
 * @throws {Error} If update fails or user doesn't have permission
 */
const updateGroup = async (groupId, requesterId, groupData, skipPermissionCheck = false) => {
    try {
        if (!skipPermissionCheck) {
            const group = await getGroup(groupId);
            
            // 권한 체크
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
 * Deletes a group and all its memberships
 * @param {string} groupId - ID of the group to delete
 * @param {string} userId - ID of user performing the deletion
 * @returns {Promise<void>}
 * @throws {Error} If deletion fails or user doesn't have permission
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
 * Gets all active groups
 * @param {number} limit - Maximum number of groups to retrieve (default: 50)
 * @returns {Promise<Array<Group>>} Array of group objects
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
 * Gets all groups a user is a member of
 * @param {string} userId - User ID to get groups for
 * @returns {Promise<Array<Group>>} Array of group objects
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
            
            // Only include active memberships
            if (membership.isActive()) {
                // getGroupData 대신 getGroupWithMembers 사용
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
 * Adds a user to a group
 * @param {string} groupId - ID of the group
 * @param {string} userId - ID of user to add
 * @param {string} role - Role of the user in the group (default: MEMBER)
 * @returns {Promise<GroupMember>} Created membership object
 * @throws {Error} If addition fails
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
            joinedAt: Date.now()
        });        

        await FirebaseManager.createDocument(GROUP_MEMBERS_COLLECTION, membership, membershipId, true);

        return membership;
    } catch (error) {
        console.error('Failed to add group member:', error);
        throw error;
    }
};

/**
 * Updates a member's role in a group
 * @param {string} groupId - ID of the group
 * @param {string} adminId - ID of admin user performing the update
 * @param {string} targetUserId - ID of user whose role is being updated
 * @param {string} newRole - New role to assign
 * @returns {Promise<GroupMember>} Updated membership object
 * @throws {Error} If update fails or user doesn't have permission
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

function getTargetMember(group, targetUserId) {
    const targetMember = group.getMember(targetUserId);
    if (!targetMember) {
        throw new Error('Target user is not a member of this group');
    }
    return targetMember;
}

/**
 * Removes a user from a group
 * @param {string} groupId - ID of the group
 * @param {string} userId - ID of user performing the removal
 * @param {string} targetUserId - ID of user to remove
 * @returns {Promise<void>}
 * @throws {Error} If removal fails or user doesn't have permission
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
                { leftAt: Date.now() }, 
                true
            );
            
            // 그룹 생성자가 탈퇴하는 경우
            if (group.createdBy === userId) {
                const remainingMembers = group.members.filter(member => 
                    member.userId !== userId && member.isActive()
                );
                
                if (remainingMembers.length > 0) {
                    // 가장 오래된 멤버 찾기 (joinedAt이 가장 작은 값)
                    const oldestMember = remainingMembers.reduce((oldest, current) => 
                        current.joinedAt < oldest.joinedAt ? current : oldest
                    );
                    
                    // 가장 오래된 멤버를 Admin으로 승격
                    await FirebaseManager.updateDocument(
                        GROUP_MEMBERS_COLLECTION, 
                        oldestMember.membershipId, 
                        { role: GROUP_ROLE.ADMIN }, 
                        true
                    );
                    
                    // 그룹의 createdBy를 새 Admin으로 변경
                    await FirebaseManager.updateDocument(
                        GROUPS_COLLECTION, 
                        groupId, 
                        { createdBy: oldestMember.userId }, 
                        true
                    );
                    
                    console.log(`Group ownership transferred to ${oldestMember.userId}`);
                } else {
                    // 남은 멤버가 없으면 그룹 삭제
                    await deleteGroup(groupId, userId);
                    console.log('Group deleted as no members remain');
                }
            }
        } else {
            // 다른 멤버를 제거하는 경우
            targetMember.leave();
            await FirebaseManager.updateDocument(
                GROUP_MEMBERS_COLLECTION, 
                targetMember.membershipId, 
                { leftAt: Date.now() }, 
                true
            );
        }
    } catch (error) {
        console.error('Failed to remove group member:', error);
        throw error;
    }
};

/**
 * Gets all members of a group
 * @param {string} groupId - ID of the group
 * @returns {Promise<Array<GroupMember>>} Array of group member objects
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
 * Checks if a user can join a group
 * @param {string} groupId - ID of the group
 * @param {string} userId - ID of the user
 * @returns {Promise<{canJoin: boolean, reason: string|null}>} Result object
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
 * Gets information about a user's membership in a group
 * @param {string} groupId - ID of the group
 * @param {string} userId - ID of the user
 * @returns {Promise<GroupMember|null>} Group member object or null if not found
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
 * Rejoins a group that the user previously left
 * @param {string} groupId - ID of the group
 * @param {string} userId - ID of the user rejoining
 * @returns {Promise<GroupMember>} Updated membership object
 * @throws {Error} If rejoin fails
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
                joinedAt: Date.now() 
            }, 
            true
        );
        
        return membership;
    } catch (error) {
        console.error('Failed to rejoin group:', error);
        throw error;
    }
};

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

// Export group management functions
const GroupManagementSystem = {
    // Group operations
    createGroup,
    getGroupData,
    getGroupWithMembers,
    updateGroup,
    deleteGroup,
    getAllGroups,
    getUserGroups,
    getGroup,
    
    // Membership operations
    addGroupMember,
    updateMemberRole,
    removeGroupMember,
    getGroupMembers,
    getMembershipData,
    canUserJoinGroup,
    rejoinGroup,

    // Image operations
    saveGroupImage,
    getGroupImage,

    generateUniqueGroupId,
    changeGroupAdmin,
};

export default GroupManagementSystem;