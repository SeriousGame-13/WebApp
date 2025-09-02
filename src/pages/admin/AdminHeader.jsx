import { useState } from 'react';
import UserManagement from '../../services/UserManagementSystem.jsx';
import ProfileAvatar from '../../components/ui/ProfileAvatar.jsx';
import '../../components/styles/sphere-styles.css';
import { LogOut } from 'lucide-react';

function AdminHeader({ user, onPageSelect, currentPage }) {
    const name = user.displayName;

    const handlePageSelect = (page) => {
        console.log('Page selected:', page);
        if (onPageSelect && typeof onPageSelect === 'function') {
            onPageSelect(page);
        } else {
            console.error('onPageSelect is not a function:', onPageSelect);
        }
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

    const adminPages = [
        { key: 'Group Manager', label: 'Group Manager', icon: '👥' },
        { key: 'Challenge Manager', label: 'Challenge Manager', icon: '🎯' },
        { key: 'Badge Manager', label: 'Badge Manager', icon: '🏆' },
        { key: 'User Manager', label: 'User Manager', icon: '👤' },
        { key: 'Workout Manager', label: 'Workout Manager', icon: '💪' },
        { key: 'Goal Manager', label: 'Goal Manager', icon: '🎯' },
        { key: 'Station Manager', label: 'Station Manager', icon: '🏋️' },
        { key: 'Station Game Manager', label: 'Station Game Manager', icon: '🎮' }
    ];

    return (
        <header className="screen-header">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <ProfileAvatar 
                        name={name} 
                        userId={user.uid} 
                        size={48} 
                        seed={user.uid}
                    />
                    <div>
                        <h1 className="screen-title">Admin Panel</h1>
                        <p className="screen-subtitle">Welcome back, {name}</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    {/* Page Selection Dropdown */}
                    <div className="flex flex-col gap-1">
                        <label className="form-label">Admin Section</label>
                        <select 
                            className="form-input"
                            value={currentPage}
                            onChange={(e) => handlePageSelect(e.target.value)}
                        >
                            {adminPages.map(page => (
                                <option key={page.key} value={page.key}>
                                    {page.icon} {page.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    
                    <button 
                        className="btn-secondary flex items-center gap-2" 
                        onClick={handleLogout}
                    >
                        <LogOut className="w-4 h-4" />
                        Logout
                    </button>
                </div>
            </div>
        </header>
    );
}

export default AdminHeader;