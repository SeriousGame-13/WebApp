import React, { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

import ExpElements from './exp';
import IconElements from './iconElements';
import AuthElements from './firebaseAuth';

import './layoutElements.css'


function Footer() {
    const [selectedIcon, setSelectedIcon] = useState('home');
    
    return (
        <footer className="App-footer">
            <div className='Footer-Iconbox' 
                style={{ color: selectedIcon === 'home' ? 'var(--main-color)' : 'var(--light-color)' }}
                onClick={() => setSelectedIcon('home')}>
                <IconElements.HomeIcon/>
                <div className='Icon-name' style={{ color: selectedIcon === 'home' ? 'var(--main-color)' : 'var(--light-color)' }}>
                    HOME
                </div>
            </div>
            
            <div className='Footer-Iconbox'
                style={{ color: selectedIcon === 'ranking' ? 'var(--main-color)' : 'var(--light-color)' }}
                onClick={() => setSelectedIcon('ranking')}>
                <IconElements.RankingIcon/>
                <div className='Icon-name' style={{ color: selectedIcon === 'ranking' ? 'var(--main-color)' : 'var(--light-color)' }}>
                    RANKING
                </div>
            </div>
            
            <div className='Footer-Iconbox' 
                style={{ color: selectedIcon === 'challenge' ? 'var(--main-color)' : 'var(--light-color)' }}
                onClick={() => setSelectedIcon('challenge')}>
                <IconElements.ChallengeIcon/>
                <div className='Icon-name' style={{ color: selectedIcon === 'challenge' ? 'var(--main-color)' : 'var(--light-color)' }}>
                    CHALLENGE
                </div>
            </div>
            
            <div className='Footer-Iconbox'
                style={{ color: selectedIcon === 'group' ? 'var(--main-color)' : 'var(--light-color)' }}
                onClick={() => setSelectedIcon('group')}>
                <IconElements.GroupIcon/>
                <div className='Icon-name' style={{ color: selectedIcon === 'group' ? 'var(--main-color)' : 'var(--light-color)' }}>
                    GROUP
                </div>
            </div>
            
            <div className='Footer-Iconbox' 
                style={{ color: selectedIcon === 'user' ? 'var(--main-color)' : 'var(--light-color)' }}
                onClick={() => setSelectedIcon('user')}>
                <IconElements.UserIcon/>
                <div className='Icon-name' style={{ color: selectedIcon === 'user' ? 'var(--main-color)' : 'var(--light-color)' }}>
                    USER
                </div>
            </div>
        </footer>
    );
}

function UserInfoHeaderContainer ({ user }) {
    const name = user.displayName;

    return (
        <div className='SeyHelloContainer'>
            <div className='SeyHello'>
                <div> Nice to meet you, </div>
                <div className='UserName'>{name}</div>
            </div>
            <button className='Logout-button'
                onClick={AuthElements.logoutUser}>
                Logout
            </button>
        </div>

    )
}

function IconContainer () {
    return (
        <div className='Header-Iconcontainer'>
            <div className='Header-Iconbox'>
                <IconElements.NotificationIcon />
            </div>
            <div className='Header-Iconbox'>
                <IconElements.SettingsIcon />
            </div>
        </div>
    );
}

function HomePage() {
    const { currentUser, userData, loading } = AuthElements.useAuth();
    
    if (loading) {
        return (
            <div className='PopupBackground'>
                <div className='PopupContainer'>
                    <h2>...Loading...</h2>
                </div>
            </div>
        )
    }

    if (!userData) {
        return <AuthElements.AppLogin/>;
    }
    
    return (
        <div className='Main-container'>
            <header className="App-header">

                <UserInfoHeaderContainer user={userData}/>
                <IconContainer />
            </header>
            <div className='Line'/>
            <div className="App-contents">
                <div>
                    <p>Halle, {userData.displayName}!</p>
                    <p>E-mail: {userData.email}</p>
                    <p>Level: {userData.level}</p>
                    <p>currentStrak: {userData.currentStreak}</p>
                    <p>MaxStrak: {userData.longestStreak}</p>
                </div>
            </div>
            <div className='Line'/>
            <Footer />
        </div>
    );
}

function RankingPage () {
    return (
        <div className='Main-container'>
            <header className="App-header">
                <div>User</div>
                <IconContainer />
            </header>
            <div className='Line'/>
            <div className="App-contents">
            </div>
            <div className='Line'/>
            <Footer />
        </div>
    );
}

function ChallengePage () {
    return (
        <div className='Main-container'>
            <header className="App-header">
                <div>User</div>
                <IconContainer />
            </header>
            <div className='Line'/>
            <div className="App-contents">
                <ExpElements.TestExpContainer />
            </div>
            <div className='Line'/>
            <Footer />
        </div>
    );
}

function GroupPage () {
    return (
        <div className='Main-container'>
            <header className="App-header">
                <div>User</div>
                <IconContainer />
            </header>
            <div className='Line'/>
            <div className="App-contents">
                <ExpElements.TestExpContainer />
            </div>
            <div className='Line'/>
            <Footer />
        </div>
    );
}

function UserPage () {
    return (
        <div className='Main-container'>
            <header className="App-header">
                <div>User</div>
                <IconContainer />
            </header>
            <div className='Line'/>
            <div className="App-contents">
                <ExpElements.TestExpContainer />
            </div>
            <div className='Line'/>
            <Footer />
        </div>
    );
}

const LayoutElements = {
    Footer,
    IconContainer,
    HomePage,
    RankingPage,
    ChallengePage,
    GroupPage,
    UserPage
};

export default LayoutElements;