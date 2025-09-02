import { useState, useEffect } from 'react';
import BadgeManagement from '../../services/BadgeManagement.jsx';
import UserManagement from '../../services/UserManagementSystem.jsx';
import { BADGE_RARITY } from '../../services/interfaces/Constants.jsx';
import BadgeImageElements from '../../components/ui/BadgeImageManager.jsx';
import { AdminPageLayout, AdminCard } from '../../components/ui/AdminComponents.jsx';
import '../../components/styles/sphere-styles.css';
import { Badge } from '../../services/interfaces/Badge.jsx';
import RewardSystem from '../../services/RewardSystem.jsx';
import BaseModel from '../../services/interfaces/Base.jsx';
import { Plus, Edit, Trash2, Award, X, Users, Check } from 'lucide-react';

// Shared Badge Form Component
function BadgeForm({ badge = null, onSubmit, onCancel, isProcessing, submitText }) {
    const dummyBadge = new Badge();
    const [formData, setFormData] = useState({
        name: badge?.name || '',
        description: badge?.description || '',
        rarity: badge?.rarity || BADGE_RARITY.COMMON,
        rewardPoints: badge?.rewardPoints || 0,
        collection: badge?.collection || dummyBadge.collection,
        aggregate: badge?.aggregate || dummyBadge.aggregate,
        field: badge?.field || dummyBadge.field,
        valueToReach: badge?.valueToReach || dummyBadge.valueToReach,
        conditions: badge?.conditions || dummyBadge.conditions,
        imageData: null
    });

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleImageUpload = (imageResult) => {
        handleInputChange('imageData', imageResult.base64Data);
    };

    const handleSubmit = () => {
        if (formData.name.trim() && formData.rewardPoints >= 0) {
            const submitData = {
                ...formData,
                name: formData.name.trim(),
                description: formData.description.trim(),
                rewardPoints: parseInt(formData.rewardPoints)
            };
            onSubmit(submitData);
        }
    };

    const isValid = formData.name.trim() && formData.rewardPoints >= 0;

    if (isProcessing) {
        return (
            <div className="modal-overlay">
                <div className="modal-backdrop"></div>
                <div className="modal-content max-w-sm">
                    <div className="text-center py-8">
                        <div className="login-spinner mx-auto mb-4"></div>
                        <h2 className="text-lg font-semibold">{badge ? 'Updating' : 'Creating'} Badge...</h2>
                    </div>
                </div>
            </div>
        );
    }

    const inputFields = [
        { key: 'name', label: 'Badge Name', type: 'text', maxLength: 50, placeholder: 'Enter badge name' },
        { key: 'description', label: 'Description', type: 'text', maxLength: 200, placeholder: 'Enter badge description' },
        { key: 'rewardPoints', label: 'Reward Points', type: 'number', min: 0, placeholder: 'Points awarded when earned' },
        { key: 'collection', label: 'Collection', type: 'text', placeholder: 'e.g., exercises' },
        { key: 'aggregate', label: 'Aggregate', type: 'text', placeholder: 'e.g., sum, count' },
        { key: 'field', label: 'Field to Aggregate', type: 'text', placeholder: 'e.g., points' },
        { key: 'valueToReach', label: 'Value to Reach', type: 'text', placeholder: 'e.g., 1000' },
        { key: 'conditions', label: 'Conditions', type: 'textarea', rows: 4, placeholder: 'field:userId,operator:==,value:{user.uid}' }
    ];

    return (
        <div className="modal-overlay">
            <div className="modal-backdrop" onClick={onCancel}></div>
            <div className="modal-content max-w-lg">
                <div className="modal-header">
                    <h2 className="modal-title">
                        {badge ? 'Edit' : 'Create New'} Badge
                    </h2>
                    <button className="modal-close" onClick={onCancel}>
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-6">
                    {/* Basic Info */}
                    <div className="grid-2 gap-4">
                        <div className="form-field">
                            <label className="form-label">Badge Name</label>
                            <input
                                className="form-input"
                                type="text"
                                value={formData.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                placeholder="Enter badge name"
                                maxLength={50}
                            />
                        </div>

                        <div className="form-field">
                            <label className="form-label">Reward Points</label>
                            <input
                                className="form-input"
                                type="number"
                                value={formData.rewardPoints}
                                onChange={(e) => handleInputChange('rewardPoints', e.target.value)}
                                placeholder="Points awarded when earned"
                                min={0}
                            />
                        </div>
                    </div>

                    <div className="form-field">
                        <label className="form-label">Description</label>
                        <textarea
                            className="form-textarea"
                            value={formData.description}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                            placeholder="Enter badge description"
                            maxLength={200}
                            rows={3}
                        />
                    </div>

                    {/* Badge Settings */}
                    <div className="form-field">
                        <label className="form-label">Rarity Level</label>
                        <select
                            className="form-input"
                            value={formData.rarity}
                            onChange={(e) => handleInputChange('rarity', e.target.value)}
                        >
                            <option value={BADGE_RARITY.COMMON}>Common</option>
                            <option value={BADGE_RARITY.UNCOMMON}>Uncommon</option>
                            <option value={BADGE_RARITY.RARE}>Rare</option>
                            <option value={BADGE_RARITY.EPIC}>Epic</option>
                            <option value={BADGE_RARITY.LEGENDARY}>Legendary</option>
                        </select>
                    </div>

                    {/* Collection Settings */}
                    <div className="grid-2 gap-4">
                        <div className="form-field">
                            <label className="form-label">Collection</label>
                            <input
                                className="form-input"
                                type="text"
                                value={formData.collection}
                                onChange={(e) => handleInputChange('collection', e.target.value)}
                                placeholder="e.g., exercises"
                            />
                        </div>

                        <div className="form-field">
                            <label className="form-label">Aggregate</label>
                            <input
                                className="form-input"
                                type="text"
                                value={formData.aggregate}
                                onChange={(e) => handleInputChange('aggregate', e.target.value)}
                                placeholder="e.g., sum, count"
                            />
                        </div>
                    </div>

                    <div className="grid-2 gap-4">
                        <div className="form-field">
                            <label className="form-label">Field to Aggregate</label>
                            <input
                                className="form-input"
                                type="text"
                                value={formData.field}
                                onChange={(e) => handleInputChange('field', e.target.value)}
                                placeholder="e.g., points"
                            />
                        </div>

                        <div className="form-field">
                            <label className="form-label">Value to Reach</label>
                            <input
                                className="form-input"
                                type="text"
                                value={formData.valueToReach}
                                onChange={(e) => handleInputChange('valueToReach', e.target.value)}
                                placeholder="e.g., 1000"
                            />
                        </div>
                    </div>

                    <div className="form-field">
                        <label className="form-label">Conditions</label>
                        <textarea
                            className="form-textarea"
                            value={formData.conditions}
                            onChange={(e) => handleInputChange('conditions', e.target.value)}
                            placeholder="field:userId,operator:==,value:{user.uid}"
                            rows={4}
                        />
                    </div>

                    {/* Badge Image */}
                    <div className="form-field">
                        <label className="form-label">Badge Image</label>
                        <div className="flex items-center justify-center">
                            <BadgeImageElements.BadgeImageUploader
                                badgeId={badge?.badgeId || null}
                                onUploadComplete={handleImageUpload}
                                disabled={false}
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 justify-end pt-4">
                        <button className="btn-secondary" onClick={onCancel}>
                            Cancel
                        </button>
                        <button
                            className="btn-primary"
                            onClick={handleSubmit}
                            disabled={!isValid}
                        >
                            {submitText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Badge Assignment Manager Component
function BadgeAssignmentManager({ badge, onClose, onAssignmentsUpdated }) {
    const [allUsers, setAllUsers] = useState([]);
    const [userBadges, setUserBadges] = useState(new Map());
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUsers, setSelectedUsers] = useState(new Set());

    useEffect(() => {
        loadUsersAndBadges();
    }, [badge.badgeId]);

    const loadUsersAndBadges = async () => {
        try {
            setIsLoading(true);
            
            // Load all users
            const users = await UserManagement.getAllActiveUsers();
            setAllUsers(users);

            // Load badge assignments for each user
            const badgeMap = new Map();
            for (const user of users) {
                try {
                    const userBadgeList = await UserManagement.getBadges(user.uid);
                    const hasBadge = userBadgeList.some(b => b.badgeId === badge.badgeId);
                    badgeMap.set(user.uid, hasBadge);
                } catch (error) {
                    console.error(`Failed to load badges for user ${user.uid}:`, error);
                    badgeMap.set(user.uid, false);
                }
            }
            setUserBadges(badgeMap);
        } catch (error) {
            console.error('Failed to load users and badges:', error);
            setAllUsers([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUserToggle = (userId) => {
        setSelectedUsers(prev => {
            const newSet = new Set(prev);
            if (newSet.has(userId)) {
                newSet.delete(userId);
            } else {
                newSet.add(userId);
            }
            return newSet;
        });
    };

    const handleBulkAssign = async () => {
        if (selectedUsers.size === 0) {
            alert('Please select at least one user');
            return;
        }

        setIsProcessing(true);
        try {
            const promises = Array.from(selectedUsers).map(userId => {
                const currentlyHasBadge = userBadges.get(userId);
                if (currentlyHasBadge) {
                    // Remove badge
                    return UserManagement.removeBadge(userId, badge.badgeId);
                } else {
                    // Award badge
                    return UserManagement.awardBadge(userId, badge.badgeId);
                }
            });

            await Promise.all(promises);
            
            // Reload badge assignments
            await loadUsersAndBadges();
            setSelectedUsers(new Set());
            onAssignmentsUpdated();
            
            alert(`Badge assignments updated for ${selectedUsers.size} user(s)`);
        } catch (error) {
            console.error('Failed to update badge assignments:', error);
            alert('Failed to update badge assignments: ' + error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const filteredUsers = allUsers.filter(user =>
        user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getActionText = () => {
        if (selectedUsers.size === 0) return 'Select users';
        
        const selectedUsersList = Array.from(selectedUsers);
        const toAward = selectedUsersList.filter(userId => !userBadges.get(userId));
        const toRemove = selectedUsersList.filter(userId => userBadges.get(userId));
        
        if (toAward.length > 0 && toRemove.length > 0) {
            return `Award to ${toAward.length}, Remove from ${toRemove.length}`;
        } else if (toAward.length > 0) {
            return `Award to ${toAward.length} user(s)`;
        } else {
            return `Remove from ${toRemove.length} user(s)`;
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-backdrop" onClick={onClose}></div>
            <div className="modal-content max-w-2xl">
                <div className="modal-header">
                    <h2 className="modal-title">Manage Badge Assignments</h2>
                    <button className="modal-close" onClick={onClose}>
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-6">
                    {/* Badge Info Header */}
                    <div className="card p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
                                <span className="text-xl">🏆</span>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gradient">{badge.name}</h3>
                                <p className="text-sm text-slate-400">{badge.rewardPoints} points</p>
                            </div>
                        </div>
                    </div>

                    {/* Search Users */}
                    <div className="flex items-center gap-4 mt-4">
                        <div className="search-container flex-1">
                            <input
                                type="text"
                                placeholder="Search users by name or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-input"
                            />
                        </div>
                        <button
                            className="btn-primary flex items-center gap-2"
                            onClick={handleBulkAssign}
                            disabled={isProcessing || selectedUsers.size === 0}
                        >
                            <Award className="w-4 h-4" />
                            {isProcessing ? 'Processing...' : getActionText()}
                        </button>
                    </div>

                    {/* User List */}
                    <div className="card p-4 mt-4">
                        <h4 className="font-semibold mb-4">Users ({filteredUsers.length})</h4>
                        
                        {isLoading ? (
                            <div className="text-center py-8">
                                <div className="login-spinner mx-auto mb-4"></div>
                                <p className="text-slate-400">Loading users...</p>
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {filteredUsers.map(user => {
                                    const hasBadge = userBadges.get(user.uid);
                                    const isSelected = selectedUsers.has(user.uid);
                                    
                                    return (
                                        <div
                                            key={user.uid}
                                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                                isSelected 
                                                    ? 'border-blue-500/50 bg-blue-500/10' 
                                                    : 'border-white/10 hover:border-white/20'
                                            }`}
                                            onClick={() => handleUserToggle(user.uid)}
                                        >
                                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                                isSelected 
                                                    ? 'border-blue-500 bg-blue-500' 
                                                    : 'border-white/30'
                                            }`}>
                                                {isSelected && <Check className="w-3 h-3 text-white" />}
                                            </div>
                                            
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">{user.displayName || 'Anonymous'}</span>
                                                    {hasBadge && (
                                                        <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-full">
                                                            Has Badge
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-sm text-slate-400">{user.email}</div>
                                            </div>

                                            <div className="text-xs text-slate-500">
                                                Level {user.level || 1} • {user.points || 0} pts
                                            </div>
                                        </div>
                                    );
                                })}
                                
                                {filteredUsers.length === 0 && (
                                    <div className="text-center py-8 text-slate-400">
                                        {searchTerm ? 'No users match your search.' : 'No users found.'}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="modal-footer mt-4 flex justify-end-footer">
                    <button className="btn-secondary" onClick={onClose}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}

function AdminBadgeDetailPopup({ badge, onClose, onBadgeUpdated }) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [showEditPopup, setShowEditPopup] = useState(false);
    const [showAssignmentManager, setShowAssignmentManager] = useState(false);
    const [isUpdatingBadge, setIsUpdatingBadge] = useState(false);
    const [badgeImage, setBadgeImage] = useState('');
    const [imageLoading, setImageLoading] = useState(true);

    useEffect(() => {
        loadBadgeImage();
    }, [badge.badgeId]);

    const loadBadgeImage = async () => {
        try {
            setImageLoading(true);
            const imageData = await BadgeManagement.getBadgeImage(badge.badgeId);
            setBadgeImage(imageData || '');
        } catch (error) {
            console.error('Failed to load badge image:', error);
            setBadgeImage('');
        } finally {
            setImageLoading(false);
        }
    };

    const handleDeleteBadge = async () => {
        const confirmDelete = confirm(`Are you sure you want to delete the badge "${badge.name}"? This action cannot be undone.`);
        if (!confirmDelete) return;

        setIsProcessing(true);
        try {
            await BadgeManagement.deleteBadge(badge.badgeId);
            onBadgeUpdated();
            onClose();
        } catch (error) {
            console.error('Failed to delete badge:', error);
            alert('Failed to delete badge: ' + error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleUpdateBadge = async (badgeData) => {
        setIsUpdatingBadge(true);
        try {
            await BadgeManagement.updateBadge(badge.badgeId, {
                name: badgeData.name,
                description: badgeData.description,
                rarity: badgeData.rarity,
                rewardPoints: badgeData.rewardPoints,
                collection: badgeData.collection,
                aggregate: badgeData.aggregate,
                field: badgeData.field,
                valueToReach: badgeData.valueToReach,
                conditions: badgeData.conditions
            });

            if (badgeData.imageData) {
                await BadgeManagement.saveBadgeImage(badgeData.imageData, badge.badgeId);
            }

            setShowEditPopup(false);
            onBadgeUpdated();
        } catch (error) {
            console.error('Failed to update badge:', error);
            alert('Failed to update badge: ' + error.message);
        } finally {
            setIsUpdatingBadge(false);
        }
    };

    const formatDate = (ts) => {
        if (!ts) return 'N/A';
        try {
            // Handle both Date objects and timestamps
            let date;
            if (ts instanceof Date) {
                date = ts;
            } else if (typeof ts === 'number') {
                date = new Date(ts);
            } else if (ts.seconds) {
                // Firestore timestamp
                date = new Date(ts.seconds * 1000);
            } else {
                date = new Date(ts);
            }
            
            // Ensure we have a valid date
            if (isNaN(date.getTime())) {
                return 'Invalid Date';
            }
            
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'Invalid Date';
        }
    };

    const getRarityColor = (rarity) => {
        switch (rarity) {
            case BADGE_RARITY.COMMON: return '#9CA3AF';
            case BADGE_RARITY.UNCOMMON: return '#10B981';
            case BADGE_RARITY.RARE: return '#3B82F6';
            case BADGE_RARITY.EPIC: return '#8B5CF6';
            case BADGE_RARITY.LEGENDARY: return '#F59E0B';
            default: return '#9CA3AF';
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-backdrop" onClick={onClose}></div>
            <div className="modal-content max-w-lg">
                <div className="modal-header">
                    <h2 className="modal-title">Badge Details</h2>
                    <button className="modal-close" onClick={onClose}>
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-8">
                    {/* Badge Header */}
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center overflow-hidden">
                            {imageLoading ? (
                                <div className="login-spinner"></div>
                            ) : badgeImage ? (
                                <img 
                                    className="w-full h-full object-cover" 
                                    src={badgeImage} 
                                    alt="Badge" 
                                />
                            ) : (
                                <span className="text-slate-400 text-xs">No Image</span>
                            )}
                        </div>
                        <div className="flex-1">
                            <h3 className="text-xl font-semibold text-gradient mb-2">
                                {badge.name}
                            </h3>
                            <p className="text-sm" style={{ color: getRarityColor(badge.rarity) }}>
                                {badge.rarity.toUpperCase()} BADGE
                            </p>
                        </div>
                    </div>

                    {/* Badge Description */}
                    <div className="card p-4 mt-4">
                        <h4 className="font-semibold mb-3">Description</h4>
                        <p className="text-slate-300">
                            {badge.description || 'No description available.'}
                        </p>
                    </div>

                    {/* Badge Stats */}
                    <div className="grid-2 gap-4 mt-4">
                        <div className="card p-3 text-center">
                            <div className="text-xs text-slate-400 mb-1">Reward Points</div>
                            <div className="text-lg font-semibold">{badge.rewardPoints}</div>
                        </div>
                        <div className="card p-3 text-center">
                            <div className="text-xs text-slate-400 mb-1">Created</div>
                            <div className="text-sm font-medium">{formatDate(badge.createdAt)}</div>
                        </div>
                    </div>

                    {/* Technical Details */}
                    <div className="card p-4 mt-4">
                        <h4 className="font-semibold mb-4">Technical Details</h4>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-400">Badge ID:</span>
                                <span className="font-mono">{badge.badgeId}</span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-slate-400">Collection:</span>
                                <span>{String(badge.collection || 'N/A')}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Aggregate:</span>
                                <span>{String(badge.aggregate || 'N/A')}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Field:</span>
                                <span>{String(badge.field || 'N/A')}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Value to Reach:</span>
                                <span>{String(badge.valueToReach || 'N/A')}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons - Right aligned, no border */}
                <div className="flex justify-end gap-3 pt-6 mt-4">
                    <button
                        className="btn-secondary"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button
                        className="btn-danger flex items-center gap-2"
                        onClick={handleDeleteBadge}
                        disabled={isProcessing}
                    >
                        <Trash2 className="w-4 h-4" />
                        {isProcessing ? 'Deleting...' : 'Delete'}
                    </button>
                    <button
                        className="btn-primary flex items-center gap-2"
                        onClick={() => setShowEditPopup(true)}
                        disabled={isProcessing}
                    >
                        <Edit className="w-4 h-4" />
                        Edit Badge
                    </button>
                </div>

                {showEditPopup && (
                    <BadgeForm
                        badge={badge}
                        onSubmit={handleUpdateBadge}
                        onCancel={() => setShowEditPopup(false)}
                        isProcessing={isUpdatingBadge}
                        submitText="Update Badge"
                    />
                )}

                {showAssignmentManager && (
                    <BadgeAssignmentManager
                        badge={badge}
                        onClose={() => setShowAssignmentManager(false)}
                        onAssignmentsUpdated={() => {
                            onBadgeUpdated();
                            // Could add more specific updates here if needed
                        }}
                    />
                )}
            </div>
        </div>
    );
}

// Badge Card Image Component
function BadgeCardImage({ badge }) {
    const [badgeImage, setBadgeImage] = useState('');
    const [imageLoading, setImageLoading] = useState(true);

    useEffect(() => {
        const loadBadgeImage = async () => {
            if (!badge?.badgeId) {
                setImageLoading(false);
                return;
            }

            try {
                setImageLoading(true);
                const imageData = await BadgeManagement.getBadgeImage(badge.badgeId);
                setBadgeImage(imageData || '');
            } catch (error) {
                console.error('Failed to load badge image:', error);
                setBadgeImage('');
            } finally {
                setImageLoading(false);
            }
        };

        loadBadgeImage();
    }, [badge?.badgeId]);

    return (
        <div className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
            {imageLoading ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin"></div>
            ) : badgeImage ? (
                <img 
                    className="w-full h-full object-cover rounded-xl" 
                    src={badgeImage} 
                    alt="Badge" 
                />
            ) : (
                <div className="w-full h-full bg-white/5 rounded-xl flex items-center justify-center">
                    <span className="text-slate-400 text-xs">No Image</span>
                </div>
            )}
        </div>
    );
}

// User Selection Popup for Badge Awarding
function UserSelectionPopup({ onClose, onUsersSelected }) {
    const [allUsers, setAllUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUsers, setSelectedUsers] = useState(new Set());
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            setIsLoading(true);
            const users = await UserManagement.getAllActiveUsers();
            setAllUsers(users);
        } catch (error) {
            console.error('Failed to load users:', error);
            setAllUsers([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUserToggle = (userId) => {
        setSelectedUsers(prev => {
            const newSet = new Set(prev);
            if (newSet.has(userId)) {
                newSet.delete(userId);
            } else {
                newSet.add(userId);
            }
            return newSet;
        });
    };

    const handleAwardBadges = async () => {
        if (selectedUsers.size === 0) {
            alert('Please select at least one user');
            return;
        }

        setIsProcessing(true);
        try {
            let successCount = 0;
            let errorCount = 0;

            for (const userId of selectedUsers) {
                try {
                    await RewardSystem.awardBadges(userId);
                    successCount++;
                } catch (error) {
                    console.error(`Failed to award badges to user ${userId}:`, error);
                    errorCount++;
                }
            }

            alert(`Badge awarding completed!\nSuccess: ${successCount} users\nErrors: ${errorCount} users`);
            onUsersSelected();
            onClose();
        } catch (error) {
            console.error('Failed to award badges:', error);
            alert('Failed to award badges: ' + error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const filteredUsers = allUsers.filter(user =>
        user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="modal-overlay">
            <div className="modal-backdrop" onClick={onClose}></div>
            <div className="modal-content max-w-2xl">
                <div className="modal-header">
                    <h2 className="modal-title">Award Badges to Users</h2>
                    <button className="modal-close" onClick={onClose}>
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-6">
                    <p className="text-sm text-slate-400">
                        Select users to check and award badges based on their achievements and activities.
                    </p>

                    {/* Search Users */}
                    <div className="flex items-center gap-4">
                        <div className="search-container flex-1">
                            <input
                                type="text"
                                placeholder="Search users by name or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-input"
                            />
                        </div>
                        <button
                            className="btn-primary flex items-center gap-2"
                            onClick={handleAwardBadges}
                            disabled={isProcessing || selectedUsers.size === 0}
                        >
                            <Award className="w-4 h-4" />
                            {isProcessing ? 'Processing...' : `Award to ${selectedUsers.size} user(s)`}
                        </button>
                    </div>

                    {/* User List */}
                    <div className="card p-4">
                        <h4 className="font-semibold mb-4">Users ({filteredUsers.length})</h4>
                        
                        {isLoading ? (
                            <div className="text-center py-8">
                                <div className="login-spinner mx-auto mb-4"></div>
                                <p className="text-slate-400">Loading users...</p>
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {filteredUsers.map(user => {
                                    const isSelected = selectedUsers.has(user.uid);
                                    
                                    return (
                                        <div
                                            key={user.uid}
                                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                                isSelected 
                                                    ? 'border-blue-500/50 bg-blue-500/10' 
                                                    : 'border-white/10 hover:border-white/20'
                                            }`}
                                            onClick={() => handleUserToggle(user.uid)}
                                        >
                                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                                isSelected 
                                                    ? 'border-blue-500 bg-blue-500' 
                                                    : 'border-white/30'
                                            }`}>
                                                {isSelected && <Check className="w-3 h-3 text-white" />}
                                            </div>
                                            
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">{user.displayName || 'Anonymous'}</span>
                                                    {user.isAdmin && (
                                                        <span className="text-xs px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full">
                                                            Admin
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-sm text-slate-400">{user.email}</div>
                                            </div>

                                            <div className="text-xs text-slate-500">
                                                Level {user.level || 1} • {user.points || 0} pts
                                            </div>
                                        </div>
                                    );
                                })}
                                
                                {filteredUsers.length === 0 && (
                                    <div className="text-center py-8 text-slate-400">
                                        {searchTerm ? 'No users match your search.' : 'No users found.'}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="modal-footer mt-4 flex justify-end">
                    <button className="btn-secondary" onClick={onClose}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}

function BadgeManagerPage({ user }) {
    const [allBadges, setAllBadges] = useState([]);
    const [isLoadingBadges, setIsLoadingBadges] = useState(true);
    const [selectedBadge, setSelectedBadge] = useState(null);
    const [showCreateBadgePopup, setShowCreateBadgePopup] = useState(false);
    const [isCreatingBadge, setIsCreatingBadge] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showUserSelectionPopup, setShowUserSelectionPopup] = useState(false);

    useEffect(() => {
        loadAllBadges();
    }, []);

    const loadAllBadges = async () => {
        try {
            setIsLoadingBadges(true);
            const badges = await BadgeManagement.getAllBadges();
            setAllBadges(badges);
        } catch (error) {
            console.error('Failed to load all badges:', error);
            setAllBadges([]);
        } finally {
            setIsLoadingBadges(false);
        }
    };

    const handleBadgeCreation = async (badgeData) => {
        setIsCreatingBadge(true);
        try {
            const createdBadge = await BadgeManagement.createBadge(badgeData);

            if (badgeData.imageData) {
                await BadgeManagement.saveBadgeImage(badgeData.imageData, createdBadge.badgeId);
            }

            setShowCreateBadgePopup(false);
            await loadAllBadges();
        } catch (error) {
            console.error('Failed to create badge:', error);
            alert('Failed to create badge: ' + error.message);
        } finally {
            setIsCreatingBadge(false);
        }
    };

    const getRarityColor = (rarity) => {
        switch (rarity) {
            case BADGE_RARITY.COMMON: return '#9CA3AF';
            case BADGE_RARITY.UNCOMMON: return '#10B981';
            case BADGE_RARITY.RARE: return '#3B82F6';
            case BADGE_RARITY.EPIC: return '#8B5CF6';
            case BADGE_RARITY.LEGENDARY: return '#F59E0B';
            default: return '#9CA3AF';
        }
    };

    const filteredBadges = allBadges.filter(badge =>
        badge.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        badge.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        badge.rarity.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const stats = [
        { value: allBadges.length, label: 'Total Badges' },
        { value: allBadges.filter(b => b.rarity === BADGE_RARITY.LEGENDARY).length, label: 'Legendary' },
        { value: allBadges.reduce((sum, badge) => sum + (badge.rewardPoints || 0), 0), label: 'Total Points' }
    ];

    const additionalButtons = [
        {
            text: 'Award Badges',
            icon: Award,
            onClick: () => setShowUserSelectionPopup(true),
            className: 'btn-secondary'
        }
    ];

    const renderBadgeCards = () => {
        return filteredBadges.map(badge => (
            <AdminCard
                key={badge.badgeId || `badge-${Math.random()}`}
                onClick={() => setSelectedBadge(badge)}
            >
                <div className="flex items-start gap-3">
                    <BadgeCardImage badge={badge} />
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gradient truncate">
                            {badge.name}
                        </h3>
                        <div className="flex items-center gap-2 mb-2">
                            <p className="text-sm" style={{ color: getRarityColor(badge.rarity) }}>
                                {badge.rarity.toUpperCase()}
                            </p>
                            <span className="text-sm text-slate-400">•</span>
                            <span className="text-sm text-slate-300">{badge.rewardPoints} points</span>
                        </div>
                        <p className="text-sm text-slate-300 line-clamp-2">
                            {badge.description || 'No description available.'}
                        </p>
                    </div>
                </div>
            </AdminCard>
        ));
    };

    return (
        <>
            <AdminPageLayout
                title="Badge Manager"
                stats={stats}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                searchPlaceholder="Search badges by name, description, or rarity..."
                onCreateClick={() => setShowCreateBadgePopup(true)}
                createButtonText="Create Badge"
                additionalButtons={additionalButtons}
                isLoading={isLoadingBadges}
                emptyMessage="No badges found."
                contentGridClass="grid-2 gap-4"
            >
                {renderBadgeCards()}
            </AdminPageLayout>

            {/* Modals */}
            {showCreateBadgePopup && (
                <BadgeForm
                    onSubmit={handleBadgeCreation}
                    onCancel={() => setShowCreateBadgePopup(false)}
                    isProcessing={isCreatingBadge}
                    submitText="Create Badge"
                />
            )}

            {selectedBadge && (
                <AdminBadgeDetailPopup
                    badge={selectedBadge}
                    onClose={() => setSelectedBadge(null)}
                    onBadgeUpdated={loadAllBadges}
                />
            )}

            {showUserSelectionPopup && (
                <UserSelectionPopup
                    onClose={() => setShowUserSelectionPopup(false)}
                    onUsersSelected={() => {
                        // Optional: Refresh badges or show success message
                        console.log('Badges awarded to selected users');
                    }}
                />
            )}
        </>
    );
}

export default BadgeManagerPage;