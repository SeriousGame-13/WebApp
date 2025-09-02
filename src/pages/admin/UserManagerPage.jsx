import { useState, useEffect } from 'react';
import UserManagementSystem from '../../services/UserManagementSystem.jsx';
import { AdminPageLayout, AdminCard } from '../../components/ui/AdminComponents.jsx';
import '../../components/styles/sphere-styles.css';
import { Users, Edit, Trash2, X, Search, Shield, UserCheck, Mail, Calendar, Crown } from 'lucide-react';

// User Edit Form Component
function EditUserForm({ user = null, onSubmit, onCancel, isProcessing, submitText }) {
    const [formData, setFormData] = useState({
        email: user?.email || '',
        displayName: user?.displayName || '',
        isAdmin: user?.isAdmin || false,
        isActive: user?.isActive !== undefined ? user.isActive : true,
        level: user?.level || 1,
        points: user?.points || 0
    });

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = () => {
        if (formData.email?.trim() && formData.displayName?.trim()) {
            onSubmit({
                ...formData,
                email: formData.email.trim(),
                displayName: formData.displayName.trim(),
                level: parseInt(formData.level) || 1,
                points: parseInt(formData.points) || 0
            });
        }
    };

    const isValid = formData.email?.trim() && formData.displayName?.trim();

    if (isProcessing) {
        return (
            <div className="modal-overlay">
                <div className="modal-backdrop"></div>
                <div className="modal-content max-w-sm">
                    <div className="text-center py-8">
                        <div className="login-spinner mx-auto mb-4"></div>
                        <h2 className="text-lg font-semibold">Updating User...</h2>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="modal-overlay">
            <div className="modal-backdrop" onClick={onCancel}></div>
            <div className="modal-content max-w-lg">
                <div className="modal-header gap-6">
                    <h2 className="modal-title">Edit User</h2>
                    <button className="modal-close" onClick={onCancel}>
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="form-field">
                        <label className="form-label">Email Address</label>
                        <input
                            className="form-input"
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            placeholder="Enter email address"
                            disabled={true} // Email usually shouldn't be editable
                        />
                        <p className="text-xs text-slate-500 mt-1">Email cannot be changed for security reasons</p>
                    </div>

                    <div className="form-field">
                        <label className="form-label">Display Name</label>
                        <input
                            className="form-input"
                            type="text"
                            value={formData.displayName}
                            onChange={(e) => handleInputChange('displayName', e.target.value)}
                            placeholder="Enter display name"
                            maxLength={100}
                        />
                    </div>

                    <div className="grid-2 gap-4">
                        <div className="form-field">
                            <label className="form-label">Level</label>
                            <input
                                className="form-input"
                                type="number"
                                value={formData.level}
                                onChange={(e) => handleInputChange('level', e.target.value)}
                                placeholder="User level"
                                min="1"
                                max="100"
                            />
                        </div>

                        <div className="form-field">
                            <label className="form-label">Points</label>
                            <input
                                className="form-input"
                                type="number"
                                value={formData.points}
                                onChange={(e) => handleInputChange('points', e.target.value)}
                                placeholder="User points"
                                min="0"
                            />
                        </div>
                    </div>

                </div>

                <div className="flex gap-3 justify-end pt-4">
                    <button className="btn-secondary" onClick={onCancel}>
                        Cancel
                    </button>
                    <button
                        className="btn-primary"
                        onClick={handleSubmit}
                        disabled={!isValid}
                    >
                        {submitText}
                    </button>
                </div>
            </div>
        </div>
    );
}

// User Detail Popup Component
function UserDetailPopup({ user, onClose, onUserUpdated }) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [showEditPopup, setShowEditPopup] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    const formatDate = (ts) => {
        if (!ts) return 'N/A';
        try {
            let date;
            if (ts instanceof Date) {
                date = ts;
            } else if (typeof ts === 'number') {
                date = new Date(ts);
            } else if (ts.seconds) {
                date = new Date(ts.seconds * 1000);
            } else if (ts.toDate && typeof ts.toDate === 'function') {
                date = ts.toDate();
            } else {
                date = new Date(ts);
            }
            
            if (isNaN(date.getTime())) {
                return 'Invalid Date';
            }
            
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'Invalid Date';
        }
    };

    const handleDeleteUser = async () => {
        const confirmDelete = confirm(`Are you sure you want to delete user "${user.displayName || user.email}"? This action cannot be undone.`);
        if (!confirmDelete) return;

        setIsProcessing(true);
        try {
            await UserManagementSystem.deleteUser(user.uid);
            onUserUpdated();
            onClose();
        } catch (error) {
            console.error('Failed to delete user:', error);
            alert('Failed to delete user: ' + error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleUpdateUser = async (userData) => {
        setIsUpdating(true);
        try {
            await UserManagementSystem.updateUser(user.uid, userData);
            setShowEditPopup(false);
            onUserUpdated();
        } catch (error) {
            console.error('Failed to update user:', error);
            alert('Failed to update user: ' + error.message);
        } finally {
            setIsUpdating(false);
        }
    };

    const toggleAdminStatus = async () => {
        const action = user.isAdmin ? 'remove admin privileges from' : 'grant admin privileges to';
        const confirmToggle = confirm(`Are you sure you want to ${action} "${user.displayName || user.email}"?`);
        if (!confirmToggle) return;

        setIsProcessing(true);
        try {
            await UserManagementSystem.updateUser(user.uid, { isAdmin: !user.isAdmin });
            onUserUpdated();
        } catch (error) {
            console.error('Failed to update admin status:', error);
            alert('Failed to update admin status: ' + error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const toggleActiveStatus = async () => {
        const action = user.isActive ? 'deactivate' : 'activate';
        const confirmToggle = confirm(`Are you sure you want to ${action} "${user.displayName || user.email}"?`);
        if (!confirmToggle) return;

        setIsProcessing(true);
        try {
            await UserManagementSystem.deleteUser(user.uid);
            onUserUpdated();
        } catch (error) {
            console.error('Failed to update active status:', error);
            alert('Failed to update active status: ' + error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-backdrop" onClick={onClose}></div>
            <div className="modal-content max-w-2xl">
                <div className="modal-header gap-6">
                    <h2 className="modal-title">User Details</h2>
                    <button className="modal-close" onClick={onClose}>
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-8">
                    {/* User Overview */}
                    <div className="card">
                        <div className="flex items-start gap-6">
                            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
                                {user.isAdmin ? (
                                    <Crown className="w-8 h-8 text-yellow-300" />
                                ) : (
                                    <Users className="w-8 h-8 text-white" />
                                )}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <h3 className="text-xl font-bold text-gradient">
                                        {user.displayName || 'No Display Name'}
                                    </h3>
                                    {user.isAdmin && (
                                        <span className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full text-xs font-medium">
                                            Admin
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 text-slate-300 mb-3">
                                    <Mail className="w-4 h-4" />
                                    <span>{user.email}</span>
                                </div>
                                <div className="grid-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-slate-400">ID:</span>
                                        <span className="text-slate-300 ml-2 font-mono">{user.uid}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400">Status:</span>
                                        <span className={`text-slate-300 ml-2 ${user.isActive ? 'text-green-400' : 'text-red-400'}`}>
                                            {user.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400">Created:</span>
                                        <span className="text-slate-300 ml-2">{formatDate(user.createdAt)}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400">Last Updated:</span>
                                        <span className="text-slate-300 ml-2">{formatDate(user.updatedAt)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* User Statistics */}
                    <div className="grid-3 gap-4  mt-4">
                        <div className="card text-center">
                            <div className="text-2xl font-bold text-gradient">
                                {user.level || 1}
                            </div>
                            <div className="text-sm text-slate-400">Level</div>
                        </div>
                        <div className="card text-center">
                            <div className="text-2xl font-bold text-gradient">
                                {user.points || 0}
                            </div>
                            <div className="text-sm text-slate-400">Points</div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-4  mt-4">
                        <div className="flex gap-3">
                            <button
                                className={`btn-${user.isAdmin ? 'secondary' : 'primary'} flex items-center gap-2`}
                                onClick={toggleAdminStatus}
                                disabled={isProcessing}
                            >
                                <Crown className="w-4 h-4" />
                                {user.isAdmin ? 'Remove Admin' : 'Make Admin'}
                            </button>
                            
                            <button
                                className={`btn-${user.isActive ? 'secondary' : 'primary'} flex items-center gap-2`}
                                onClick={toggleActiveStatus}
                                disabled={isProcessing}
                            >
                                <UserCheck className="w-4 h-4" />
                                {user.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                        </div>
                        
                        <div className="flex justify-end gap-3 pt-6">

                            <button 
                        className="btn-secondary" 
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                            <button
                                className="btn-primary flex items-center gap-2"
                                onClick={() => setShowEditPopup(true)}
                                disabled={isProcessing}
                            >
                                <Edit className="w-4 h-4" />
                                Edit User
                            </button>
                            <button
                                className="btn-danger flex items-center gap-2"
                                onClick={handleDeleteUser}
                                disabled={isProcessing}
                            >
                                <Trash2 className="w-4 h-4" />
                                {isProcessing ? 'Deleting...' : 'Delete User'}
                            </button>
                        </div>
                    </div>
                </div>

                {showEditPopup && (
                    <EditUserForm
                        user={user}
                        onSubmit={handleUpdateUser}
                        onCancel={() => setShowEditPopup(false)}
                        isProcessing={isUpdating}
                        submitText="Update User"
                    />
                )}
            </div>
        </div>
    );
}

// Main User Manager Page Component
function UserManagerPage({ user: currentUser }) {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const loadUsers = async () => {
        setIsLoading(true);
        try {
            const userData = await UserManagementSystem.getAllActiveUsers();
            setUsers(userData);

            if (selectedUser) {
                const updatedSelected = userData.find(u => u.uid === selectedUser.uid);
                setSelectedUser(updatedSelected || null);
            }
        } catch (error) {
            console.error('Failed to load users:', error);
            setUsers([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const filteredUsers = users.filter(user =>
        user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const adminCount = users.filter(user => user.isAdmin).length;
    const regularUserCount = users.filter(user => !user.isAdmin).length;

    const stats = [
        { value: users.length, label: 'Total Users' },
        { value: adminCount, label: 'Administrators' },
        { value: regularUserCount, label: 'Regular Users' }
    ];

    const renderUserCards = () => {
        return filteredUsers.map(user => (
            <AdminCard
                key={user.uid}
                onClick={() => setSelectedUser(user)}
            >
                <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
                        {user.isAdmin ? (
                            <Crown className="w-6 h-6 text-yellow-300" />
                        ) : (
                            <Users className="w-6 h-6 text-white" />
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gradient truncate">
                                {user.displayName || 'No Display Name'}
                            </h3>
                            {user.isAdmin && (
                                <span className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full text-xs">
                                    Admin
                                </span>
                            )}
                            {!user.isActive && (
                                <span className="bg-red-500/20 text-red-400 px-2 py-1 rounded-full text-xs">
                                    Inactive
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-slate-300 mb-2">{user.email}</p>
                        <div className="flex items-center gap-4 text-xs text-slate-400 mb-2">
                            <span>Level {user.level || 1}</span>
                            <span>{user.points || 0} points</span>
                            <span>{user.workouts?.length || 0} workouts</span>
                        </div>
                    </div>
                </div>
            </AdminCard>
        ));
    };

    return (
        <>
            <AdminPageLayout
                title="User Manager"
                stats={stats}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                searchPlaceholder="Search users by name or email..."
                showCreateButton={false}
                isLoading={isLoading}
                emptyMessage="No users found."
                contentGridClass="grid-2 gap-6"
            >
                {renderUserCards()}
            </AdminPageLayout>

            {/* Modal */}
            {selectedUser && (
                <UserDetailPopup
                    user={selectedUser}
                    onClose={() => setSelectedUser(null)}
                    onUserUpdated={loadUsers}
                />
            )}
        </>
    );
}

export default UserManagerPage;
