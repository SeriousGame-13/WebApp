import React, { useState, useEffect, useRef, useMemo } from 'react';
import IconElements from '../components/ui/IconElements';
import UserManagement from '../services/UserManagementSystem';
import GroupManagement from '../services/GroupManagementSystem';
import ChallengeManagement from '../services/ChallengeManagement';

import { Search, Users, Plus, Trophy } from 'lucide-react';
import { Card, Modal, Pill, Screen, Avatar } from '../components/ui/UIComponents';
import { CHALLENGE_TYPE, CHALLENGE_VISIBILITY } from '../services/interfaces/constants';
import { Timestamp } from 'firebase/firestore';

import '../components/styles/sphere-styles.css'

function GroupPage({ groups, setGroups, joinedIds, setJoinedIds }) {
    const [search, setSearch] = useState("");
    const [opened, setOpened] = useState(null);
    const [createOpen, setCreateOpen] = useState(false);
    const [showCreateChallenge, setShowCreateChallenge] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [newGroupData, setNewGroupData] = useState({
        name: '',
        description: '',
        isPrivate: false,
        imageData: null
    });

    const handleInputChange = (field, value) => {
        setNewGroupData(prev => ({ ...prev, [field]: value }));
    };

    const resetNewGroupData = () => {
        setNewGroupData({
            name: '',
            description: '',
            isPrivate: false,
            imageData: null
        });
    };

    const filtered = useMemo(() =>
        groups.filter(g => g.name.toLowerCase().includes(search.toLowerCase())),
        [groups, search]
    );

    const loadUserGroups = async () => {
        try {
            const user = await UserManagement.getCurrentUser();
            setCurrentUser(user);

            const publicGroups = await GroupManagement.getPublicGroups();

            const mappedGroups = await Promise.all(publicGroups.map(async (group) => {
                const members = await GroupManagement.getGroupMembers(group.groupId);
                group.members = members;
                const image = await GroupManagement.getGroupImage(group.groupId);
                return {
                    id: group.groupId,
                    name: group.name,
                    description: group.description,
                    members: group.getActiveMemberCount(),
                    memberIds: group.members.map(m => m.userId),
                    isPrivate: group.isPrivate,
                    image: image,
                    createdBy: group.createdBy,
                };
            }));
            setGroups(mappedGroups);
        } catch (error) {
            console.error('Failed to load group list:', error);
            setGroups([]);
        }
    };

    useEffect(() => {
        loadUserGroups();
    }, []);

    const current = opened ? groups.find(g => g.id === opened) : null;

    const createGroup = async () => {
        if (!newGroupData.name.trim()) return;
        const currentUser = await UserManagement.getCurrentUser();

        const createdGroup = await GroupManagement.createGroup(
            currentUser.uid,
            newGroupData.name,
            newGroupData.description,
            50,
            newGroupData.isPrivate,
            newGroupData.imageData
        );

        // Map the newly created group to the same structure as loaded groups
        const image = await GroupManagement.getGroupImage(createdGroup.groupId);
        const newGroup = {
            id: createdGroup.groupId,
            name: createdGroup.name,
            description: createdGroup.description,
            members: createdGroup.getActiveMemberCount(),
            memberIds: createdGroup.members.map(m => m.userId),
            isPrivate: createdGroup.isPrivate,
            image: image,
            createdBy: createdGroup.createdBy,
        };

        setGroups(prev => [newGroup, ...prev]);
        setCreateOpen(false);
        resetNewGroupData();
    };

    const toggleJoin = async (gid) => {
        const currentUser = await UserManagement.getCurrentUser();
        if (!currentUser) {
            console.error("User not logged in!");
            return;
        }
        const userId = currentUser.uid;
        const isJoined = joinedIds.includes(gid);
        const group = groups.find(g => g.id === gid);

        try {
            if (isJoined) {
                if (group && group.createdBy === userId) {
                    if (window.confirm("You are the admin of this group. Leaving will delete the group permanently. Are you sure?")) {
                        await deleteGroup(gid);
                    }
                    return; // Stop execution whether confirmed or not
                }
                await GroupManagement.removeGroupMember(gid, userId, userId);
            } else {
                await GroupManagement.addGroupMember(gid, userId);
            }

            // Update joinedIds state
            const newJoinedIds = isJoined
                ? joinedIds.filter(id => id !== gid)
                : [...joinedIds, gid];
            setJoinedIds(newJoinedIds);

            // Update groups state for member count and member list
            setGroups(prevGroups => prevGroups.map(g => {
                if (g.id === gid) {
                    const newMembersCount = g.members + (isJoined ? -1 : 1);
                    const newMemberIds = isJoined
                        ? (g.memberIds || []).filter(id => id !== userId)
                        : [...(g.memberIds || []), userId];
                    return { ...g, members: newMembersCount, memberIds: newMemberIds };
                }
                return g;
            }));

        } catch (error) {
            console.error(`Failed to ${isJoined ? 'leave' : 'join'} group:`, error);
            alert(`An error occurred: ${error.message}`);
        }
    };

    const deleteGroup = async (gid) => {
        if (!window.confirm("Are you sure you want to delete this group? This action cannot be undone.")) {
            return;
        }
        try {
            await GroupManagement.deleteGroup(gid);
            setGroups(prev => prev.filter(g => g.id !== gid));
            if (opened === gid) {
                setOpened(null);
            }
        } catch (error) {
            console.error('Failed to delete group:', error);
            alert(`Failed to delete group: ${error.message}`);
        }
    };

    const joinGroupById = async () => {
        const groupId = prompt("Please enter the Group ID to join:");
        if (!groupId) return;

        const currentUser = await UserManagement.getCurrentUser();
        if (!currentUser) {
            alert("You must be logged in to join a group.");
            return;
        }

        try {
            await GroupManagement.addGroupMember(groupId, currentUser.uid);
            alert("Successfully joined group!");
            loadUserGroups(); // Refresh the group list
        } catch (error) {
            console.error("Failed to join group by ID:", error);
            alert(`Failed to join group: ${error.message}`);
        }
    };

    const [members, setMembers] = useState([]);

    useEffect(() => {
        if (current) {
            const fetchMembers = async () => {
                if (current.memberIds && current.memberIds.length > 0) {
                    const memberPromises = current.memberIds.map(id => UserManagement.getUser(id));
                    const memberData = await Promise.all(memberPromises);
                    setMembers(memberData.filter(Boolean)); // Filtert null-Werte heraus
                } else {
                    setMembers([]);
                }
            };
            fetchMembers();
        } else {
            setMembers([]);
        }
    }, [current, opened, groups, joinedIds]);

    return (
        <Screen title="Groups" subtitle={opened ? current?.name : "My Groups"}>
            {!opened && (
                <>
                    <div className="mb-4 flex items-center gap-2">
                        <div className="search-container">
                            <Search className="search-icon" />
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search groups"
                                className="search-input"
                            />
                        </div>
                        <button
                            onClick={() => setCreateOpen(true)}
                            className="btn-primary flex items-center gap-2 px-3 py-2"
                        >
                            <Plus className="w-4 h-4" /> Create
                        </button>
                        <button
                            onClick={joinGroupById}
                            className="btn-secondary flex items-center gap-2 px-3 py-2"
                        >
                            Join by ID
                        </button>
                    </div>

                    <div className="space-y-3">
                        {filtered.map(g => (
                            <Card key={g.id}>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-white/10 flex-shrink-0">
                                        <img src={g.image} alt={g.name} className="w-full h-full rounded-full object-cover" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-lg font-semibold">{g.name}</p>
                                        <p className="text-slate-400 text-sm">{g.members} members</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setOpened(g.id)}
                                            className="btn-secondary"
                                        >
                                            Open
                                        </button>
                                        {currentUser && g.createdBy === currentUser.uid && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteGroup(g.id);
                                                }}
                                                className="btn-secondary"
                                            >
                                                Delete
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>

                    <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Group" size="sm">
                        <div className="flex flex-col" style={{ maxHeight: '80vh' }}>
                            {/* Scrollable form area */}
                            <div className="space-y-3 overflow-y-auto" style={{ flex: '1 1 auto' }}>
                                {/* Image Upload */}
                                <div className="form-group">
                                    <div className="text-center mb-4">
                                        <div className="text-slate-300 mb-4">Group Image</div>
                                        <div className="text-center">
                                            {newGroupData.imageData ? (
                                                <img
                                                    src={newGroupData.imageData}
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
                                                id="group-image-upload"
                                                accept="image/*"
                                                style={{ display: 'none' }}
                                                onChange={async (e) => {
                                                    const file = e.target.files[0];
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
                                                        handleInputChange('imageData', resizedBase64);
                                                    } catch (error) {
                                                        console.error('Image processing failed:', error);
                                                        alert(`Image processing failed: ${error.message}`);
                                                    }
                                                }}
                                            />
                                            <button
                                                className='btn-secondary mt-2'
                                                onClick={() => document.getElementById('group-image-upload').click()}
                                            >
                                                {newGroupData.imageData ? 'Change Image' : 'Upload Image'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                {/* Name & Description */}
                                {[{ key: 'name', label: 'Name', type: 'text' },
                                { key: 'description', label: 'Description', type: 'textarea', rows: 3 }].map(field => (
                                    <label key={field.key} className="form-label">
                                        {field.label}
                                        {field.type === 'textarea' ? (
                                            <textarea
                                                value={newGroupData[field.key]}
                                                onChange={e => handleInputChange(field.key, e.target.value)}
                                                className="form-textarea mt-1"
                                                rows={field.rows}
                                            />
                                        ) : (
                                            <input
                                                value={newGroupData[field.key]}
                                                onChange={e => handleInputChange(field.key, e.target.value)}
                                                className="form-input mt-1"
                                            />
                                        )}
                                    </label>
                                ))}
                                {/* Privacy Setting */}
                                <div className='form-group'>
                                    <label className='form-label'>Privacy Setting</label>
                                    <div className='flex space-x-4'>
                                        <label className='flex items-center'>
                                            <input
                                                type="radio"
                                                name="privacy"
                                                checked={!newGroupData.isPrivate}
                                                onChange={() => handleInputChange('isPrivate', false)}
                                                className="mr-2"
                                            />
                                            <span className="text-slate-200">Public Group</span>
                                        </label>
                                        <label className='flex items-center'>
                                            <input
                                                type="radio"
                                                name="privacy"
                                                checked={!!newGroupData.isPrivate}
                                                onChange={() => handleInputChange('isPrivate', true)}
                                                className="mr-2"
                                            />
                                            <span className="text-slate-200">Private Group</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                            {/* Sticky footer inside modal (non-scrolling) */}
                            <div className="flex justify-end gap-2" style={{ flexShrink: 0, marginTop: '1rem' }}>
                                <button
                                    onClick={() => {
                                        setCreateOpen(false);
                                        resetNewGroupData();
                                    }}
                                    className="btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={createGroup}
                                    className="btn-primary"
                                    disabled={!newGroupData.name.trim()}
                                >
                                    Create
                                </button>
                            </div>
                        </div>
                    </Modal>
                </>
            )}

            {opened && current && (
                <div className="space-y-4">
                    <button
                        onClick={() => setOpened(null)}
                        className="text-sm text-slate-300 hover:text-white cursor-pointer"
                        style={{ background: 'none', border: 'none' }}
                    >
                        ← Back
                    </button>

                    <Card>
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-slate-300 mb-2">{current.description}</p>
                                <p className="text-slate-400 text-sm">Members: {current.members}</p>
                            </div>
                            {currentUser && current.createdBy === currentUser.uid && (
                                <button
                                    onClick={() => deleteGroup(current.id)}
                                    className="btn-secondary flex-shrink-0"
                                >
                                    Delete Group
                                </button>
                            )}
                        </div>
                    </Card>

                    <div>
                        <h4 className="mb-2 text-slate-200 font-semibold">Members</h4>
                        <div className="space-y-2">
                            {members.map((member) => (
                                <Card key={member.uid}>
                                    <div className="flex items-center gap-3">
                                        <Avatar name={member.displayName} size={36} seed={member.uid} />
                                        <span className="font-medium">{member.displayName}</span>
                                    </div>
                                </Card>
                            ))}
                            {members.length === 0 && (
                                <p className="text-slate-400 text-sm">No members yet.</p>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                        {joinedIds.includes(current.id) ? (
                            <button
                                onClick={() => toggleJoin(current.id)}
                                className="btn-secondary"
                            >
                                Leave Group
                            </button>
                        ) : (
                            <button
                                onClick={() => toggleJoin(current.id)}
                                className="btn-primary"
                            >
                                Join Group
                            </button>
                        )}
                        {currentUser && current.createdBy === currentUser.uid && (
                            <button
                                onClick={() => setShowCreateChallenge(true)}
                                className="btn-primary flex items-center gap-2"
                            >
                                <Trophy className="w-4 h-4" /> Create Challenge
                            </button>
                        )}
                    </div>
                </div>
            )}

            {showCreateChallenge && current && (
                <CreateGroupChallengePopup
                    group={current}
                    onClose={() => setShowCreateChallenge(false)}
                    onCreate={(challengeData) => {
                        console.log("Creating challenge:", challengeData);
                        setShowCreateChallenge(false);
                    }}
                />
            )}
        </Screen>
    );
}


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

function CreateGroupChallengePopup({ group, onClose, onCreate }) {
    const [challengeData, setChallengeData] = useState({
        name: '',
        description: '',
        challengeType: CHALLENGE_TYPE.TARGET,
        startDate: '',
        endDate: '',
        rewardPoints: 100,
        targetValue: 10,
        conditions: '',
        targetField: '',
    });
    const [isCreating, setIsCreating] = useState(false);

    const handleInputChange = (field, value) => {
        setChallengeData(prev => ({ ...prev, [field]: value }));
    };

    const handleConfirm = async () => {
        if (!challengeData.name.trim() || !challengeData.startDate || !challengeData.endDate) {
            alert("Please fill in all required fields: Name, Start Date, and End Date.");
            return;
        }
        setIsCreating(true);
        try {
            const currentUser = await UserManagement.getCurrentUser();
            const fullChallengeData = {
                ...challengeData,
                creatorId: currentUser.uid,
                visibility: CHALLENGE_VISIBILITY.GROUP,
                groupId: group.id,
                rewardPoints: Number(challengeData.rewardPoints) || 0,
                targetValue: Number(challengeData.targetValue) || 0,
                startDate: Timestamp.fromDate(new Date(challengeData.startDate)),
                endDate: Timestamp.fromDate(new Date(challengeData.endDate)),
                conditions: challengeData.conditions,
                targetField: challengeData.targetField,
            };
            await ChallengeManagement.createChallenge(fullChallengeData);
            onCreate(fullChallengeData);
        } catch (error) {
            console.error("Failed to create challenge:", error);
            alert(`Error: ${error.message}`);
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <Modal open={true} onClose={onClose} title={`Create Challenge for ${group.name}`} size="md">
            <div className="flex flex-col" style={{ maxHeight: '80vh' }}>
                {/* Scrollable form area */}
                <div className="space-y-4 overflow-y-auto" style={{ flex: '1 1 auto' }}>
                    <label className="form-label">
                        Challenge Name
                        <input
                            value={challengeData.name}
                            onChange={e => handleInputChange('name', e.target.value)}
                            className="form-input mt-1"
                            placeholder="e.g., Weekly Step Goal"
                        />
                    </label>
                    <label className="form-label">
                        Description
                        <textarea
                            value={challengeData.description}
                            onChange={e => handleInputChange('description', e.target.value)}
                            className="form-textarea mt-1"
                            rows={3}
                            placeholder="Describe the challenge for your group"
                        />
                    </label>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="form-label">
                            Challenge Type
                            <select
                                value={challengeData.challengeType}
                                onChange={e => handleInputChange('challengeType', e.target.value)}
                                className="form-input mt-1"
                            >
                                {Object.values(CHALLENGE_TYPE).map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </label>
                        <label className="form-label">
                            Target Value
                            <input
                                type="number"
                                value={challengeData.targetValue}
                                onChange={e => handleInputChange('targetValue', e.target.value)}
                                className="form-input mt-1"
                                min="0"
                            />
                        </label>
                        <label className="form-label">
                            Start Date
                            <input
                                type="date"
                                value={challengeData.startDate}
                                onChange={e => handleInputChange('startDate', e.target.value)}
                                className="form-input mt-1"
                            />
                        </label>
                        <label className="form-label">
                            End Date
                            <input
                                type="date"
                                value={challengeData.endDate}
                                onChange={e => handleInputChange('endDate', e.target.value)}
                                className="form-input mt-1"
                            />
                        </label>
                        <label className="form-label">
                            Reward Points
                            <input
                                type="number"
                                value={challengeData.rewardPoints}
                                onChange={e => handleInputChange('rewardPoints', e.target.value)}
                                className="form-input mt-1"
                                min="0"
                            />
                        </label>
                        <label className="form-label">
                            Target Field
                            <input
                                value={challengeData.targetField}
                                onChange={e => handleInputChange('targetField', e.target.value)}
                                className="form-input mt-1"
                                placeholder="e.g., points"
                            />
                        </label>
                    </div>

                    <label className="form-label">
                        Conditions
                        <textarea
                            value={challengeData.conditions}
                            onChange={e => handleInputChange('conditions', e.target.value)}
                            className="form-textarea mt-1"
                            rows={3}
                            placeholder="Enter conditions, one per line"
                        />
                    </label>
                </div>
                {/* Sticky footer inside modal (non-scrolling) */}
                <div className="flex justify-end gap-2 mt-6" style={{ flexShrink: 0 }}>
                    <button onClick={onClose} className="btn-secondary">
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="btn-primary"
                        disabled={isCreating || !challengeData.name.trim() || !challengeData.startDate || !challengeData.endDate}
                    >
                        {isCreating ? 'Creating...' : 'Create Challenge'}
                    </button>
                </div>
            </div>
        </Modal>
    );
}

export default GroupPage;