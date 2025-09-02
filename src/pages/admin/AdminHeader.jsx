import { useState } from 'react';
import UserManagement from '../../services/UserManagementSystem.jsx';
import { Avatar } from '../../components/ui/UIComponents.jsx'; 
import '../../components/styles/LayoutElements.css';

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
                <Avatar 
                    name={name} 
                    userId={user.uid} 
                    size={48} 
                    seed={user.uid}
                />
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