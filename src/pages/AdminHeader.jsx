import { useState } from 'react';
import UserManagement from '../services/firebase/UserManagementSystem';
import DatamanagerElements from '../utils/dataManager';
import '../components/styles/LayoutElements.css';

function AdminHeader({ user, onPageSelect, currentPage }) {
    const [showDropdown, setShowDropdown] = useState(false);
    const name = user.displayName;

    const handleDropdownToggle = () => {
        console.log('Dropdown toggle clicked, current state:', showDropdown);
        setShowDropdown(prev => !prev);
    };

    const handlePageSelect = (page) => {
        console.log('Page selected:', page);
        onPageSelect(page);
        setShowDropdown(false);
    };

    const handleLogout = async () => {
        try {
            console.log('Logout button clicked');
            await UserManagement.logoutUser();
            window.location.reload();
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    console.log('Rendering AdminHeader, showDropdown:', showDropdown);

    return (
        <header className="AppHeader">
            <div className='SeyHelloContainer'>
                <DatamanagerElements.ProfileImageDisplay userId={user.uid} imageclass={'ProfileImageForHeader'} />
                <div className='SeyHello'>
                    <div className='UserName'>{name}</div>
                </div>
                <button className='LogoutButton' onClick={handleLogout}>
                    Logout
                </button>
            </div>

            <div className='AdminDropdownContainer'>
                <button
                    className={`AdminDropdownButton ${showDropdown ? 'open' : ''}`}
                    onClick={handleDropdownToggle}
                >
                    {currentPage} ▼
                </button>
                {showDropdown && (
                    <div className='AdminDropdownMenu'>
                        <div
                            className='AdminDropdownItem'
                            onClick={() => handlePageSelect('Group Manager')}
                        >
                            Group Manager
                        </div>
                        <div
                            className='AdminDropdownItem'
                            onClick={() => handlePageSelect('Challenge Manager')}
                        >
                            Challenge Manager
                        </div>
                        <div
                            className='AdminDropdownItem'
                            onClick={() => handlePageSelect('Badge Manager')}
                        >
                            Badge Manager
                        </div>
                        <div
                            className='AdminDropdownItem'
                            onClick={() => handlePageSelect('Workout Manager')}
                        >
                            Workout Manager
                        </div>
                                                <div
                            className='AdminDropdownItem'
                            onClick={() => handlePageSelect('Station Manager')}
                        >
                            Station Manager
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}

export default AdminHeader;