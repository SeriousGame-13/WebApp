import { useEffect, useState } from 'react';

import GroupPage from '../pages/GroupPage.jsx';
import HomePage from '../pages/HomePage.jsx';
import ProgressPage from '../pages/ProgressPage.jsx';
import RankingPage from '../pages/RankingPage.jsx';
import UserPage from '../pages/UserPage.jsx';
import UserManagement from '../services/UserManagementSystem.jsx';
import FirebaseAuthenticationManager from '../services/firebase/FirebaseAuthenticationManager.jsx';
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

    // Listen for global user-data refresh events (e.g., after workout/exercise changes)
    useEffect(() => {
        const onRefresh = async () => {
            try {
                if (currentUser?.uid) {
                    const updated = await UserManagement.getUser(currentUser.uid);
                    setUserData(updated);
                }
            } catch (error) {
                console.error('Failed to refresh user data:', error);
            }
        };
        window.addEventListener('refreshUserData', onRefresh);
        return () => window.removeEventListener('refreshUserData', onRefresh);
    }, [currentUser?.uid]);

    return { currentUser, userData, loading };
};

function AppLayout() {
    const { userData, loading } = useAuth();

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
                    <HomePage userData={userData} />
                    <div className='border-t border-white/10' />
                    <MainFooter.Footer tab={currentPage} setTab={setCurrentPage} />
                </div>)
            case 'rankings':
                return (
                <div className='app-container'>
                    <RankingPage userData={userData} />
                    <div className='border-t border-white/10' />
                    <MainFooter.Footer tab={currentPage} setTab={setCurrentPage} />
                </div>)
            case 'progress':
                return (
                    <div className='app-container'>
                        <ProgressPage data={userData} />
                        <div className='border-t border-white/10' />
                        <MainFooter.Footer tab={currentPage} setTab={setCurrentPage} />
                    </div>)
            case 'groups':
                return (
                    <div className='app-container'>
                        <GroupPage.Page groups={groups} setGroups={setGroups} joinedIds={joinedIds} setJoinedIds={setJoinedIds} />
                        <div className='border-t border-white/10' />
                        <MainFooter.Footer tab={currentPage} setTab={setCurrentPage} />
                    </div>)
            case 'user':
                return (
                <div className='app-container'>
                    <div className='border-t border-white/10' />
                    <UserPage data={userData} />
                    <div className='border-t border-white/10' />
                    <MainFooter.Footer tab={currentPage} setTab={setCurrentPage} />
                </div>)
            default:
                return (
                    <div className='app-container'>
                        <HomePage userData={userData} />
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

    // Not authenticated: show a lightweight placeholder (login is handled at app level)
    if (!userData) {
        return (
            <div className='modal-overlay'>
                <div className='modal-backdrop'></div>
                <div className='modal-content'>
                    <h2 className='modal-title'>Bitte einloggen…</h2>
                </div>
            </div>
        );
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
