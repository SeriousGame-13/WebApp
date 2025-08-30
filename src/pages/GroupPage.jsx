import React, { useState, useEffect, useRef } from 'react';
import ExpElements from '../components/ui/ExpBar';
import IconElements from '../components/ui/IconElements';
import UserManagement from '../services/firebase/UserManagementSystem';
import GroupManagement from '../services/firebase/GroupManagementSystem';
import ChallengeManagement from '../services/firebase/ChallengeManagement';

import '../components/styles/LayoutElements.css'
import '../components/styles/GroupPage.css'

function newGroups({ groups, setGroups, joinedIds, setJoinedIds }) {
  const [search, setSearch] = useState("");
  const [opened, setOpened] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const filtered = useMemo(() => 
    groups.filter(g => g.name.toLowerCase().includes(search.toLowerCase())), 
    [groups, search]
  );
  
  const current = opened ? groups.find(g => g.id === opened) : null;

  const createGroup = () => {
    if (!newName.trim()) return;
    const id = `g${Math.random().toString(36).slice(2, 7)}`;
    const g = { 
      id, 
      name: newName, 
      members: 1, 
      description: newDesc || "", 
      memberIds: ["me"] 
    };
    setGroups(prev => [g, ...prev]);
    setCreateOpen(false); 
    setNewName(""); 
    setNewDesc("");
  };

  const toggleJoin = (gid) => {
    setGroups(prev => prev.map(g => {
      if (g.id !== gid) return g;
      const already = (g.memberIds || []).includes("me");
      const memberIds = already 
        ? g.memberIds.filter(id => id !== "me") 
        : [...(g.memberIds || []), "me"]; 
      const members = Math.max(0, (g.members || memberIds.length) + (already ? -1 : 1));
      return { ...g, memberIds, members };
    }));
    const set = new Set(joinedIds);
    if (set.has(gid)) set.delete(gid); else set.add(gid);
    setJoinedIds(Array.from(set));
  };

  const getUserById = (id) => {
    if (id === "me") return { id: "me", name: DUMMY_USER.name };
    const u = BASE_USERS.find(u => u.id === id);
    return u ? { id: u.id, name: u.name } : { id, name: `Member ${id}` };
  };

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
          </div>

          <div className="space-y-3">
            {filtered.map(g => (
              <Card key={g.id}>
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-white/10 p-3">
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-lg font-semibold">{g.name}</p>
                    <p className="text-slate-400 text-sm">{g.members} members</p>
                  </div>
                  <button 
                    onClick={() => setOpened(g.id)} 
                    className="btn-secondary"
                  >
                    Open
                  </button>
                </div>
              </Card>
            ))}
          </div>

          <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Group" size="sm">
            <div className="space-y-3">
              <label className="form-label">
                Name
                <input 
                  value={newName} 
                  onChange={e=>setNewName(e.target.value)} 
                  className="form-input mt-1" 
                />
              </label>
              <label className="form-label">
                Description
                <textarea 
                  value={newDesc} 
                  onChange={e=>setNewDesc(e.target.value)} 
                  className="form-textarea mt-1" 
                  rows={3} 
                />
              </label>
              <div className="flex justify-end gap-2">
                <button 
                  onClick={()=>setCreateOpen(false)} 
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button 
                  onClick={createGroup} 
                  className="btn-primary"
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
            <p className="text-slate-300 mb-2">{current.description}</p>
            <p className="text-slate-400 text-sm">Members: {current.members}</p>
          </Card>

          <div>
            <h4 className="mb-2 text-slate-200 font-semibold">Members</h4>
            <div className="space-y-2">
              {(current.memberIds || []).map((mid) => {
                const m = getUserById(mid);
                return (
                  <Card key={mid}>
                    <div className="flex items-center gap-3">
                      <Avatar name={m.name} size={36} seed={mid} />
                      <span className="font-medium">{m.name}</span>
                    </div>
                  </Card>
                );
              })}
              {!(current.memberIds && current.memberIds.length) && (
                <p className="text-slate-400 text-sm">No members yet.</p>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => toggleJoin(current.id)} 
              className={joinedIds.includes(current.id) ? "btn-secondary" : "btn-primary"}
            >
              {joinedIds.includes(current.id) ? "Joined" : "Join Group"}
            </button>
          </div>
        </div>
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
            <div className='modal-overlay'>
                <div className='modal-backdrop'></div>
                <div className='modal-content'>
                    <h2 className='modal-title'>Creating Group...</h2>
                </div>
            </div>
        );
    }

    return (
        <div className='modal-overlay'>
            <div className='modal-backdrop'></div>
            <div className='modal-content'>
                <h2 className='modal-title'>Create Group</h2>
                
                <div className='space-y-4'>
                    <div className='form-group'>
                        <div className='text-center mb-4'>
                            <div className="text-slate-300 mb-4">
                                Group Image
                            </div>
                            <div className="text-center">
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
                                    className='btn-secondary mt-2'
                                    onClick={handleImageButtonClick}
                                >
                                    {imagePreview ? 'Change Image' : 'Upload Image'}
                                </button>
                            </div>
                        </div>

                        <div className='form-group'>
                            <label className='form-label'>Group Name</label>
                            <input 
                                className='form-input'
                                type="text"
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                                placeholder="Group Name"
                                maxLength={50}
                            />
                        </div>
                        
                        <div className='form-group'>
                            <label className='form-label'>Description</label>
                            <input 
                                className='form-input'
                                type="text"
                                value={groupDescription}
                                onChange={(e) => setGroupDescription(e.target.value)}
                                placeholder="Group Description (Optional)"
                                maxLength={200}
                            />
                        </div>

                        <div className='form-group'>
                            <label className='form-label'>Privacy Setting</label>
                            <div className='flex space-x-4'>
                                <label className='flex items-center'>
                                    <input
                                        type="radio"
                                        name="privacy"
                                        checked={!isPrivate}
                                        onChange={() => setIsPrivate(false)}
                                        className="mr-2"
                                    />
                                    <span className="text-slate-200">Public Group</span>
                                </label>
                                <label className='flex items-center'>
                                    <input
                                        type="radio"
                                        name="privacy"
                                        checked={isPrivate}
                                        onChange={() => setIsPrivate(true)}
                                        className="mr-2"
                                    />
                                    <span className="text-slate-200">Private Group</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                <div className='flex justify-between items-center mt-6 border-t pt-4'>
                    <button className='btn-secondary' onClick={onCancel}>
                        Cancel
                    </button>
                    <button 
                        className='btn-primary' 
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
            <div className='modal-overlay'>
                <div className='modal-backdrop'></div>
                <div className='modal-content'>
                    <h2 className='modal-title'>Updating Group...</h2>
                </div>
            </div>
        );
    }

    return (
        <div className='modal-overlay'>
            <div className='modal-backdrop'></div>
            <div className='modal-content'>
                <h2 className='modal-title'>Edit Group</h2>
                
                <div className='space-y-4'>
                    <div className='form-group'>
                        <div className='text-center mb-4'>
                            <div className="text-slate-300 mb-4">
                                Group Image
                            </div>
                            <div className="text-center">
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
                                    className='btn-secondary mt-2'
                                    onClick={handleImageButtonClick}
                                    disabled={imageLoading}
                                >
                                    {imageLoading ? 'Loading...' : 
                                     displayImage ? 'Change Image' : 'Upload Image'}
                                </button>
                            </div>
                        </div>

                        <div className='form-group'>
                            <label className='form-label'>Group Name</label>
                            <input 
                                className='form-input'
                                type="text"
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                                placeholder="Group Name"
                                maxLength={50}
                            />
                        </div>
                        
                        <div className='form-group'>
                            <label className='form-label'>Description</label>
                            <input 
                                className='form-input'
                                type="text"
                                value={groupDescription}
                                onChange={(e) => setGroupDescription(e.target.value)}
                                placeholder="Group Description (Optional)"
                                maxLength={200}
                            />
                        </div>

                        <div className='form-group'>
                            <label className='form-label'>Privacy Setting</label>
                            <div className='flex space-x-4'>
                                <label className='flex items-center'>
                                    <input
                                        type="radio"
                                        name="privacy"
                                        checked={!isPrivate}
                                        onChange={() => setIsPrivate(false)}
                                        className="mr-2"
                                    />
                                    <span className="text-slate-200">Public Group</span>
                                </label>
                                <label className='flex items-center'>
                                    <input
                                        type="radio"
                                        name="privacy"
                                        checked={isPrivate}
                                        onChange={() => setIsPrivate(true)}
                                        className="mr-2"
                                    />
                                    <span className="text-slate-200">Private Group</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                <div className='flex justify-between items-center mt-6 border-t pt-4'>
                    <button className='btn-secondary' onClick={onCancel}>
                        Cancel
                    </button>
                    <button 
                        className='btn-primary' 
                        onClick={handleConfirm}
                        disabled={!groupName.trim()}
                    >
                        Save Changes
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
            <div className='modal-overlay'>
                <div className='modal-backdrop'></div>
                <div className='modal-content'>
                    <h2 className='modal-title'>Joining Group...</h2>
                </div>
            </div>
        );
    }

    return (
        <div className='modal-overlay'>
            <div className='modal-backdrop'></div>
            <div className='modal-content'>
                <h2 className='modal-title'>Join Group by ID</h2>
                <div className='form-group my-4'>
                    <input 
                        className='form-input'
                        type="text"
                        value={groupId}
                        onChange={(e) => setGroupId(e.target.value.toUpperCase())}
                        placeholder="Enter Group ID (e.g., OG123456)"
                        maxLength={8}
                    />
                </div>
                <div className='flex justify-between items-center mt-6 border-t pt-4'>
                    <button className='btn-secondary' onClick={onCancel}>
                        Cancel
                    </button>
                    <button 
                        className='btn-primary' 
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
            <div className='modal-overlay'>
                <div className='modal-backdrop'></div>
                <div className='modal-content'>
                    <h2 className='modal-title'>Group Details</h2>
                    <div className='card mt-4'>
                        <h3 className='text-gradient text-lg font-semibold'>{selectedGroup.name}</h3>
                        <p className='text-slate-300 mt-2'>
                            {selectedGroup.description || 'No description available.'}
                        </p>
                        <div className='text-slate-400 text-sm mt-4 space-y-1'>
                            <div>Group ID: {selectedGroup.groupId}</div>
                            <div>Members: {selectedGroup.getActiveMemberCount()}/{selectedGroup.maxMembers}</div>
                            <div>Created by: {creatorName || 'Loading...'}</div>
                        </div>
                    </div>
                    <div className='flex justify-between items-center mt-6 border-t pt-4'>
                        <button className='btn-secondary' onClick={() => setSelectedGroup(null)}>
                            Back
                        </button>
                        <button 
                            className='btn-primary' 
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
        <div className='modal-overlay'>
            <div className='modal-backdrop'></div>
            <div className='modal-content'>
                <h2 className='modal-title'>Join Public Group</h2>
                <div className='mt-4 space-y-4'>
                    {isLoadingGroups ? (
                        <div className='text-slate-400 text-center py-6'>
                            Loading groups...
                        </div>
                    ) : publicGroups.length === 0 ? (
                        <div className='text-slate-400 text-center py-6'>
                            No public groups available
                        </div>
                    ) : (
                        publicGroups.map(group => (
                            <div 
                                key={group.groupId} 
                                className="card-button"
                                onClick={() => setSelectedGroup(group)}
                            >
                                <h3 className='text-gradient font-semibold'>{group.name}</h3>
                                <p className='text-slate-300 mt-2 text-sm'>
                                    {group.description || 'No description available.'}
                                </p>
                                <div className='text-slate-400 text-xs mt-2'>
                                    Group ID: {group.groupId} | Members: {group.getActiveMemberCount()}/{group.maxMembers}
                                </div>
                            </div>
                        ))
                    )}
                </div>
                <div className='flex justify-end items-center mt-6 border-t pt-4'>
                    <button className='btn-secondary' onClick={onCancel}>
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
            <div className='modal-overlay'>
                <div className='modal-backdrop'></div>
                <div className='modal-content'>
                    <h2 className='modal-title'>Creating Challenge...</h2>
                </div>
            </div>
        );
    }

    return (
        <div className='modal-overlay'>
            <div className='modal-backdrop'></div>
            <div className='modal-content'>
                <h2 className='modal-title text-center mb-4'>
                    Create Challenge for {group.name}
                </h2>
                
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div className='space-y-4'>
                        <div className='form-group'>
                            <label className='form-label'>Challenge Name</label>
                            <input 
                                className='form-input'
                                type="text"
                                value={challengeName}
                                onChange={(e) => setChallengeName(e.target.value)}
                                placeholder="Enter challenge name"
                                maxLength={50}
                            />
                        </div>

                        <div className='form-group'>
                            <label className='form-label'>Description</label>
                            <input 
                                className='form-input'
                                type="text"
                                value={challengeDescription}
                                onChange={(e) => setChallengeDescription(e.target.value)}
                                placeholder="Enter challenge description"
                                maxLength={200}
                            />
                        </div>

                        <div className='form-group'>
                            <label className='form-label'>Challenge Type</label>
                            <select 
                                className='form-input'
                                value={challengeType}
                                onChange={(e) => setChallengeType(e.target.value)}
                            >
                                <option value="target">Target</option>
                                <option value="streak">Streak</option>
                                <option value="endurance">Endurance</option>
                                <option value="frequency">Frequency</option>
                            </select>
                        </div>

                        <div className='form-group'>
                            <label className='form-label'>Target Value</label>
                            <input 
                                className='form-input'
                                type="number"
                                value={targetValue}
                                onChange={(e) => setTargetValue(e.target.value)}
                                placeholder="Enter target value"
                                min="0"
                            />
                        </div>
                    </div>

                    <div className='space-y-4'>
                        <div className='form-group'>
                            <label className='form-label'>Start Date</label>
                            <input 
                                className='form-input'
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>

                        <div className='form-group'>
                            <label className='form-label'>End Date</label>
                            <input 
                                className='form-input'
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>

                        <div className='form-group'>
                            <label className='form-label'>Reward Points</label>
                            <input 
                                className='form-input'
                                type="number"
                                value={rewardPoints}
                                onChange={(e) => setRewardPoints(e.target.value)}
                                placeholder="Points awarded when completed"
                                min="0"
                            />
                        </div>
                    </div>
                </div>

                <div className='flex justify-between items-center mt-6 border-t pt-4'>
                    <button className='btn-secondary' onClick={onCancel}>
                        Cancel
                    </button>
                    <button 
                        className='btn-primary' 
                        onClick={handleConfirm}
                        disabled={!challengeName.trim() || !startDate || !endDate}
                    >
                        Create Challenge
                    </button>
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
        <div className='modal-overlay'>
            <div className='modal-backdrop'></div>
            <div className='modal-content'>
                <h2 className='modal-title text-center'>Group Details</h2>
                
                <div className='space-y-4 mt-4'>
                    <div className='card'>
                        <h3 className='text-gradient font-semibold'>
                            {group.name} {group.isPrivate && <span className='text-slate-400 text-sm'>(Private)</span>}
                        </h3>
                        <p className='text-slate-300 mt-2'>
                            {group.description || 'No description available.'}
                        </p>
                        <div className='text-slate-400 text-sm mt-4 space-y-1'>
                            <div>Group ID: {group.groupId}</div>
                            <div>Members: {group.getActiveMemberCount()}/{group.maxMembers}</div>
                            <div>Created by: {creatorName}</div>
                        </div>
                    </div>
                    
                    <div className='card'>
                        <h3 className='text-slate-200 font-semibold text-center mb-4'>Members</h3>
                        <div className='space-y-3'>
                            {activeMembers.map(member => (
                                <div key={member.membershipId} className='bg-white/5 p-3 rounded-lg'>
                                    <div className='text-gradient font-medium'>
                                        {member.user?.displayName || 'Unknown User'} 
                                        {member.isAdmin() && <span className='text-slate-400 text-xs ml-1'>(Admin)</span>}
                                    </div>
                                    <div className='text-slate-300 text-sm mt-1'>
                                        Joined: {formatJoinDate(member.joinedAt)}
                                    </div>
                                    <div className='text-slate-400 text-xs mt-1'>
                                        Role: {member.role} | User ID: {member.userId}
                                    </div>
                                </div>
                            ))}
                        </div>
                            
                        <div className='flex flex-wrap gap-2 mt-4 justify-center'>
                            {isAdmin && (
                                <button 
                                    className='btn-secondary'
                                    onClick={() => setShowCreateChallengePopup(true)}
                                    disabled={isProcessing}
                                >
                                    Add Challenge
                                </button>
                            )}
                            
                            {isCreator && (
                                <button 
                                    className='btn-secondary'
                                    onClick={() => setShowEditGroupPopup(true)}
                                    disabled={isProcessing}
                                >
                                    Edit Group
                                </button>
                            )}
                            
                            {isCreator && (
                                <button 
                                    className='btn-secondary text-red-400'
                                    onClick={handleDeleteGroup}
                                    disabled={isProcessing}
                                >
                                    {isProcessing ? 'Deleting...' : 'Delete Group'}
                                </button>
                            )}
                            <button 
                                className='btn-secondary text-red-400'
                                onClick={handleLeaveGroup}
                                disabled={isProcessing}
                            >
                                {isProcessing ? 'Leaving...' : 'Leave Group'}
                            </button>
                        </div>
                    </div>
                </div>
                
                <div className='flex justify-end items-center mt-6 border-t pt-4'>
                    <button className='btn-secondary' onClick={onClose}>
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
        <div className="card-button" onClick={onClick}>
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 relative flex-shrink-0">
                    {imageLoading ? (
                        <div className='bg-white/5 rounded-full w-10 h-10 flex items-center justify-center'>
                            <span className='text-slate-400 text-xs'>Loading...</span>
                        </div>
                    ) : groupImage ? (
                        <img className='w-10 h-10 rounded-full object-cover'
                            src={groupImage} 
                            alt="Group Profile" 
                        />
                    ) : (
                        <div className='bg-white/5 rounded-full w-10 h-10 flex items-center justify-center'>
                            <IconElements.UserIcon />
                        </div>
                    )}
                </div>
                <div className="flex-1">
                    <div className="text-gradient font-semibold">
                        {group.name} {group.isPrivate && <span className='text-slate-400 text-xs'>(Private)</span>}
                    </div>
                    <div className="text-slate-400 text-sm">
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
        <div className="space-y-4 mb-6">
            <h2 className="screen-title mb-2">Groups</h2>
            <h3 className="text-slate-200 font-semibold">My Groups</h3>

            {isLoadingGroups ? (
                <div className='text-slate-400 text-center py-6'>
                    Loading...
                </div>
            ) : userGroups.length === 0 ? (
                <div className='text-slate-400 text-center py-6'>
                    No Joined Groups
                </div>
            ) : (
                <div className="space-y-3">
                    {userGroups.map(group => (
                        <GroupCardItem 
                            key={group.groupId} 
                            group={group}
                            onClick={() => setSelectedJoinedGroup(group)}
                        />
                    ))}
                </div>
            )}
        </div>
    );

    const GroupListSectionHorizontal = () => (
        <div className="space-y-4 mb-6">
            <h3 className="text-slate-200 font-semibold">My Groups</h3>
            {isLoadingGroups ? (
                <div className='text-slate-400 text-center py-6'>
                    Loading...
                </div>
            ) : userGroups.length === 0 ? (
                <div className='text-slate-400 text-center py-6'>
                    No Joined Groups
                </div>
            ) : (
                <div className="space-y-3">
                    {userGroups.map(group => (
                        <GroupCardItem 
                            key={group.groupId} 
                            group={group}
                            onClick={() => setSelectedJoinedGroup(group)}
                        />
                    ))}
                </div>
            )}
        </div>
    );

    const ButtonSection = () => (
        <div className="flex flex-wrap gap-2 justify-center mt-4">
            <button 
                className='btn-primary'
                onClick={handleCreateGroup}
            >
                <span className='mr-2'>+</span>
                <span>Create Group</span>
            </button>
            <button 
                className="btn-secondary"
                onClick={() => setShowActionPopup(true)}
            >
                <span className='mr-2'>▷</span>
                <span>Find Group</span>
            </button>
        </div>
    );

    const ButtonSectionHorizontal = () => (
        <div className="flex flex-wrap gap-2 mb-4">
            <button 
                className='btn-primary'
                onClick={handleCreateGroup}
            >
                <span className='mr-2'>+</span>
                <span>Create Group</span>
            </button>
            <button 
                className="btn-secondary"
                onClick={() => setShowActionPopup(true)}
            >
                <span className='mr-2'>▷</span>
                <span>Find Group</span>
            </button>
        </div>
    );

    return (
        <div className="app-container">
            <div className="screen">
                <div className="background">
                    <div className="bg-gradient-1"></div>
                    <div className="bg-gradient-2"></div>
                    <div className="bg-overlay"></div>
                </div>
                
                <div className="screen-main">
                    {orientation === 'portrait' ? (
                        <div className="space-y-4">
                            <GroupListSection />
                            <ButtonSection />
                        </div>
                    ) : (
                        <>
                            <div className="mb-6">
                                <h2 className="screen-title mb-4">Groups</h2>
                                <ButtonSectionHorizontal />
                            </div>
                            
                            <div className="overflow-auto">
                                <GroupListSectionHorizontal />
                            </div>
                        </>
                    )}
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
        <div className='modal-overlay'>
            <div className='modal-backdrop'></div>
            <div className='modal-content'>
                <h2 className='modal-title'>Find Group</h2>
                <div className='flex flex-col gap-2 my-4'>
                    <button 
                        className='btn-primary'
                        onClick={onJoinGroup}
                    >
                        <span className='mr-2'>▷</span>
                        <span>Join Group</span>
                    </button>
                    <button 
                        className='btn-secondary'
                        onClick={onJoinGroupViaId}
                    >
                        <span className='mr-2'>▷</span>
                        <span>Join Group via ID</span>
                    </button>
                </div>
                <div className='flex justify-end items-center mt-6 border-t pt-4'>
                    <button className='btn-secondary' onClick={onCancel}>
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