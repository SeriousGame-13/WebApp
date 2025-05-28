import React, { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

import ExpElements from './exp';
import IconElements from './iconElements';
import AuthElements from './firebaseAuth';
import DatamanagerElements from './dataManager';
import ProfileImageElements from './profileImageManager';

import { auth, db } from './config/firebase';

import './layoutElements.css'


function Footer({ selectedIcon, onIconSelect }) {
    
    return (
        <footer className="App-footer">
            <div className='Footer-Iconbox' 
                style={{ color: selectedIcon === 'home' ? 'var(--main-color)' : 'var(--light-color)' }}
                onClick={() => onIconSelect('home')}>
                <IconElements.HomeIcon/>
                <div className='Icon-name' style={{ color: selectedIcon === 'home' ? 'var(--main-color)' : 'var(--light-color)' }}>
                    HOME
                </div>
            </div>
            
            <div className='Footer-Iconbox'
                style={{ color: selectedIcon === 'ranking' ? 'var(--main-color)' : 'var(--light-color)' }}
                onClick={() => onIconSelect('ranking')}>
                <IconElements.RankingIcon/>
                <div className='Icon-name' style={{ color: selectedIcon === 'ranking' ? 'var(--main-color)' : 'var(--light-color)' }}>
                    RANKING
                </div>
            </div>
            
            <div className='Footer-Iconbox' 
                style={{ color: selectedIcon === 'challenge' ? 'var(--main-color)' : 'var(--light-color)' }}
                onClick={() => onIconSelect('challenge')}>
                <IconElements.ChallengeIcon/>
                <div className='Icon-name' style={{ color: selectedIcon === 'challenge' ? 'var(--main-color)' : 'var(--light-color)' }}>
                    CHALLENGE
                </div>
            </div>
            
            <div className='Footer-Iconbox'
                style={{ color: selectedIcon === 'group' ? 'var(--main-color)' : 'var(--light-color)' }}
                onClick={() => onIconSelect('group')}>
                <IconElements.GroupIcon/>
                <div className='Icon-name' style={{ color: selectedIcon === 'group' ? 'var(--main-color)' : 'var(--light-color)' }}>
                    GROUP
                </div>
            </div>
            
            <div className='Footer-Iconbox' 
                style={{ color: selectedIcon === 'user' ? 'var(--main-color)' : 'var(--light-color)' }}
                onClick={() => onIconSelect('user')}>
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
            <DatamanagerElements.ProfileImageDisplay userId={user.uid} imageclass={'ProfileImageForHeader'}/>
            <div className='SeyHello'>
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

const Home = ({Data}) => {
    const userData = Data;

    return (
        <div className="App-contents">
            <div className='ExpContainer'>
                <ExpElements.NewCircleExpContainer level={userData.level} expnow={userData.points} expmax={1000} />
                <div className='HomeInfoContainer'>
                    <div className='HomeInfo'
                        style={{ color: 'var(--main-color)'}}>
                        <IconElements.RankingIcon/>
                        <div className='HomeInfo-name'>
                            11
                        </div>
                        <p style={{ textAlign: 'center'}}>Plase</p>
                    </div>
                    <div className='HomeInfo'
                        style={{ color: 'var(--main-color)'}}>
                        <IconElements.TimeIcon/>
                        <div className='HomeInfo-name'>
                            45 min
                        </div>
                        <p style={{ textAlign: 'center'}}>Training</p>
                    </div>
                    <div className='HomeInfo'
                        style={{ color: 'var(--main-color)'}}>
                        <IconElements.FitnessIcon/>
                        <div className='HomeInfo-name'>
                            3/7
                        </div>
                        <p style={{ textAlign: 'center'}}>Goal</p>
                    </div>
                </div>
            </div>
            
            <div className='GuideText'>
                    Active Group Exercise
            </div>
            <div className='ExerciseContainer'>
                <div className='GroupExerciseContainer'>
                    
                    <div className='GroupExerciseHeader'>
                        Group exercise Name 1
                    </div>
                    <div className='GroupExerciseContents'>
                        This is test information about active group exercise contents and this is place for description.
                    </div>
                    <div className='GroupExpContainer'>
                        <ExpElements.NewLinearExpContainerSimple expnow={2} expmax={10} />
                    </div>
                </div>
                <div className='GroupExerciseContainer'>
                    
                    <div className='GroupExerciseHeader'>
                        Group exercise Name 2
                    </div>
                    <div className='GroupExerciseContents'>
                        This is test information about active group exercise contents and this is place for description. And this is a long long long text, and it's very long. Really looooooooooong.
                    </div>
                    <div className='GroupExpContainer'>
                        <ExpElements.NewLinearExpContainerSimple expnow={7} expmax={10} />
                    </div>
                </div>
                <div className='GroupExerciseContainer'>
                    
                    <div className='GroupExerciseHeader'>
                        Group exercise Name 3
                    </div>
                    <div className='GroupExerciseContents'>
                        Short text.    
                    </div>
                    <div className='GroupExpContainer'>
                        <ExpElements.NewLinearExpContainerSimple expnow={5} expmax={10} />
                    </div>
                </div>
            </div>
            
        </div>
    )
}

const Ranking = ({Data}) => {
    const userData = Data;

    return (
        <div className="App-contents">
            This is Rankingpage !!!
        </div>
    )
}

const Challenge = ({Data}) => {
    const userData = Data;

    return (
        <div className="App-contents">
            This is Challengepage !!!
        </div>
    )
}

const Group = ({Data}) => {
    const userData = Data;

    return (
        <div className="App-contents">
            This is Grouppage !!!
        </div>
    )
}

const User = ({Data}) => {
    const userData = Data;

    return (
        <div className="App-contents">
            <ProfileImageElements.ProfileImageUploader userId={userData.uid}/>
            <div>
                <p>Halle, {userData.displayName}!</p>
                <p>E-mail: {userData.email}</p>
                <p>Level: {userData.level}</p>
                <p>Active: {userData.isActive}</p>
                <p>Points: {userData.points}</p>
                <p>MaxRecord: {userData.longestStreak}</p>
            </div>
        </div>
    )
}



function HomePage() {
    const { currentUser, userData, loading } = DatamanagerElements.useAuth('users');

    const [currentPage, setCurrentPage] = useState('home');
    
    const renderCurrentPage = () => {
        switch(currentPage) {
            case 'home':
                return <Home Data={userData} />
            case 'ranking':
                return <Ranking Data={userData} />
            case 'challenge':
                return <Challenge Data={userData} />
            case 'group':
                return <Group Data={userData} />
            case 'user':
                return <User Data={userData} />
            default:
                return <User Data={userData} />
        }
    }

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
            {renderCurrentPage()}

            <div className='Line'/>
            <Footer selectedIcon={currentPage} onIconSelect={setCurrentPage} />
        </div>
    );
}

const LayoutElements = {
    Footer,
    IconContainer,
    HomePage
};

export default LayoutElements;