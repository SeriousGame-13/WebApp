import { useState } from 'react';
import AdminHeader from './AdminHeader';
import GroupManagerPage from './GroupManagerPage';
import BadgeManagerPage from './BadgeManagerPage';
import ChallengeManagerPage from './ChallengeManagerPage';
import UserManagerPage from './UserManagerPage';
import '../../components/styles/sphere-styles.css';
import WorkoutManagerPage from './WorkoutManagerPage';
import StationManagerPage from './StationManagerPage';
import StationGamePage from './StationGamePage';

function AdminPageMain({ user }) {
    const [currentPage, setCurrentPage] = useState('Group Manager');

    const handlePageSelect = (page) => {
        console.log('AdminPage - Setting current page to:', page);
        setCurrentPage(page);
    };

    const renderCurrentPage = () => {
        console.log('AdminPage - Rendering page:', currentPage);
        switch (currentPage) {
            case 'Group Manager':
                return <GroupManagerPage />;
            case 'Challenge Manager':
                return <ChallengeManagerPage />;
            case 'Badge Manager':
                return <BadgeManagerPage user={user} />;
            case 'User Manager':
                return <UserManagerPage user={user} />;
            case 'Workout Manager':
                return <WorkoutManagerPage user={user} />;
            case 'Station Manager':
                return <StationManagerPage user={user} />;
            case 'Station Game Manager':
                return <StationGamePage user={user} />;
            default:
                console.log('AdminPage - Unknown page, defaulting to Group Manager');
                return <GroupManagerPage />;
        }
    };

    return (
        <div className="app-container">
            {/* Background gradients */}
            <div className="background">
                <div className="bg-gradient-1"></div>
                <div className="bg-gradient-2"></div>
                <div className="bg-overlay"></div>
            </div>

            <AdminHeader
                user={user}
                onPageSelect={handlePageSelect}
                currentPage={currentPage}
            />
            
            <main className="screen-main">
                {renderCurrentPage()}
            </main>
        </div>
    );
}

const AdminPage = {
    AdminPageMain,
}

export default AdminPage;