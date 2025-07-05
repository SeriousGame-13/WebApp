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

function Page ({data}) {

    const userData = data;
    const [groupName, setGroupName] = useState('');
    const [memberId, setMemberId] = useState('');
    const [showActionPopup, setShowActionPopup] = useState(false);
    const [showCreateGroupPopup, setShowCreateGroupPopup] = useState(false);
    const [isCreatingGroup, setIsCreatingGroup] = useState(false);
    const [userGroups, setUserGroups] = useState([]);
    const [isLoadingGroups, setIsLoadingGroups] = useState(true);

    const handleJoinGroup = () => {
        setShowActionPopup(false);
        // TODO
    };

    const handleCreateGroup = async () => {
        setShowActionPopup(false);
        setShowCreateGroupPopup(true);
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
                            <div key={group.groupId} className="GroupExerciseContainer">
                                <div className="GroupExerciseHeader">
                                    {group.name} {group.isPrivate && <span style={{ fontSize: '12px', color: '#A0A0A0' }}>(Private)</span>}
                                </div>
                                <div className="GroupExerciseContents">
                                    {group.description || 'No description available.'}
                                </div>
                                <div style={{ margin: '0 16px 16px 16px', fontSize: '12px', color: '#A0A0A0' }}>
                                    Group ID: {group.groupId} | Members: {group.getMemberCount()}
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
        </div>
    );
}

function ActionSelectionPopup({ onCreateGroup, onJoinGroup, onCancel }) {
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