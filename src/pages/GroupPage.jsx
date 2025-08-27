import React, { useState, useEffect, useRef } from 'react';
import ExpElements from '../components/ui/ExpBar';
import IconElements from '../components/ui/IconElements';
import UserManagement from '../services/firebase/UserManagementSystem';
import GroupManagement from '../services/firebase/GroupManagementSystem';
import ChallengeManagement from '../services/firebase/ChallengeManagement';
import { CHALLENGE_STYLE, CHALLENGE_TYPE } from '../services/interfaces/constants';
import { localDateTimeStringToTimestamp, toDateTime } from '../utils/DateUtils';
import { Timestamp } from 'firebase/firestore';

import { Challenge } from '../services/interfaces/challenge';

import '../components/styles/LayoutElements.css'
import '../components/styles/GroupPage.css'

const resizeImage = (file, width = 150, height = 150, quality = 0.8) => {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);

            const base64String = canvas.toDataURL('image/jpeg', quality);
            resolve(base64String);
        };

        img.onerror = () => reject(new Error('Image loading failed'));
        img.src = URL.createObjectURL(file);
    });
};

function CreateGroupPopup({ onCreateGroup, onCancel, isCreating }) {
    const [groupName, setGroupName] = useState('');
    const [groupDescription, setGroupDescription] = useState('');
    const [isPrivate, setIsPrivate] = useState(false);
    const [imageData, setImageData] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const fileInputRef = useRef(null);

    const handleImageUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('Please select an image file only.');
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            alert('File size must be less than 10MB.');
            return;
        }

        try {
            const resizedBase64 = await resizeImage(file, 150, 150, 0.8);
            setImageData(resizedBase64);
            setImagePreview(resizedBase64);
        } catch (error) {
            console.error('Image processing failed:', error);
            alert(`Image processing failed: ${error.message}`);
        }
    };

    const handleImageButtonClick = () => {
        fileInputRef.current?.click();
    };

    const handleConfirm = () => {
        if (groupName.trim()) {
            onCreateGroup({
                name: groupName.trim(),
                description: groupDescription.trim(),
                isPrivate: isPrivate,
                imageData: imageData
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
            <div className='LargePopupContainer'>
                <h2>Create Group</h2>

                <div className='BadgeCreateContent'>
                    <div className='BadgeInputSection'>
                        <div className='BadgeImageSection'>
                            <div className="GuideText" style={{ textAlign: 'center', marginBottom: '16px' }}>
                                Group Image
                            </div>
                            <div className="BadgeImageContainer" style={{ textAlign: 'center' }}>
                                {imagePreview ? (
                                    <img
                                        src={imagePreview}
                                        alt="Group Preview"
                                        style={{
                                            width: '150px',
                                            height: '150px',
                                            objectFit: 'cover',
                                            borderRadius: '8px',
                                            border: '2px solid var(--main-color)'
                                        }}
                                    />
                                ) : (
                                    <div style={{
                                        width: '150px',
                                        height: '150px',
                                        border: '2px dashed #A0A0A0',
                                        borderRadius: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#A0A0A0',
                                        margin: '0 auto'
                                    }}>
                                        No Image
                                    </div>
                                )}
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    style={{ display: 'none' }}
                                />
                                <button
                                    className='AdminActionButton'
                                    onClick={handleImageButtonClick}
                                    style={{ marginTop: '10px' }}
                                >
                                    {imagePreview ? 'Change Image' : 'Upload Image'}
                                </button>
                            </div>
                        </div>

                        <div className='BadgeInputGroup'>
                            <label className='BadgeInputLabel'>Group Name</label>
                            <input
                                className='Input'
                                type="text"
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                                placeholder="Group Name"
                                maxLength={50}
                            />
                        </div>

                        <div className='BadgeInputGroup'>
                            <label className='BadgeInputLabel'>Description</label>
                            <input
                                className='Input'
                                type="text"
                                value={groupDescription}
                                onChange={(e) => setGroupDescription(e.target.value)}
                                placeholder="Group Description (Optional)"
                                maxLength={200}
                            />
                        </div>

                        <div className='BadgeInputGroup'>
                            <label className='BadgeInputLabel'>Privacy Setting</label>
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
                            disabled={!groupName.trim()}
                        >
                            Create
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function EditGroupPopup({ group, onEditGroup, onCancel, isEditing }) {
    const [groupName, setGroupName] = useState(group.name);
    const [groupDescription, setGroupDescription] = useState(group.description || '');
    const [isPrivate, setIsPrivate] = useState(group.isPrivate);
    const [imageData, setImageData] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [existingImage, setExistingImage] = useState('');
    const [imageLoading, setImageLoading] = useState(true);
    const fileInputRef = useRef(null);

    useEffect(() => {
        const loadExistingImage = async () => {
            setImageLoading(true);
            try {
                const imageData = await GroupManagement.getGroupImage(group.groupId);
                setExistingImage(imageData || '');
            } catch (error) {
                console.error('Failed to load group image:', error);
                setExistingImage('');
            } finally {
                setImageLoading(false);
            }
        };

        if (group.groupId) {
            loadExistingImage();
        }
    }, [group.groupId]);

    const handleImageUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('Please select an image file only.');
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            alert('File size must be less than 10MB.');
            return;
        }

        try {
            const resizedBase64 = await resizeImage(file, 150, 150, 0.8);
            setImageData(resizedBase64);
            setImagePreview(resizedBase64);
        } catch (error) {
            console.error('Image processing failed:', error);
            alert(`Image processing failed: ${error.message}`);
        }
    };

    const handleImageButtonClick = () => {
        fileInputRef.current?.click();
    };

    const handleConfirm = () => {
        if (groupName.trim()) {
            onEditGroup({
                name: groupName.trim(),
                description: groupDescription.trim(),
                isPrivate: isPrivate,
                imageData: imageData
            });
        }
    };

    const displayImage = imagePreview || existingImage;

    if (isEditing) {
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
            <div className='LargePopupContainer'>
                <h2>Edit Group</h2>

                <div className='BadgeCreateContent'>
                    <div className='BadgeInputSection'>
                        <div className='BadgeImageSection'>
                            <div className="GuideText" style={{ textAlign: 'center', marginBottom: '16px' }}>
                                Group Image
                            </div>
                            <div className="BadgeImageContainer" style={{ textAlign: 'center' }}>
                                {imageLoading ? (
                                    <div style={{
                                        width: '150px',
                                        height: '150px',
                                        border: '2px dashed #A0A0A0',
                                        borderRadius: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#A0A0A0',
                                        margin: '0 auto'
                                    }}>
                                        Loading...
                                    </div>
                                ) : displayImage ? (
                                    <img
                                        src={displayImage}
                                        alt="Group Preview"
                                        style={{
                                            width: '150px',
                                            height: '150px',
                                            objectFit: 'cover',
                                            borderRadius: '8px',
                                            border: '2px solid var(--main-color)'
                                        }}
                                    />
                                ) : (
                                    <div style={{
                                        width: '150px',
                                        height: '150px',
                                        border: '2px dashed #A0A0A0',
                                        borderRadius: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#A0A0A0',
                                        margin: '0 auto'
                                    }}>
                                        No Image
                                    </div>
                                )}
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    style={{ display: 'none' }}
                                />
                                <button
                                    className='AdminActionButton'
                                    onClick={handleImageButtonClick}
                                    style={{ marginTop: '10px' }}
                                    disabled={imageLoading}
                                >
                                    {imageLoading ? 'Loading...' :
                                        displayImage ? 'Change Image' : 'Upload Image'}
                                </button>
                            </div>
                        </div>

                        <div className='BadgeInputGroup'>
                            <label className='BadgeInputLabel'>Group Name</label>
                            <input
                                className='Input'
                                type="text"
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                                placeholder="Group Name"
                                maxLength={50}
                            />
                        </div>

                        <div className='BadgeInputGroup'>
                            <label className='BadgeInputLabel'>Description</label>
                            <input
                                className='Input'
                                type="text"
                                value={groupDescription}
                                onChange={(e) => setGroupDescription(e.target.value)}
                                placeholder="Group Description (Optional)"
                                maxLength={200}
                            />
                        </div>

                        <div className='BadgeInputGroup'>
                            <label className='BadgeInputLabel'>Privacy Setting</label>
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
                            disabled={!groupName.trim()}
                        >
                            Save Changes
                        </button>
                    </div>
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

function JoinGroupListPopup({ onCancel, onGroupJoined }) {
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
            onGroupJoined();
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
                <div className='GroupDetailContainer'>
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
    // This array is the single source of truth for the exercise form.
    const inputFields = [
        { key: 'name', label: 'Name', type: 'text', maxLength: 50, placeholder: 'Enter name' },
        { key: 'description', label: 'Description', type: 'text', maxLength: 200, placeholder: 'Enter Description name' },
        { key: 'challengeStyle', label: 'Challenge Style', type: 'selectStyle', placeholder: 'Select Style ...' },
        { key: 'rewardPoints', label: 'Reward Points', type: 'number', placeholder: 'Enter Reward Points' },
        { key: 'startDate', label: 'Start', type: 'datetime-local' },
        { key: 'endDate', label: 'End', type: 'datetime-local' },
        { key: 'conditions', label: 'conditions', type: 'text', maxLength: 200, placeholder: 'Enter conditions name' },
        { key: 'challengeType', label: 'Challenge Type', type: 'selectType', placeholder: 'Select Type ...' },
        { key: 'targetField', label: 'Target Field', type: 'text', maxLength: 50, placeholder: 'Enter Target Field' },
        { key: 'targetValue', label: 'Target Value', type: 'text', maxLength: 50, placeholder: 'Enter Target Value' },
    ];

    const dummyChallenge = new Challenge();
    dummyChallenge.startDate = Timestamp.now();
    dummyChallenge.challengeStyle = CHALLENGE_STYLE.GROUP;

    // The initial state is generated dynamically from the inputFields array.
    const [formData, setFormData] = useState(() => {
        return inputFields.reduce((acc, field) => {
            const sourceValue = dummyChallenge?.[field.key];
            if (field.type === 'datetime-local' && sourceValue?.toDate) {
                acc[field.key] = toDateTime(sourceValue);
            } else {
                acc[field.key] = sourceValue ?? (field.type === 'number' ? 0 : '');
            }
            return acc;
        }, {});
    });

    // The submission data is generated dynamically from the inputFields array.
    const handleConfirm = () => {
        if (formData.name && formData.name.trim()) {
            const submitData = inputFields.reduce((acc, field) => {
                const value = formData[field.key];
                if (field.type === 'number') {
                    acc[field.key] = parseInt(value, 10) || 0;
                } else if (field.type === 'datetime-local') {
                    acc[field.key] = value ? localDateTimeStringToTimestamp(value) : null;
                } else if (typeof value === 'string') {
                    acc[field.key] = value.trim();
                } else {
                    acc[field.key] = value;
                }
                return acc;
            }, {});

            if (dummyChallenge) {
                submitData.uid = dummyChallenge.uid;
            }
            onCreateChallenge(submitData);
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
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
                        {inputFields.map(field => (
                            <div key={field.key} className='BadgeInputGroup'>
                                <label className='BadgeInputLabel'>{field.label}</label>
                                {
                                    field.type === 'selectStyle' ? (
                                        <select
                                            className='Input'
                                            value={formData[field.key]}
                                            onChange={(e) => handleInputChange(field.key, e.target.value)}
                                        >
                                            <option value="" disabled>{field.placeholder}</option>
                                            {Object.values(CHALLENGE_STYLE) && Object.values(CHALLENGE_STYLE).map(obj => (
                                                <option key={obj} value={obj}>
                                                    {obj}
                                                </option>
                                            ))}
                                        </select>
                                    ) : field.type === 'selectType' ? (
                                        <select
                                            className='Input'
                                            value={formData[field.key]}
                                            onChange={(e) => handleInputChange(field.key, e.target.value)}
                                        >
                                            <option value="" disabled>{field.placeholder}</option>
                                            {Object.values(CHALLENGE_TYPE) && Object.values(CHALLENGE_TYPE).map(obj => (
                                                <option key={obj} value={obj}>
                                                    {obj}
                                                </option>
                                            ))}
                                        </select>
                                    ) : field.type === 'textarea' ? (
                                        <textarea
                                            className='Input'
                                            value={formData[field.key]}
                                            onChange={(e) => handleInputChange(field.key, e.target.value)}
                                            placeholder={field.placeholder}
                                            rows={4}
                                            style={{ resize: 'vertical' }}
                                        />
                                    ) : (
                                        <input
                                            className='Input'
                                            type={field.type}
                                            value={formData[field.key]}
                                            onChange={(e) => handleInputChange(field.key, e.target.value)}
                                            placeholder={field.placeholder}
                                            maxLength={field.maxLength}
                                            min={field.min}
                                        />
                                    )}
                            </div>
                        ))}
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
                            disabled={!formData.name.trim() || !formData.startDate || !formData.endDate}
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
    const [showCreateChallengePopup, setShowCreateChallengePopup] = useState(false);
    const [isCreatingChallenge, setIsCreatingChallenge] = useState(false);
    const [showEditGroupPopup, setShowEditGroupPopup] = useState(false);
    const [isEditingGroup, setIsEditingGroup] = useState(false);

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
        } catch (error) {
            console.error('Failed to create challenge:', error);
            alert('Failed to create challenge: ' + error.message);
        } finally {
            setIsCreatingChallenge(false);
        }
    };

    const handleGroupEdit = async (groupData) => {
        setIsEditingGroup(true);
        try {
            await GroupManagement.updateGroup(group.groupId, currentUser.uid, {
                name: groupData.name,
                description: groupData.description,
                isPrivate: groupData.isPrivate
            });

            if (groupData.imageData) {
                await GroupManagement.saveGroupImage(groupData.imageData, group.groupId);
            }

            setShowEditGroupPopup(false);
            onGroupLeft();
            alert('Group updated successfully!');
        } catch (error) {
            console.error('Failed to update group:', error);
            alert('Failed to update group: ' + error.message);
        } finally {
            setIsEditingGroup(false);
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
                                        className='AdminActionButton'
                                        onClick={() => setShowEditGroupPopup(true)}
                                        disabled={isProcessing}
                                    >
                                        Edit Group
                                    </button>
                                )}

                                {isCreator && (
                                    <button
                                        className='CancelButton'
                                        onClick={handleDeleteGroup}
                                        disabled={isProcessing}
                                        style={{ marginBottom: '12px' }}
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

            {showEditGroupPopup && (
                <EditGroupPopup
                    group={group}
                    onEditGroup={handleGroupEdit}
                    onCancel={() => setShowEditGroupPopup(false)}
                    isEditing={isEditingGroup}
                />
            )}
        </div>
    );
}

function GroupCardItem({ group, onClick }) {
    const [groupImage, setGroupImage] = useState('');
    const [imageLoading, setImageLoading] = useState(true);

    useEffect(() => {
        const loadGroupImage = async () => {
            setImageLoading(true);
            try {
                const imageData = await GroupManagement.getGroupImage(group.groupId);
                setGroupImage(imageData || '');
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

function Page({ data }) {
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
    const [orientation, setOrientation] = useState('landscape');

    useEffect(() => {
        const checkOrientation = () => {
            const isPortrait = window.innerHeight > window.innerWidth;
            setOrientation(isPortrait ? 'portrait' : 'landscape');
        };

        checkOrientation();
        window.addEventListener('resize', checkOrientation);
        window.addEventListener('orientationchange', checkOrientation);

        return () => {
            window.removeEventListener('resize', checkOrientation);
            window.removeEventListener('orientationchange', checkOrientation);
        };
    }, []);

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

            const createdGroup = await GroupManagement.createGroup(
                currentUser.uid,
                groupData.name,
                groupData.description,
                50,
                groupData.isPrivate
            );

            if (groupData.imageData && createdGroup && createdGroup.groupId) {
                await GroupManagement.saveGroupImage(groupData.imageData, createdGroup.groupId);
            }

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

    const GroupListSection = () => (
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
    );

    const GroupListSectionHorizontal = () => (
        <div className="GroupContainer">
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
    );

    const ButtonSection = () => (
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
    );

    const ButtonSectionHorizontal = () => (
        <div className="GroupButtonContainerHorizontal">
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
    );

    return (
        <div className="AppContents">
            <div className={`MainContentWrapper ${orientation}`}>
                {orientation === 'portrait' ? (
                    <div className="GroupContents">
                        <GroupListSection />
                        <ButtonSection />
                    </div>
                ) : (
                    <>
                        <div className="TopGridSection">
                            <div className="GroupActionsSectionHorizontal">
                                <div className="GuideTitle">Groups</div>
                                <ButtonSectionHorizontal />
                            </div>
                        </div>

                        <div className="BottomGridSection" style={{ overflow: 'auto', maxHeight: '100%' }}>
                            <GroupListSectionHorizontal />
                        </div>
                    </>
                )}
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
                    onGroupJoined={loadUserGroups}
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
    CreateGroupPopup,
    EditGroupPopup
};

export default GroupPageElements;