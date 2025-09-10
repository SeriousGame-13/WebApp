import { Edit, Search, Trash2, UserPlus, Users, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import '../../components/styles/sphere-styles.css';
import { AdminCard, AdminPageLayout } from '../../components/ui/AdminComponents.jsx';
import ChallengeManagement from '../../services/ChallengeManagement.jsx';
import GroupManagement from '../../services/GroupManagementSystem.jsx';
import BaseModel from '../../services/interfaces/Base.jsx';
import UserManagement from '../../services/UserManagementSystem.jsx';

function AdminGroupDetailPopup({ group, onClose, onGroupUpdated }) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [showEditPopup, setShowEditPopup] = useState(false);
    const [isUpdatingGroup, setIsUpdatingGroup] = useState(false);
    const [creatorName, setCreatorName] = useState('Loading...');
    const [showAddMembersPopup, setShowAddMembersPopup] = useState(false);

    useEffect(() => {
        loadCreatorName();
    }, [group.createdBy]);

    const formatJoinDate = (timestamp) => {
        try {
            // Handle different timestamp formats
            if (!timestamp) return 'Unknown';
            
            // If it's already a Date object, format it directly
            if (timestamp instanceof Date) {
                return timestamp.toLocaleDateString();
            }
            
            // If it's a Firestore Timestamp or similar object with toDate method
            if (timestamp && typeof timestamp.toDate === 'function') {
                return timestamp.toDate().toLocaleDateString();
            }
            
            // If it's a number (Unix timestamp)
            if (typeof timestamp === 'number') {
                return new Date(timestamp).toLocaleDateString();
            }
            
            // If it's a string
            if (typeof timestamp === 'string') {
                return new Date(timestamp).toLocaleDateString();
            }
            
            // Fallback - try using BaseModel   
            const bm = new BaseModel({ createdAt: timestamp });
            return bm.getCreateAt();
        } catch (error) {
            console.error('Error formatting date:', error, timestamp);
            return 'Invalid Date';
        }
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
        <div className="modal-overlay">
            <div className="modal-backdrop" onClick={onClose}></div>
            <div className="modal-content max-w-lg">
                <div className="modal-header gap-6">
                    <h2 className="modal-title">
                        {group.name}
                        {group.isPrivate && <span className="text-sm text-slate-400 ml-2">(Private)</span>}
                    </h2>
                    <button className="modal-close" onClick={onClose}>
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-8 mb-4">
                    {/* Group Info Card */}
                    <div className="card p-4">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                                <Users className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">{group.name}</h3>
                                <p className="text-slate-400 text-sm">
                                    {group.isPrivate ? 'Private Group' : 'Public Group'}
                                </p>
                            </div>
                        </div>
                        <p className="text-slate-300 mb-4">
                            {group.description || 'No description available.'}
                        </p>
                        
                        <div className="grid-1 gap-3 text-sm">
                            <div>
                                <span className="text-slate-400">Created by:</span>
                                <p>{creatorName}</p>
                            </div>
                        </div>
                    </div>

                    {/* Members Section */}
                    <div className="card p-4 mt-4">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="font-semibold">
                                Members ({group.getActiveMemberCount()}/{group.maxMembers})
                            </h4>
                            <button
                                className="btn-secondary text-xs px-3 py-1 flex items-center gap-1"
                                onClick={() => setShowAddMembersPopup(true)}
                            >
                                <UserPlus className="w-3 h-3" />
                                Add
                            </button>
                        </div>
                        
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                            {activeMembers.map(member => (
                                <div 
                                    key={member.membershipId} 
                                    className="flex items-center justify-between p-2 bg-white/5 rounded-lg"
                                >
                                    <div>
                                        <p className="font-medium text-sm">{member.displayName}</p>
                                        <p className="text-xs text-slate-400">
                                            Joined {formatJoinDate(member.joinedAt)}
                                        </p>
                                    </div>
                                    <div className="text-xs text-slate-400">
                                        #{member.userId.slice(-6)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 pt-6 mt-4">
                        <button
                            className="btn-primary flex items-center gap-2"
                            onClick={() => setShowEditPopup(true)}
                            disabled={isProcessing}
                        >
                            <Edit className="w-4 h-4" />
                            Edit Group
                        </button>
                        <button
                            className="btn-danger flex items-center gap-2"
                            onClick={handleDeleteGroup}
                            disabled={isProcessing}
                        >
                            <Trash2 className="w-4 h-4" />
                            {isProcessing ? 'Deleting...' : 'Delete'}
                        </button>
                    </div>
                </div>
                {/* Edit Group Modal */}
                {showEditPopup && (
                    <CreateGroupPopup
                        existingGroup={group}
                        onCreateGroup={handleUpdateGroup}
                        onCancel={() => setShowEditPopup(false)}
                        isCreating={isUpdatingGroup}
                        isEditing={true}
                    />
                )}

                {/* Add Members Modal */}
                {showAddMembersPopup && (
                    <AddMembersPopup
                        group={group}
                        onClose={() => setShowAddMembersPopup(false)}
                        onMemberAdded={() => {
                            setShowAddMembersPopup(false);
                            onGroupUpdated();
                        }}
                    />
                )}
            </div>
        </div>
    );
}
function AddMembersPopup({ group, onClose, onMemberAdded }) {
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
            const users = await UserManagement.getAllActiveUsers();

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
        <div className="modal-overlay">
            <div className="modal-backdrop" onClick={onClose}></div>
            <div className="modal-content max-w-lg">
                <div className="modal-header">
                    <h2 className="modal-title">Add Members</h2>
                    <button className="modal-close" onClick={onClose}>
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Search */}
                    <div className="search-container">
                        <Search className="search-icon" />
                        <input
                            className="search-input"
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search users by name or email..."
                        />
                    </div>

                    {/* User List */}
                    <div className="max-h-64 overflow-y-auto space-y-2">
                        {isLoading ? (
                            <div className="text-center py-8">
                                <div className="login-spinner mx-auto mb-2"></div>
                                <p className="text-slate-400">Loading users...</p>
                            </div>
                        ) : filteredUsers.length === 0 ? (
                            <div className="text-center py-8 text-slate-400">
                                No available users found.
                            </div>
                        ) : (
                            filteredUsers.map(user => (
                                <div
                                    key={user.uid}
                                    className={`card p-3 cursor-pointer transition-colors ${
                                        selectedUsers.includes(user.uid) ? 'bg-white/10' : ''
                                    }`}
                                    onClick={() => handleUserSelect(user)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium">{user.displayName}</p>
                                            <p className="text-sm text-slate-400">{user.email}</p>
                                        </div>
                                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                            selectedUsers.includes(user.uid) 
                                                ? 'bg-purple-500 border-purple-500' 
                                                : 'border-slate-400'
                                        }`}>
                                            {selectedUsers.includes(user.uid) && (
                                                <span className="text-white text-xs">✓</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 justify-end pt-4 border-t border-white/10">
                        <button className="btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button
                            className="btn-primary flex items-center gap-2"
                            onClick={handleAddMembers}
                            disabled={selectedUsers.length === 0 || isAdding}
                        >
                            <UserPlus className="w-4 h-4" />
                            {isAdding ? 'Adding...' : `Add ${selectedUsers.length} Member${selectedUsers.length === 1 ? '' : 's'}`}
                        </button>
                    </div>
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

function CreateGroupPopup({ onCreateGroup, onCancel, isCreating, existingGroup, isEditing = false }) {
    const [groupName, setGroupName] = useState(existingGroup?.name || '');
    const [groupDescription, setGroupDescription] = useState(existingGroup?.description || '');
    const [isPrivate, setIsPrivate] = useState(existingGroup?.isPrivate || false);

    const handleConfirm = () => {
        if (groupName.trim()) {
            onCreateGroup({
                name: groupName.trim(),
                description: groupDescription.trim(),
                isPrivate: isPrivate
            });
        }
    };

    if (isCreating) {
        return (
            <div className="modal-overlay">
                <div className="modal-backdrop"></div>
                <div className="modal-content">
                    <div className="text-center py-8">
                        <div className="login-spinner mx-auto mb-4"></div>
                        <h2>{isEditing ? 'Updating Group...' : 'Creating Group...'}</h2>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="modal-overlay">
            <div className="modal-backdrop" onClick={onCancel}></div>
            <div className="modal-content max-w-md">
                <div className="modal-header">
                    <h2 className="modal-title">{isEditing ? 'Edit Group' : 'Create Group'}</h2>
                    <button className="modal-close" onClick={onCancel}>
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="form-label">
                            Group Name
                            <input
                                type="text"
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                                className="form-input mt-1"
                                placeholder="Enter group name"
                                maxLength={50}
                            />
                        </label>
                    </div>

                    <div>
                        <label className="form-label">
                            Description (Optional)
                            <textarea
                                value={groupDescription}
                                onChange={(e) => setGroupDescription(e.target.value)}
                                className="form-textarea mt-1"
                                placeholder="Enter group description"
                                maxLength={200}
                                rows={3}
                            />
                        </label>
                    </div>

                    <div>
                        <label className="form-label">Privacy</label>
                        <div className="space-y-2 mt-2">
                            <label className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    name="privacy"
                                    checked={!isPrivate}
                                    onChange={() => setIsPrivate(false)}
                                    className="form-radio"
                                />
                                <span>Public Group</span>
                            </label>
                            <label className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    name="privacy"
                                    checked={isPrivate}
                                    onChange={() => setIsPrivate(true)}
                                    className="form-radio"
                                />
                                <span>Private Group</span>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 justify-end pt-6 border-t border-white/10 mt-6">
                    <button className="btn-secondary" onClick={onCancel}>
                        Cancel
                    </button>
                    <button
                        className="btn-primary"
                        onClick={handleConfirm}
                        disabled={!groupName.trim()}
                    >
                        {isEditing ? 'Update' : 'Create'}
                    </button>
                </div>
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
    const [searchTerm, setSearchTerm] = useState('');

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

    const filteredGroups = allGroups.filter(group =>
        group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        creatorNames[group.createdBy]?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const stats = [
        { value: allGroups.length, label: 'Total Groups' },
        { value: allGroups.filter(g => g.isPrivate).length, label: 'Private Groups' },
        { value: allGroups.reduce((sum, group) => sum + group.getActiveMemberCount(), 0), label: 'Total Members' }
    ];

    const renderGroupCards = () => {
        return filteredGroups.map(group => (
            <AdminCard
                key={group.groupId}
                onClick={() => setSelectedGroup(group)}
            >
                <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Users className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gradient truncate">
                                {group.name}
                            </h3>
                            {group.isPrivate && (
                                <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded-full">
                                    Private
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-slate-300 line-clamp-2 mb-3">
                            {group.description || 'No description available.'}
                        </p>
                        <div className="flex items-center justify-between text-xs text-slate-400">
                            <span>{group.getActiveMemberCount()}/{group.maxMembers} members</span>
                            <span>by {creatorNames[group.createdBy] || 'Loading...'}</span>
                        </div>
                    </div>
                </div>
            </AdminCard>
        ));
    };

    return (
        <>
            <AdminPageLayout
                title="Group Manager"
                stats={stats}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                searchPlaceholder="Search groups by name, description, or creator..."
                onCreateClick={() => setShowCreateGroupPopup(true)}
                createButtonText="Create Group"
                isLoading={isLoadingGroups}
                emptyMessage="No groups found."
                contentGridClass="grid-2 gap-6"
            >
                {renderGroupCards()}
            </AdminPageLayout>

            {/* Modals */}
            {showCreateGroupPopup && (
                <CreateGroupPopup
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
        </>
    );
}

export default GroupManagerPage;