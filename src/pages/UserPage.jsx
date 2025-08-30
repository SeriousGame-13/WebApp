import React, { useState, useEffect } from 'react';
import ProfileImageElements from '../utils/profileImageManager';
import WorkoutManager from './../services/firebase/WorkoutManagement.jsx';
import StationManager from '../services/firebase/StationManagement';
import BadgeManagement from '../services/firebase/BadgeManagement';
import IconElements from '../components/ui/IconElements';
import { Workout } from '../services/interfaces/workout';
import { Timestamp } from 'firebase/firestore';

import '../sphere-styles.css'

function newProfile({ onOpenBadge, onOpenSettings }) {
  const u = DUMMY_USER;
  const owned = new Map(u.badges.map(b => [b.id, b.level]));
  const ownedCount = owned.size;
  const total = ALL_BADGES.length;

  const header = (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Avatar name={u.name} size={48} seed={u.id} />
        <div>
          <h1 className="screen-title">{u.name}</h1>
          <p className="screen-subtitle">Level {u.level}</p>
        </div>
      </div>
      <button 
        onClick={onOpenSettings} 
        className="btn-secondary text-sm flex items-center gap-2"
      >
        <Settings className="w-4 h-4" /> Settings
      </button>
    </div>
  );

  return (
    <Screen titleNode={header}>
      <Card>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-slate-300 text-sm">Badges gesammelt</p>
            <p className="text-xl font-semibold">{ownedCount} / {total}</p>
          </div>
          <Legend />
        </div>
      </Card>

      <div className="mt-4 mb-2 text-slate-400 text-xs">Badges</div>

      <div className="grid-3">
        {ALL_BADGES.map((b) => {
          const lvl = owned.get(b.id);
          const unlocked = !!lvl;
          return (
            <Card key={b.id} onClick={() => onOpenBadge(b.id)}>
              <div className="flex flex-col items-center gap-2">
                <div className={`p-3 rounded-xl ${unlocked ? badgeLevelColor(lvl) : "badge-locked"}`}>
                  {b.icon}
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium truncate" style={{ maxWidth: '8rem' }}>
                    {b.name}
                  </p>
                  <p className="text-xs text-slate-400">
                    {unlocked ? `Lvl ${lvl}` : "Locked"}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      <p className="text-slate-400 text-xs mt-3">Tippe auf ein Badge für Details.</p>
    </Screen>
  );
}

const WorkoutUtils = {
    localDateTimeStringToTimestamp(value) {
        const [date, time] = value.split('T');
        const [year, month, day] = date.split('-').map(Number);
        const [hour, minute] = time.split(':').map(Number);
        const localDate = new Date(year, month - 1, day, hour, minute);
        return Timestamp.fromDate(localDate);
    },

    localISODateTime(date) {
        date = date.toDate();
        const pad = (n) => n.toString().padStart(2, '0');
        const y = date.getFullYear();
        const m = pad(date.getMonth() + 1);
        const d = pad(date.getDate());
        const h = pad(date.getHours());
        const min = pad(date.getMinutes());
        return `${y}-${m}-${d}T${h}:${min}`;
    }
};

function FormBase({ 
    title, 
    inputFields, 
    initialData, 
    onSubmit, 
    onCancel, 
    isProcessing, 
    submitText,
    stations = null 
}) {
    const [formData, setFormData] = useState(() => {
        return inputFields.reduce((acc, field) => {
            const sourceValue = initialData?.[field.key];
            if (field.type === 'datetime-local' && sourceValue?.toDate) {
                acc[field.key] = WorkoutUtils.localISODateTime(sourceValue);
            } else {
                acc[field.key] = sourceValue ?? (field.type === 'number' ? 0 : '');
            }
            return acc;
        }, {});
    });

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = () => {
        if (formData.name && formData.name.trim()) {
            const submitData = inputFields.reduce((acc, field) => {
                const value = formData[field.key];
                if (field.type === 'number') {
                    acc[field.key] = parseInt(value, 10) || 0;
                } else if (field.type === 'datetime-local') {
                    acc[field.key] = value ? WorkoutUtils.localDateTimeStringToTimestamp(value) : null;
                } else if (field.key === 'stationId') {
                    acc[field.key] = value || null;
                } else if (typeof value === 'string') {
                    acc[field.key] = value.trim();
                } else {
                    acc[field.key] = value;
                }
                return acc;
            }, {});
            
            if (initialData?.uid) {
                submitData.uid = initialData.uid;
            }
            onSubmit(submitData);
        }
    };

    const isValid = formData.name?.trim() !== '';

    if (isProcessing) {
        return (
            <div className='modal-overlay'>
                <div className='modal-backdrop'></div>
                <div className='modal-content card'>
                    <h2 className='text-xl font-semibold text-center'>{initialData ? 'Updating' : 'Creating'}...</h2>
                </div>
            </div>
        );
    }

    return (
        <div className='modal-overlay'>
            <div className='modal-backdrop'></div>
            <div className='modal-content card'>
                <h2 className='text-xl font-semibold mb-4'>{title}</h2>
                <div className='space-y-4' style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                    <div className='space-y-3'>
                        {inputFields.map(field => (
                            <div key={field.key} className='space-y-1'>
                                <label className='form-label'>{field.label}</label>
                                {field.type === 'select' ? (
                                    <select
                                        className='form-select'
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
                                        className='form-textarea'
                                        value={formData[field.key]}
                                        onChange={(e) => handleInputChange(field.key, e.target.value)}
                                        placeholder={field.placeholder}
                                        rows={4}
                                    />
                                ) : (
                                    <input
                                        className='form-input'
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
                <div className='border-t border-white/10 my-4'></div>
                <div className='flex justify-end gap-2'>
                    <button className='btn-secondary' onClick={onCancel}>
                        Cancel
                    </button>
                    <button
                        className='btn-primary'
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

function EditWorkoutForm(props) {
    const inputFields = [
        { key: 'name', label: 'Name', type: 'text', maxLength: 50, placeholder: 'Enter name' },
        { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Enter description' },
        { key: 'startTime', label: 'Start Time', type: 'datetime-local' },
        { key: 'endTime', label: 'End Time', type: 'datetime-local' },
        { key: 'heartRateMax', label: 'Max Heart Rate', type: 'number', min: 0, placeholder: 'Enter max heart rate' },
        { key: 'heartRateMin', label: 'Min Heart Rate', type: 'number', min: 0, placeholder: 'Enter min heart rate' },
    ];

    const title = props.workout ? 'Edit Workout' : 'Create New Workout';

    return (
        <FormBase
            title={title}
            inputFields={inputFields}
            initialData={props.workout}
            onSubmit={props.onSubmit}
            onCancel={props.onCancel}
            isProcessing={props.isProcessing}
            submitText={props.submitText}
        />
    );
}

function ExerciseForm(props) {
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

    const title = props.exerciseToEdit ? 'Edit Exercise' : 'Add New Exercise';

    return (
        <FormBase
            title={title}
            inputFields={inputFields}
            initialData={props.exerciseToEdit}
            onSubmit={props.onSubmit}
            onCancel={props.onCancel}
            isProcessing={props.isProcessing}
            submitText={props.submitText}
            stations={props.stations}
        />
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
        <div className='modal-overlay'>
            <div className='modal-backdrop'></div>
            <div className='modal-content card'>
                <h2 className='text-xl font-semibold mb-4'>Workout Details</h2>
                <div className='space-y-4'>
                    <div className='space-y-2'>
                        <h3 className='text-lg font-semibold text-gradient'>{workout.name}</h3>
                        <p className='text-slate-300'>{workout.description || 'No description available.'}</p>
                    </div>
                    
                    <div className='space-y-1 text-sm text-slate-400'>
                        <div>Workout ID: <span className='text-slate-300'>{workout.uid}</span></div>
                        {workout.startTime && <div>Created: <span className='text-slate-300'>{workout.startTime.toDate().toLocaleString()}</span></div>}
                        <div>Active Time: <span className='text-slate-300'>{workout.formatDuration(workout.activeTime * 1000) || 0}</span></div>
                        <div>Idle Time: <span className='text-slate-300'>{workout.formatDuration(workout.idleTime * 1000) || 0}</span></div>
                    </div>

                    <div className='mt-4'>
                        <h3 className='text-gradient text-md font-semibold mb-2'>Exercises</h3>
                        <div className='space-y-2' style={{ maxHeight: '200px', overflowY: 'auto' }}>
                            {workout.exercises && workout.exercises.length > 0 ? (
                                [...workout.exercises]
                                    .sort((a, b) => (b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0) - (a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0))
                                    .map(exercise => {
                                        const station = stations.find(s => s.uid === exercise.stationId);
                                        return (
                                            <div key={exercise.uid} className="card p-3 mb-2">
                                                <div className="flex justify-between items-center">
                                                    <strong className="text-white">{exercise.name}</strong>
                                                    <div className='flex gap-2'>
                                                         <button 
                                                            onClick={() => setEditingExercise(exercise)} 
                                                            className="btn-secondary btn-sm">
                                                                Edit
                                                         </button>
                                                         <button 
                                                            onClick={() => handleDeleteExercise(exercise.uid)}
                                                            className="btn-tertiary btn-sm">
                                                                Delete
                                                         </button>
                                                    </div>
                                                </div>
                                                <p className="text-sm text-slate-300 my-1">{exercise.description || 'No description.'}</p>
                                                <div className="text-xs text-slate-400">
                                                    Points: {exercise.points || 0}
                                                    {station && ` | Station: ${station.name}`}
                                                </div>
                                            </div>
                                        );
                                    })
                            ) : (
                                <p className="text-slate-400">No exercises have been added to this workout yet.</p>
                            )}
                        </div>
                        <button
                            className='btn-primary mt-3'
                            onClick={() => setShowAddExercisePopup(true)}
                            disabled={isProcessing}
                        >
                            Add New Exercise
                        </button>
                    </div>

                    <div className="flex gap-2 mt-4">
                        <button
                            className='btn-secondary'
                            onClick={() => setShowEditPopup(true)}
                            disabled={isProcessing}
                        >
                            Edit Workout Info
                        </button>
                        <button
                            className='btn-tertiary'
                            onClick={handleDeleteWorkout}
                            disabled={isProcessing}
                        >
                            {isProcessing ? 'Deleting...' : 'Delete Workout'}
                        </button>
                    </div>
                </div>
                <div className='border-t border-white/10 my-4'></div>
                <div className='flex justify-end'>
                    <button className='btn-secondary' onClick={onClose}>Close</button>
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

function BadgeCardItem({ badge, onClick }) {
    const [badgeImage, setBadgeImage] = useState('');
    const [imageLoading, setImageLoading] = useState(true);

    useEffect(() => {
        const loadBadgeImage = async () => {
            setImageLoading(true);
            try {
                const imageBase64 = await BadgeManagement.getBadgeImage(badge.badgeId);
                setBadgeImage(imageBase64 || '');
            } catch (error) {
                console.error('Failed to load badge image:', error);
                setBadgeImage('');
            } finally {
                setImageLoading(false);
            }
        };

        if (badge.badgeId) {
            loadBadgeImage();
        }
    }, [badge.badgeId]);

    const getRarityColor = (rarity) => {
        switch (rarity) {
            case 'common': return '#9CA3AF';
            case 'rare': return '#3B82F6';
            case 'epic': return '#8B5CF6';
            case 'legendary': return '#F59E0B';
            default: return '#9CA3AF';
        }
    };

    return (
        <div className="card p-3 hover:bg-slate-800 cursor-pointer" onClick={onClick}>
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                    {imageLoading ? (
                        <div className='w-full h-full bg-slate-700 flex items-center justify-center text-xs'>
                            Loading...
                        </div>
                    ) : badgeImage ? (
                        <img className='w-full h-full object-cover'
                            src={badgeImage} 
                            alt="Badge Image" 
                        />
                    ) : (
                        <div className='w-full h-full bg-slate-700 flex items-center justify-center'>
                            <IconElements.UserIcon />
                        </div>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-white font-medium truncate">
                        {badge.name}
                    </div>
                    <div className="text-sm" style={{ color: getRarityColor(badge.rarity) }}>
                        {badge.rarity.charAt(0).toUpperCase() + badge.rarity.slice(1)}
                    </div>
                </div>
            </div>
        </div>
    );
}

function Page({ data }) {
    const userData = data;
    const [activeTab, setActiveTab] = useState('badges');
    const [badges, setBadges] = useState([]);
    const [isLoadingBadges, setIsLoadingBadges] = useState(true);
    
    const [workouts, setWorkouts] = useState([]);
    const [stations, setStations] = useState([]);
    const [isLoadingWorkouts, setIsLoadingWorkouts] = useState(false);
    const [selectedWorkout, setSelectedWorkout] = useState(null);
    const [showCreateWorkoutPopup, setShowCreateWorkoutPopup] = useState(false);
    const [isCreatingWorkout, setIsCreatingWorkout] = useState(false);

    const loadBadges = async () => {
        try {
            setIsLoadingBadges(true);
            const allBadges = await BadgeManagement.getAllBadges();
            setBadges(allBadges);
        } catch (error) {
            console.error('Failed to load badges:', error);
            setBadges([]);
        } finally {
            setIsLoadingBadges(false);
        }
    };

    const loadWorkouts = async () => {
        try {
            setIsLoadingWorkouts(true);
            const workoutData = await WorkoutManager.loadWorkouts(userData.uid);
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
            console.error('Failed to load workouts:', error);
            setWorkouts([]);
            setStations([]);
        } finally {
            setIsLoadingWorkouts(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'badges') {
            loadBadges();
        } else if (activeTab === 'edit') {
            loadWorkouts();
        }
    }, [activeTab]);

    const handleWorkoutCreation = async (data) => {
        setIsCreatingWorkout(true);
        try {
            data.userId = userData.uid;
            await WorkoutManager.saveWorkout(data);
            setShowCreateWorkoutPopup(false);
            await loadWorkouts();
        } catch (error) {
            console.error('Failed to create workout:', error);
            alert('Failed to create workout: ' + error.message);
        } finally {
            setIsCreatingWorkout(false);
        }
    };

    const UserTabSection = () => (
        <div className="sticky top-0 z-10 bg-slate-900 pb-3 border-b border-white/10">
            <div className="flex gap-2">
                <button 
                    className={activeTab === 'badges' ? 'btn-primary' : 'btn-secondary'}
                    onClick={() => setActiveTab('badges')}
                >
                    Badges
                </button>
                <button 
                    className={activeTab === 'edit' ? 'btn-primary' : 'btn-secondary'}
                    onClick={() => setActiveTab('edit')}
                >
                    Edit
                </button>
            </div>
        </div>
    );

    const BadgesSection = () => (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gradient">Badges</h2>

            {isLoadingBadges ? (
                <div className="text-center text-slate-400 py-4">
                    Loading...
                </div>
            ) : badges.length === 0 ? (
                <div className="text-center text-slate-400 py-4">
                    No Badges Found
                </div>
            ) : (
                <div className="grid-3">
                    {badges.map(badge => (
                        <BadgeCardItem 
                            key={badge.badgeId} 
                            badge={badge}
                            onClick={() => console.log('Badge clicked:', badge.name)}
                        />
                    ))}
                </div>
            )}
        </div>
    );

    const EditSection = () => (
        <div className="space-y-6 overflow-y-auto py-4">
            <div className="card p-4">
                <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                        <ProfileImageElements.ProfileImageUploader userId={userData.uid} />
                    </div>
                    <div className="space-y-1">
                        <p className="font-semibold">Hallo, {userData.displayName}!</p>
                        <p className="text-sm text-slate-300">E-mail: {userData.email}</p>
                        <p className="text-sm text-slate-300">Level: {userData.level}</p>
                        <p className="text-sm text-slate-300">Active: {userData.isActive}</p>
                        <p className="text-sm text-slate-300">Points: {userData.points}</p>
                        <p className="text-sm text-slate-300">MaxRecord: {userData.longestStreak}</p>
                    </div>
                </div>
            </div>
            
            <div className="space-y-3">
                <h2 className="text-lg font-semibold">Workout Management</h2>
                
                <div className="space-y-2">
                    {isLoadingWorkouts ? (
                        <div className="text-center text-slate-400 py-4">
                            Loading Workouts...
                        </div>
                    ) : workouts.length === 0 ? (
                        <div className="text-center text-slate-400 py-4">
                            No Workouts Found. Create one to get started!
                        </div>
                    ) : (
                        workouts.map(workout => (
                            <div
                                key={workout.uid}
                                className="card p-3 hover:bg-slate-800 cursor-pointer mb-2"
                                onClick={() => setSelectedWorkout(workout)}
                            >
                                <h3 className="text-gradient font-medium">{workout.name}</h3>
                                <p className="text-sm text-slate-300 my-1">
                                    {workout.description || 'No description available.'}
                                </p>
                                <p className="text-xs text-slate-400">
                                    Exercises: {workout.exercises?.length || 0}
                                </p>
                            </div>
                        ))
                    )}
                </div>

                <button
                    className="btn-primary w-full mt-4"
                    onClick={() => setShowCreateWorkoutPopup(true)}
                >
                    Create New Workout
                </button>
            </div>
        </div>
    );

    return (
        <div className="app-container">
            <div className="screen">
                <div className="background">
                    <div className="bg-gradient-1"></div>
                    <div className="bg-gradient-2"></div>
                    <div className="bg-overlay"></div>
                </div>

            <UserTabSection />
            
            <div className="screen-content">
                {activeTab === 'badges' ? <BadgesSection /> : <EditSection />}
            </div>

            {showCreateWorkoutPopup && (
                <EditWorkoutForm
                    onSubmit={handleWorkoutCreation}
                    onCancel={() => setShowCreateWorkoutPopup(false)}
                    isProcessing={isCreatingWorkout}
                    submitText="Create Workout"
                />
            )}

            {selectedWorkout && (
                <WorkoutDetailPopup
                    workout={selectedWorkout}
                    onClose={() => setSelectedWorkout(null)}
                    onWorkoutUpdated={loadWorkouts}
                    user={userData}
                    stations={stations}
                />
            )}
        </div></div>
    )
}

const UserPageElements = {
    Page,
    newProfile
};

export default UserPageElements;