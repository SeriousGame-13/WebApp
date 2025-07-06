import React, { useState, useEffect } from 'react';
import ExpElements from '../components/ui/ExpBar';
import IconElements from '../components/ui/IconElements';
import UserManagement from '../services/firebase/UserManagementSystem';
import GroupManagement from '../services/firebase/GroupManagementSystem';

import '../components/styles/LayoutElements.css'

function CreateGroupPopup({ onCreateGroup, onCancel, isCreating }) {
    const [groupName, setGroupName] = useState('');
    const [groupDescription, setGroupDescription] = useState('');
    const [isPrivate, setIsPrivate] = useState(false);

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
            <div className='PopupBackground'>
                <div className='PopupContainer'>
                    <h2>Creating Group...</h2>
                </div>
            </div>
        );
    }

    return (
        <div className='PopupBackground'>
            <div className='PopupContainer'>
                <h2>Create New Group</h2>
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
                        Create
                    </button>
                </div>
            </div>
        </div>
    );
}

function JoinGroupByIdPopup({ onJoinById, onCancel, isJoining }) {
    const [groupId, setGroupId] = useState('');

    const handleConfirm = () => {
        if (groupId.trim()) {
            onJoinById(groupId.trim());
        }
    };

    if (isJoining) {
        return (
            <div className='PopupBackground'>
                <div className='PopupContainer'>
                    <h2>Joining Group...</h2>
                </div>
            </div>
        );
    }

    return (
        <div className='PopupBackground'>
            <div className='PopupContainer'>
                <h2>Join Group by ID</h2>
                <div className='Inputfield'>
                    <input 
                        className='Input'
                        type="text"
                        value={groupId}
                        onChange={(e) => setGroupId(e.target.value.toUpperCase())}
                        placeholder="Enter Group ID (e.g., OG123456)"
                        maxLength={8}
                    />
                </div>
                <div className='Line'></div>
                <div className='Buttonfield'>
                    <button className='CancelButton' onClick={onCancel}>
                        Cancel
                    </button>
                    <button 
                        className='ConfirmButton' 
                        onClick={handleConfirm}
                        disabled={!groupId.trim()}
                    >
                        Join
                    </button>
                </div>
            </div>
        </div>
    );
}

