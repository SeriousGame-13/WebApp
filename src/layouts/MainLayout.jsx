import { useState, useEffect } from 'react';

import LoginPage from '../pages/LoginPage.jsx';
import ChallengePageElements from '../pages/ChallengePage.jsx';
import GroupPageElements from '../pages/GroupPage.jsx';
import HomePageElements from '../pages/HomePage.jsx';
import RankingPage from '../pages/RankingPage.jsx';
import UserPageElements from '../pages/UserPage.jsx';
import UserManagement from '../services/UserManagementSystem.jsx';
import FirebaseAuthenticationManager from '../services/firebase/FirebaseAuthenticationManager.jsx';
import '../components/styles/LayoutElements.css'
import MainFooter from './MainFooter.jsx';

const useAuth = () => {
    const [currentUser, setCurrentUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = FirebaseAuthenticationManager.subscribeToAuthChanges(async (user) => {
            if (user) {
                setCurrentUser(user);
                
                // Use UserManagement system to fetch detailed user information
                try {
                    const userDataFromManagement = await UserManagement.getUser(user.uid);
                    if (userDataFromManagement) {
                        setUserData(userDataFromManagement);
                    } else {
                        console.warn('User data not found in UserManagement system');
                        setUserData(null);
                    }
                } catch (error) {
                    console.error('Failed to fetch user data from UserManagement:', error);
                    setUserData(null);
                }
            } else {
                setCurrentUser(null);
                setUserData(null);
            }
            setLoading(false);
        });
        
        return () => unsubscribe(); // Prevent memory leaks
    }, []);

    return { currentUser, userData, loading };
};

function AppLayout() {
    const { currentUser, userData, loading } = useAuth();

    const [currentPage, setCurrentPage] = useState('home');

    // Groups state
    const [groups, setGroups] = useState([]);
    const [joinedIds, setJoinedIds] = useState([]);

    const renderCurrentPage = () => {
        switch (currentPage) {
            case 'home':
                console.log('Rendering HomePage with data:', userData);
                return (
                <div className='app-container'>
                    <HomePageElements.Page userData={userData} />
                    <div className='border-t border-white/10' />
                    <MainFooter.Footer tab={currentPage} setTab={setCurrentPage} />
                </div>)
            case 'rankings':
                return (
                <div className='app-container'>
                    <RankingPage.Page userData={userData} />
                    <div className='border-t border-white/10' />
                    <MainFooter.Footer tab={currentPage} setTab={setCurrentPage} />
                </div>)
            case 'challenges':
                return (
                    <div className='app-container'>
                        <ChallengePageElements.Page data={userData} />
                        <div className='border-t border-white/10' />
                        <MainFooter.Footer tab={currentPage} setTab={setCurrentPage} />
                    </div>)
            case 'groups':
                return (
                    <div className='app-container'>
                        <GroupPageElements.Page groups={groups} setGroups={setGroups} joinedIds={joinedIds} setJoinedIds={setJoinedIds} />
                        <div className='border-t border-white/10' />
                        <MainFooter.Footer tab={currentPage} setTab={setCurrentPage} />
                    </div>)
            case 'user':
                return (
                <div className='app-container'>
                    <div className='border-t border-white/10' />
                    <UserPageElements.Page data={userData} />
                    <div className='border-t border-white/10' />
                    <MainFooter.Footer tab={currentPage} setTab={setCurrentPage} />
                </div>)
            default:
                return (
                    <div className='app-container'>
                        <HomePageElements.Page data={userData} />
                        <div className='border-t border-white/10' />
                        <MainFooter.Footer tab={currentPage} setTab={setCurrentPage} />
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
    AppLayout
};

export default MainLayout;
