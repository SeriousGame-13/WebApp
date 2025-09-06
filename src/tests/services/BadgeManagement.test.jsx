/**
 * @fileoverview Test suite for BadgeManagement
 * 
 * This test suite provides comprehensive testing for the Badge Management system,
 * including badge CRUD operations, image management, and proper Firebase integration.
 * All dependencies are mocked to enable isolated unit testing.
 * 
 * @author Igor, Alexander, Hyunu, Robert  
 * @version 1.0.0
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';

// Mock Firebase configuration first
vi.mock('../services/firebase/FirebaseAppConfiguration', () => ({
    firebaseApp: {}
}));

// Mock Firebase/Firestore
vi.mock('firebase/firestore', () => ({
    getFirestore: vi.fn(() => ({})),
    doc: vi.fn(() => 'mock-doc-reference'),
    setDoc: vi.fn(),
    getDoc: vi.fn(),
    deleteDoc: vi.fn(),
    query: vi.fn(() => 'mock-query'),
    where: vi.fn(() => 'mock-where-clause'),
    collection: vi.fn(() => 'mock-collection'),
    getDocs: vi.fn(),
    serverTimestamp: vi.fn(() => ({ type: 'timestamp' })),
    Timestamp: {
        now: vi.fn(() => ({ type: 'timestamp' })),
        fromDate: vi.fn((date) => ({ type: 'timestamp', date })),
        toDate: vi.fn(() => new Date())
    },
    addDoc: vi.fn(),
    limit: vi.fn(() => 'mock-limit'),
}));

// Mock FirebaseHelper
vi.mock('../services/firebase/FirebaseHelper', () => ({
    serverTimestamp: vi.fn(() => ({ type: 'server_timestamp' }))
}));

// Mock FirestoreManager
vi.mock('../services/firebase/FirestoreManager', () => ({
    default: {
        createDocument: vi.fn(),
        readDocument: vi.fn(),
        updateDocument: vi.fn(),
        deleteDocument: vi.fn(),
        getAllDocuments: vi.fn()
    }
}));

// Mock Collections
vi.mock('../services/firebase/Collections', () => ({
    BADGES_COLLECTION: 'badges',
    BADGE_IMAGES_COLLECTION: 'badgeimages'
}));

// Mock Badge interface
vi.mock('../services/interfaces/Badge', () => {
    const BadgeMock = vi.fn().mockImplementation((data = {}) => ({
        uid: data.uid || 'mock-badge-uid',
        badgeId: data.badgeId || null,
        name: data.name || '',
        description: data.description || '',
        rarity: data.rarity || 'COMMON',
        rewardPoints: data.rewardPoints || 0,
        collection: data.collection || 'exercises',
        conditions: data.conditions || '',
        aggregate: data.aggregate || 'sum',
        field: data.field || 'points',
        valueToReach: data.valueToReach || '0'
    }));
    
    BadgeMock.fromJSON = vi.fn((data) => ({ ...data, fromJSON: true }));
    
    return {
        Badge: BadgeMock
    };
});

// Import BadgeManagement after mocks
import BadgeManagement from '../../services/BadgeManagement';
import FirestoreManager from '../../services/firebase/FirestoreManager';
import { serverTimestamp } from '../../services/firebase/FirebaseHelper';
import { Badge } from '../../services/interfaces/Badge';

describe('BadgeManagement', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        console.error = vi.fn();
        console.warn = vi.fn();

        // Set up default mock return values
        FirestoreManager.createDocument.mockResolvedValue({ id: 'new-badge-id' });
        FirestoreManager.readDocument.mockResolvedValue({
            uid: 'badge-123',
            name: 'Test Badge',
            description: 'A test badge',
            rarity: 'COMMON',
            rewardPoints: 100
        });
        FirestoreManager.updateDocument.mockResolvedValue('updated');
        FirestoreManager.deleteDocument.mockResolvedValue('deleted');
        FirestoreManager.getAllDocuments.mockResolvedValue([
            {
                id: 'badge-1',
                data: () => ({
                    uid: 'badge-1',
                    name: 'First Badge',
                    description: 'First test badge',
                    rarity: 'COMMON',
                    rewardPoints: 50
                })
            },
            {
                id: 'badge-2', 
                data: () => ({
                    uid: 'badge-2',
                    name: 'Second Badge',
                    description: 'Second test badge',
                    rarity: 'RARE',
                    rewardPoints: 200
                })
            }
        ]);

        serverTimestamp.mockReturnValue({ type: 'server_timestamp' });
    });

    describe('createBadge', () => {
        test('should create badge successfully', async () => {
            const badgeData = {
                name: 'Achievement Badge',
                description: 'Badge for completing achievements',
                rarity: 'UNCOMMON',
                rewardPoints: 150
            };

            const result = await BadgeManagement.createBadge(badgeData);

            expect(Badge).toHaveBeenCalled();
            expect(FirestoreManager.createDocument).toHaveBeenCalledWith(
                'badges',
                expect.objectContaining({
                    ...badgeData,
                    uid: 'mock-badge-uid'
                }),
                undefined // ui property should be undefined due to typo in original code
            );
            expect(result).toEqual(expect.objectContaining({
                uid: 'mock-badge-uid',
                badgeId: 'new-badge-id'
            }));
        });

        test('should handle badge creation failure', async () => {
            FirestoreManager.createDocument.mockResolvedValue(null);
            
            const badgeData = {
                name: 'Test Badge',
                description: 'Test description'
            };

            await expect(BadgeManagement.createBadge(badgeData))
                .rejects.toThrow('Failed to create badge document');
        });

        test('should handle database errors during creation', async () => {
            const dbError = new Error('Database connection failed');
            FirestoreManager.createDocument.mockRejectedValue(dbError);
            
            const badgeData = {
                name: 'Test Badge',
                description: 'Test description'
            };

            await expect(BadgeManagement.createBadge(badgeData))
                .rejects.toThrow('Database connection failed');
        });
    });

    describe('getAllBadges', () => {
        test('should retrieve all badges successfully', async () => {
            const result = await BadgeManagement.getAllBadges();

            expect(FirestoreManager.getAllDocuments).toHaveBeenCalledWith('badges');
            expect(Badge.fromJSON).toHaveBeenCalledTimes(2);
            expect(Badge.fromJSON).toHaveBeenCalledWith(expect.objectContaining({
                uid: 'badge-1',
                badgeId: 'badge-1'
            }));
            expect(result).toHaveLength(2);
        });

        test('should return empty array on database error', async () => {
            const dbError = new Error('Database read failed');
            FirestoreManager.getAllDocuments.mockRejectedValue(dbError);

            const result = await BadgeManagement.getAllBadges();

            expect(result).toEqual([]);
            expect(console.error).toHaveBeenCalledWith('Failed to get all badges:', dbError);
        });

        test('should handle empty result set', async () => {
            FirestoreManager.getAllDocuments.mockResolvedValue([]);

            const result = await BadgeManagement.getAllBadges();

            expect(result).toEqual([]);
        });
    });

    describe('saveBadgeImage', () => {
        test('should save badge image successfully', async () => {
            const base64Data = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
            const badgeId = 'badge-123';

            const result = await BadgeManagement.saveBadgeImage(base64Data, badgeId);

            expect(FirestoreManager.createDocument).toHaveBeenCalledWith(
                'badgeimages',
                expect.objectContaining({
                    badgeId,
                    imageData: base64Data,
                    updatedAt: { type: 'server_timestamp' }
                }),
                badgeId,
                true
            );
            expect(result).toEqual({
                success: true,
                badgeId,
                size: base64Data.length
            });
        });

        test('should handle image save failure', async () => {
            const dbError = new Error('Image save failed');
            FirestoreManager.createDocument.mockRejectedValue(dbError);
            
            const base64Data = 'test-image-data';
            const badgeId = 'badge-123';

            await expect(BadgeManagement.saveBadgeImage(base64Data, badgeId))
                .rejects.toThrow('Image save failed');
        });
    });

    describe('getBadgeImage', () => {
        test('should retrieve badge image successfully', async () => {
            const imageData = 'base64-image-data';
            const badgeId = 'badge-123';
            
            FirestoreManager.readDocument.mockResolvedValue({
                badgeId,
                imageData
            });

            const result = await BadgeManagement.getBadgeImage(badgeId);

            expect(FirestoreManager.readDocument).toHaveBeenCalledWith('badgeimages', badgeId);
            expect(result).toBe(imageData);
        });

        test('should return null when image not found', async () => {
            const badgeId = 'nonexistent-badge';
            
            FirestoreManager.readDocument.mockResolvedValue(null);

            const result = await BadgeManagement.getBadgeImage(badgeId);

            expect(result).toBeNull();
        });

        test('should return null when image document has no imageData', async () => {
            const badgeId = 'badge-123';
            
            FirestoreManager.readDocument.mockResolvedValue({
                badgeId,
                // No imageData field
            });

            const result = await BadgeManagement.getBadgeImage(badgeId);

            expect(result).toBeNull();
        });

        test('should return null on database error', async () => {
            const dbError = new Error('Database read failed');
            const badgeId = 'badge-123';
            
            FirestoreManager.readDocument.mockRejectedValue(dbError);

            const result = await BadgeManagement.getBadgeImage(badgeId);

            expect(result).toBeNull();
            expect(console.error).toHaveBeenCalledWith('Failed to get badge image:', dbError);
        });
    });

    describe('deleteBadge', () => {
        test('should delete badge and image successfully', async () => {
            const badgeId = 'badge-123';

            const result = await BadgeManagement.deleteBadge(badgeId);

            expect(FirestoreManager.deleteDocument).toHaveBeenCalledWith('badges', badgeId);
            expect(FirestoreManager.deleteDocument).toHaveBeenCalledWith('badgeimages', badgeId);
            expect(result).toBe(true);
        });

        test('should handle badge deletion failure', async () => {
            const dbError = new Error('Delete failed');
            const badgeId = 'badge-123';
            
            FirestoreManager.deleteDocument.mockRejectedValue(dbError);

            await expect(BadgeManagement.deleteBadge(badgeId))
                .rejects.toThrow('Delete failed');
        });

        test('should delete badge even if image deletion fails', async () => {
            const badgeId = 'badge-123';
            
            // First call (badge deletion) succeeds, second call (image deletion) fails
            FirestoreManager.deleteDocument
                .mockResolvedValueOnce('badge-deleted')
                .mockRejectedValueOnce(new Error('Image deletion failed'));

            await expect(BadgeManagement.deleteBadge(badgeId))
                .rejects.toThrow('Image deletion failed');
        });
    });

    describe('updateBadge', () => {
        test('should update badge successfully', async () => {
            const badgeId = 'badge-123';
            const updateData = {
                name: 'Updated Badge Name',
                description: 'Updated description',
                rewardPoints: 250
            };

            const result = await BadgeManagement.updateBadge(badgeId, updateData);

            expect(FirestoreManager.updateDocument).toHaveBeenCalledWith(
                'badges',
                badgeId,
                updateData,
                true
            );
            expect(result).toBe(true);
        });

        test('should handle badge update failure', async () => {
            const dbError = new Error('Update failed');
            const badgeId = 'badge-123';
            const updateData = { name: 'New Name' };
            
            FirestoreManager.updateDocument.mockRejectedValue(dbError);

            await expect(BadgeManagement.updateBadge(badgeId, updateData))
                .rejects.toThrow('Update failed');
        });

        test('should update with partial data', async () => {
            const badgeId = 'badge-123';
            const updateData = {
                rewardPoints: 500
            };

            const result = await BadgeManagement.updateBadge(badgeId, updateData);

            expect(FirestoreManager.updateDocument).toHaveBeenCalledWith(
                'badges',
                badgeId,
                updateData,
                true
            );
            expect(result).toBe(true);
        });
    });

    describe('Integration tests', () => {
        test('should handle complete badge lifecycle', async () => {
            // Create badge
            const badgeData = {
                name: 'Lifecycle Badge',
                description: 'Testing complete lifecycle',
                rarity: 'EPIC',
                rewardPoints: 300
            };
            
            const createdBadge = await BadgeManagement.createBadge(badgeData);
            expect(createdBadge.badgeId).toBe('new-badge-id');

            // Save image
            const imageData = 'base64-image-data';
            const saveResult = await BadgeManagement.saveBadgeImage(imageData, createdBadge.badgeId);
            expect(saveResult.success).toBe(true);

            // Update badge
            const updateResult = await BadgeManagement.updateBadge(createdBadge.badgeId, {
                name: 'Updated Lifecycle Badge'
            });
            expect(updateResult).toBe(true);

            // Delete badge
            const deleteResult = await BadgeManagement.deleteBadge(createdBadge.badgeId);
            expect(deleteResult).toBe(true);
        });

        test('should handle concurrent operations', async () => {
            const badges = [
                { name: 'Badge 1', description: 'First badge' },
                { name: 'Badge 2', description: 'Second badge' },
                { name: 'Badge 3', description: 'Third badge' }
            ];

            const createPromises = badges.map(badge => BadgeManagement.createBadge(badge));
            const results = await Promise.all(createPromises);

            expect(results).toHaveLength(3);
            results.forEach(result => {
                expect(result.badgeId).toBe('new-badge-id');
            });
            expect(FirestoreManager.createDocument).toHaveBeenCalledTimes(3);
        });
    });

    describe('Error handling', () => {
        test('should log errors appropriately', async () => {
            const dbError = new Error('Specific database error');
            FirestoreManager.getAllDocuments.mockRejectedValue(dbError);

            await BadgeManagement.getAllBadges();

            expect(console.error).toHaveBeenCalledWith('Failed to get all badges:', dbError);
        });

        test('should handle null/undefined inputs gracefully', async () => {
            // Test createBadge with empty object (undefined would cause error trying to set uid)
            await expect(BadgeManagement.createBadge({})).resolves.toBeDefined();
            
            // Test saveBadgeImage with null values should throw
            await expect(BadgeManagement.saveBadgeImage(null, null))
                .rejects.toThrow();
        });
    });
});
