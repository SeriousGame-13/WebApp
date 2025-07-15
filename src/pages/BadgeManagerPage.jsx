import { useState, useEffect } from 'react';
import BadgeManagement from '../services/firebase/BadgeManagement';
import { BADGE_RARITY } from '../services/interfaces/constants';
import BadgeImageElements from '../utils/BadgeImageUploader';
import '../components/styles/LayoutElements.css';
import { Badge } from '../services/interfaces/badge';
import RewardSystem from '../services/firebase/RewardSystem';

function CreateBadgePopup({ onCreateBadge, onCancel, isCreating }) {
    let dummyBadge = new Badge();
    const [badgeName, setBadgeName] = useState('');
    const [badgeDescription, setBadgeDescription] = useState('');
    const [rarity, setRarity] = useState(BADGE_RARITY.COMMON);
    const [rewardPoints, setRewardPoints] = useState(0);
    const [badgeImageData, setBadgeImageData] = useState(null);
    const [badgeStructure, setBadgeStructure] = useState(dummyBadge.structure);
    const [badgeQuery, setBadgeQuery] = useState(dummyBadge.query);
    const [badgeMapping, setBadgeMapping] = useState(dummyBadge.mapping);
    const [badgeConditions, setBadgeConditions] = useState(dummyBadge.conditions);

    const handleImageUpload = (imageResult) => {
        setBadgeImageData(imageResult.base64Data);
    };

    const handleConfirm = async () => {
        if (badgeName.trim() && rewardPoints >= 0) {
            const badgeData = {
                name: badgeName.trim(),
                description: badgeDescription.trim(),
                rarity: rarity,
                rewardPoints: parseInt(rewardPoints),
                imageData: badgeImageData
            };

            onCreateBadge(badgeData);
        }
    };

    if (isCreating) {
        return (
            <div className='PopupBackground'>
                <div className='PopupContainer'>
                    <h2>Creating Badge...</h2>
                </div>
            </div>
        );
    }

    return (
        <div className='PopupBackground'>
            <div className='LargePopupContainer'>
                <h2 style={{ margin: '20px 0', textAlign: 'center' }}>Create New Badge</h2>

                <div className='BadgeCreateContent'>
                    <div className='BadgeInputSection'>
                        <div className='BadgeInputGroup'>
                            <label className='BadgeInputLabel'>Badge Name</label>
                            <input
                                className='Input'
                                type="text"
                                value={badgeName}
                                onChange={(e) => setBadgeName(e.target.value)}
                                placeholder="Enter badge name"
                                maxLength={50}
                            />
                        </div>

                        <div className='BadgeInputGroup'>
                            <label className='BadgeInputLabel'>Description</label>
                            <input
                                className='Input'
                                type="text"
                                value={badgeDescription}
                                onChange={(e) => setBadgeDescription(e.target.value)}
                                placeholder="Enter badge description"
                                maxLength={200}
                            />
                        </div>

                        <div className='BadgeInputGroup'>
                            <label className='BadgeInputLabel'>Reward Points</label>
                            <input
                                className='Input'
                                type="number"
                                value={rewardPoints}
                                onChange={(e) => setRewardPoints(e.target.value)}
                                placeholder="Points awarded when earned"
                                min="0"
                            />
                        </div>

                        <div className='BadgeInputGroup'>
                            <label className='BadgeInputLabel'>Firebase Structure</label>
                            <textarea
                                className='Input'
                                type="text"
                                value={badgeStructure}
                                onChange={(e) => setBadgeStructure(e.target.value)}
                                placeholder="Enter Firebase Structure"
                                rows={4}
                                style={{ resize: 'vertical' }}
                            />
                        </div>

                        <div className='BadgeInputGroup'>
                            <label className='BadgeInputLabel'>Firebase Mapping</label>
                            <textarea
                                className='Input'
                                type="text"
                                value={badgeMapping}
                                onChange={(e) => setBadgeMapping(e.target.value)}
                                placeholder="Enter Firebase Mapping"
                                rows={4}
                                style={{ resize: 'vertical' }}
                            />
                        </div>

                        <div className='BadgeInputGroup'>
                            <label className='BadgeInputLabel'>Query</label>
                            <textarea
                                className='Input'
                                type="text"
                                value={badgeQuery}
                                onChange={(e) => setBadgeQuery(e.target.value)}
                                placeholder="Enter Query"
                                rows={4}
                                style={{ resize: 'vertical' }}
                            />
                        </div>

                        <div className='BadgeInputGroup'>
                            <label className='BadgeInputLabel'>Conditions</label>
                            <textarea
                                className='Input'
                                type="text"
                                value={badgeConditions}
                                onChange={(e) => setBadgeConditions(e.target.value)}
                                placeholder="Enter Query"
                                rows={4}
                                style={{ resize: 'vertical' }}
                            />
                        </div>

                        <div className='BadgeInputGroup'>
                            <label className='BadgeInputLabel'>Rarity Level</label>
                            <select
                                className='Input'
                                value={rarity}
                                onChange={(e) => setRarity(e.target.value)}
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
                            badgeId={null}
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
                            onClick={handleConfirm}
                            disabled={!badgeName.trim() || rewardPoints < 0}
                        >
                            Create Badge
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function EditBadgePopup({ badge, onUpdateBadge, onCancel, isUpdating }) {
    const [badgeName, setBadgeName] = useState(badge.name);
    const [badgeDescription, setBadgeDescription] = useState(badge.description || '');
    const [rarity, setRarity] = useState(badge.rarity);
    const [rewardPoints, setRewardPoints] = useState(badge.rewardPoints);
    const [badgeImageData, setBadgeImageData] = useState(null);

    const handleImageUpload = (imageResult) => {
        setBadgeImageData(imageResult.base64Data);
    };

    const handleConfirm = () => {
        if (badgeName.trim() && rewardPoints >= 0) {
            onUpdateBadge({
                name: badgeName.trim(),
                description: badgeDescription.trim(),
                rarity: rarity,
                rewardPoints: parseInt(rewardPoints),
                imageData: badgeImageData
            });
        }
    };

    if (isUpdating) {
        return (
            <div className='PopupBackground'>
                <div className='PopupContainer'>
                    <h2>Updating Badge...</h2>
                </div>
            </div>
        );
    }

    return (
        <div className='PopupBackground'>
            <div className='LargePopupContainer'>
                <h2 style={{ margin: '20px 0', textAlign: 'center' }}>Edit Badge</h2>

                <div className='BadgeCreateContent'>
                    <div className='BadgeInputSection'>
                        <div className='BadgeInputGroup'>
                            <label className='BadgeInputLabel'>Badge Name</label>
                            <input
                                className='Input'
                                type="text"
                                value={badgeName}
                                onChange={(e) => setBadgeName(e.target.value)}
                                placeholder="Enter badge name"
                                maxLength={50}
                            />
                        </div>

                        <div className='BadgeInputGroup'>
                            <label className='BadgeInputLabel'>Description</label>
                            <input
                                className='Input'
                                type="text"
                                value={badgeDescription}
                                onChange={(e) => setBadgeDescription(e.target.value)}
                                placeholder="Enter badge description"
                                maxLength={200}
                            />
                        </div>

                        <div className='BadgeInputGroup'>
                            <label className='BadgeInputLabel'>Reward Points</label>
                            <input
                                className='Input'
                                type="number"
                                value={rewardPoints}
                                onChange={(e) => setRewardPoints(e.target.value)}
                                placeholder="Points awarded when earned"
                                min="0"
                            />
                        </div>

                        <div className='BadgeInputGroup'>
                            <label className='BadgeInputLabel'>Rarity Level</label>
                            <select
                                className='Input'
                                value={rarity}
                                onChange={(e) => setRarity(e.target.value)}
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
                            badgeId={badge.badgeId}
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
                            onClick={handleConfirm}
                            disabled={!badgeName.trim() || rewardPoints < 0}
                        >
                            Update Badge
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
                rewardPoints: badgeData.rewardPoints
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

    const formatDate = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className='PopupBackground'>
            <div className='LargePopupContainer'>
                <h2 style={{ textAlign: 'center' }}>Badge Management</h2>

                <div className='GroupDetailContainer'>
                    <div className='BadgeDetailHeader'>
                        <div className='BadgeImageContainer'>
                            {imageLoading ? (
                                <div className='ProfileImageAlt'>
                                    <div>Loading...</div>
                                </div>
                            ) : badgeImage ? (
                                <img className='BadgeDetailImage'
                                    src={badgeImage}
                                    alt="Badge Image"
                                />
                            ) : (
                                <div className='ProfileImageAlt'>
                                    <div>No Image</div>
                                </div>
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
                    <button className='CancelButton' onClick={onClose}>
                        Close
                    </button>
                </div>

                {showEditPopup && (
                    <EditBadgePopup
                        badge={badge}
                        onUpdateBadge={handleUpdateBadge}
                        onCancel={() => setShowEditPopup(false)}
                        isUpdating={isUpdatingBadge}
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

    const awardBadgesF = async (userId) => {
        RewardSystem.awardBadges(userId);
    }

    return (
        <div className="AppContents">
            <h2 style={{ color: '#E5E5E5', margin: '0 0 20px 0' }}>Badge Manager</h2>

            <div className="AdminGroupContainer">
                <div className="GuideText">All Badges</div>

                {isLoadingBadges ? (
                    <div style={{ color: '#A0A0A0', textAlign: 'center', padding: '20px' }}>
                        Loading...
                    </div>
                ) : allBadges.length === 0 ? (
                    <div style={{ color: '#A0A0A0', textAlign: 'center', padding: '20px' }}>
                        No Badges Found
                    </div>
                ) : (
                    allBadges.map(badge => (
                        <div
                            key={badge.badgeId || `badge-${Math.random()}`}
                            className="GroupExerciseContainer"
                            onClick={() => setSelectedBadge(badge)}
                        >
                            <div className="GroupExerciseHeader" style={{ color: 'var(--main-color)' }}>
                                {badge.name} <span style={{ fontSize: '12px', color: badge.getRarityColor() }}>({badge.rarity})</span>
                            </div>
                            <div className="GroupExerciseContents">
                                {badge.description || 'No description available.'}
                            </div>
                            <div style={{ margin: '0 16px 16px 16px', fontSize: '12px', color: '#A0A0A0' }}>
                                Badge ID: {badge.badgeId} | Reward Points: {badge.rewardPoints}
                            </div>
                        </div>
                    ))
                )}

                <button
                    className="AdminActionButton"
                    onClick={() => setShowCreateBadgePopup(true)}
                >
                    Create New Badge
                </button>

                <button
                    className="AdminActionButton"
                    onClick={() => awardBadgesF(user.uid)}
                >
                    Award Badges
                </button>
            </div>

            {showCreateBadgePopup && (
                <CreateBadgePopup
                    onCreateBadge={handleBadgeCreation}
                    onCancel={() => setShowCreateBadgePopup(false)}
                    isCreating={isCreatingBadge}
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