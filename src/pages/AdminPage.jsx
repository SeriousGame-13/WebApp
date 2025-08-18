import { useState } from 'react';
import AdminHeader from './AdminHeader';
import GroupManagerPage from './GroupManagerPage';
import BadgeManagerPage from './BadgeManagerPage';
import ChallengeManagerPage from './ChallengeManagerPage';
import '../components/styles/LayoutElements.css';
import WorkoutManagerPage from './WorkoutManagerPage';
import StationManagerPage  from './StationManagerPage';

function AdminPageMain({ user }) {
    const [currentPage, setCurrentPage] = useState('Group Manager');

    const renderCurrentPage = () => {
        switch (currentPage) {
            case 'Group Manager':
                return <GroupManagerPage />;
            case 'Challenge Manager':
                return <ChallengeManagerPage />;
            case 'Badge Manager':
                return <BadgeManagerPage user={user} />;
            case 'Workout Manager':
                return <WorkoutManagerPage user={user} />;
            case 'Station Manager':
                return <StationManagerPage user={user} />;
            default:
                return <GroupManagerPage />;
        }
    };

    return (
        <div className='MainContainerWithHeader'>
            <AdminHeader
                user={user}
                onPageSelect={setCurrentPage}
                currentPage={currentPage}
            />
            <div className='Line' />
            {renderCurrentPage()}
        </div>
    );
}

const AdminPage = {
    AdminPageMain,
}

export default AdminPage;