import { useState, useEffect } from 'react';
import '../components/styles/LayoutElements.css';
import WorkoutManager from '../services/firebase/WorkoutManagement';
import StationManager from '../services/firebase/StationManagement';

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

// Renamed from AddExerciseForm to ExerciseForm and adapted for both creating and editing.
function ExerciseForm({
    exerciseToEdit = null,
    onSubmit,
    onCancel,
    isProcessing,
    submitText,
    stations
}) {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        points: 0,
        calories: 0,
        heartRateAvg: 0,
        stationId: '',
    });

    // Effect to populate form when editing an existing exercise.
    useEffect(() => {
        if (exerciseToEdit) {
            setFormData({
                name: exerciseToEdit.name || '',
                description: exerciseToEdit.description || '',
                points: exerciseToEdit.points || 0,
                calories: exerciseToEdit.calories || 0,
                heartRateAvg: exerciseToEdit.heartRateAvg || 0,
                stationId: exerciseToEdit.stationId || '',
            });
        }
    }, [exerciseToEdit]);


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
                heartRateAvg: parseInt(formData.heartRateAvg, 10) || 0,
                stationId: formData.stationId || null,
            };
            // Include the original UID when updating an exercise.
            if (exerciseToEdit) {
                submitData.uid = exerciseToEdit.uid;
            }
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
                    <h2>{exerciseToEdit ? 'Updating' : 'Adding'} Exercise...</h2>
                </div>
            </div>
        );
    }
    
    const inputFields = [
        { key: 'name', label: 'Name', type: 'text', maxLength: 50, placeholder: 'Enter exercise name' },
        { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Enter description' },
        { key: 'points', label: 'Points', type: 'number', min: 0, placeholder: 'Enter points for completing' },
        { key: 'calories', label: 'Calories', type: 'number', min: 0, placeholder: 'Enter calories' },
        { key: 'heartRateAvg', label: 'Heartrate Avg', type: 'number', min: 0, placeholder: 'Enter heartRateAvg' },
        { key: 'stationId', label: 'Station', type: 'select', placeholder: 'Select Station...' },
    ];

    return (
        <div className='PopupBackground'>
            <div className='LargePopupContainer'>
                <h2 style={{ margin: '20px 0', textAlign: 'center' }}>
                    {exerciseToEdit ? 'Edit Exercise' : 'Add New Exercise'}
                </h2>
                <div className='BadgeCreateContent'>
                    <div className='BadgeInputSection'>
                        {inputFields.map(field => (
                            <div key={field.key} className='BadgeInputGroup'>
                                <label className='BadgeInputLabel'>{field.label}</label>
                                {field.type === 'select' ? (
                                    <select
                                        className='Input'
                                        value={formData[field.key]}
                                        onChange={(e) => handleInputChange(field.key, e.target.value)}
                                    >
                                        <option value="" disabled>{field.placeholder}</option>
                                        {stations && stations.map(station => (
                                            <option key={station.uid} value={station.uid}>
                                                {station.name}
                                            </option>
                                        ))}
                                    </select>
                                ) : field.type === 'textarea' ? (
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

// Popup to show workout details and exercises
function WorkoutDetailPopup({ workout, onClose, onWorkoutUpdated, user, stations }) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [showEditPopup, setShowEditPopup] = useState(false);
    const [showAddExercisePopup, setShowAddExercisePopup] = useState(false);
    // State to manage editing a specific exercise.
    const [editingExercise, setEditingExercise] = useState(null); 
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (showEditPopup || showAddExercisePopup || editingExercise) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showEditPopup, showAddExercisePopup, editingExercise, onClose]);

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
        setIsSubmitting(true);
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
            setIsSubmitting(false);
        }
    };

    // Logic to handle both creation and updates of exercises.
    const handleExerciseSubmit = async (exerciseData) => {
        setIsSubmitting(true);
        try {
            if (editingExercise) { // This is an update
                await WorkoutManager.updateExercise(user.uid, workout.uid, exerciseData);
            } else { // This is a new exercise
                await WorkoutManager.addExercise(user.uid, workout.uid, exerciseData);
            }
            setEditingExercise(null);
            setShowAddExercisePopup(false);
            onWorkoutUpdated();
        } catch (error) {
            console.error('Failed to save exercise:', error);
            alert('Failed to save exercise: ' + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    // Function to handle deleting an exercise.
    const handleDeleteExercise = async (exerciseId) => {
        if (confirm('Are you sure you want to delete this exercise?')) {
            setIsProcessing(true);
            try {
                await WorkoutManager.deleteExercise(user.uid, workout.uid, exerciseId);
                onWorkoutUpdated();
            } catch (error) {
                console.error('Failed to delete exercise:', error);
                alert('Failed to delete exercise: ' + error.message);
            } finally {
                setIsProcessing(false);
            }
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
                        <h3 style={{ color: 'var(--main-color)', marginBottom: '10px' }}>Exercises</h3>
                        <div className="StationList" style={{ maxHeight: '200px', overflowY: 'auto', paddingRight: '10px' }}>
                            {workout.exercises && workout.exercises.length > 0 ? (
                                [...workout.exercises]
                                    .sort((a, b) => (b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0) - (a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0))
                                    .map(exercise => {
                                        // Find the station name from the stations list.
                                        const station = stations.find(s => s.uid === exercise.stationId);
                                        return (
                                            <div key={exercise.uid} className="StationItem" style={{ border: '1px solid #444', borderRadius: '8px', padding: '10px', marginBottom: '10px', background: '#2C2C2C' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <strong style={{ color: '#E5E5E5' }}>{exercise.name}</strong>
                                                    {/* Edit and Delete buttons for each exercise */}
                                                    <div className='ActionButtons'>
                                                         <button onClick={() => setEditingExercise(exercise)} style={{marginRight: '10px'}}>Edit</button>
                                                         <button onClick={() => handleDeleteExercise(exercise.uid)}>Delete</button>
                                                    </div>
                                                </div>
                                                <p style={{ margin: '5px 0', color: '#A0A0A0' }}>{exercise.description || 'No description.'}</p>
                                                <div style={{ fontSize: '12px', color: '#A0A0A0' }}>
                                                    Points: {exercise.points || 0}
                                                    {/* Display station name if available */}
                                                    {station && ` | Station: ${station.name}`}
                                                </div>
                                            </div>
                                        );
                                    })
                            ) : (
                                <p style={{ color: '#A0A0A0' }}>No exercises have been added to this workout yet.</p>
                            )}
                        </div>
                        <button
                            className='AdminActionButton'
                            style={{ marginTop: '10px' }}
                            onClick={() => setShowAddExercisePopup(true)}
                            disabled={isProcessing}
                        >
                            Add New Exercise
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
                        isProcessing={isSubmitting}
                        submitText="Update Workout"
                    />
                )}

                {(showAddExercisePopup || editingExercise) && (
                    <ExerciseForm
                        exerciseToEdit={editingExercise}
                        onSubmit={handleExerciseSubmit}
                        onCancel={() => { setShowAddExercisePopup(false); setEditingExercise(null); }}
                        isProcessing={isSubmitting}
                        submitText={editingExercise ? "Update Exercise" : "Add Exercise"}
                        stations={stations}
                    />
                )}
            </div>
        </div>
    );
}

function WorkoutManagerPage({ user }) {
    const [workouts, setWorkouts] = useState([]);
    const [stations, setStations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedWorkout, setSelectedWorkout] = useState(null);
    const [showCreatePopup, setShowCreatePopup] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const workoutData = await WorkoutManager.loadWorkouts(user.uid);
            setWorkouts(workoutData);

            const stationData = await StationManager.loadAll();
            setStations(stationData);

            if (selectedWorkout) {
                const updatedSelectedWorkout = workoutData.find(w => w.uid === selectedWorkout.uid);
                if (updatedSelectedWorkout) {
                    setSelectedWorkout(updatedSelectedWorkout);
                } else {
                    setSelectedWorkout(null);
                }
            }
        } catch (error) {
            console.error('Failed to load data:', error);
            setWorkouts([]);
            setStations([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user?.uid) {
            loadData();
        }
    }, [user]);

    const handleWorkoutCreation = async (data) => {
        setIsCreating(true);
        try {
            data.userId = user.uid;
            await WorkoutManager.saveWorkout(data);
            setShowCreatePopup(false);
            await loadData();
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
                    Exercises: {workout.exercises?.length || 0}
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
                    onWorkoutUpdated={loadData}
                    user={user}
                    stations={stations}
                />
            )}
        </div>
    );
}

export default WorkoutManagerPage;