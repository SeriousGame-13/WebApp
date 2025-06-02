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
 * Creates a new user account with email and password
 * @param {string} email - User's email address
 * @param {string} password - User's password
 * @returns {Promise<UserCredential>} Firebase user credential
 * @throws {FirebaseError} If account creation fails
 */
const createUser = async (email, password) => {
    return await createUserWithEmailAndPassword(auth, email, password);
};

/**
 * Updates a user's profile information
 * @param {object} user - Firebase user object
 * @param {object} profileData - Profile data to update (displayName, photoURL)
 * @returns {Promise<void>}
 */
const updateUserProfile = async (user, profileData) => {
    return await updateProfile(user, profileData);
};

/**
 * Signs in an existing user with email and password
 * @param {string} email - User's email address
 * @param {string} password - User's password
 * @returns {Promise<UserCredential>} Firebase user credential
 * @throws {FirebaseError} If authentication fails
 */
const signInUser = async (email, password) => {
    const auth = getAuth(firebaseApp);
    return await signInWithEmailAndPassword(auth, email, password);
};

/**
 * Signs out the currently authenticated user
 * @returns {Promise<void>}
 */
const signOutUser = async () => {
    return await signOut(auth);
};

/**
 * Updates a user's email address
 * @param {object} user - Firebase user object
 * @param {string} newEmail - New email address
 * @returns {Promise<void>}
 * @throws {FirebaseError} If email update fails
 */
const changeUserEmail = async (user, newEmail) => {
    return await updateEmail(user, newEmail);
};

/**
 * Gets the currently signed-in user
 * @returns {object|null} Firebase user object or null if not signed in
 */
const getCurrentUser = () => {
    return auth.currentUser;
};

/**
 * Subscribes to authentication state changes
 * @param {function} callback - Function to call when auth state changes
 * @returns {function} Unsubscribe function
 */
const subscribeToAuthChanges = (callback) => {
    return onAuthStateChanged(auth, callback);
};

const FireAuthManager = {
    createUser,
    updateUserProfile,
    signInUser,
    signOutUser,
    changeUserEmail,
    getCurrentUser,
    subscribeToAuthChanges
};

export default FireAuthManager;
