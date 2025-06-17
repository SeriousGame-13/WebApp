import React, { useState, useEffect } from 'react';

import UserManagement from '../services/firebase/UserManagementSystem';
import IconElements from '../components/ui/IconElements';
import LayoutElements from '../layouts/LayoutElements';

import '../components/styles/LoginPage.css';

function AppLogin() {
    const [showLoginPopup, setShowLoginPopup] = useState(false);
    const [showSignupPopup, setShowSignupPopup] = useState(false);
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [isSigningUp, setIsSigningUp] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUserData] = useState(null);

    const handleLogin = async (id, password) => {
        setIsLoggingIn(true);
        try {
            const userLogin = await UserManagement.loginUser(id, password);
            const user = UserManagement.getUser(userLogin.uid);
            setUserData(user);
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
            const userLogin = UserManagement.signupUser(nickname, id, password);
            const user = UserManagement.getUser(userLogin.uid);
            setUserData(user);
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
                    <p>Alexander Link, Hyunu Park, Igor Ricarte, Robert Rothenberger</p>
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

const LoginPage = {
    AppLogin,
}

export default LoginPage;