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

import LayoutElements from './layoutElemets';
import IconElements from './iconElements';

import './firebaseAuth.css';

// 로그인 함수
const loginUser = async (id, password) => {
    const userCredential = await signInWithEmailAndPassword(auth, id, password);
    return userCredential.user;
};

// 사용자 데이터 가져오기
const getUserData = async (uid) => {
    try {
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (userDoc.exists()) {
            return userDoc.data();
        }
        return null;
    } catch (error) {
        console.error('사용자 데이터 가져오기 실패:', error);
        return null;
    }
};

// 로그아웃
const logoutUser = async () => {
    const auth = getAuth();
    try {
        await signOut(auth);
        // console.log('로그아웃 성공');
        // 자동으로 onAuthStateChanged가 호출되어 user가 null이 됨
    } catch (error) {
        console.error('Logout failed:', error);
        alert('로그아웃 중 오류가 발생했습니다.');
    }
}

// 회원가입 함수
const signupUser = async (nickname, id, password) => {
    // Firebase Auth에 사용자 생성
    const userCredential = await createUserWithEmailAndPassword(auth, id, password);
    const user = userCredential.user;

    await updateProfile(userCredential.user, {
        displayName: nickname
    });

    // Firestore에 사용자 정보 저장
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

    // 로그인 처리
    const handleLogin = async (id, password) => {
        setIsLoggingIn(true);
        try {
            const user = await loginUser(id, password);
            
            // 사용자 데이터 가져오기
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

    // 회원가입 처리
    const handleSignup = async (nickname, id, password) => {
        setIsSigningUp(true);
        try {
            const user = await signupUser(nickname, id, password);
            
            // 새로 생성된 사용자 데이터 가져오기
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

    // 로그인 성공시
    if (isLoggedIn) {
        return (
            <LayoutElements.HomePage/>
        );
    }

    return (
        <div className='MainContainer'>
            <header/>
            <div/>
            <div className="FirstContainer">
                <div className="LoginpageLogo">
                    <div style={ {height: '80%', width: '80%'} }>
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

                {/* 로그인 팝업 */}
                {showLoginPopup && (
                    <LoginPopup 
                    onLogin={handleLogin}
                    onCancel={() => setShowLoginPopup(false)}
                    isLoading={isLoggingIn}
                    />
                )}

                {/* 회원가입 팝업 */}
                {showSignupPopup && (
                    <SignupPopup 
                    onSignup={handleSignup}
                    onCancel={() => setShowSignupPopup(false)}
                    isLoading={isSigningUp}
                    />
                )}
            </div>
            <div className='Line'/>
            <div className='AppFooter'>
                <div className='Author'>
                    <p>Made by. Serious Games Gruppe 13</p>
                    <p>Hyunu Park</p>
                </div>
            </div>       
        </div>
    );
}

// 로그인 팝업 컴포넌트
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

// 회원가입 팝업 컴포넌트
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