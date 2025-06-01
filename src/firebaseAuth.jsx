import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
    signOut,
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    updateProfile,
    onAuthStateChanged
} from 'firebase/auth';
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc,
    serverTimestamp 
} from 'firebase/firestore';

import { auth, db } from './config/firebase';

import LayoutElements from './layoutElements';
import IconElements from './iconElements';

import './firebaseAuth.css';

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

function AppLogin() {
    const [showLoginPopup, setShowLoginPopup] = useState(false);
    const [showSignupPopup, setShowSignupPopup] = useState(false);
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [isSigningUp, setIsSigningUp] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userData, setUserData] = useState(null);

    const handleLogin = async (id, password) => {
        setIsLoggingIn(true);
        try {
            const user = await loginUser(id, password);
            const userInfo = await getUserData(user.uid);
            setUserData(userInfo);
            setIsLoggingIn(false);
            setShowLoginPopup(false);
            setIsLoggedIn(true);
        } catch (error) {
            setIsLoggingIn(false);
            alert('Login failed: ' + error.message);
        }
    };

    const handleSignup = async (nickname, id, password) => {
        setIsSigningUp(true);
        try {
            const user = await signupUser(nickname, id, password);
            const userInfo = await getUserData(user.uid);
            setUserData(userInfo);
            setIsSigningUp(false);
            setShowSignupPopup(false);
            setIsLoggedIn(true);
        } catch (error) {
            setIsSigningUp(false);
            alert('Registration failed: ' + error.message);
        }
    };

    if (isLoggedIn) {
        return (
            <LayoutElements.HomePage />
        );
    }

    return (
        <div className='MainContainer'>
            <header />
            <div />
            <div className="FirstContainer">
                <div className="LoginpageLogo">
                    <div style={{ height: '80%', width: '80%' }}>
                        <IconElements.FrontIcon />
                    </div>
                </div>
                <div className='Title'>
                    This is demo-app
                </div>
                <button className='LoginButton'
                    onClick={() => setShowLoginPopup(true)}>
                    Login
                </button>
                <button className='RegisterButton'
                    onClick={() => setShowSignupPopup(true)}>
                    Register
                </button>

                {showLoginPopup && (
                    <LoginPopup
                        onLogin={handleLogin}
                        onCancel={() => setShowLoginPopup(false)}
                        isLoading={isLoggingIn}
                    />
                )}

                {showSignupPopup && (
                    <SignupPopup
                        onSignup={handleSignup}
                        onCancel={() => setShowSignupPopup(false)}
                        isLoading={isSigningUp}
                    />
                )}
            </div>
            <div className='Line' />
            <div className='AppFooter'>
                <div className='Author'>
                    <p>Made by. Serious Games Gruppe 13</p>
                    <p>Hyunu Park</p>
                </div>
            </div>
        </div>
    );
}

function LoginPopup({ onLogin, onCancel, isLoading }) {
    const [id, setId] = useState('');
    const [password, setPassword] = useState('');

    const handleConfirm = () => {
        if (id && password) {
            onLogin(id, password);
        }
    };

    if (isLoading) {
        return (
            <div className='PopupBackground'>
                <div className='PopupContainer'>
                    <h2>...Loging-in...</h2>
                </div>
            </div>
        );
    }

    return (
        <div className='PopupBackground'>
            <div className='PopupContainer'>
                <h2>Login</h2>
                <div className='Inputfield'>
                    <input className='Input'
                        type="email"
                        value={id}
                        onChange={(e) => setId(e.target.value)}
                        placeholder="Email"
                    />
                    <input className='Input'
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                    />
                </div>
                <div className='Line'></div>
                <div className='Buttonfield'>
                    <button className='CancelButton' onClick={onCancel}>
                        Cancel
                    </button>
                    <button className='ConfirmButton' onClick={handleConfirm}>
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
}

function SignupPopup({ onSignup, onCancel, isLoading }) {
    const [nickname, setNickname] = useState('');
    const [id, setId] = useState('');
    const [password, setPassword] = useState('');

    const handleConfirm = () => {
        if (nickname && id && password) {
            onSignup(nickname, id, password);
        }
    };

    if (isLoading) {
        return (
            <div className='PopupBackground'>
                <div className='PopupContainer'>
                    <h2>...Registering...</h2>
                </div>
            </div>
        );
    }

    return (
        <div className='PopupBackground'>
            <div className='PopupContainer'>
                <h2>Register</h2>
                <div className='Inputfield'>
                    <input className='Input'
                        type="text"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        placeholder="Name"
                    />
                    <input className='Input'
                        type="email"
                        value={id}
                        onChange={(e) => setId(e.target.value)}
                        placeholder="Email"
                    />
                    <input className='Input'
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                    />
                </div>
                <div className='Line'></div>
                <div className='Buttonfield'>
                    <button className='CancelButton' onClick={onCancel}>
                        Cancel
                    </button>
                    <button className='ConfirmButton' onClick={handleConfirm}>
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
}

const AuthElements = {
    AppLogin,
    logoutUser
}

export default AuthElements;