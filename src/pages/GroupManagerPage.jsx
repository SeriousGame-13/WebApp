import { useState, useEffect } from 'react';
import UserManagement from '../services/firebase/UserManagementSystem';
import GroupManagement from '../services/firebase/GroupManagementSystem';
import GroupPageElements from './GroupPage';
import '../components/styles/LayoutElements.css';
import ChallengeManagement from '../services/firebase/ChallengeManagement';

function AdminGroupDetailPopup({ group, onClose, onGroupUpdated }) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [showEditPopup, setShowEditPopup] = useState(false);
    const [isUpdatingGroup, setIsUpdatingGroup] = useState(false);
    const [creatorName, setCreatorName] = useState('Loading...');

    useEffect(() => {
        loadCreatorName();
    }, [group.createdBy]);

    const formatJoinDate = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const loadCreatorName = async () => {
        try {
            const creator = await UserManagement.getUser(group.createdBy);
            setCreatorName(creator?.displayName || 'Unknown User');
        } catch (error) {
            console.error('Failed to load creator name:', error);
            setCreatorName('Unknown User');
        }
    };

    const handleDeleteGroup = async () => {
        const confirmDelete = confirm(`Are you sure you want to delete the group "${group.name}"? This action cannot be undone.`);
        if (!confirmDelete) return;

        setIsProcessing(true);
        try {
            await GroupManagement.deleteGroup(group.groupId, group.createdBy);
            onGroupUpdated();
            onClose();
        } catch (error) {
            console.error('Failed to delete group:', error);
            alert('Failed to delete group: ' + error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleUpdateGroup = async (groupData) => {
        setIsUpdatingGroup(true);
        try {
            // Admin 페이지에서는 그룹 생성자 ID 사용
            await GroupManagement.updateGroup(group.groupId, group.createdBy, {
                name: groupData.name,
                description: groupData.description,
                isPrivate: groupData.isPrivate
            }, true);
            
            setShowEditPopup(false);
            onGroupUpdated();
        } catch (error) {
            console.error('Failed to update group:', error);
            alert('Failed to update group: ' + error.message);
        } finally {
            setIsUpdatingGroup(false);
        }
    };

    const activeMembers = group.members.filter(member => member.isActive());

    return (
        <div className='PopupBackground'>
            <div className='LargePopupContainer'>
                <h2 style={{ textAlign: 'center' }}>Admin Group Management</h2>
                
                <div className='GroupDetailContainer'>
                    <div className='GroupDetailHeader' style={{ textAlign: 'left' }}>
                        {group.name} {group.isPrivate && <span style={{ fontSize: '16px', color: '#A0A0A0' }}>(Private)</span>}
                    </div>
                    <div className='GroupDetailDescription' style={{ textAlign: 'left' }}>
                        {group.description || 'No description available.'}
                    </div>
                    <div className='GroupDetailInfo' style={{ textAlign: 'left' }}>
                        <div>Group ID: {group.groupId}</div>
                        <div>Members: {group.getActiveMemberCount()}/{group.maxMembers}</div>
                        <div>Created by: {creatorName}</div>
                        <div>Type: {group.isPrivate ? 'Private' : 'Public'}</div>
                    </div>
                    
                    <div style={{ marginTop: '20px' }}>
                        <div className="MemberListContainer">
                            <div className="GuideText" style={{ textAlign: 'center' }}>Members</div>
                            {activeMembers.map(member => (
                                <div key={member.membershipId} className="GroupJoinItem">
                                    <div style={{ 
                                        color: 'var(--main-color)', 
                                        margin: '16px 0px 12px 16px',
                                        lineHeight: '1.4',
                                        fontSize: '15px'
                                    }}>
                                        {member.user?.displayName || 'Unknown User'} 
                                        {member.isAdmin() && <span style={{ fontSize: '12px', color: '#A0A0A0' }}> (Admin)</span>}
                                    </div>
                                    <div style={{ 
                                        color: 'var(--light-color)', 
                                        margin: '0 16px 12px 16px',
                                        lineHeight: '1.4',
                                        fontSize: '13px'
                                    }}>
                                        Joined: {formatJoinDate(member.joinedAt)}
                                    </div>
                                    <div style={{ 
                                        color: 'var(--light-color)', 
                                        margin: '0 16px 16px 16px',
                                        fontSize: '12px'
                                    }}>
                                        Role: {member.role} | User ID: {member.userId}
                                    </div>
                                </div>
                            ))}
                            
                            <div className="GroupActionButtons">
                                <button 
                                    className='AdminActionButton'
                                    onClick={() => setShowEditPopup(true)}
                                    disabled={isProcessing}
                                >
                                    Edit Group
                                </button>
                                <button 
                                    className='AdminActionButton'
                                    onClick={handleDeleteGroup}
                                    disabled={isProcessing}
                                    style={{background: 'var(--background-red)', color: 'var(--light-color)'}}
                                >
                                    {isProcessing ? 'Deleting...' : 'Delete Group'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className='Line'></div>
                <div className='Buttonfield'>
                    <button className='CancelButton' onClick={onClose}>
                        Close
                    </button>
                </div>

                {showEditPopup && (
                    <EditGroupPopup
                        group={group}
                        onUpdateGroup={handleUpdateGroup}
                        onCancel={() => setShowEditPopup(false)}
                        isUpdating={isUpdatingGroup}
                    />
                )}
            </div>
        </div>
    );
}

function AddMemberPopup({ group, onClose, onMemberAdded }) {
    const [allUsers, setAllUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadAllUsers();
    }, []);

    useEffect(() => {
        if (searchTerm.trim() === '') {
            setFilteredUsers(allUsers);
        } else {
            const searchLower = searchTerm.toLowerCase();
            const filtered = allUsers.filter(user =>
                user.displayName?.toLowerCase().includes(searchLower) ||
                user.email?.toLowerCase().includes(searchLower)
            );
            setFilteredUsers(filtered);
        }
    }, [searchTerm, allUsers]);

    const loadAllUsers = async () => {
        try {
            setIsLoading(true);
            const users = await UserManagement.getAllUsers();
            
            const currentMemberIds = group.members.map(member => member.userId);
            const availableUsers = users.filter(user => !currentMemberIds.includes(user.uid));
            
            setAllUsers(availableUsers);
            setFilteredUsers(availableUsers);
        } catch (error) {
            console.error('Failed to load users:', error);
            setAllUsers([]);
            setFilteredUsers([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUserSelect = (user) => {
        setSelectedUsers(prev => {
            if (prev.includes(user.uid)) {
                return prev.filter(id => id !== user.uid);
            } else {
                return [...prev, user.uid];
            }
        });
    };

    const handleAddMembers = async () => {
        if (selectedUsers.length === 0) return;

        setIsAdding(true);
        try {
            for (const userId of selectedUsers) {
                await GroupManagement.addGroupMember(group.groupId, userId);
                // 챌린지 참가 처리
                await ChallengeManagement.addUserToGroupChallenges(group.groupId, userId);
            }
            onMemberAdded();
        } catch (error) {
            console.error('Failed to add members:', error);
            alert('Failed to add members: ' + error.message);
        } finally {
            setIsAdding(false);
        }
    };

    return (
        <div className='PopupBackground'>
            <div className='LargePopupContainer'>
                <h2>Add Members</h2>
                
                <div style={{ padding: '20px', paddingBottom: '10px' }}>
                    <input 
                        className='Input'
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search users by name or email..."
                    />
                </div>
                
                <div className='UserListContainer'>
                    {isLoading ? (
                        <div style={{ color: '#A0A0A0', textAlign: 'center', padding: '20px' }}>
                            Loading users...
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div style={{ color: '#A0A0A0', textAlign: 'center', padding: '20px' }}>
                            {searchTerm ? 'No users found matching search' : 'No available users'}
                        </div>
                    ) : (
                        filteredUsers.map(user => (
                            <div 
                                key={user.uid} 
                                className={`UserSelectItem ${selectedUsers.includes(user.uid) ? 'selected' : ''}`}
                                onClick={() => handleUserSelect(user)}
                            >
                                <div className="UserSelectName">{user.displayName}</div>
                                <div className="UserSelectInfo">
                                    {user.email} | UID: {user.uid}
                                </div>
                            </div>
                        ))
                    )}
                </div>
                <div className='Line'></div>
                <div className='Buttonfield'>
                    <button className='CancelButton' onClick={onClose}>
                        Cancel
                    </button>
                    <button 
                        className='ConfirmButton' 
                        onClick={handleAddMembers}
                        disabled={selectedUsers.length === 0 || isAdding}
                    >
                        {isAdding ? 'Adding...' : `Add ${selectedUsers.length} Member(s)`}
                    </button>
                </div>
            </div>
        </div>
    );
}

function RemoveMemberPopup({ group, onClose, onMemberRemoved }) {
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [isRemoving, setIsRemoving] = useState(false);

    const activeMembers = group.members.filter(member => member.isActive());

    const handleMemberSelect = (member) => {
        setSelectedMembers(prev => {
            if (prev.includes(member.userId)) {
                return prev.filter(id => id !== member.userId);
            } else {
                return [...prev, member.userId];
            }
        });
    };

    const handleRemoveMembers = async () => {
        if (selectedMembers.length === 0) return;

        setIsRemoving(true);
        try {
            for (const userId of selectedMembers) {
                await GroupManagement.removeGroupMember(group.groupId, group.createdBy, userId);
                await ChallengeManagement.removeUserFromGroupChallenges(group.groupId, userId);
            }
            onMemberRemoved();
        } catch (error) {
            console.error('Failed to remove members:', error);
            alert('Failed to remove members: ' + error.message);
        } finally {
            setIsRemoving(false);
        }
    };

    return (
        <div className='PopupBackground'>
            <div className='LargePopupContainer'>
                <h2>Remove Members</h2>
                <div className='UserListContainer'>
                    {activeMembers.map(member => (
                        <div 
                            key={member.userId} 
                            className={`UserSelectItem ${selectedMembers.includes(member.userId) ? 'selected' : ''}`}
                            onClick={() => handleMemberSelect(member)}
                        >
                            <div className="UserSelectName">
                                {member.user?.displayName || 'Unknown User'}
                                {member.isAdmin() && <span style={{ color: '#A0A0A0' }}> (Admin)</span>}
                            </div>
                            <div className="UserSelectInfo">
                                Role: {member.role} | UID: {member.userId}
                            </div>
                        </div>
                    ))}
                </div>
                <div className='Line'></div>
                <div className='Buttonfield'>
                    <button className='CancelButton' onClick={onClose}>
                        Cancel
                    </button>
                    <button 
                        className='GroupActionButton' 
                        onClick={handleRemoveMembers}
                        disabled={selectedMembers.length === 0 || isRemoving}
                    >
                        {isRemoving ? 'Removing...' : `Remove ${selectedMembers.length} Member(s)`}
                    </button>
                </div>
            </div>
        </div>
    );
}

function ChangeAdminPopup({ group, onClose, onAdminChanged }) {
    const [selectedAdmin, setSelectedAdmin] = useState(group.createdBy);
    const [isChanging, setIsChanging] = useState(false);

    const activeMembers = group.members.filter(member => member.isActive());

    const handleChangeAdmin = async () => {
        if (selectedAdmin === group.createdBy) {
            alert('Selected user is already the admin.');
            return;
        }

        setIsChanging(true);
        try {
            await GroupManagement.changeGroupAdmin(group.groupId, group.createdBy, selectedAdmin);
            onAdminChanged();
        } catch (error) {
            console.error('Failed to change admin:', error);
            alert('Failed to change admin: ' + error.message);
        } finally {
            setIsChanging(false);
        }
    };

    return (
        <div className='PopupBackground'>
            <div className='LargePopupContainer'>
                <h2>Change Admin</h2>
                <div className='UserListContainer'>
                    {activeMembers.map(member => (
                        <div 
                            key={member.userId} 
                            className={`UserSelectItem ${selectedAdmin === member.userId ? 'selected' : ''}`}
                            onClick={() => setSelectedAdmin(member.userId)}
                        >
                            <div className="UserSelectName">
                                {member.user?.displayName || 'Unknown User'}
                                {member.userId === group.createdBy && <span style={{ color: '#00FF94' }}> (Current Admin)</span>}
                            </div>
                            <div className="UserSelectInfo">
                                Role: {member.role} | UID: {member.userId}
                            </div>
                        </div>
                    ))}
                </div>
                <div className='Line'></div>
                <div className='Buttonfield'>
                    <button className='CancelButton' onClick={onClose}>
                        Cancel
                    </button>
                    <button 
                        className='ConfirmButton' 
                        onClick={handleChangeAdmin}
                        disabled={isChanging}
                    >
                        {isChanging ? 'Changing...' : 'Change Admin'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function EditGroupPopup({ group, onUpdateGroup, onCancel, isUpdating }) {
    const [groupName, setGroupName] = useState(group.name);
    const [groupDescription, setGroupDescription] = useState(group.description || '');
    const [isPrivate, setIsPrivate] = useState(group.isPrivate);
    const [showAddMemberPopup, setShowAddMemberPopup] = useState(false);
    const [showRemoveMemberPopup, setShowRemoveMemberPopup] = useState(false);
    const [showChangeAdminPopup, setShowChangeAdminPopup] = useState(false);

    const handleConfirm = () => {
        if (groupName.trim()) {
            onUpdateGroup({
                name: groupName.trim(),
                description: groupDescription.trim(),
                isPrivate: isPrivate
            });
        }
    };

    if (isUpdating) {
        return (
            <div className='PopupBackground'>
                <div className='PopupContainer'>
                    <h2>Updating Group...</h2>
                </div>
            </div>
        );
    }

    return (
        <div className='PopupBackground'>
            <div className='PopupContainer'>
                <h2>Edit Group</h2>
                <div className='Inputfield'>
                    <input 
                        className='Input'
                        type="text"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        placeholder="Group Name"
                        maxLength={50}
                    />
                    <input 
                        className='Input'
                        type="text"
                        value={groupDescription}
                        onChange={(e) => setGroupDescription(e.target.value)}
                        placeholder="Group Description (Optional)"
                        maxLength={200}
                    />
                    <div className='PrivacySelector'>
                        <label className='PrivacyOption'>
                            <input
                                type="radio"
                                name="privacy"
                                checked={!isPrivate}
                                onChange={() => setIsPrivate(false)}
                            />
                            <span>Public Group</span>
                        </label>
                        <label className='PrivacyOption'>
                            <input
                                type="radio"
                                name="privacy"
                                checked={isPrivate}
                                onChange={() => setIsPrivate(true)}
                            />
                            <span>Private Group</span>
                        </label>
                    </div>
                    
                    <div className='MemberManagementButtons'>
                        <button 
                            className='MemberManagementButton'
                            onClick={() => setShowAddMemberPopup(true)}
                        >
                            Add Member
                        </button>
                        <button 
                            className='MemberManagementButton'
                            onClick={() => setShowRemoveMemberPopup(true)}
                        >
                            Remove Member
                        </button>
                        <button 
                            className='MemberManagementButton'
                            onClick={() => setShowChangeAdminPopup(true)}
                        >
                            Change Admin
                        </button>
                    </div>
                </div>
                <div className='Line'></div>
                <div className='Buttonfield'>
                    <button className='CancelButton' onClick={onCancel}>
                        Cancel
                    </button>
                    <button 
                        className='ConfirmButton' 
                        onClick={handleConfirm}
                        disabled={!groupName.trim()}
                    >
                        Update
                    </button>
                </div>

                {showAddMemberPopup && (
                    <AddMemberPopup
                        group={group}
                        onClose={() => setShowAddMemberPopup(false)}
                        onMemberAdded={() => {
                            setShowAddMemberPopup(false);
                        }}
                    />
                )}

                {showRemoveMemberPopup && (
                    <RemoveMemberPopup
                        group={group}
                        onClose={() => setShowRemoveMemberPopup(false)}
                        onMemberRemoved={() => {
                            setShowRemoveMemberPopup(false);
                        }}
                    />
                )}

                {showChangeAdminPopup && (
                    <ChangeAdminPopup
                        group={group}
                        onClose={() => setShowChangeAdminPopup(false)}
                        onAdminChanged={() => {
                            setShowChangeAdminPopup(false);
                        }}
                    />
                )}
            </div>
        </div>
    );
}

function GroupManagerPage() {
    const [allGroups, setAllGroups] = useState([]);
    const [isLoadingGroups, setIsLoadingGroups] = useState(true);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [showCreateGroupPopup, setShowCreateGroupPopup] = useState(false);
    const [isCreatingGroup, setIsCreatingGroup] = useState(false);
    const [creatorNames, setCreatorNames] = useState({});

    useEffect(() => {
        loadAllGroups();
    }, []);

    const loadAllGroups = async () => {
        try {
            setIsLoadingGroups(true);
            const groups = await GroupManagement.getAllGroups();
            setAllGroups(groups);
            
            const names = {};
            for (const group of groups) {
                try {
                    const creator = await UserManagement.getUser(group.createdBy);
                    names[group.createdBy] = creator?.displayName || 'Unknown User';
                } catch (error) {
                    names[group.createdBy] = 'Unknown User';
                }
            }
            setCreatorNames(names);
        } catch (error) {
            console.error('Failed to load all groups:', error);
            setAllGroups([]);
        } finally {
            setIsLoadingGroups(false);
        }
    };

    const handleGroupCreation = async (groupData) => {
        setIsCreatingGroup(true);
        try {
            const currentUser = await UserManagement.getCurrentUser();
            
            await GroupManagement.createGroup(
                currentUser.uid,
                groupData.name,
                groupData.description,
                50,
                groupData.isPrivate
            );
            
            setShowCreateGroupPopup(false);
            await loadAllGroups();
        } catch (error) {
            console.error('Failed to create group:', error);
            alert('Failed to create group: ' + error.message);
        } finally {
            setIsCreatingGroup(false);
        }
    };

    return (
        <div className="AppContents">
            <h2 style={{ color: '#E5E5E5', margin: '0 0 20px 0' }}>Group Manager</h2>
            
            <div className="AdminGroupContainer">
                <div className="GuideText">All Groups</div>
                
                {isLoadingGroups ? (
                    <div style={{ color: '#A0A0A0', textAlign: 'center', padding: '20px' }}>
                        Loading...
                    </div>
                ) : allGroups.length === 0 ? (
                    <div style={{ color: '#A0A0A0', textAlign: 'center', padding: '20px' }}>
                        No Groups Found
                    </div>
                ) : (
                    allGroups.map(group => (
                        <div 
                            key={group.groupId} 
                            className="GroupExerciseContainer"
                            onClick={() => setSelectedGroup(group)}
                        >
                            <div className="GroupExerciseHeader">
                                {group.name} {group.isPrivate && <span style={{ fontSize: '12px', color: '#A0A0A0' }}>(Private)</span>}
                            </div>
                            <div className="GroupExerciseContents">
                                {group.description || 'No description available.'}
                            </div>
                            <div style={{ margin: '0 16px 16px 16px', fontSize: '12px', color: '#A0A0A0' }}>
                                Group ID: {group.groupId} | Members: {group.getActiveMemberCount()}/{group.maxMembers} | Created by: {creatorNames[group.createdBy] || 'Loading...'}
                            </div>
                        </div>
                    ))
                )}
                    
                <button 
                    className="AdminActionButton"
                    onClick={() => setShowCreateGroupPopup(true)}
                >
                    Create New Group
                </button>
            </div>

            {showCreateGroupPopup && (
                <GroupPageElements.CreateGroupPopup
                    onCreateGroup={handleGroupCreation}
                    onCancel={() => setShowCreateGroupPopup(false)}
                    isCreating={isCreatingGroup}
                />
            )}

            {selectedGroup && (
                <AdminGroupDetailPopup
                    group={selectedGroup}
                    onClose={() => setSelectedGroup(null)}
                    onGroupUpdated={loadAllGroups}
                />
            )}
        </div>
    );
}

export default GroupManagerPage;