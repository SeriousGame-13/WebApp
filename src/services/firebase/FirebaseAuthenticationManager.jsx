/**
 * @fileoverview Firebase Authentication Manager
 * 
 * This module provides comprehensive Firebase authentication functionality for the fitness application.
 * It handles user account creation, sign-in/sign-out operations, profile management, and authentication
 * state monitoring using Firebase Auth services.
 * 
 * The module encapsulates all Firebase authentication operations and provides a clean API
 * for user management throughout the application.
 * 
 * @author Igor, Alexander, Hyunu, Robert
 * @version 1.0.0
 */

import { 
    signOut,
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    updateProfile,
    updateEmail,
    onAuthStateChanged
} from 'firebase/auth';

import { firebaseApp } from './FirebaseAppConfiguration';

const auth = getAuth(firebaseApp);

/**
 * Creates a new user account with email and password authentication.
 * Registers a new user in the Firebase authentication system.
 * @param {string} email - The user's email address for account creation
 * @param {string} password - The user's password (must meet Firebase security requirements)
 * @returns {Promise<UserCredential>} Firebase user credential object containing user data
 * @throws {Error} If account creation fails due to invalid credentials, existing email, or network issues
 */
const createUser = async (email, password) => {
    try {
        return await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
        console.error('Failed to create user account:', error);
        throw error;
    }
};

/**
 * Updates the profile information for an authenticated user.
 * Allows modification of user display name, profile photo, and other profile data.
 * @param {User} user - The Firebase user object to update
 * @param {Object} profileData - The profile data to update
 * @param {string} [profileData.displayName] - The user's display name
 * @param {string} [profileData.photoURL] - URL to the user's profile photo
 * @returns {Promise<void>} Resolves when profile update is complete
 * @throws {Error} If profile update fails or user is not authenticated
 */
const updateUserProfile = async (user, profileData) => {
    try {
        return await updateProfile(user, profileData);
    } catch (error) {
        console.error('Failed to update user profile:', error);
        throw error;
    }
};

/**
 * Authenticates an existing user with email and password credentials.
 * Signs in a user and establishes an authenticated session.
 * @param {string} email - The user's registered email address
 * @param {string} password - The user's account password
 * @returns {Promise<UserCredential>} Firebase user credential object with authentication data
 * @throws {Error} If authentication fails due to invalid credentials, disabled account, or network issues
 */
const signInUser = async (email, password) => {
    try {
        return await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        console.error('Failed to sign in user:', error);
        throw error;
    }
};

/**
 * Signs out the currently authenticated user.
 * Terminates the user's authenticated session and clears authentication state.
 * @returns {Promise<void>} Resolves when sign-out is complete
 * @throws {Error} If sign-out operation fails
 */
const signOutUser = async () => {
    try {
        return await signOut(auth);
    } catch (error) {
        console.error('Failed to sign out user:', error);
        throw error;
    }
};

/**
 * Updates the email address for an authenticated user.
 * Changes the user's primary email address in their Firebase account.
 * @param {User} user - The Firebase user object whose email to update
 * @param {string} newEmail - The new email address to set for the user
 * @returns {Promise<void>} Resolves when email update is complete
 * @throws {Error} If email update fails due to invalid email, existing email, or authentication issues
 */
const changeUserEmail = async (user, newEmail) => {
    try {
        return await updateEmail(user, newEmail);
    } catch (error) {
        console.error('Failed to change user email:', error);
        throw error;
    }
};

/**
 * Retrieves the currently authenticated user.
 * Returns the user object for the currently signed-in user, if any.
 * @returns {User|null} The Firebase user object if authenticated, null if not signed in
 */
const getCurrentUser = () => {
    return auth.currentUser;
};

/**
 * Subscribes to authentication state changes.
 * Sets up a listener that triggers when user authentication state changes (sign-in/sign-out).
 * @param {function} callback - Function to call when authentication state changes
 * @param {User|null} callback.user - The current user object or null if signed out
 * @returns {function} Unsubscribe function to remove the listener when no longer needed
 */
const subscribeToAuthChanges = (callback) => {
    return onAuthStateChanged(auth, callback);
};

/**
 * Firebase Authentication Manager
 * 
 * Provides comprehensive Firebase authentication functionality including:
 * - User account creation and management
 * - Email/password authentication (sign-in/sign-out)
 * - User profile management (display name, photo URL)
 * - Email address updates
 * - Authentication state monitoring
 * - Current user retrieval
 * 
 * All methods include proper error handling and logging for debugging purposes.
 * The module integrates seamlessly with Firebase Auth services and provides
 * a clean abstraction layer for authentication operations.
 * 
 * @namespace FirebaseAuthenticationManager
 */
const FirebaseAuthenticationManager = {
    createUser,
    updateUserProfile,
    signInUser,
    signOutUser,
    changeUserEmail,
    getCurrentUser,
    subscribeToAuthChanges
};

export default FirebaseAuthenticationManager;
