import ExpElements from './exp';
import IconElements from './iconElements';
import React, { useEffect, useState, useRef } from 'react';

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

function HomePage () {
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

function RankingPage () {
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