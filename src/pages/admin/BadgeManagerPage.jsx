import { useState, useEffect } from 'react';
import BadgeManagement from '../../services/BadgeManagement.jsx';
import { BADGE_RARITY } from '../../services/interfaces/Constants.jsx';
import BadgeImageElements from '../../components/ui/BadgeImageManager.jsx';
import '../../components/styles/sphere-styles.css';
import { Badge } from '../../services/interfaces/Badge.jsx';
import RewardSystem from '../../services/RewardSystem.jsx';
import BaseModel from '../../services/interfaces/Base.jsx';
import { Plus, Edit, Trash2, Award, X } from 'lucide-react';

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
                    <div className="grid-2 gap-4">
                        <div className="space-y-4">
                            {inputFields.map(field => (
                                <div key={field.key} className="form-field">
                                    <label className="form-label">{field.label}</label>
                                    {field.type === 'textarea' ? (
                                        <textarea
                                            className="form-textarea"
                                            value={formData[field.key]}
                                            onChange={(e) => handleInputChange(field.key, e.target.value)}
                                            placeholder={field.placeholder}
                                            rows={field.rows}
                                        />
                                    ) : (
                                        <input
                                            className="form-input"
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
                        </div>

                        <div className="text-center">
                            <label className="form-label block mb-3">Badge Image</label>
                            <BadgeImageElements.BadgeImageUploader
                                badgeId={badge?.badgeId || null}
                                onUploadComplete={handleImageUpload}
                                disabled={false}
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 justify-end pt-4 border-t border-white/10">
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

function AdminBadgeDetailPopup({ badge, onClose, onBadgeUpdated }) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [showEditPopup, setShowEditPopup] = useState(false);
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

                <div className="space-y-6">
                    {/* Badge Header */}
                    <div className="flex items-center gap-4">
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
                            <h3 className="text-xl font-semibold text-gradient">
                                {badge.name}
                            </h3>
                            <p className="text-sm" style={{ color: getRarityColor(badge.rarity) }}>
                                {badge.rarity.toUpperCase()} BADGE
                            </p>
                        </div>
                    </div>

                    {/* Badge Description */}
                    <div className="card p-4">
                        <h4 className="font-semibold mb-2">Description</h4>
                        <p className="text-slate-300">
                            {badge.description || 'No description available.'}
                        </p>
                    </div>

                    {/* Badge Stats */}
                    <div className="grid-2 gap-3">
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
                    <div className="card p-4">
                        <h4 className="font-semibold mb-3">Technical Details</h4>
                        <div className="space-y-2 text-sm">
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

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <button
                            className="btn-primary flex items-center gap-2 flex-1"
                            onClick={() => setShowEditPopup(true)}
                            disabled={isProcessing}
                        >
                            <Edit className="w-4 h-4" />
                            Edit Badge
                        </button>
                        <button
                            className="btn-danger flex items-center gap-2"
                            onClick={handleDeleteBadge}
                            disabled={isProcessing}
                        >
                            <Trash2 className="w-4 h-4" />
                            {isProcessing ? 'Deleting...' : 'Delete'}
                        </button>
                    </div>
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

    const awardBadges = async (userId) => {
        RewardSystem.awardBadges(userId);
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

    const renderBadgeList = () => {
        if (isLoadingBadges) {
            return (
                <div className="text-center py-12">
                    <div className="login-spinner mx-auto mb-4"></div>
                    <p className="text-slate-400">Loading badges...</p>
                </div>
            );
        }

        if (filteredBadges.length === 0) {
            return (
                <div className="text-center py-12">
                    <div className="text-slate-400 mb-4">
                        {searchTerm ? 'No badges match your search.' : 'No badges found.'}
                    </div>
                    <button
                        className="btn-primary"
                        onClick={() => setShowCreateBadgePopup(true)}
                    >
                        Create First Badge
                    </button>
                </div>
            );
        }

        return (
            <div className="grid-2 gap-4">
                {filteredBadges.map(badge => (
                    <div
                        key={badge.badgeId || `badge-${Math.random()}`}
                        className="card cursor-pointer"
                        onClick={() => setSelectedBadge(badge)}
                    >
                        <div className="flex items-start gap-3">
                            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                                <span className="text-xl">🏆</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-gradient truncate">
                                    {badge.name}
                                </h3>
                                <p className="text-xs mb-2" style={{ color: getRarityColor(badge.rarity) }}>
                                    {badge.rarity.toUpperCase()}
                                </p>
                                <p className="text-sm text-slate-300 line-clamp-2">
                                    {badge.description || 'No description available.'}
                                </p>
                                <div className="flex items-center justify-between mt-3 text-xs text-slate-400">
                                    <span>{badge.rewardPoints} points</span>
                                    <span>#{badge.badgeId.slice(-6)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gradient">Badge Manager</h2>
                    <p className="text-slate-400">Manage achievement badges for the application</p>
                </div>
                <div className="flex gap-3">
                    <button
                        className="btn-secondary flex items-center gap-2"
                        onClick={() => awardBadges(user.uid)}
                    >
                        <Award className="w-4 h-4" />
                        Award Badges
                    </button>
                    <button
                        className="btn-primary flex items-center gap-2"
                        onClick={() => setShowCreateBadgePopup(true)}
                    >
                        <Plus className="w-4 h-4" />
                        Create Badge
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="search-container">
                <input
                    type="text"
                    placeholder="Search badges by name, description, or rarity..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />
            </div>

            {/* Stats Cards */}
            <div className="grid-3 gap-4 mt-4">
                <div className="card text-center">
                    <div className="text-2xl font-bold text-gradient">{allBadges.length}</div>
                    <div className="text-sm text-slate-400">Total Badges</div>
                </div>
                <div className="card text-center">
                    <div className="text-2xl font-bold text-gradient">
                        {allBadges.filter(b => b.rarity === BADGE_RARITY.LEGENDARY).length}
                    </div>
                    <div className="text-sm text-slate-400">Legendary</div>
                </div>
                <div className="card text-center">
                    <div className="text-2xl font-bold text-gradient">
                        {allBadges.reduce((sum, badge) => sum + (badge.rewardPoints || 0), 0)}
                    </div>
                    <div className="text-sm text-slate-400">Total Points</div>
                </div>
            </div>

            {/* Badge List */}
            <div className="mt-4">
                {renderBadgeList()}
            </div>

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
        </div>
    );
}

export default BadgeManagerPage;