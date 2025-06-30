import FirestoreManager from './FirestoreManager.jsx';
import UserManagement from './UserManagementSystem.jsx';
import { Badge, UserBadge } from '../interfaces/badge.jsx';

const BADGES_COLLECTION = 'badges';
const BADGE_DATABSE = 'badges';

const createPath = (userId) => {
    return `${UserManagement.getUserDatabasePath(userId)}${BADGES_COLLECTION}`;
};

const createBadge = async (badge) => {
    try {
        const badgeInstance = await FirestoreManager.createDocument(BADGE_DATABSE, badge.uid, badge);

        return badgeInstance.uid;
    } catch (error) {
        console.error('Fehler beim Speichern:', error);
        throw error;
    }
}

// const loadBadgeById = async (badgeId) => {
//     try {
//         const data = await FirestoreManager.readDocument(BADGE_DATABSE, badgeId);
//         if (!data) throw new Error('Badge nicht gefunden');
//         return data;
//     } catch (error) {
//         console.error('Fehler beim Laden der Badge:', error);
//         throw error;
//     }
// }

const awardBadge = async (userId, badgeId) => {
    try {

        var userBadge = new UserBadge({ userId: userId, badgeId: badgeId });

        const badgeInstance = await FirestoreManager.createDocument(`${createPath(userId)}`, userBadge.uid, userBadge);

        return badgeInstance.uid;
    } catch (error) {
        console.error('Fehler beim Speichern:', error);
        throw error;
    }
}



const BadgeManager = {
    createBadge,
    awardBadge,
}
export default BadgeManager;