function JoinGroupListPopup({ onCancel }) {
    const [publicGroups, setPublicGroups] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [isLoadingGroups, setIsLoadingGroups] = useState(true);
    const [isJoining, setIsJoining] = useState(false);

    useEffect(() => {
        loadPublicGroups();
    }, []);

    const loadPublicGroups = async () => {
        try {
            setIsLoadingGroups(true);
            const currentUser = await UserManagement.getCurrentUser();
            
            // 모든 그룹과 사용자의 가입 그룹을 병렬로 가져오기
            const [allGroups, userGroups] = await Promise.all([
                GroupManagement.getAllGroups(),
                GroupManagement.getUserGroups(currentUser.uid)
            ]);
            
            // 사용자가 이미 가입한 그룹 ID 목록
            const joinedGroupIds = userGroups.map(group => group.groupId);
            
            // 공개 그룹 중에서 이미 가입하지 않은 그룹만 필터링
            const availablePublicGroups = allGroups.filter(group => 
                !group.isPrivate && !joinedGroupIds.includes(group.groupId)
            );
            
            setPublicGroups(availablePublicGroups);
        } catch (error) {
            console.error('Failed to load public groups:', error);
            setPublicGroups([]);
        } finally {
            setIsLoadingGroups(false);
        }
    };

    const handleJoinGroup = async () => {
        if (!selectedGroup) return;
        
        setIsJoining(true);
        try {
            const currentUser = await UserManagement.getCurrentUser();
            await GroupManagement.addGroupMember(selectedGroup.groupId, currentUser.uid);
            onCancel(); // 팝업 닫기
            // TODO: 그룹 목록 새로고침
        } catch (error) {
            console.error('Failed to join group:', error);
            alert('Failed to join group: ' + error.message);
        } finally {
            setIsJoining(false);
        }
    };

    if (selectedGroup) {
        return (
            <div className='PopupBackground'>
                <div className='LargePopupContainer'>
                    <h2>Group Details</h2>
                    <div className='GroupDetailContainer'>
                        <div className='GroupDetailHeader'>{selectedGroup.name}</div>
                        <div className='GroupDetailDescription'>
                            {selectedGroup.description || 'No description available.'}
                        </div>
                        <div className='GroupDetailInfo'>
                            <div>Group ID: {selectedGroup.groupId}</div>
                            <div>Members: {selectedGroup.getActiveMemberCount()}/{selectedGroup.maxMembers}</div>
                            <div>Created by: {selectedGroup.createdBy}</div>
                        </div>
                    </div>
                    <div className='Line'></div>
                    <div className='Buttonfield'>
                        <button className='CancelButton' onClick={() => setSelectedGroup(null)}>
                            Back
                        </button>
                        <button 
                            className='ConfirmButton' 
                            onClick={handleJoinGroup}
                            disabled={isJoining}
                        >
                            {isJoining ? 'Joining...' : 'Join Group'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className='PopupBackground'>
            <div className='LargePopupContainer'>
                <h2>Join Public Group</h2>
                <div className='GroupListContainer'>
                    {isLoadingGroups ? (
                        <div style={{ color: '#A0A0A0', textAlign: 'center', padding: '20px' }}>
                            Loading groups...
                        </div>
                    ) : publicGroups.length === 0 ? (
                        <div style={{ color: '#A0A0A0', textAlign: 'center', padding: '20px' }}>
                            No public groups available
                        </div>
                    ) : (
                        publicGroups.map(group => (
                            <div 
                                key={group.groupId} 
                                className="GroupListItem"
                                onClick={() => setSelectedGroup(group)}
                            >
                                <div className="GroupListHeader">{group.name}</div>
                                <div className="GroupListDescription">
                                    {group.description || 'No description available.'}
                                </div>
                                <div className="GroupListInfo">
                                    Group ID: {group.groupId} | Members: {group.getActiveMemberCount()}/{group.maxMembers}
                                </div>
                            </div>
                        ))
                    )}
                </div>
                <div className='Line'></div>
                <div className='Buttonfield'>
                    <button className='CancelButton' onClick={onCancel}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
function JoinedGroupDetailPopup({ group, onClose, onGroupLeft }) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        const loadCurrentUser = async () => {
            try {
                const user = await UserManagement.getCurrentUser();
                setCurrentUser(user);
            } catch (error) {
                console.error('Failed to load current user:', error);
            }
        };
        loadCurrentUser();
    }, []);

    const formatJoinDate = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const handleLeaveGroup = async () => {
        if (!currentUser) return;
        
        setIsProcessing(true);
        try {
            await GroupManagement.removeGroupMember(group.groupId, currentUser.uid, currentUser.uid);
            onGroupLeft(); // 그룹 목록 새로고침
            onClose();
        } catch (error) {
            console.error('Failed to leave group:', error);
            alert('Failed to leave group: ' + error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDeleteGroup = async () => {
        if (!currentUser) return;
        
        const confirmDelete = confirm(`Are you sure you want to delete the group "${group.name}"? This action cannot be undone.`);
        if (!confirmDelete) return;

        setIsProcessing(true);
        try {
            await GroupManagement.deleteGroup(group.groupId, currentUser.uid);
            onGroupLeft(); // 그룹 목록 새로고침
            onClose();
        } catch (error) {
            console.error('Failed to delete group:', error);
            alert('Failed to delete group: ' + error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const activeMembers = group.members.filter(member => member.isActive());
    const isCreator = currentUser && group.createdBy === currentUser.uid;

    return (
        <div className='PopupBackground'>
            <div className='LargePopupContainer'>
                <h2 style={{ textAlign: 'center' }}>Group Details</h2>
                
                {/* 그룹 정보 */}
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
                        <div>Created by: {group.createdBy}</div>
                    </div>
                    
                    {/* 멤버 목록 */}
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
                            
                            {/* 그룹 액션 버튼들 */}
                            <div className="GroupActionButtons">
                                {isCreator && (
                                    <button 
                                        className='GroupActionButton'
                                        onClick={handleDeleteGroup}
                                        disabled={isProcessing}
                                    >
                                        {isProcessing ? 'Deleting...' : 'Delete Group'}
                                    </button>
                                )}
                                <button 
                                    className='GroupActionButton'
                                    onClick={handleLeaveGroup}
                                    disabled={isProcessing}
                                >
                                    {isProcessing ? 'Leaving...' : 'Leave Group'}
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
            </div>
        </div>
    );
}

function Page ({data}) {

    const userData = data;
    const [groupName, setGroupName] = useState('');
    const [memberId, setMemberId] = useState('');
    const [showActionPopup, setShowActionPopup] = useState(false);
    const [showCreateGroupPopup, setShowCreateGroupPopup] = useState(false);
    const [isCreatingGroup, setIsCreatingGroup] = useState(false);
    const [userGroups, setUserGroups] = useState([]);
    const [isLoadingGroups, setIsLoadingGroups] = useState(true);
    const [showJoinByIdPopup, setShowJoinByIdPopup] = useState(false);
    const [showJoinListPopup, setShowJoinListPopup] = useState(false);
    const [isJoiningGroup, setIsJoiningGroup] = useState(false);
    const [selectedJoinedGroup, setSelectedJoinedGroup] = useState(null);

    const handleCreateGroup = async () => {
        setShowActionPopup(false);
        setShowCreateGroupPopup(true);
    };

    const handleJoinGroup = () => {
        setShowActionPopup(false);
        setShowJoinListPopup(true);
    };

    const handleJoinGroupViaId = () => {
        setShowActionPopup(false);
        setShowJoinByIdPopup(true);
    };

    const loadUserGroups = async () => {
        try {
            setIsLoadingGroups(true);
            const currentUser = await UserManagement.getCurrentUser();
            const groups = await GroupManagement.getUserGroups(currentUser.uid);
            setUserGroups(groups);
        } catch (error) {
            console.error('Failed to load group list:', error);
            setUserGroups([]);
        } finally {
            setIsLoadingGroups(false);
        }
    };

    useEffect(() => {
        loadUserGroups();
    }, []);

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
            await loadUserGroups(); // 그룹 목록 새로고침
        } catch (error) {
            console.error('Failed to create group:', error);
            alert('Failed to create group: ' + error.message);
        } finally {
            setIsCreatingGroup(false);
        }
    };

    const handleJoinById = async (groupId) => {
    setIsJoiningGroup(true);
    try {
        const currentUser = await UserManagement.getCurrentUser();
        await GroupManagement.addGroupMember(groupId, currentUser.uid);
        setShowJoinByIdPopup(false);
        await loadUserGroups();
    } catch (error) {
        console.error('Failed to join group:', error);
        alert('Failed to join group: ' + error.message);
    } finally {
        setIsJoiningGroup(false);
    }
};

    const handleAddMember = async () => {
        const user = await UserManagement.getCurrentUser();
        const groups = await GroupManagement.getUserGroups(user.uid);
        GroupManagement.addGroupMember(groups[0].groupId, memberId, GROUP_ROLE.MEMBER);
    };

    const handleRemoveMember = async () => {
        const user = await UserManagement.getCurrentUser();
        const groups = await GroupManagement.getUserGroups(user.uid);
        GroupManagement.removeGroupMember(groups[0].groupId, user.uid, memberId)
    };

    const handleDeleteGroup = async () => {
        const user = await UserManagement.getCurrentUser();
        const groups = await GroupManagement.getUserGroups(user.uid);
        GroupManagement.deleteGroup(groups[0].groupId, user.uid);
    };

    return (
        <div className="AppContents">
            <div className="GroupContents">
                <div className="GroupContainer">
                    <div className="GuideText">Joined Groups</div>

                    {isLoadingGroups ? (
                        <div style={{ color: '#A0A0A0', textAlign: 'center', padding: '20px' }}>
                            Loading...
                        </div>
                    ) : userGroups.length === 0 ? (
                        <div style={{ color: '#A0A0A0', textAlign: 'center', padding: '20px' }}>
                            No Joined Groups
                        </div>
                    ) : (
                        userGroups.map(group => (
                            <div 
                                key={group.groupId} 
                                className="GroupExerciseContainer"
                                onClick={() => setSelectedJoinedGroup(group)}  // 클릭 이벤트 추가
                            >
                                <div className="GroupExerciseHeader">
                                    {group.name} {group.isPrivate && <span style={{ fontSize: '12px', color: '#A0A0A0' }}>(Private)</span>}
                                </div>
                                <div className="GroupExerciseContents">
                                    {group.description || 'No description available.'}
                                </div>
                                <div style={{ margin: '0 16px 16px 16px', fontSize: '12px', color: '#A0A0A0' }}>
                                    Group ID: {group.groupId} | Members: {group.getActiveMemberCount()}/{group.maxMembers}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="AddGroupButtonContainer">
                    <button 
                        className="AddGroupButton"
                        onClick={() => setShowActionPopup(true)}
                    >
                        <span className="PlusIcon">+</span>
                    </button>
                </div>

            </div>

            {showActionPopup && (
                <ActionSelectionPopup
                    onCreateGroup={handleCreateGroup}
                    onJoinGroup={handleJoinGroup}
                    onJoinGroupViaId={handleJoinGroupViaId}
                    onCancel={() => setShowActionPopup(false)}
                />
            )}

            {showCreateGroupPopup && (
                <CreateGroupPopup
                    onCreateGroup={handleGroupCreation}
                    onCancel={() => setShowCreateGroupPopup(false)}
                    isCreating={isCreatingGroup}
                />
            )}

            {showJoinByIdPopup && (
                <JoinGroupByIdPopup
                    onJoinById={handleJoinById}
                    onCancel={() => setShowJoinByIdPopup(false)}
                    isJoining={isJoiningGroup}
                />
            )}

            {showJoinListPopup && (
                <JoinGroupListPopup
                    onCancel={() => setShowJoinListPopup(false)}
                />
            )}

            {selectedJoinedGroup && (
                <JoinedGroupDetailPopup
                    group={selectedJoinedGroup}
                    onClose={() => setSelectedJoinedGroup(null)}
                    onGroupLeft={loadUserGroups}
                />
            )}
        </div>
    );
}

function ActionSelectionPopup({ onCreateGroup, onJoinGroup, onJoinGroupViaId, onCancel }) {
    return (
        <div className='PopupBackground'>
            <div className='PopupContainer'>
                <h2>Group Management</h2>
                <div className='ActionButtonContainer'>
                    <button 
                        className='ActionButton CreateGroupButton'
                        onClick={onCreateGroup}
                    >
                        <div className='ActionIcon'>+</div>
                        <div className='ActionText'>Create New Group</div>
                    </button>
                    <button 
                        className='ActionButton JoinGroupButton'
                        onClick={onJoinGroup}
                    >
                        <div className='ActionIcon'>▷</div>
                        <div className='ActionText'>Join Group</div>
                    </button>
                    <button 
                        className='ActionButton JoinGroupViaIdButton'
                        onClick={onJoinGroupViaId}
                    >
                        <div className='ActionIcon'>▷</div>
                        <div className='ActionText'>Join Group via ID</div>
                    </button>
                </div>
                <div className='Line' style={{ margin: '20px 0 0 0' }}></div>
                <div className='Buttonfield'>
                    <button className='CancelButton' onClick={onCancel}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}

const GroupPageElements = {
    Page
};

export default GroupPageElements;