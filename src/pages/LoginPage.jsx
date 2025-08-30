import { useState, lazy, Suspense } from 'react';

import UserManagement from '../services/firebase/UserManagementSystem';
import ChallengeManagement from '../services/firebase/ChallengeManagement';
import AdminPage from './AdminPage';
import MainLayout from '../layouts/MainLayout';

const NewApp = lazy(() => import('../layouts/newApp.jsx'));

import '../sphere-styles.css';

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
            const user = await UserManagement.getUser(userLogin.uid); 
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
            const userLogin = await UserManagement.signupUser(nickname, id, password);
            const user = await UserManagement.getUser(userLogin.uid);
            
            // Add new User in all Public/Hidden Challenge
            try {
                await ChallengeManagement.addNewUserToChallenges(userLogin.uid);
            } catch (error) {
                console.error('Failed to add new user to challenges:', error);
            }
            
            setUserData(user);
            setIsSigningUp(false);
            setShowSignupPopup(false);
            setIsLoggedIn(true);
        } catch (error) {
            setIsSigningUp(false);
            alert('Registration failed: ' + error.message);
        }
    };

    // Admin check after log-in and app selection
    const [showAppSelectionPopup, setShowAppSelectionPopup] = useState(false);
    const [selectedApp, setSelectedApp] = useState(null);

    if (isLoggedIn && user && !showAppSelectionPopup && !selectedApp) {
        console.log('Login check - user:', user);
        console.log('Login check - user.isAdmin:', user.isAdmin);
        console.log('Login check - typeof user.isAdmin:', typeof user.isAdmin);

        if (user.isAdmin === true) {
            console.log('Redirecting to Admin page');
            return <AdminPage.AdminPageMain user={user} />;
        } else {
            console.log('Showing app selection popup');
            setShowAppSelectionPopup(true);
        }
    }

    // Handle app selection
    if (isLoggedIn && user && selectedApp) {
        if (selectedApp === "main") {
            console.log('Redirecting to regular HomePage');
            return <MainLayout.HomePage />;
        } else if (selectedApp === "new") {
            console.log('Redirecting to new App');
            return (
                <Suspense fallback={<div>Loading...</div>}>
                    <NewApp />
                </Suspense>
            );
        }
    }

    return (
        <div className='app-container'>
            <div className='background'>
                <div className='bg-gradient-1'></div>
                <div className='bg-gradient-2'></div>
            </div>
            <div className='screen'>
                <div className='screen-header'>
                    <h1 className='screen-title'>Serious Games App</h1>
                    <p className='screen-subtitle'>Group 13</p>
                </div>
                <div className='screen-main'>
                    <div className='card space-y-4'>
                        <h2 className='text-center text-xl font-semibold'>Welcome</h2>
                        <button className='btn-primary w-full'
                            onClick={() => setShowLoginPopup(true)}>
                            Login
                        </button>
                        <button className='btn-secondary w-full'
                            onClick={() => setShowSignupPopup(true)}>
                            Register
                        </button>
                    </div>
                </div>
            </div>

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
            
            {showAppSelectionPopup && (
                <AppSelectionPopup
                    onSelect={(app) => {
                        setSelectedApp(app);
                        setShowAppSelectionPopup(false);
                    }}
                    onCancel={() => {
                        // Default to main app if user cancels
                        setSelectedApp("main");
                        setShowAppSelectionPopup(false);
                    }}
                />
            )}
            
            <div className='footer text-center py-4 text-slate-400 text-sm'>
                <p>Made by Serious Games Gruppe 13</p>
                <p>Alexander Link, Hyunu Park, Igor Ricarte, Robert Rothenberger</p>
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
            <div className='modal-overlay'>
                <div className='modal-backdrop'></div>
                <div className='modal-content card'>
                    <h2 className='text-xl font-semibold text-center'>Logging in...</h2>
                </div>
            </div>
        );
    }

    return (
        <div className='modal-overlay'>
            <div className='modal-backdrop'></div>
            <div className='modal-content card'>
                <h2 className='text-xl font-semibold mb-4'>Login</h2>
                <div className='space-y-3'>
                    <input className='form-input'
                        type="email"
                        value={id}
                        onChange={(e) => setId(e.target.value)}
                        placeholder="Email"
                    />
                    <input className='form-input'
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                    />
                </div>
                <div className='border-t border-white/10 my-4'></div>
                <div className='flex justify-end gap-2'>
                    <button className='btn-secondary' onClick={onCancel}>
                        Cancel
                    </button>
                    <button className='btn-primary' onClick={handleConfirm}>
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
            <div className='modal-overlay'>
                <div className='modal-backdrop'></div>
                <div className='modal-content card'>
                    <h2 className='text-xl font-semibold text-center'>Registering...</h2>
                </div>
            </div>
        );
    }

    return (
        <div className='modal-overlay'>
            <div className='modal-backdrop'></div>
            <div className='modal-content card'>
                <h2 className='text-xl font-semibold mb-4'>Register</h2>
                <div className='space-y-3'>
                    <input className='form-input'
                        type="text"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        placeholder="Name"
                    />
                    <input className='form-input'
                        type="email"
                        value={id}
                        onChange={(e) => setId(e.target.value)}
                        placeholder="Email"
                    />
                    <input className='form-input'
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                    />
                </div>
                <div className='border-t border-white/10 my-4'></div>
                <div className='flex justify-end gap-2'>
                    <button className='btn-secondary' onClick={onCancel}>
                        Cancel
                    </button>
                    <button className='btn-primary' onClick={handleConfirm}>
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
}

function AppSelectionPopup({ onSelect, onCancel }) {
    return (
        <div className='modal-overlay'>
            <div className='modal-backdrop'></div>
            <div className='modal-content card'>
                <h2 className='text-xl font-semibold mb-4'>Choose Application</h2>
                <p className='text-sm text-slate-300 mb-4'>Select which version of the app you'd like to use:</p>
                
                <div className='space-y-3'>
                    <button 
                        className='btn-primary w-full'
                        onClick={() => onSelect('main')}
                    >
                        Main Application
                    </button>
                    <button 
                        className='btn-secondary w-full'
                        onClick={() => onSelect('new')}
                    >
                        New Application
                    </button>
                </div>
                
                <div className='border-t border-white/10 my-4'></div>
                <div className='flex justify-end'>
                    <button className='btn-tertiary' onClick={onCancel}>
                        Cancel
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