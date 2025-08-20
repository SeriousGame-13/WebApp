/**
 * @fileoverview Badge Management Module
 * 
 * This module provides comprehensive badge management functionality for the fitness application.
 * It handles all CRUD operations for badges including creation, retrieval, updating, and deletion.
 * Additionally, it manages badge image storage and retrieval using Firebase/Firestore.
 * 
 * The module ensures unique badge ID generation and provides proper error handling
 * for all database operations.
 * 
 * @author Igor, Alexander, Hyunu, Robert
 * @version 1.0.0
 */

import FirebaseManager from './FirestoreManager.jsx';
import { Badge } from '../interfaces/badge.jsx';
import { BADGES_COLLECTION, BADGE_IMAGES_COLLECTION } from './collections.jsx'

/**
 * Generates a unique badge ID in the format BD000001, BD000002, etc.
 * Checks existing badges in the database to ensure uniqueness.
 * @returns {Promise<string>} A unique badge ID string
 * @throws {Error} If there's an error accessing the database
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
 * Creates a new badge in the database with the provided badge data.
 * Automatically generates a unique badge ID and stores the badge document.
 * @param {Object} badgeData - The badge data object
 * @param {string} badgeData.name - The name of the badge
 * @param {string} badgeData.description - The description of the badge
 * @param {string} badgeData.rarity - The rarity level of the badge (from BADGE_RARITY constants)
 * @param {number} badgeData.rewardPoints - The reward points value for this badge
 * @returns {Promise<Badge>} The created Badge object with assigned badgeId
 * @throws {Error} If badge creation fails or document creation fails
 */
const createBadge = async (badgeData) => {
    try {
        const badge = new Badge();
        badgeData.uid = badge.uid;
        const docRef = await FirebaseManager.createDocument(BADGES_COLLECTION, badgeData, badge.ui);

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

/**
 * Retrieves all badges from the database.
 * Converts Firestore documents to Badge objects with proper structure.
 * @returns {Promise<Badge[]>} An array of Badge objects, or empty array if retrieval fails
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
 * Saves a badge image as base64 data to the database.
 * Stores the image data associated with a specific badge ID.
 * @param {string} base64Data - The base64 encoded image data
 * @param {string} badgeId - The unique identifier of the badge
 * @returns {Promise<Object>} Success object containing badgeId and data size
 * @returns {Promise<Object>} result.success - Whether the operation was successful
 * @returns {Promise<Object>} result.badgeId - The badge ID the image was saved for
 * @returns {Promise<Object>} result.size - The size of the base64 data
 * @throws {Error} If image saving fails
 */
const saveBadgeImage = async (base64Data, badgeId) => {
    try {
        const imageData = {
            badgeId,
            imageData: base64Data,
            updatedAt: Date.now()
        };

        await FirebaseManager.createDocument(BADGE_IMAGES_COLLECTION, imageData, badgeId, true);

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
 * Retrieves the image data for a specific badge.
 * Returns the base64 encoded image data associated with the badge ID.
 * @param {string} badgeId - The unique identifier of the badge
 * @returns {Promise<string|null>} The base64 image data string, or null if not found or on error
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
 * Deletes a badge and its associated image from the database.
 * Removes both the badge document and the badge image document.
 * @param {string} badgeId - The unique identifier of the badge to delete
 * @returns {Promise<boolean>} True if deletion was successful
 * @throws {Error} If badge deletion fails
 */
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

/**
 * Updates an existing badge with new data.
 * Merges the provided badge data with the existing badge document.
 * @param {string} badgeId - The unique identifier of the badge to update
 * @param {Object} badgeData - The badge data to update
 * @param {string} [badgeData.name] - The updated name of the badge
 * @param {string} [badgeData.description] - The updated description of the badge
 * @param {string} [badgeData.rarity] - The updated rarity level of the badge
 * @param {number} [badgeData.rewardPoints] - The updated reward points value
 * @returns {Promise<boolean>} True if update was successful
 * @throws {Error} If badge update fails
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




/**
 * Badge Management System
 * 
 * Provides comprehensive badge management functionality including:
 * - Creating new badges with unique IDs
 * - Retrieving all badges from the database
 * - Managing badge images (save/retrieve)
 * - Updating existing badge data
 * - Deleting badges and their associated images
 * 
 * All methods handle Firebase/Firestore operations and include proper error handling.
 * 
 * @namespace BadgeManagement
 */
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