import { useState } from 'react';

import IconElements from '../components/ui/IconElements';
import LoginPage from '../pages/LoginPage';
import UserManagement from '../services/firebase/UserManagementSystem';
import DatamanagerElements from '../utils/dataManager';
import ChallengePageElements from '../pages/ChallengePage';
import GroupPageElements from '../pages/GroupPage';
import HomePageElements from '../pages/HomePage';
import RankingPage from '../pages/RankingPage';
import UserPageElements from '../pages/UserPage';
import '../components/styles/LayoutElements.css'
import MainFooter from './MainFooter';

/**
 * Where elements for layouts that will be used commonly will be placed.
 * Content for each page should be written in the corresponding jsx file inside the 
 * 'pages' directory.
 */



function UserInfoHeaderContainer({ user }) {
    const name = user.displayName;

    return (
        <div className='flex items-center gap-4'>
            <DatamanagerElements.ProfileImageDisplay userId={user.uid} imageclass={'w-10 h-10 rounded-full'} />
            <div className='flex flex-col'>
                <div className='text-gradient font-semibold'>{name}</div>
            </div>
        </div>
    )
}

function IconContainer() {
    return (
        <div className='flex gap-4'>
            <div className='p-2 bg-white/5 rounded-full'>
                <IconElements.NotificationIcon />
            </div>
            <div className='p-2 bg-white/5 rounded-full'>
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
                return (
                <div className='app-container'>
                    <HomePageElements.Page userData={userData} />
                    <div className='border-t border-white/10' />
                    <MainFooter.newFooter tab={currentPage} setTab={setCurrentPage} />
                </div>)
            case 'rankings':
                return (
                <div className='app-container'>
                    <RankingPage.Page userData={userData} />
                    <div className='border-t border-white/10' />
                    <MainFooter.newFooter tab={currentPage} setTab={setCurrentPage} />
                </div>)
            case 'challenges':
                return (
                <div className='app-container'>
                    <ChallengePageElements.Page data={userData} />
                    <div className='border-t border-white/10' />
                    <MainFooter.newFooter tab={currentPage} setTab={setCurrentPage} />
                </div>)
            case 'groups':

                return (
                <div className='app-container'>
                    <GroupPageElements.Page data={userData} />
                    <div className='border-t border-white/10' />
                    <MainFooter.newFooter tab={currentPage} setTab={setCurrentPage} />
                </div>)
            case 'user':
                return (
                <div className='app-container'>
                    <header className="screen-header flex justify-between items-center">
                        <UserInfoHeaderContainer user={userData} />
                        {/*
                        <IconContainer />
                        */}
                        <button className='btn-secondary'
                            onClick={UserManagement.logoutUser}>
                            Logout
                        </button>
                    </header>
                    <div className='border-t border-white/10' />
                    <UserPageElements.Page data={userData} />
                    <div className='border-t border-white/10' />
                    <MainFooter.newFooter tab={currentPage} setTab={setCurrentPage} />
                </div>)
            default:
                return (
                <div className='app-container'>
                    <HomePageElements.Page data={userData} />
                    <div className='border-t border-white/10' />
                    <MainFooter.newFooter tab={currentPage} setTab={setCurrentPage} />
                </div>)
        }
    }

    if (loading) {
        return (
            <div className='modal-overlay'>
                <div className='modal-backdrop'></div>
                <div className='modal-content'>
                    <h2 className='modal-title'>...Loading...</h2>
                </div>
            </div>
        )
    }

    if (!userData) {
        return <LoginPage.AppLogin />;
    }

    return (
        <div>
            {renderCurrentPage()}
            
        </div>
    );
}

const MainLayout = {
    IconContainer,
    HomePage
};

export default MainLayout;
