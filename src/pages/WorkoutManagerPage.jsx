import { useState, useEffect } from 'react';
import '../components/styles/LayoutElements.css';
import RewardSystem from '../services/firebase/RewardSystem';
import WorkoutManager from '../services/firebase/WorkoutManagement';

// Shared Workout Form Component
function BadgeForm({ badge = null, onSubmit, onCancel, isProcessing, submitText }) {
    const [formData, setFormData] = useState({
        name: badge?.name || '',
        description: badge?.description || '',
        rewardPoints: badge?.rewardPoints || 0,
        imageData: null
    });

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };



    const handleSubmit = () => {
        if (formData.name.trim() && formData.rewardPoints >= 0) {
            const submitData = {
                ...formData,
                name: formData.name.trim(),
                description: formData.description.trim(),
                rewardPoints: parseInt(formData.rewardPoints)
            };
            onSubmit(submitData);
        }
    };

    const isValid = formData.name.trim() && formData.rewardPoints >= 0;

    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                if (isValid && !isProcessing) {
                    handleSubmit();
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                onCancel(); // nur das Formular schließen
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isValid, isProcessing, formData]);



    if (isProcessing) {
        return (
            <div className='PopupBackground'>
                <div className='PopupContainer'>
                    <h2>{badge ? 'Updating' : 'Creating'} Workout...</h2>
                </div>
            </div>
        );
    }

    const inputFields = [
        { key: 'name', label: 'Name', type: 'text', maxLength: 50, placeholder: 'Enter name' },
        { key: 'description', label: 'Description', type: 'text', maxLength: 200, placeholder: 'Enter description' },
    ];

    return (
        <div className='PopupBackground'>
            <div className='LargePopupContainer'>
                <h2 style={{ margin: '20px 0', textAlign: 'center' }}>
                    {badge ? 'Edit' : 'Create New'} Workout
                </h2>

                <div className='BadgeCreateContent'>
                    <div className='BadgeInputSection'>
                        {inputFields.map(field => (
                            <div key={field.key} className='BadgeInputGroup'>
                                <label className='BadgeInputLabel'>{field.label}</label>
                                {field.type === 'textarea' ? (
                                    <textarea
                                        className='Input'
                                        value={formData[field.key]}
                                        onChange={(e) => handleInputChange(field.key, e.target.value)}
                                        placeholder={field.placeholder}
                                        rows={field.rows}
                                        style={{ resize: 'vertical' }}
                                    />
                                ) : (
                                    <input
                                        className='Input'
                                        type={field.type}
                                        value={formData[field.key]}
                                        onChange={(e) => handleInputChange(field.key, e.target.value)}
                                        placeholder={field.placeholder}
                                        maxLength={field.maxLength}
                                        min={field.min}
                                    />
                                )}
                            </div>
                        ))}

                    </div>


                </div>

                <div className='BadgeCreateFooter'>
                    <div className='Line'></div>
                    <div className='Buttonfield'>
                        <button className='CancelButton' onClick={onCancel}>
                            Cancel
                        </button>
                        <button
                            className='ConfirmButton'
                            onClick={handleSubmit}
                            disabled={!isValid}
                        >
                            {submitText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function AdminBadgeDetailPopup({ badge: object, onClose, onBadgeUpdated, user }) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [showEditPopup, setShowEditPopup] = useState(false);
    const [isUpdatingBadge, setIsUpdatingBadge] = useState(false);

    useEffect(() => {
        if (showEditPopup) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                onClose(); // gesamtes Popup schließen
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showEditPopup]);






    const handleDeleteBadge = async () => {
        const confirmDelete = confirm(`Are you sure you want to delete the badge "${object.name}"? This action cannot be undone.`);
        if (!confirmDelete) return;

        setIsProcessing(true);
        try {
            await WorkoutManager.deleteWorkout(user.uid, object.uid);
            onBadgeUpdated();
            onClose();
        } catch (error) {
            console.error('Failed to delete badge:', error);
            alert('Failed to delete badge: ' + error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleUpdateBadge = async (updates) => {
        setIsUpdatingBadge(true);
        try {
            await WorkoutManager.update({
                uid: object.uid,
                name: updates.name,
                description: updates.description,
                userId: user.uid
            });

            setShowEditPopup(false);
            onBadgeUpdated();
            onClose();
        } catch (error) {
            console.error('Failed to update badge:', error);
            alert('Failed to update badge: ' + error.message);
        } finally {
            setIsUpdatingBadge(false);
        }
    };
    return (
        <div className='PopupBackground'>
            <div className='LargePopupContainer'>
                <h2 style={{ textAlign: 'center' }}>Editing</h2>

                <div className='GroupDetailContainer'>
                    <div className='BadgeDetailHeader'>
                        <div className='BadgeInfoContainer'>
                            <div className='BadgeDetailTitle' style={{ color: 'var(--main-color)' }}>
                                {object.name}
                            </div>
                        </div>
                    </div>

                    <div className='GroupDetailDescription' style={{ textAlign: 'left' }}>
                        {object.description || 'No description available.'}
                    </div>

                    <div className='GroupDetailInfo' style={{ textAlign: 'left' }}>
                        <div>Workout ID: {object.uid}</div>
                        <div>StartTime: {object.startTime.toDate().toLocaleDateString()} {object.startTime.toDate().toLocaleTimeString()}</div>
                    </div>

                    <div className="GroupActionButtons" style={{ marginTop: '40px' }}>
                        <button
                            className='AdminActionButton'
                            onClick={() => setShowEditPopup(true)}
                            disabled={isProcessing}
                        >
                            Edit Workout
                        </button>
                        <button
                            className='GroupActionButton'
                            onClick={handleDeleteBadge}
                            disabled={isProcessing}
                        >
                            {isProcessing ? 'Deleting...' : 'Delete Workout'}
                        </button>
                    </div>
                </div>

                <div className='Line'></div>
                <div className='Buttonfield'>
                    <button className='CancelButton' onClick={onClose}>Close</button>
                </div>

                {showEditPopup && (
                    <BadgeForm
                        badge={object}
                        onSubmit={handleUpdateBadge}
                        onCancel={() => setShowEditPopup(false)}
                        isProcessing={isUpdatingBadge}
                        submitText="Update Workout"
                    />
                )}
            </div>
        </div>
    );
}

function WorkoutManagerPage({ user }) {
    const [allObjs, setAll] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedObject, setSelected] = useState(null);
    const [showCreatePopup, setShowCreatePopup] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        loadAll();
    }, []);

    const loadAll = async () => {
        try {
            setIsLoading(true);
            const data = await WorkoutManager.loadWorkouts(user.uid);
            setAll(data);
        } catch (error) {
            console.error('Failed to load all:', error);
            setAll([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleBadgeCreation = async (data) => {
        setIsCreating(true);
        try {
            data.userId = user.uid;
            await WorkoutManager.saveWorkout(data);
            setShowCreatePopup(false);
            await loadAll();
        } catch (error) {
            console.error('Failed to create badge:', error);
            alert('Failed to create badge: ' + error.message);
        } finally {
            setIsCreating(false);
        }
    };

    const renderList = () => {
        if (isLoading) {
            return <div style={{ color: '#A0A0A0', textAlign: 'center', padding: '20px' }}>Loading...</div>;
        }

        if (allObjs.length === 0) {
            return <div style={{ color: '#A0A0A0', textAlign: 'center', padding: '20px' }}>No Badges Found</div>;
        }

        return allObjs.map(object => (
            <div
                key={object.uid || `badge-${Math.random()}`}
                className="GroupExerciseContainer"
                onClick={() => setSelected(object)}
            >
                <div className="GroupExerciseHeader" style={{ color: 'var(--main-color)' }}>
                    {object.name} <span style={{ fontSize: '12px' }}>({object.rarity})</span>
                </div>
                <div className="GroupExerciseContents">
                    {object.description || 'No description available.'}
                </div>
                <div style={{ margin: '0 16px 16px 16px', fontSize: '12px', color: '#A0A0A0' }}>
                    Workout ID: {object.uid} | Reward Points: {object.rewardPoints}
                </div>
            </div>
        ));
    };

    return (
        <div className="AppContents">
            <h2 style={{ color: '#E5E5E5', margin: '0 0 20px 0' }}>Workout Manager</h2>

            <div className="AdminGroupContainer">
                <div className="GuideText">All Badges</div>

                {renderList()}

                <button
                    className="AdminActionButton"
                    onClick={() => setShowCreatePopup(true)}
                >
                    Create New Workout
                </button>
            </div>

            {showCreatePopup && (
                <BadgeForm
                    onSubmit={handleBadgeCreation}
                    onCancel={() => setShowCreatePopup(false)}
                    isProcessing={isCreating}
                    submitText="Create Workout"
                />
            )}

            {selectedObject && (
                <AdminBadgeDetailPopup
                    badge={selectedObject}
                    onClose={() => setSelected(null)}
                    onBadgeUpdated={loadAll}
                    user={user}
                />
            )}
        </div>
    );
}

export default WorkoutManagerPage;