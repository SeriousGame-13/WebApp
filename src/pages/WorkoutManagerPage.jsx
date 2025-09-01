import { useState, useEffect } from 'react';
import '../components/styles/LayoutElements.css';
import WorkoutManager from '../services/firebase/WorkoutManagement';
import StationManager from '../services/firebase/StationManagement';
import { Workout } from '../services/interfaces/workout';
import { Timestamp } from 'firebase/firestore';

function localDateTimeStringToTimestamp(value) {
    const [date, time] = value.split('T');
    const [year, month, day] = date.split('-').map(Number);
    const [hour, minute] = time.split(':').map(Number);
    const localDate = new Date(year, month - 1, day, hour, minute); // interpreted in local timezone
    return Timestamp.fromDate(localDate);
}

const localISODateTime = (date) => {
    date = date?.toDate ? date.toDate() : (date instanceof Date ? date : new Date());
    const pad = (n) => n.toString().padStart(2, '0');
    const y = date.getFullYear();
    const m = pad(date.getMonth() + 1);
    const d = pad(date.getDate());
    const h = pad(date.getHours());
    const min = pad(date.getMinutes());
    return `${y}-${m}-${d}T${h}:${min}`;
};


function EditWorkoutForm({ workout = null, onSubmit, onCancel, isProcessing, submitText }) {
    // This array is now the single source of truth for the form's structure.
    const inputFields = [
        { key: 'name', label: 'Name', type: 'text', maxLength: 50, placeholder: 'Enter name' },
        { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Enter description' },
        { key: 'startTime', label: 'Start Time', type: 'datetime-local' },
        { key: 'endTime', label: 'End Time', type: 'datetime-local' },
        { key: 'heartRateMax', label: 'Max Heart Rate', type: 'number', min: 0, placeholder: 'Enter max heart rate' },
        { key: 'heartRateMin', label: 'Min Heart Rate', type: 'number', min: 0, placeholder: 'Enter min heart rate' },
    ];

    // The initial state is generated dynamically from the inputFields array.
    const [formData, setFormData] = useState(() => {
        return inputFields.reduce((acc, field) => {
            const sourceValue = workout?.[field.key];
            if (field.type === 'datetime-local' && sourceValue?.toDate) {
                acc[field.key] = localISODateTime(sourceValue);
            } else if (field.type === 'datetime-local' && !sourceValue) {
                acc[field.key] = localISODateTime(new Date());
            } else {
                acc[field.key] = sourceValue ?? (field.type === 'number' ? 0 : '');
            }
            return acc;
        }, {});
    });

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // The submission data is generated dynamically from the inputFields array.
    const handleSubmit = () => {
        if (formData.name && formData.name.trim()) {
            const submitData = inputFields.reduce((acc, field) => {
                const value = formData[field.key];
                if (field.type === 'number') {
                    acc[field.key] = parseInt(value, 10) || 0;
                } else if (field.type === 'datetime-local') {
                    acc[field.key] = value ? localDateTimeStringToTimestamp(value) : null;
                } else if (typeof value === 'string') {
                    acc[field.key] = value.trim();
                } else {
                    acc[field.key] = value;
                }
                return acc;
            }, {});
            onSubmit(submitData);
        }
    };

    const isValid = formData.name?.trim() !== '';

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

    return (
        <div className='PopupBackground'>
            <div className='LargePopupContainer'>
                <h2 style={{ margin: '20px 0', textAlign: 'center' }}>
                    {workout ? 'Edit' : 'Create New'} Workout
                </h2>
                <div className='BadgeCreateContent' style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '15px' }}>
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
                                        disabled={field.disabled || false}
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


function ExerciseForm({
    exerciseToEdit = null,
    onSubmit,
    onCancel,
    isProcessing,
    submitText,
    stations
}) {
    // This array is the single source of truth for the exercise form.
    const inputFields = [
        { key: 'name', label: 'Name', type: 'text', maxLength: 50, placeholder: 'Enter exercise name' },
        { key: 'stationId', label: 'Station', type: 'select', placeholder: 'Select Station...' },
        { key: 'startTime', label: 'Start Time', type: 'datetime-local' },
        { key: 'endTime', label: 'End Time', type: 'datetime-local' },
        { key: 'points', label: 'Points', type: 'number', min: 0, placeholder: 'Enter points for completing' },
        { key: 'calories', label: 'Calories', type: 'number', min: 0, placeholder: 'Enter calories' },
        { key: 'heartRateAvg', label: 'Avg Heart Rate', type: 'number', min: 0, placeholder: 'Enter avg heart rate' },
        { key: 'heartRateMax', label: 'Max Heart Rate', type: 'number', min: 0, placeholder: 'Enter max heart rate' },
        { key: 'heartRateMin', label: 'Min Heart Rate', type: 'number', min: 0, placeholder: 'Enter min heart rate' },
    ];

    // The initial state is generated dynamically from the inputFields array.
    const [formData, setFormData] = useState(() => {
        return inputFields.reduce((acc, field) => {
            const sourceValue = exerciseToEdit?.[field.key];
            if (field.type === 'datetime-local' && sourceValue?.toDate) {
                acc[field.key] = localISODateTime(sourceValue);
            } else if (field.type === 'datetime-local' && !sourceValue) {
                acc[field.key] = localISODateTime(new Date());
            } else {
                acc[field.key] = sourceValue ?? (field.type === 'number' ? 0 : '');
            }
            return acc;
        }, {});
    });


    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // The submission data is generated dynamically from the inputFields array.
    const handleSubmit = () => {
        if (formData.name && formData.name.trim()) {
            const submitData = inputFields.reduce((acc, field) => {
                const value = formData[field.key];
                if (field.type === 'number') {
                    acc[field.key] = parseInt(value, 10) || 0;
                } else if (field.type === 'datetime-local') {
                    acc[field.key] = value ? localDateTimeStringToTimestamp(value) : null;
                } else if (field.key === 'stationId') {
                    acc[field.key] = value || null;
                } else if (typeof value === 'string') {
                    acc[field.key] = value.trim();
                } else {
                    acc[field.key] = value;
                }
                return acc;
            }, {});

            if (exerciseToEdit) {
                submitData.uid = exerciseToEdit.uid;
            }
            onSubmit(submitData);
        }
    };

    const isValid = formData.name?.trim() !== '';

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

    return (
        <div className='PopupBackground'>
            <div className='LargePopupContainer'>
                <h2 style={{ margin: '20px 0', textAlign: 'center' }}>
                    {exerciseToEdit ? 'Edit Exercise' : 'Add New Exercise'}
                </h2>
                <div className='BadgeCreateContent' style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '15px' }}>
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


function WorkoutDetailPopup({ workout, onClose, onWorkoutUpdated, user, stations }) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [showEditPopup, setShowEditPopup] = useState(false);
    const [showAddExercisePopup, setShowAddExercisePopup] = useState(false);
    const [editingExercise, setEditingExercise] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    workout = Workout.fromJSON(workout);

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
                ...updates,
                uid: workout.uid,
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


    const handleExerciseSubmit = async (exerciseData) => {
        setIsSubmitting(true);
        try {
            if (editingExercise) {
                await WorkoutManager.updateExercise(user.uid, workout.uid, exerciseData);
            } else {
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
                        {workout.startTime && (() => { const bm = new BaseModel({ createdAt: workout.startTime }); return <div>Created: {bm.getCreateAt()}</div>; })()}
                        <div>Active Time: {workout.formatDuration(workout.activeTime * 1000) || 0}</div>
                        <div>Idle Time: {workout.formatDuration(workout.idleTime * 1000) || 0}</div>
                    </div>

                    <div className="StationsSection" style={{ marginTop: '20px', textAlign: 'left' }}>
                        <h3 style={{ color: 'var(--main-color)', marginBottom: '10px' }}>Exercises</h3>
                        <div className="StationList" style={{ maxHeight: '200px', overflowY: 'auto', paddingRight: '10px' }}>
                            {workout.exercises && workout.exercises.length > 0 ? (
                                [...workout.exercises]
                                    .sort((a, b) => (b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0) - (a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0))
                                    .map(exercise => {

                                        const station = stations.find(s => s.uid === exercise.stationId);
                                        return (
                                            <div key={exercise.uid} className="StationItem" style={{ border: '1px solid #444', borderRadius: '8px', padding: '10px', marginBottom: '10px', background: '#2C2C2C' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <strong style={{ color: '#E5E5E5' }}>{exercise.name}</strong>
                                                    {/* Edit and Delete buttons for each exercise */}
                                                    <div className='ActionButtons'>
                                                        <button onClick={() => setEditingExercise(exercise)} style={{ marginRight: '10px' }}>Edit</button>
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
                className="CardContainer"
                onClick={() => setSelectedWorkout(workout)}
            >
                <div className="CardHeader" style={{ color: 'var(--main-color)' }}>
                    {workout.name}
                </div>
                <div className="CardContents">
                    {workout.description || 'No description available.'}
                </div>
                <div className="CardContents">
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