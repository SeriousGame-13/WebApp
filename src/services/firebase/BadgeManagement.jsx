import FirebaseManager from './FirestoreManager.jsx';
import { Badge } from '../interfaces/badge.jsx';
import { BADGE_RARITY } from '../interfaces/constants.jsx';

const BADGES_COLLECTION = 'badges';
const BADGE_IMAGES_COLLECTION = 'badgeimages';

const generateUniqueBadgeId = async () => {
    let badgeId;
    let isUnique = false;
    let counter = 1;
    
    while (!isUnique) {
        const paddedNumber = counter.toString().padStart(6, '0');
        badgeId = `BD${paddedNumber}`;
        
        const existingBadge = await FirebaseManager.readDocument(BADGES_COLLECTION, badgeId);
        if (!existingBadge) {
            isUnique = true;
        } else {
            counter++;
        }
    }
    
    return badgeId;
};

const createBadge = async (badgeData) => {
    try {
        const badge = new Badge({
            name: badgeData.name,
            description: badgeData.description,
            rarity: badgeData.rarity,
            rewardPoints: badgeData.rewardPoints
        });
        
        const { badgeId, ...badgeDataForFirebase } = badge;
        
        const docRef = await FirebaseManager.createDocumentWithAutoId(BADGES_COLLECTION, badgeDataForFirebase);
        
        if (!docRef || !docRef.id) {
            throw new Error('Failed to create badge document');
        }
        
        badge.badgeId = docRef.id;
        
        return badge;
    } catch (error) {
        console.error('Failed to create badge:', error);
        throw error;
    }
};

const getAllBadges = async () => {
    try {
        const snapshot = await FirebaseManager.getAllDocuments(BADGES_COLLECTION);
        const badges = [];
        
        snapshot.forEach(doc => {
            const badgeData = doc.data();
            const badge = Badge.fromJSON({
                ...badgeData,
                badgeId: doc.id
            });
            badges.push(badge);
        });
        
        return badges;
    } catch (error) {
        console.error('Failed to get all badges:', error);
        return [];
    }
};

const saveBadgeImage = async (base64Data, badgeId) => {
    try {
        const imageData = {
            badgeId,
            imageData: base64Data,
            updatedAt: Date.now()
        };
        
        await FirebaseManager.createDocument(BADGE_IMAGES_COLLECTION, badgeId, imageData, true);
        
        return {
            success: true,
            badgeId,
            size: base64Data.length
        };
    } catch (error) {
        console.error('Failed to save badge image:', error);
        throw error;
    }
};

const getBadgeImage = async (badgeId) => {
    try {
        const imageDoc = await FirebaseManager.readDocument(BADGE_IMAGES_COLLECTION, badgeId);
        return imageDoc?.imageData || null;
    } catch (error) {
        console.error('Failed to get badge image:', error);
        return null;
    }
};

const deleteBadge = async (badgeId) => {
    try {
        await FirebaseManager.deleteDocument(BADGES_COLLECTION, badgeId);
        
        await FirebaseManager.deleteDocument(BADGE_IMAGES_COLLECTION, badgeId);
        
        return true;
    } catch (error) {
        console.error('Failed to delete badge:', error);
        throw error;
    }
};

const updateBadge = async (badgeId, badgeData) => {
    try {
        await FirebaseManager.updateDocument(BADGES_COLLECTION, badgeId, badgeData, true);
        return true;
    } catch (error) {
        console.error('Failed to update badge:', error);
        throw error;
    }
};

const BadgeManagement = {
    generateUniqueBadgeId,
    createBadge,
    getAllBadges,
    saveBadgeImage,
    getBadgeImage,
    deleteBadge,
    updateBadge,
};

export default BadgeManagement;