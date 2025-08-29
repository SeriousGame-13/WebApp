/**
 * @fileoverview Test suite for FirebaseAuthenticationManager
 * 
 * This test suite provides comprehensive testing for the Firebase Authentication Manager,
 * including user creation, authentication, profile management, and state monitoring.
 * All Firebase dependencies are mocked to enable isolated unit testing.
 * 
 * @author Igor, Alexander, Hyunu, Robert
 * @version 1.0.0
 */

// Define mock user object for testing
const mockUser = {
    uid: 'test-uid-123',
    email: 'test@example.com',
    displayName: 'Test User'
};

// Mock Firebase configuration
vi.mock('../services/firebase/FirebaseAppConfiguration', () => ({
    firebaseApp: {}
}));

// Mock Firebase Auth module with all required functions
vi.mock('firebase/auth', () => {
    // Create auth object with mock currentUser
    const auth = {
        currentUser: null
    };
    
    return {
        getAuth: vi.fn(() => auth),
        createUserWithEmailAndPassword: vi.fn(),
        signInWithEmailAndPassword: vi.fn(),
        signOut: vi.fn(),
        updateProfile: vi.fn(),
        updateEmail: vi.fn(),
        onAuthStateChanged: vi.fn(),
        // Make auth object accessible to tests
        __auth: auth
    };
});

import FirebaseAuthenticationManager from '../services/firebase/FirebaseAuthenticationManager';

describe('FirebaseAuthenticationManager', () => {
    // Standard credential response for Firebase auth operations
    const mockUserCredential = {
        user: mockUser,
        credential: null,
        operationType: 'signIn'
    };

    // Reference to mock auth object for manipulating auth state
    let mockAuth;

    beforeEach(async () => {
        // Reset all mocks before each test
        vi.clearAllMocks();
        
        // Get reference to mock auth object
        const { __auth } = await import('firebase/auth');
        mockAuth = __auth;
        
        // Set default auth state (not logged in)
        mockAuth.currentUser = null;
        
        // Mock console.error to suppress error logs in tests
        console.error = vi.fn();
    });

    afterEach(() => {
        vi.resetAllMocks();
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
            // Set the mock current user
            mockAuth.currentUser = mockUser;

            const result = FirebaseAuthenticationManager.getCurrentUser();

            expect(result).toEqual(mockUser);
        });

        test('should return null when no user is authenticated', () => {
            // Set mock current user to null
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
            
            // Simulate auth state change by calling the callback directly
            vi.mocked(onAuthStateChanged).mockImplementation((auth, callback) => {
                callback(mockUser);
                return vi.fn(); // Return mock unsubscribe function
            });

            FirebaseAuthenticationManager.subscribeToAuthChanges(mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(mockUser);
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

            // Set up mocks for the sequence of calls
            vi.mocked(createUserWithEmailAndPassword).mockResolvedValue(mockUserCredential);
            vi.mocked(updateProfile).mockResolvedValue(undefined);
            vi.mocked(signOut).mockResolvedValue(undefined);
            vi.mocked(signInWithEmailAndPassword).mockResolvedValue(mockUserCredential);

            // Test user creation
            const createResult = await FirebaseAuthenticationManager.createUser('test@example.com', 'password');
            expect(createResult.user).toEqual(mockUser);

            // Test profile update
            await FirebaseAuthenticationManager.updateUserProfile(mockUser, { displayName: 'Updated Name' });
            expect(updateProfile).toHaveBeenCalled();

            // Test sign out
            await FirebaseAuthenticationManager.signOutUser();
            expect(signOut).toHaveBeenCalled();

            // Test sign in
            const signInResult = await FirebaseAuthenticationManager.signInUser('test@example.com', 'password');
            expect(signInResult.user).toEqual(mockUser);
        });
    });
});
