import React, { useState, useEffect, useRef } from 'react';
import ExpElements from '../components/ui/ExpBar';
import IconElements from '../components/ui/IconElements';
import UserManagement from '../services/firebase/UserManagementSystem';
import GroupManagement from '../services/firebase/GroupManagementSystem';
import ChallengeManagement from '../services/firebase/ChallengeManagement';
import { CHALLENGE_TYPE } from '../services/interfaces/constants';

import '../components/styles/LayoutElements.css'
import '../components/styles/GroupPage.css'

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
                <h2>Create Group</h2>
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
    const [creatorName, setCreatorName] = useState('');

    useEffect(() => {
        loadPublicGroups();
    }, []);

    useEffect(() => {
        if (selectedGroup) {
            loadCreatorName();
        }
    }, [selectedGroup]);

    const loadCreatorName = async () => {
        if (!selectedGroup) return;
        try {
            const creator = await UserManagement.getUser(selectedGroup.createdBy);
            setCreatorName(creator?.displayName || 'Unknown User');
        } catch (error) {
            console.error('Failed to load creator name:', error);
            setCreatorName('Unknown User');
        }
    };

    const loadPublicGroups = async () => {
        try {
            setIsLoadingGroups(true);
            const currentUser = await UserManagement.getCurrentUser();
            
            const [allGroups, userGroups] = await Promise.all([
                GroupManagement.getAllGroups(),
                GroupManagement.getUserGroups(currentUser.uid)
            ]);

            const joinedGroupIds = userGroups.map(group => group.groupId);
            
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
            onCancel(); 
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
                            <div>Created by: {creatorName || 'Loading...'}</div>
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

function CreateGroupChallengePopup({ group, onCreateChallenge, onCancel, isCreating }) {
    const [challengeName, setChallengeName] = useState('');
    const [challengeDescription, setChallengeDescription] = useState('');
    const [challengeType, setChallengeType] = useState('target');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [rewardPoints, setRewardPoints] = useState(0);
    const [targetValue, setTargetValue] = useState('');

    const handleConfirm = async () => {
        if (!challengeName.trim() || !startDate || !endDate) {
            alert('Please fill in all required fields');
            return;
        }

        if (new Date(endDate) <= new Date(startDate)) {
            alert('End date must be after start date');
            return;
        }

        const challengeData = {
            name: challengeName.trim(),
            description: challengeDescription.trim(),
            challengeType: challengeType,
            startDate: new Date(startDate).getTime(),
            endDate: new Date(endDate).getTime(),
            rewardPoints: parseInt(rewardPoints) || 0,
            targetValue: targetValue ? parseFloat(targetValue) : null
        };
        
        onCreateChallenge(challengeData);
    };

    if (isCreating) {
        return (
            <div className='PopupBackground'>
                <div className='PopupContainer'>
                    <h2>Creating Challenge...</h2>
                </div>
            </div>
        );
    }

    return (
        <div className='PopupBackground'>
            <div className='LargePopupContainer'>
                <h2 style={{ margin: '20px 0', textAlign: 'center' }}>
                    Create Challenge for {group.name}
                </h2>
                
                <div className='BadgeCreateContent'>
                    <div className='BadgeInputSection'>
                        <div className='BadgeInputGroup'>
                            <label className='BadgeInputLabel'>Challenge Name</label>
                            <input 
                                className='Input'
                                type="text"
                                value={challengeName}
                                onChange={(e) => setChallengeName(e.target.value)}
                                placeholder="Enter challenge name"
                                maxLength={50}
                            />
                        </div>

                        <div className='BadgeInputGroup'>
                            <label className='BadgeInputLabel'>Description</label>
                            <input 
                                className='Input'
                                type="text"
                                value={challengeDescription}
                                onChange={(e) => setChallengeDescription(e.target.value)}
                                placeholder="Enter challenge description"
                                maxLength={200}
                            />
                        </div>

                        <div className='BadgeInputGroup'>
                            <label className='BadgeInputLabel'>Challenge Type</label>
                            <select 
                                className='Input'
                                value={challengeType}
                                onChange={(e) => setChallengeType(e.target.value)}
                            >
                                <option value="target">Target</option>
                                <option value="streak">Streak</option>
                                <option value="endurance">Endurance</option>
                                <option value="frequency">Frequency</option>
                            </select>
                        </div>

                        <div className='BadgeInputGroup'>
                            <label className='BadgeInputLabel'>Target Value</label>
                            <input 
                                className='Input'
                                type="number"
                                value={targetValue}
                                onChange={(e) => setTargetValue(e.target.value)}
                                placeholder="Enter target value"
                                min="0"
                            />
                        </div>
                    </div>

                    <div className='BadgeInputSection'>
                        <div className='BadgeInputGroup'>
                            <label className='BadgeInputLabel'>Start Date</label>
                            <input 
                                className='Input'
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>

                        <div className='BadgeInputGroup'>
                            <label className='BadgeInputLabel'>End Date</label>
                            <input 
                                className='Input'
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>

                        <div className='BadgeInputGroup'>
                            <label className='BadgeInputLabel'>Reward Points</label>
                            <input 
                                className='Input'
                                type="number"
                                value={rewardPoints}
                                onChange={(e) => setRewardPoints(e.target.value)}
                                placeholder="Points awarded when completed"
                                min="0"
                            />
                        </div>
                    </div>
                </div>

                <div className='BadgeCreateFooter'>
                    <div className='Line'></div>
                    <div className='Buttonfield'>
                        <button className='CancelButton' onClick={onCancel}>
                            Cancel
                        </button>
                        <button 
                            className='ConfirmButton' 
                            onClick={handleConfirm}
                            disabled={!challengeName.trim() || !startDate || !endDate}
                        >
                            Create Challenge
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function JoinedGroupDetailPopup({ group, onClose, onGroupLeft }) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [creatorName, setCreatorName] = useState('Loading...');
    const [showCreateChallengePopup, setShowCreateChallengePopup] = useState(false); // 추가
    const [isCreatingChallenge, setIsCreatingChallenge] = useState(false);

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

    useEffect(() => {
        loadCreatorName();
    }, [group.createdBy]);

    const loadCreatorName = async () => {
        try {
            const creator = await UserManagement.getUser(group.createdBy);
            setCreatorName(creator?.displayName || 'Unknown User');
        } catch (error) {
            console.error('Failed to load creator name:', error);
            setCreatorName('Unknown User');
        }
    };

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
            onGroupLeft();
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
            onGroupLeft();
            onClose();
        } catch (error) {
            console.error('Failed to delete group:', error);
            alert('Failed to delete group: ' + error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleChallengeCreation = async (challengeData) => {
        setIsCreatingChallenge(true);
        try {
            const challengeRequest = {
                ...challengeData,
                visibility: 'group',
                groupId: group.groupId,
                creatorId: currentUser.uid
            };
            
            await ChallengeManagement.createChallenge(challengeRequest);
            setShowCreateChallengePopup(false);
            //alert('Challenge created successfully!');
        } catch (error) {
            console.error('Failed to create challenge:', error);
            alert('Failed to create challenge: ' + error.message);
        } finally {
            setIsCreatingChallenge(false);
        }
    };


    const activeMembers = group.members.filter(member => member.isActive());
    const isCreator = currentUser && group.createdBy === currentUser.uid;
    const isAdmin = currentUser && activeMembers.find(member => 
        member.userId === currentUser.uid && member.isAdmin()
    );

    return (
        <div className='PopupBackground'>
            <div className='LargePopupContainer'>
                <h2 style={{ textAlign: 'center' }}>Group Details</h2>
                
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
                            
                            <div className="CancelButtons">
                                {isAdmin && (
                                    <button 
                                        className='AdminActionButton'
                                        onClick={() => setShowCreateChallengePopup(true)}
                                        disabled={isProcessing}
                                    >
                                        Add Challenge
                                    </button>
                                )}
                                
                                {isCreator && (
                                    <button 
                                        className='CancelButton'
                                        onClick={handleDeleteGroup}
                                        disabled={isProcessing}
                                    >
                                        {isProcessing ? 'Deleting...' : 'Delete Group'}
                                    </button>
                                )}
                                <button 
                                    className='CancelButton'
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

            {showCreateChallengePopup && (
                <CreateGroupChallengePopup
                    group={group}
                    onCreateChallenge={handleChallengeCreation}
                    onCancel={() => setShowCreateChallengePopup(false)}
                    isCreating={isCreatingChallenge}
                />
            )}
        </div>
    );
}
// GroupCardItem
function GroupCardItem({ group, onClick }) {
    const [groupImage, setGroupImage] = useState('');
    const [imageLoading, setImageLoading] = useState(true);

    useEffect(() => {
        const loadGroupImage = async () => {
            setImageLoading(true);
            try {
                const existingImageBase64 = await DatamanagerElements.getExistingImage(group.groupId);
                setGroupImage(existingImageBase64 || '');
            } catch (error) {
                console.error('Failed to load group image:', error);
                setGroupImage('');
            } finally {
                setImageLoading(false);
            }
        };

        if (group.groupId) {
            loadGroupImage();
        }
    }, [group.groupId]);

    return (
        <div className="CardContainer" onClick={onClick}>
            <div className="CardContainerOut">
                <div className="ProfileImageForCard">
                    {imageLoading ? (
                        <div className='ProfileImageForCardAlt'>
                            <div>Loading...</div>
                        </div>
                    ) : groupImage ? (
                        <img className='ProfileImageForCard'
                            src={groupImage} 
                            alt="Group Profile" 
                        />
                    ) : (
                        <div className='ProfileImageForCardAlt'>
                            <IconElements.UserIcon />
                        </div>
                    )}
                </div>
                <div className="CardContainerIn">
                    <div className="CardHeader">
                        {group.name} {group.isPrivate && <span style={{ fontSize: '12px', color: '#A0A0A0' }}>(Private)</span>}
                    </div>
                    <div className="CardContents">
                        {group.getActiveMemberCount()}/{group.maxMembers} Members
                    </div>
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
            await loadUserGroups();
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
                    <div className="GuideTitle">Groups</div>
                    <div className="GuideText">My Groups</div>

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
                            <GroupCardItem 
                                key={group.groupId} 
                                group={group}
                                onClick={() => setSelectedJoinedGroup(group)}
                            />
                        ))
                    )}
                </div>

                <div className="GroupButtonContainer">
                    <button 
                        className='ButtonMediumFilled CreateGroupButton'
                        onClick={handleCreateGroup}
                    >
                        <div className='ButtonIcon'>+</div>
                        <div className='ButtonText'>Create Group</div>
                    </button>
                    <button 
                        className="ButtonMedium JoinGroupButton"
                        onClick={() => setShowActionPopup(true)}
                    >
                        <div className='ButtonIcon'>▷</div>
                        <div className='ButtonText'>Find Group</div>
                    </button>
                </div>

            </div>

            {showActionPopup && (
                <ActionSelectionPopup
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
                <h2>Find Group</h2>
                <div className='GroupButtonContainer'>
                    <button 
                        className='ButtonMediumFilled JoinGroupButton'
                        onClick={onJoinGroup}
                    >
                        <div className='ButtonIcon'>▷</div>
                        <div className='ButtonText'>Join Group</div>
                    </button>
                    <button 
                        className='ButtonMediumFilled JoinGroupViaIdButton'
                        onClick={onJoinGroupViaId}
                    >
                        <div className='ButtonIcon'>▷</div>
                        <div className='ButtonText'>Join Group via ID</div>
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
    Page,
    CreateGroupPopup
};

export default GroupPageElements;