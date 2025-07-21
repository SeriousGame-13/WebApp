import { useState, useEffect } from 'react';
import '../components/styles/LayoutElements.css';
import WorkoutManager from '../services/firebase/WorkoutManagement';

// Form for creating/editing a Workout
function EditWorkoutForm({ workout = null, onSubmit, onCancel, isProcessing, submitText }) {
    const [formData, setFormData] = useState({
        name: workout?.name || '',
        description: workout?.description || '',
    });

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = () => {
        if (formData.name.trim()) {
            onSubmit({
                ...formData,
                name: formData.name.trim(),
                description: formData.description.trim(),
            });
        }
    };

    const isValid = formData.name.trim() !== '';

    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                if (isValid && !isProcessing) {
                    handleSubmit();
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                onCancel();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isValid, isProcessing, formData]);

    if (isProcessing) {
        return (
            <div className='PopupBackground'>
                <div className='PopupContainer'>
                    <h2>{workout ? 'Updating' : 'Creating'} Workout...</h2>
                </div>
            </div>
        );
    }

    const inputFields = [
        { key: 'name', label: 'Name', type: 'text', maxLength: 50, placeholder: 'Enter name' },
        { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Enter description' },
    ];

    return (
        <div className='PopupBackground'>
            <div className='LargePopupContainer'>
                <h2 style={{ margin: '20px 0', textAlign: 'center' }}>
                    {workout ? 'Edit' : 'Create New'} Workout
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
                                        rows={4}
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

// Component for adding a station
function AddStationForm({ onSubmit, onCancel, isProcessing, submitText }) {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        points: 0,
        calories: 0,
        heartRateAvg: 0
    });

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = () => {
        if (formData.name.trim()) {
            const submitData = {
                ...formData,
                name: formData.name.trim(),
                description: formData.description.trim(),
                points: parseInt(formData.points, 10) || 0,
                calories: parseInt(formData.calories, 10) || 0,
                heartRateAvg: parseInt(formData.heartRateAvg, 10) || 0
            };
            onSubmit(submitData);
        }
    };

    const isValid = formData.name.trim() !== '';

    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                if (isValid && !isProcessing) {
                    handleSubmit();
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                onCancel();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isValid, isProcessing, formData]);

    if (isProcessing) {
        return (
            <div className='PopupBackground'>
                <div className='PopupContainer'>
                    <h2>Adding Station...</h2>
                </div>
            </div>
        );
    }

    const inputFields = [
        { key: 'name', label: 'Name', type: 'text', maxLength: 50, placeholder: 'Enter station name' },
        { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Enter description' },
        { key: 'points', label: 'Points', type: 'number', min: 0, placeholder: 'Enter points for completing' },
        { key: 'calories', label: 'Calories', type: 'number', min: 0, placeholder: 'Enter calories' },
        { key: 'heartRateAvg', label: 'Heartrate Avg', type: 'number', min: 0, placeholder: 'Enter heartRateAvg' },
    ];

    return (
        <div className='PopupBackground'>
            <div className='LargePopupContainer'>
                <h2 style={{ margin: '20px 0', textAlign: 'center' }}>
                    Add New Station
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
                                        rows={4}
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

// Popup to show workout details and stations
function WorkoutDetailPopup({ workout, onClose, onWorkoutUpdated, user }) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [showEditPopup, setShowEditPopup] = useState(false);
    const [isUpdatingWorkout, setIsUpdatingWorkout] = useState(false);
    const [showAddStationPopup, setShowAddStationPopup] = useState(false);
    const [isAddingStation, setIsAddingStation] = useState(false);

    useEffect(() => {
        if (showEditPopup || showAddStationPopup) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showEditPopup, showAddStationPopup, onClose]);

    const handleDeleteWorkout = async () => {
        if (confirm(`Are you sure you want to delete the workout "${workout.name}"? This action cannot be undone.`)) {
            setIsProcessing(true);
            try {
                await WorkoutManager.deleteWorkout(user.uid, workout.uid);
                onWorkoutUpdated();
                onClose();
            } catch (error) {
                console.error('Failed to delete workout:', error);
                alert('Failed to delete workout: ' + error.message);
            } finally {
                setIsProcessing(false);
            }
        }
    };

    const handleUpdateWorkout = async (updates) => {
        setIsUpdatingWorkout(true);
        try {
            await WorkoutManager.update({
                uid: workout.uid,
                name: updates.name,
                description: updates.description,
                userId: user.uid
            });
            setShowEditPopup(false);
            onWorkoutUpdated();
        } catch (error) {
            console.error('Failed to update workout:', error);
            alert('Failed to update workout: ' + error.message);
        } finally {
            setIsUpdatingWorkout(false);
        }
    };

    const handleAddStation = async (stationData) => {
        setIsAddingStation(true);
        try {
            await WorkoutManager.addStation(user.uid, workout.uid, stationData);
            setShowAddStationPopup(false);
            onWorkoutUpdated();
        } catch (error) {
            console.error('Failed to add station:', error);
            alert('Failed to add station: ' + error.message);
        } finally {
            setIsAddingStation(false);
        }
    };

    return (
        <div className='PopupBackground'>
            <div className='LargePopupContainer'>
                <h2 style={{ textAlign: 'center' }}>Workout Details</h2>
                <div className='GroupDetailContainer'>
                    <div className='BadgeDetailHeader'>
                        <div className='BadgeInfoContainer'>
                            <div className='BadgeDetailTitle' style={{ color: 'var(--main-color)' }}>
                                {workout.name}
                            </div>
                        </div>
                    </div>
                    <div className='GroupDetailDescription' style={{ textAlign: 'left' }}>
                        {workout.description || 'No description available.'}
                    </div>
                    <div className='GroupDetailInfo' style={{ textAlign: 'left' }}>
                        <div>Workout ID: {workout.uid}</div>
                        {workout.startTime && <div>Created: {workout.startTime.toDate().toLocaleString()}</div>}
                    </div>

                    <div className="StationsSection" style={{ marginTop: '20px', textAlign: 'left' }}>
                        <h3 style={{ color: 'var(--main-color)', marginBottom: '10px' }}>Stations</h3>
                        <div className="StationList" style={{ maxHeight: '200px', overflowY: 'auto', paddingRight: '10px' }}>
                            {workout.stations && workout.stations.length > 0 ? (
                                [...workout.stations]
                                    .sort((a, b) => {
                                        // Sortiert die Stationen, neueste zuerst.
                                        const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
                                        const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
                                        return dateB - dateA;
                                    })
                                    .map(station => (
                                    <div key={station.uid} className="StationItem" style={{ border: '1px solid #444', borderRadius: '8px', padding: '10px', marginBottom: '10px', background: '#2C2C2C' }}>
                                        <strong style={{ color: '#E5E5E5' }}>{station.name}</strong>
                                        <p style={{ margin: '5px 0', color: '#A0A0A0' }}>{station.description || 'No description.'}</p>
                                        <div style={{ fontSize: '12px', color: '#A0A0A0' }}>Points: {station.points || 0}</div>
                                    </div>
                                ))
                            ) : (
                                <p style={{ color: '#A0A0A0' }}>No stations have been added to this workout yet.</p>
                            )}
                        </div>
                        <button
                            className='AdminActionButton'
                            style={{ marginTop: '10px' }}
                            onClick={() => setShowAddStationPopup(true)}
                            disabled={isProcessing}
                        >
                            Add New Station
                        </button>
                    </div>

                    <div className="GroupActionButtons" style={{ marginTop: '40px' }}>
                        <button
                            className='AdminActionButton'
                            onClick={() => setShowEditPopup(true)}
                            disabled={isProcessing}
                        >
                            Edit Workout Info
                        </button>
                        <button
                            className='GroupActionButton'
                            onClick={handleDeleteWorkout}
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
                    <EditWorkoutForm
                        workout={workout}
                        onSubmit={handleUpdateWorkout}
                        onCancel={() => setShowEditPopup(false)}
                        isProcessing={isUpdatingWorkout}
                        submitText="Update Workout"
                    />
                )}

                {showAddStationPopup && (
                    <AddStationForm
                        onSubmit={handleAddStation}
                        onCancel={() => setShowAddStationPopup(false)}
                        isProcessing={isAddingStation}
                        submitText="Add Station"
                    />
                )}
            </div>
        </div>
    );
}

