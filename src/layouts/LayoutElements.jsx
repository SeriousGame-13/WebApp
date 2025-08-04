import { useState } from 'react';

import IconElements from '../components/ui/IconElements';
import LoginPage from '../pages/LoginPage';
import UserManagement from '../services/firebase/UserManagementSystem';
import DatamanagerElements from '../utils/dataManager';

import ChallengePageElements from '../pages/ChallengePage';
import GroupPageElements from '../pages/GroupPage';
import HomePageElements from '../pages/HomePage';
import RankingPageElements from '../pages/RankingPage';
import UserPageElements from '../pages/UserPage';
import '../components/styles/LayoutElements.css'

/**
 * Where elements for layouts that will be used commonly will be placed.
 * Content for each page should be written in the corresponding jsx file inside the 
 * 'pages' directory.
 */

function Footer({ selectedIcon, onIconSelect }) {

    return (
        <footer className="AppFooter">
            <div className='FooterIconbox'
                style={{ color: selectedIcon === 'home' ? 'var(--main-color)' : 'var(--text-secondary)' }}
                onClick={() => onIconSelect('home')}>
                <IconElements.HomeIcon />
                <div className='IconName' style={{ color: selectedIcon === 'home' ? 'var(--main-color)' : 'var(--text-secondary)' }}>
                    HOME
                </div>
            </div>

            <div className='FooterIconbox'
                style={{ color: selectedIcon === 'ranking' ? 'var(--main-color)' : 'var(--text-secondary)' }}
                onClick={() => onIconSelect('ranking')}>
                <IconElements.RankingIcon />
                <div className='IconName' style={{ color: selectedIcon === 'ranking' ? 'var(--main-color)' : 'var(--text-secondary)' }}>
                    RANKING
                </div>
            </div>

            <div className='FooterIconbox'
                style={{ color: selectedIcon === 'challenge' ? 'var(--main-color)' : 'var(--text-secondary)' }}
                onClick={() => onIconSelect('challenge')}>
                <IconElements.ChallengeIcon />
                <div className='IconName' style={{ color: selectedIcon === 'challenge' ? 'var(--main-color)' : 'var(--text-secondary)' }}>
                    CHALLENGE
                </div>
            </div>

            <div className='FooterIconbox'
                style={{ color: selectedIcon === 'group' ? 'var(--main-color)' : 'var(--text-secondary)' }}
                onClick={() => onIconSelect('group')}>
                <IconElements.GroupIcon />
                <div className='IconName' style={{ color: selectedIcon === 'group' ? 'var(--main-color)' : 'var(--text-secondary)' }}>
                    GROUP
                </div>
            </div>

            <div className='FooterIconbox'
                style={{ color: selectedIcon === 'user' ? 'var(--main-color)' : 'var(--text-secondary)' }}
                onClick={() => onIconSelect('user')}>
                <IconElements.UserIcon />
                <div className='IconName' style={{ color: selectedIcon === 'user' ? 'var(--main-color)' : 'var(--text-secondary)' }}>
                    USER
                </div>
            </div>
        </footer>
    );
}

function UserInfoHeaderContainer({ user }) {
    const name = user.displayName;

    return (
        <div className='SeyHelloContainer'>
            <DatamanagerElements.ProfileImageDisplay userId={user.uid} imageclass={'ProfileImageForHeader'} />
            <div className='SeyHello'>
                <div className='UserName'>{name}</div>
            </div>
        </div>
    )
}

function IconContainer() {
    return (
        <div className='HeaderIconcontainer'>
            <div className='HeaderIconbox'>
                <IconElements.NotificationIcon />
            </div>
            <div className='HeaderIconbox'>
                <IconElements.SettingsIcon />
            </div>
        </div>
    );
}


function HomePage() {
    const { currentUser, userData, loading } = DatamanagerElements.useAuth();

    const [currentPage, setCurrentPage] = useState('home');

    const renderCurrentPage = () => {
        switch (currentPage) {
            case 'home':
                console.log('Rendering GroupPage with data:', userData);
                return <HomePageElements.Page data={userData} />
            case 'ranking':
                return <RankingPageElements.Page data={userData} />
            case 'challenge':
                return <ChallengePageElements.Page data={userData} />
            case 'group':

                return <GroupPageElements.Page data={userData} />
            case 'user':
                return <UserPageElements.Page data={userData} />
            default:
                return <HomePageElements.Page data={userData} />
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
        return <LoginPage.AppLogin />;
    }

    return (
        <div className='MainContainer'>
            <header className="AppHeader">

                <UserInfoHeaderContainer user={userData} />
                {/*
                <IconContainer />
                */}
                <button className='LogoutButton'
                    onClick={UserManagement.logoutUser}>
                    Logout
                </button>
            </header>
            <div className='Line' />
            {renderCurrentPage()}

            <div className='Line' />
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