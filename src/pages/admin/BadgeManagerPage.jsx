import { useState, useEffect } from 'react';
import BadgeManagement from '../../services/BadgeManagement.jsx';
import { BADGE_RARITY } from '../../services/interfaces/Constants.jsx';
import BadgeImageElements from '../../components/ui/BadgeImageManager.jsx';
import '../../components/styles/LayoutElements.css';
import { Badge } from '../../services/interfaces/Badge.jsx';
import RewardSystem from '../../services/RewardSystem.jsx';
import BaseModel from '../../services/interfaces/Base.jsx';

// Shared Badge Form Component
function BadgeForm({ badge = null, onSubmit, onCancel, isProcessing, submitText }) {
    const dummyBadge = new Badge();
    const [formData, setFormData] = useState({
        name: badge?.name || '',
        description: badge?.description || '',
        rarity: badge?.rarity || BADGE_RARITY.COMMON,
        rewardPoints: badge?.rewardPoints || 0,
        structure: badge?.structure || dummyBadge.structure,
        mapping: badge?.mapping || dummyBadge.mapping,
        query: badge?.query || dummyBadge.query,
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
            <div className='PopupBackground'>
                <div className='PopupContainer'>
                    <h2>{badge ? 'Updating' : 'Creating'} Badge...</h2>
                </div>
            </div>
        );
    }

    const inputFields = [
        { key: 'name', label: 'Badge Name', type: 'text', maxLength: 50, placeholder: 'Enter badge name' },
        { key: 'description', label: 'Description', type: 'text', maxLength: 200, placeholder: 'Enter badge description' },
        { key: 'rewardPoints', label: 'Reward Points', type: 'number', min: 0, placeholder: 'Points awarded when earned' },
        { key: 'structure', label: 'Firebase Structure', type: 'textarea', rows: 4, placeholder: 'Enter Firebase Structure' },
        { key: 'mapping', label: 'Firebase Mapping', type: 'textarea', rows: 4, placeholder: 'Enter Firebase Mapping' },
        { key: 'query', label: 'Query', type: 'textarea', rows: 4, placeholder: 'Enter Query' },
        { key: 'conditions', label: 'Conditions', type: 'textarea', rows: 4, placeholder: 'Enter Conditions' }
    ];

    return (
        <div className='PopupBackground'>
            <div className='LargePopupContainer'>
                <h2 style={{ margin: '20px 0', textAlign: 'center' }}>
                    {badge ? 'Edit' : 'Create New'} Badge
                </h2>

                <div className='BadgeCreateContent'>
                    <div className='BadgeInputSection'>
                        {inputFields.map(field => (
                            <div key={field.key} className='BadgeInputGroup'>
                                <label className='BadgeInputLabel'>{field.label}</label>
                                {field.type === 'textarea' ? (
                                    <textarea
                                        className='Input'
                                        value={formData[field.key]}
                                        onChange={(e) => handleInputChange(field.key, e.target.value)}
                                        placeholder={field.placeholder}
                                        rows={field.rows}
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

                        <div className='BadgeInputGroup'>
                            <label className='BadgeInputLabel'>Rarity Level</label>
                            <select
                                className='Input'
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

                    <div className='BadgeImageSection'>
                        <div className="GuideText" style={{ textAlign: 'center', marginBottom: '16px' }}>
                            Badge Image
                        </div>
                        <BadgeImageElements.BadgeImageUploader
                            badgeId={badge?.badgeId || null}
                            onUploadComplete={handleImageUpload}
                            disabled={false}
                        />
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
                structure: badgeData.structure,
                mapping: badgeData.mapping,
                query: badgeData.query,
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
        if (!ts) return '';
        const bm = new BaseModel({ createdAt: ts });
        return bm.getCreateAt();
    };

    return (
        <div className='PopupBackground'>
            <div className='LargePopupContainer'>
                <h2 style={{ textAlign: 'center' }}>Badge Management</h2>

                <div className='GroupDetailContainer'>
                    <div className='BadgeDetailHeader'>
                        <div className='BadgeImageContainer'>
                            {imageLoading ? (
                                <div className='ProfileImageAlt'>Loading...</div>
                            ) : badgeImage ? (
                                <img className='BadgeDetailImage' src={badgeImage} alt="Badge" />
                            ) : (
                                <div className='ProfileImageAlt'>No Image</div>
                            )}
                        </div>
                        <div className='BadgeInfoContainer'>
                            <div className='BadgeDetailTitle' style={{ color: 'var(--main-color)' }}>
                                {badge.name}
                            </div>
                            <div className='BadgeDetailRarity' style={{ color: badge.getRarityColor() }}>
                                {badge.rarity.toUpperCase()}
                            </div>
                        </div>
                    </div>

                    <div className='GroupDetailDescription' style={{ textAlign: 'left' }}>
                        {badge.description || 'No description available.'}
                    </div>

                    <div className='GroupDetailInfo' style={{ textAlign: 'left' }}>
                        <div>Badge ID: {badge.badgeId}</div>
                        <div>Reward Points: {badge.rewardPoints}</div>
                        <div>Rarity: {badge.rarity}</div>
                        <div>Created: {formatDate(badge.createdAt)}</div>
                    </div>

                    <div className="GroupActionButtons" style={{ marginTop: '40px' }}>
                        <button
                            className='AdminActionButton'
                            onClick={() => setShowEditPopup(true)}
                            disabled={isProcessing}
                        >
                            Edit Badge
                        </button>
                        <button
                            className='GroupActionButton'
                            onClick={handleDeleteBadge}
                            disabled={isProcessing}
                        >
                            {isProcessing ? 'Deleting...' : 'Delete Badge'}
                        </button>
                    </div>
                </div>

                <div className='Line'></div>
                <div className='Buttonfield'>
                    <button className='CancelButton' onClick={onClose}>Close</button>
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

    const renderBadgeList = () => {
        if (isLoadingBadges) {
            return <div style={{ color: '#A0A0A0', textAlign: 'center', padding: '20px' }}>Loading...</div>;
        }

        if (allBadges.length === 0) {
            return <div style={{ color: '#A0A0A0', textAlign: 'center', padding: '20px' }}>No Badges Found</div>;
        }

        return allBadges.map(badge => (
            <div
                key={badge.badgeId || `badge-${Math.random()}`}
                className="CardContainer"
                onClick={() => setSelectedBadge(badge)}
            >
                <div className="CardHeader" style={{ color: 'var(--main-color)' }}>
                    {badge.name} <span style={{ fontSize: '12px', color: badge.getRarityColor() }}>({badge.rarity})</span>
                </div>
                <div className="CardContents">
                    {badge.description || 'No description available.'}
                </div>
                <div className="CardContents">
                    Badge ID: {badge.badgeId} | Reward Points: {badge.rewardPoints}
                </div>
            </div>
        ));
    };

    return (
        <div className="AppContents">
            <h2 style={{ color: '#E5E5E5', margin: '0 0 20px 0' }}>Badge Manager</h2>

            <div className="AdminGroupContainer">
                <div className="GuideText">All Badges</div>

                {renderBadgeList()}

                <button
                    className="AdminActionButton"
                    onClick={() => setShowCreateBadgePopup(true)}
                >
                    Create New Badge
                </button>

                <button
                    className="AdminActionButton"
                    onClick={() => awardBadges(user.uid)}
                >
                    Award Badges
                </button>
            </div>

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