function WorkoutManagerPage({ user }) {
    const [workouts, setWorkouts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedWorkout, setSelectedWorkout] = useState(null);
    const [showCreatePopup, setShowCreatePopup] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    const loadWorkouts = async () => {
        setIsLoading(true);
        try {
            const data = await WorkoutManager.loadWorkouts(user.uid);
            setWorkouts(data);

            if (selectedWorkout) {
                const updatedSelectedWorkout = data.find(w => w.uid === selectedWorkout.uid);
                if (updatedSelectedWorkout) {
                    setSelectedWorkout(updatedSelectedWorkout);
                } else {
                    setSelectedWorkout(null);
                }
            }
        } catch (error) {
            console.error('Failed to load workouts:', error);
            setWorkouts([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user?.uid) {
            loadWorkouts();
        }
    }, [user]);

    const handleWorkoutCreation = async (data) => {
        setIsCreating(true);
        try {
            data.userId = user.uid;
            await WorkoutManager.saveWorkout(data);
            setShowCreatePopup(false);
            await loadWorkouts();
        } catch (error) {
            console.error('Failed to create workout:', error);
            alert('Failed to create workout: ' + error.message);
        } finally {
            setIsCreating(false);
        }
    };

    const renderList = () => {
        if (isLoading) {
            return <div style={{ color: '#A0A0A0', textAlign: 'center', padding: '20px' }}>Loading Workouts...</div>;
        }

        if (workouts.length === 0) {
            return <div style={{ color: '#A0A0A0', textAlign: 'center', padding: '20px' }}>No Workouts Found. Create one to get started!</div>;
        }

        return workouts.map(workout => (
            <div
                key={workout.uid}
                className="GroupExerciseContainer"
                onClick={() => setSelectedWorkout(workout)}
            >
                <div className="GroupExerciseHeader" style={{ color: 'var(--main-color)' }}>
                    {workout.name}
                </div>
                <div className="GroupExerciseContents">
                    {workout.description || 'No description available.'}
                </div>
                <div style={{ margin: '0 16px 16px 16px', fontSize: '12px', color: '#A0A0A0' }}>
                    Stations: {workout.stations?.length || 0}
                </div>
            </div>
        ));
    };

    return (
        <div className="AppContents">
            <h2 style={{ color: '#E5E5E5', margin: '0 0 20px 0' }}>Workout Manager</h2>
            <div className="AdminGroupContainer">
                <div className="GuideText">All Workouts</div>
                {renderList()}
                <button
                    className="AdminActionButton"
                    onClick={() => setShowCreatePopup(true)}
                >
                    Create New Workout
                </button>
            </div>

            {showCreatePopup && (
                <EditWorkoutForm
                    onSubmit={handleWorkoutCreation}
                    onCancel={() => setShowCreatePopup(false)}
                    isProcessing={isCreating}
                    submitText="Create Workout"
                />
            )}

            {selectedWorkout && (
                <WorkoutDetailPopup
                    workout={selectedWorkout}
                    onClose={() => setSelectedWorkout(null)}
                    onWorkoutUpdated={loadWorkouts}
                    user={user}
                />
            )}
        </div>
    );
}

export default WorkoutManagerPage;
