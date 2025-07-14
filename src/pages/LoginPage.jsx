import { useState } from 'react';

import UserManagement from '../services/firebase/UserManagementSystem';
import ChallengeManagement from '../services/firebase/ChallengeManagement';
import IconElements from '../components/ui/IconElements';
import AdminPage from './AdminPage';
import LayoutElements from '../layouts/LayoutElements';

import '../components/styles/LoginPage.css';

//temp
//For Test - Hyunu P.
import { Workout } from '../services/interfaces/workout.jsx';
import { getDummyWorkout, createAllDummyUsers, getDummyBadges } from '../utils/dummyDataGenerator.jsx';
import UserModel from '../services/interfaces/user.jsx';
import { GROUP_ROLE } from '../services/interfaces/constants.jsx';
import WorkoutManager from './../services/firebase/WorkoutManagement.jsx';
import BadgeManager from '../services/firebase/BadgeManagement.jsx';

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

    // Admin check after log-in
    if (isLoggedIn && user) {
        console.log('Login check - user:', user);
        console.log('Login check - user.isAdmin:', user.isAdmin);
        console.log('Login check - typeof user.isAdmin:', typeof user.isAdmin);

        if (user.isAdmin === true) {
            console.log('Redirecting to Admin page');
            return <AdminPage.AdminPageMain user={user} />;
        } else {
            console.log('Redirecting to regular HomePage');
            return <LayoutElements.HomePage />;
        }
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

//temp
//For Test - Hyunu P.
function AdminPage({ user }) {
    const userData = user;
    const [workout, setStations] = useState(new Workout());
    const [badges, setBadges] = useState([]);

    const handleGenerate = () => {
        const newData = getDummyWorkout(userData.uid, 30);
        setStations(newData);
        setBadges(getDummyBadges());

    };

    const handleSave = () => {
        WorkoutManager.saveWorkout(workout);
        badges.map(badge => {
            BadgeManager.createBadge(badge);
            BadgeManager.awardBadge(user.uid, badge.uid)
        }
        );

    }

    return (
        <div>
            <h1 style={{
                color: '#f2f2f2'
            }}>Admin</h1>
            <p>Willkommen, {user.displayName}</p>

            <button
                onClick={handleGenerate}
                style={{
                    backgroundColor: '#a0ff78',
                    color: '#2e2f29',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    margin: '0 auto 1rem',
                    display: 'block'
                }}
            >
                Trainings-Daten generieren
            </button>

            <div style={{
                maxHeight: '300px',
                overflowY: 'auto',
                backgroundColor: '#3b3c36',
                borderRadius: '10px',
                padding: '1rem',
                color: '#a0ff78',
                fontFamily: 'sans-serif'
            }}>
                {workout.stations.length === 0 && (
                    <p style={{ textAlign: 'center', color: '#aaa' }}>
                        Noch keine Trainings-Daten generiert.
                    </p>
                )}
                {workout.stations.map((entry, index) => (
                    <div key={index} style={{
                        marginBottom: '1rem',
                        paddingBottom: '0.75rem',
                        borderBottom: '1px solid #555'
                    }}>
                        <div><span style={{ color: '#ccc' }}>User:</span> {workout.userId}</div>
                        <div><span style={{ color: '#ccc' }}>Start:</span> {new Date(entry.start).toLocaleString()}</div>
                        <div><span style={{ color: '#ccc' }}>Ende:</span> {new Date(entry.end).toLocaleString()}</div>
                        <div><span style={{ color: '#ccc' }}>Punkte:</span> {entry.points}</div>
                        <div><span style={{ color: '#ccc' }}>Kalorien:</span> {entry.calories}</div>
                        <div><span style={{ color: '#ccc' }}>Ø Herzfrequenz:</span> {entry.heartRateAvg}</div>
                    </div>
                ))}
            </div>

            <button
                onClick={handleSave}
                style={{
                    backgroundColor: '#a0ff78',
                    color: '#2e2f29',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    margin: '0 auto 1rem',
                    display: 'block'
                }}
            >
                Trainings-Daten speichern
            </button>

            <button
                onClick={createAllDummyUsers}
                style={{
                    backgroundColor: '#a0ff78',
                    color: '#2e2f29',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    margin: '0 auto 1rem',
                    display: 'block'
                }}
            >
                Generate Dummy-users
            </button>
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