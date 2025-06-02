import { 
    signOut,
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    updateProfile,
} from 'firebase/auth';
import { 
    doc, 
    setDoc, 
    getDoc,
    serverTimestamp 
} from 'firebase/firestore';

import { auth, db } from './firebaseConfig';

const loginUser = async (id, password) => {
    const userCredential = await signInWithEmailAndPassword(auth, id, password);
    return userCredential.user;
};

const getUserData = async (uid) => {
    try {
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (userDoc.exists()) {
            return userDoc.data();
        }
        return null;
    } catch (error) {
        console.error('Failed to get user data:', error);
        return null;
    }
};

const logoutUser = async () => {
    const auth = getAuth();
    try {
        await signOut(auth);
    } catch (error) {
        console.error('Logout failed:', error);
        alert('An error occurred during logout.');
    }
};

const signupUser = async (nickname, id, password) => {
    const userCredential = await createUserWithEmailAndPassword(auth, id, password);
    const user = userCredential.user;

    await updateProfile(userCredential.user, {
        displayName: nickname
    });

    await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: id,
        displayName: nickname,
        createdAt: serverTimestamp(),
        isActive: true,
        level: 1,
        points: 0,
        longestStreak: 0
    });

    return user;
};


const UserManagement = {
    loginUser,
    getUserData,
    logoutUser,
    signupUser
}

export default UserManagement;