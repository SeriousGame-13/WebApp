/**
 * @fileoverview Test suite for FirebaseAuthenticationManager
 * 
 * This test suite provides comprehensive testing for the Firebase Authentication Manager,
 * including user creation, authentication, profile management, and state monitoring.
 * All Firebase dependencies are mocked to enable isolated unit testing.
 * 
 * @author Fitness App Team
 * @version 1.0.0
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Firebase configuration
vi.mock('../services/firebase/FirebaseAppConfiguration', () => ({
    firebaseApp: {}
}));

// Mock Firebase Auth module
vi.mock('firebase/auth', () => ({
    getAuth: vi.fn(() => ({
        currentUser: null
    })),
    createUserWithEmailAndPassword: vi.fn(),
    signInWithEmailAndPassword: vi.fn(),
    signOut: vi.fn(),
    updateProfile: vi.fn(),
    updateEmail: vi.fn(),
    onAuthStateChanged: vi.fn()
}));

import FirebaseAuthenticationManager from '../services/firebase/FirebaseAuthenticationManager';

describe('FirebaseAuthenticationManager', () => {
    // Get mocked functions for use in tests
    const mockAuth = {
        currentUser: null
    };

    const mockUser = {
        uid: 'test-uid-123',
        email: 'test@example.com',
        displayName: 'Test User'
    };

    const mockUserCredential = {
        user: mockUser,
        credential: null,
        operationType: 'signIn'
    };

    beforeEach(() => {
        vi.clearAllMocks();
        console.error = vi.fn(); // Mock console.error to suppress error logs in tests
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('createUser', () => {
        test('should successfully create a new user account', async () => {
            const { createUserWithEmailAndPassword } = await import('firebase/auth');
            vi.mocked(createUserWithEmailAndPassword).mockResolvedValue(mockUserCredential);

            const result = await FirebaseAuthenticationManager.createUser('test@example.com', 'password123');

            expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
                expect.any(Object),
                'test@example.com',
                'password123'
            );
            expect(result).toEqual(mockUserCredential);
        });

        test('should handle account creation errors', async () => {
            const { createUserWithEmailAndPassword } = await import('firebase/auth');
            const error = new Error('Email already exists');
            vi.mocked(createUserWithEmailAndPassword).mockRejectedValue(error);

            await expect(
                FirebaseAuthenticationManager.createUser('existing@example.com', 'password123')
            ).rejects.toThrow('Email already exists');

            expect(console.error).toHaveBeenCalledWith('Failed to create user account:', error);
        });

        test('should validate email and password parameters', async () => {
            const { createUserWithEmailAndPassword } = await import('firebase/auth');
            vi.mocked(createUserWithEmailAndPassword).mockResolvedValue(mockUserCredential);

            await FirebaseAuthenticationManager.createUser('valid@email.com', 'strongPassword');

            expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
                expect.any(Object),
                'valid@email.com',
                'strongPassword'
            );
        });
    });

    describe('signInUser', () => {
        test('should successfully authenticate user with valid credentials', async () => {
            const { signInWithEmailAndPassword } = await import('firebase/auth');
            vi.mocked(signInWithEmailAndPassword).mockResolvedValue(mockUserCredential);

            const result = await FirebaseAuthenticationManager.signInUser('test@example.com', 'password123');

            expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
                expect.any(Object),
                'test@example.com',
                'password123'
            );
            expect(result).toEqual(mockUserCredential);
        });

        test('should handle authentication errors', async () => {
            const { signInWithEmailAndPassword } = await import('firebase/auth');
            const error = new Error('Invalid credentials');
            vi.mocked(signInWithEmailAndPassword).mockRejectedValue(error);

            await expect(
                FirebaseAuthenticationManager.signInUser('wrong@example.com', 'wrongpassword')
            ).rejects.toThrow('Invalid credentials');

            expect(console.error).toHaveBeenCalledWith('Failed to sign in user:', error);
        });
    });

    describe('signOutUser', () => {
        test('should successfully sign out current user', async () => {
            const { signOut } = await import('firebase/auth');
            vi.mocked(signOut).mockResolvedValue(undefined);

            await FirebaseAuthenticationManager.signOutUser();

            expect(signOut).toHaveBeenCalledWith(expect.any(Object));
        });

        test('should handle sign-out errors', async () => {
            const { signOut } = await import('firebase/auth');
            const error = new Error('Sign-out failed');
            vi.mocked(signOut).mockRejectedValue(error);

            await expect(
                FirebaseAuthenticationManager.signOutUser()
            ).rejects.toThrow('Sign-out failed');

            expect(console.error).toHaveBeenCalledWith('Failed to sign out user:', error);
        });
    });

    describe('updateUserProfile', () => {
        test('should successfully update user profile', async () => {
            const { updateProfile } = await import('firebase/auth');
            const profileData = { displayName: 'New Name', photoURL: 'https://example.com/photo.jpg' };
            vi.mocked(updateProfile).mockResolvedValue(undefined);

            await FirebaseAuthenticationManager.updateUserProfile(mockUser, profileData);

            expect(updateProfile).toHaveBeenCalledWith(mockUser, profileData);
        });

        test('should handle profile update errors', async () => {
            const { updateProfile } = await import('firebase/auth');
            const error = new Error('Profile update failed');
            const profileData = { displayName: 'New Name' };
            vi.mocked(updateProfile).mockRejectedValue(error);

            await expect(
                FirebaseAuthenticationManager.updateUserProfile(mockUser, profileData)
            ).rejects.toThrow('Profile update failed');

            expect(console.error).toHaveBeenCalledWith('Failed to update user profile:', error);
        });

        test('should update only provided profile fields', async () => {
            const { updateProfile } = await import('firebase/auth');
            const profileData = { displayName: 'Only Name' };
            vi.mocked(updateProfile).mockResolvedValue(undefined);

            await FirebaseAuthenticationManager.updateUserProfile(mockUser, profileData);

            expect(updateProfile).toHaveBeenCalledWith(mockUser, profileData);
        });
    });

    describe('changeUserEmail', () => {
        test('should successfully update user email', async () => {
            const { updateEmail } = await import('firebase/auth');
            const newEmail = 'newemail@example.com';
            vi.mocked(updateEmail).mockResolvedValue(undefined);

            await FirebaseAuthenticationManager.changeUserEmail(mockUser, newEmail);

            expect(updateEmail).toHaveBeenCalledWith(mockUser, newEmail);
        });

        test('should handle email update errors', async () => {
            const { updateEmail } = await import('firebase/auth');
            const error = new Error('Email update failed');
            const newEmail = 'invalid@email';
            vi.mocked(updateEmail).mockRejectedValue(error);

            await expect(
                FirebaseAuthenticationManager.changeUserEmail(mockUser, newEmail)
            ).rejects.toThrow('Email update failed');

            expect(console.error).toHaveBeenCalledWith('Failed to change user email:', error);
        });
    });

    describe('getCurrentUser', () => {
        test('should return current user when authenticated', () => {
            mockAuth.currentUser = mockUser;

            const result = FirebaseAuthenticationManager.getCurrentUser();

            expect(result).toEqual(mockUser);
        });

        test('should return null when no user is authenticated', () => {
            mockAuth.currentUser = null;

            const result = FirebaseAuthenticationManager.getCurrentUser();

            expect(result).toBeNull();
        });
    });

    describe('subscribeToAuthChanges', () => {
        test('should set up authentication state listener', async () => {
            const { onAuthStateChanged } = await import('firebase/auth');
            const mockCallback = vi.fn();
            const mockUnsubscribe = vi.fn();
            vi.mocked(onAuthStateChanged).mockReturnValue(mockUnsubscribe);

            const unsubscribe = FirebaseAuthenticationManager.subscribeToAuthChanges(mockCallback);

            expect(onAuthStateChanged).toHaveBeenCalledWith(expect.any(Object), mockCallback);
            expect(unsubscribe).toBe(mockUnsubscribe);
        });

        test('should call callback when authentication state changes', async () => {
            const { onAuthStateChanged } = await import('firebase/auth');
            const mockCallback = vi.fn();
            vi.mocked(onAuthStateChanged).mockImplementation((auth, callback) => {
                // Simulate auth state change
                callback(mockUser);
                return vi.fn(); // Return mock unsubscribe function
            });

            FirebaseAuthenticationManager.subscribeToAuthChanges(mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(mockUser);
        });

        test('should return unsubscribe function', async () => {
            const { onAuthStateChanged } = await import('firebase/auth');
            const mockCallback = vi.fn();
            const mockUnsubscribe = vi.fn();
            vi.mocked(onAuthStateChanged).mockReturnValue(mockUnsubscribe);

            const unsubscribe = FirebaseAuthenticationManager.subscribeToAuthChanges(mockCallback);

            expect(typeof unsubscribe).toBe('function');
            expect(unsubscribe).toBe(mockUnsubscribe);
        });
    });

    describe('Error Handling', () => {
        test('should properly log and re-throw errors', async () => {
            const { createUserWithEmailAndPassword } = await import('firebase/auth');
            const error = new Error('Network error');
            vi.mocked(createUserWithEmailAndPassword).mockRejectedValue(error);

            await expect(
                FirebaseAuthenticationManager.createUser('test@example.com', 'password')
            ).rejects.toThrow('Network error');

            expect(console.error).toHaveBeenCalledWith('Failed to create user account:', error);
        });

        test('should handle Firebase-specific error codes', async () => {
            const { createUserWithEmailAndPassword } = await import('firebase/auth');
            const firebaseError = {
                code: 'auth/email-already-in-use',
                message: 'The email address is already in use by another account.'
            };
            vi.mocked(createUserWithEmailAndPassword).mockRejectedValue(firebaseError);

            await expect(
                FirebaseAuthenticationManager.createUser('existing@example.com', 'password')
            ).rejects.toEqual(firebaseError);
        });
    });

    describe('Integration Tests', () => {
        test('should handle complete authentication flow', async () => {
            const { 
                createUserWithEmailAndPassword, 
                updateProfile, 
                signOut, 
                signInWithEmailAndPassword 
            } = await import('firebase/auth');

            // Test user creation
            vi.mocked(createUserWithEmailAndPassword).mockResolvedValue(mockUserCredential);
            const createResult = await FirebaseAuthenticationManager.createUser('test@example.com', 'password');
            expect(createResult.user).toEqual(mockUser);

            // Test profile update
            vi.mocked(updateProfile).mockResolvedValue(undefined);
            await FirebaseAuthenticationManager.updateUserProfile(mockUser, { displayName: 'Updated Name' });

            // Test sign out
            vi.mocked(signOut).mockResolvedValue(undefined);
            await FirebaseAuthenticationManager.signOutUser();

            // Test sign in
            vi.mocked(signInWithEmailAndPassword).mockResolvedValue(mockUserCredential);
            const signInResult = await FirebaseAuthenticationManager.signInUser('test@example.com', 'password');
            expect(signInResult.user).toEqual(mockUser);
        });
    });
});
