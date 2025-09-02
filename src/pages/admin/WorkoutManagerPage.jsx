import { useState, useEffect } from 'react';
import WorkoutManager from '../../services/WorkoutManagement.jsx';
import StationManager from '../../services/StationManagement.jsx';
import { Workout } from '../../services/interfaces/Workout.jsx';
import { Timestamp } from '../../services/firebase/FirebaseHelper.jsx';
import BaseModel from '../../services/interfaces/Base.jsx';
import { AdminPageLayout, AdminCard } from '../../components/ui/AdminComponents.jsx';
import '../../components/styles/sphere-styles.css';
import { Plus, Dumbbell, Edit, Trash2, X, Search, Clock, Activity, Target } from 'lucide-react';

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
            <div className="modal-overlay">
                <div className="modal-backdrop"></div>
                <div className="modal-content max-w-sm">
                    <div className="text-center py-8">
                        <div className="login-spinner mx-auto mb-4"></div>
                        <h2 className="text-lg font-semibold">{workout ? 'Updating' : 'Creating'} Workout...</h2>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="modal-overlay">
            <div className="modal-backdrop" onClick={onCancel}></div>
            <div className="modal-content max-w-2xl">
                <div className="modal-header">
                    <h2 className="modal-title">
                        {workout ? 'Edit' : 'Create New'} Workout
                    </h2>
                    <button className="modal-close" onClick={onCancel}>
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-6 max-h-[60vh] overflow-y-auto">
                    <div className="grid-2 gap-4">
                        {inputFields.map(field => (
                            <div key={field.key} className="form-field">
                                <label className="form-label">{field.label}</label>
                                {field.type === 'textarea' ? (
                                    <textarea
                                        className="form-textarea"
                                        value={formData[field.key]}
                                        onChange={(e) => handleInputChange(field.key, e.target.value)}
                                        placeholder={field.placeholder}
                                        rows={4}
                                    />
                                ) : (
                                    <input
                                        className="form-input"
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

                <div className="flex gap-3 justify-end pt-4 border-t border-white/10">
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
            <div className="modal-overlay">
                <div className="modal-backdrop"></div>
                <div className="modal-content max-w-sm">
                    <div className="text-center py-8">
                        <div className="login-spinner mx-auto mb-4"></div>
                        <h2 className="text-lg font-semibold">{exerciseToEdit ? 'Updating' : 'Adding'} Exercise...</h2>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="modal-overlay">
            <div className="modal-backdrop" onClick={onCancel}></div>
            <div className="modal-content max-w-2xl">
                <div className="modal-header">
                    <h2 className="modal-title">
                        {exerciseToEdit ? 'Edit Exercise' : 'Add New Exercise'}
                    </h2>
                    <button className="modal-close" onClick={onCancel}>
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-6 max-h-[60vh] overflow-y-auto">
                    <div className="grid-2 gap-4">
                        {inputFields.map(field => (
                            <div key={field.key} className="form-field">
                                <label className="form-label">{field.label}</label>
                                {field.type === 'select' ? (
                                    <select
                                        className="form-input"
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
                                        className="form-textarea"
                                        value={formData[field.key]}
                                        onChange={(e) => handleInputChange(field.key, e.target.value)}
                                        placeholder={field.placeholder}
                                        rows={4}
                                    />
                                ) : (
                                    <input
                                        className="form-input"
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

                <div className="flex gap-3 justify-end pt-4 border-t border-white/10">
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


function WorkoutDetailPopup({ workout, onClose, onWorkoutUpdated, user, stations }) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [showEditPopup, setShowEditPopup] = useState(false);
    const [showAddExercisePopup, setShowAddExercisePopup] = useState(false);
    const [editingExercise, setEditingExercise] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    workout = Workout.fromJSON(workout);

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
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'Invalid Date';
        }
    };

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
        <div className="modal-overlay">
            <div className="modal-backdrop" onClick={onClose}></div>
            <div className="modal-content max-w-4xl">
                <div className="modal-header">
                    <h2 className="modal-title">Workout Details</h2>
                    <button className="modal-close" onClick={onClose}>
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-6">
                    {/* Workout Overview */}
                    <div className="card">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
                                <Dumbbell className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-gradient mb-2">
                                    {workout.name}
                                </h3>
                                <p className="text-slate-300 mb-4">
                                    {workout.description || 'No description available.'}
                                </p>
                                <div className="grid-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-slate-400">Workout ID:</span>
                                        <span className="text-slate-300 ml-2 font-mono">{workout.uid}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400">Start Time:</span>
                                        <span className="text-slate-300 ml-2">{formatDate(workout.startTime)}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400">Active Time:</span>
                                        <span className="text-slate-300 ml-2">{workout.formatDuration(workout.activeTime * 1000) || '0'}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400">Idle Time:</span>
                                        <span className="text-slate-300 ml-2">{workout.formatDuration(workout.idleTime * 1000) || '0'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Statistics */}
                    <div className="grid-3 gap-4">
                        <div className="card text-center">
                            <div className="text-2xl font-bold text-gradient">{workout.exercises?.length || 0}</div>
                            <div className="text-sm text-slate-400">Exercises</div>
                        </div>
                        <div className="card text-center">
                            <div className="text-2xl font-bold text-gradient">
                                {workout.exercises?.reduce((sum, ex) => sum + (ex.points || 0), 0) || 0}
                            </div>
                            <div className="text-sm text-slate-400">Total Points</div>
                        </div>
                        <div className="card text-center">
                            <div className="text-2xl font-bold text-gradient">
                                {workout.exercises?.reduce((sum, ex) => sum + (ex.calories || 0), 0) || 0}
                            </div>
                            <div className="text-sm text-slate-400">Total Calories</div>
                        </div>
                    </div>

                    {/* Exercises Section */}
                    <div className="card">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gradient">Exercises</h3>
                            <button
                                className="btn-primary flex items-center gap-2"
                                onClick={() => setShowAddExercisePopup(true)}
                                disabled={isProcessing}
                            >
                                <Plus className="w-4 h-4" />
                                Add Exercise
                            </button>
                        </div>

                        <div className="space-y-3 max-h-[300px] overflow-y-auto">
                            {workout.exercises && workout.exercises.length > 0 ? (
                                [...workout.exercises]
                                    .sort((a, b) => (b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0) - (a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0))
                                    .map(exercise => {
                                        const station = stations.find(s => s.uid === exercise.stationId);
                                        return (
                                            <div key={exercise.uid} className="card p-4">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-start gap-3 flex-1">
                                                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                                            <Activity className="w-5 h-5 text-white" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <h4 className="font-semibold text-white mb-1">{exercise.name}</h4>
                                                            <p className="text-sm text-slate-400 mb-2">
                                                                {exercise.description || 'No description.'}
                                                            </p>
                                                            <div className="flex items-center gap-4 text-xs text-slate-500">
                                                                <span>Points: {exercise.points || 0}</span>
                                                                <span>Calories: {exercise.calories || 0}</span>
                                                                {station && <span>Station: {station.name}</span>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            className="btn-icon"
                                                            onClick={() => setEditingExercise(exercise)}
                                                            title="Edit Exercise"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            className="btn-icon btn-danger"
                                                            onClick={() => handleDeleteExercise(exercise.uid)}
                                                            title="Delete Exercise"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                            ) : (
                                <div className="text-center py-8 text-slate-400">
                                    <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p>No exercises have been added to this workout yet.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 justify-end">
                        <button
                            className="btn-primary flex items-center gap-2"
                            onClick={() => setShowEditPopup(true)}
                            disabled={isProcessing}
                        >
                            <Edit className="w-4 h-4" />
                            Edit Workout
                        </button>
                        <button
                            className="btn-danger flex items-center gap-2"
                            onClick={handleDeleteWorkout}
                            disabled={isProcessing}
                        >
                            <Trash2 className="w-4 h-4" />
                            {isProcessing ? 'Deleting...' : 'Delete Workout'}
                        </button>
                    </div>
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
    const [searchTerm, setSearchTerm] = useState('');

    const loadData = async () => {
        setIsLoading(true);
        try {
            // Load all workouts from all users for admin management
            const workoutData = await WorkoutManager.loadAllWorkouts();
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
        loadData();
    }, []);

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

    const filteredWorkouts = workouts.filter(workout =>
        workout.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        workout.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        workout.userDisplayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        workout.userEmail?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const stats = [
        { value: workouts.length, label: 'Total Workouts' },
        { value: new Set(workouts.map(w => w.userId)).size, label: 'Active Users' },
        { value: workouts.reduce((sum, workout) => sum + (workout.exercises?.length || 0), 0), label: 'Total Exercises' }
    ];

    const renderWorkoutCards = () => {
        return filteredWorkouts.map(workout => (
            <AdminCard
                key={workout.uid}
                onClick={() => setSelectedWorkout(workout)}
            >
                <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Dumbbell className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gradient truncate mb-1">
                            {workout.name}
                        </h3>
                        <p className="text-sm text-slate-300 mb-2 line-clamp-2">
                            {workout.description || 'No description available.'}
                        </p>
                        <div className="text-xs text-slate-400 mb-2">
                            <span className="font-medium">Owner:</span> {workout.userDisplayName || 'Unknown User'} ({workout.userEmail})
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-400">
                            <span className="flex items-center gap-1">
                                <Activity className="w-3 h-3" />
                                {workout.exercises?.length || 0} exercises
                            </span>
                            <span>#{workout.uid.slice(-8)}</span>
                        </div>
                    </div>
                </div>
            </AdminCard>
        ));
    };

    return (
        <>
            <AdminPageLayout
                title="Workout Manager"
                stats={stats}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                searchPlaceholder="Search workouts by name, description, or user..."
                onCreateClick={() => setShowCreatePopup(true)}
                createButtonText="Create Workout"
                isLoading={isLoading}
                emptyMessage="No workouts found in the system."
                contentGridClass="grid-2 gap-6"
            >
                {renderWorkoutCards()}
            </AdminPageLayout>

            {/* Modals */}
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
        </>
    );
}

export default WorkoutManagerPage;