import FirebaseManager from './FirestoreManager.jsx';
import { Badge } from '../interfaces/badge.jsx';
import { BADGE_RARITY } from '../interfaces/constants.jsx';

const BADGES_COLLECTION = 'badges';
const BADGE_IMAGES_COLLECTION = 'badgeimages';

/**
 * 고유한 뱃지 ID 생성 (BD000001 형태)
 */
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

/**
 * 뱃지 생성
 */
const createBadge = async (badgeData) => {
    try {
        const badge = new Badge({
            name: badgeData.name,
            description: badgeData.description,
            rarity: badgeData.rarity,
            rewardPoints: badgeData.rewardPoints
        });
        
        // badge 객체에서 badgeId 제거 (Firebase가 자동 생성할 것)
        const { badgeId, ...badgeDataForFirebase } = badge;
        
        // 자동 ID로 문서 생성
        const docRef = await FirebaseManager.createDocumentWithAutoId(BADGES_COLLECTION, badgeDataForFirebase);
        
        if (!docRef || !docRef.id) {
            throw new Error('Failed to create badge document');
        }
        
        // 생성된 ID를 badgeId로 설정
        badge.badgeId = docRef.id;
        
        return badge;
    } catch (error) {
        console.error('Failed to create badge:', error);
        throw error;
    }
};

/**
 * 모든 뱃지 조회
 */
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

/**
 * 뱃지 이미지 저장
 */
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

/**
 * 뱃지 이미지 조회
 */
const getBadgeImage = async (badgeId) => {
    try {
        const imageDoc = await FirebaseManager.readDocument(BADGE_IMAGES_COLLECTION, badgeId);
        return imageDoc?.imageData || null;
    } catch (error) {
        console.error('Failed to get badge image:', error);
        return null;
    }
};

/**
 * 뱃지 삭제
 */
const deleteBadge = async (badgeId) => {
    try {
        // 뱃지 삭제
        await FirebaseManager.deleteDocument(BADGES_COLLECTION, badgeId);
        
        // 뱃지 이미지도 삭제
        await FirebaseManager.deleteDocument(BADGE_IMAGES_COLLECTION, badgeId);
        
        return true;
    } catch (error) {
        console.error('Failed to delete badge:', error);
        throw error;
    }
};

/**
 * 뱃지 업데이트
 */
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