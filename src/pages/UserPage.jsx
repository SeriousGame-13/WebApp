import { useState, useEffect } from 'react';
import ProfileImageElements from '../utils/profileImageManager';
import WorkoutManager from './../services/firebase/WorkoutManagement.jsx';
import GoalSystem from './../services/firebase/GoalSystem.jsx';
import StationManager from '../services/firebase/StationManagement';
import BadgeManagement from '../services/firebase/BadgeManagement';
import IconElements from '../components/ui/IconElements';
import { Workout } from '../services/interfaces/workout';
import {localDateTimeStringToTimestamp, localISODateTime} from '../utils/DateUtils';

import '../components/styles/LayoutElements.css'
import '../components/styles/UserPage.css'


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
                acc[field.key] = localISODateTime(sourceValue);
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
            
            if (initialData?.uid) {
                submitData.uid = initialData.uid;
            }
            onSubmit(submitData);
        }
    };

    const isValid = formData.name?.trim() !== '';

    if (isProcessing) {
        return (
            <div className='PopupBackground'>
                <div className='PopupContainer'>
                    <h2>{initialData ? 'Updating' : 'Creating'}...</h2>
                </div>
            </div>
        );
    }

    return (
        <div className='PopupBackground'>
            <div className='LargePopupContainer'>
                <h2 style={{ margin: '20px 0', textAlign: 'center' }}>{title}</h2>
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

function GoalForm(props) {    
    const inputFields = [
        { key: 'name', label: 'Name', type: 'text', maxLength: 50, placeholder: 'Enter goal name' },
        { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Enter description' },
        { key: 'targetValue', label: 'Target Value', type: 'number', min: 1, placeholder: 'Enter target value' },
        { key: 'stationId', label: 'Station', type: 'select', placeholder: 'Select Station...' },
        { key: 'deadline', label: 'Deadline', type: 'datetime-local' },
    ];

    const title = props.goalToEdit ? 'Edit Goal' : 'Create New Goal';

    return (
        <FormBase
            title={title}
            inputFields={inputFields}
            initialData={props.goalToEdit}
            onSubmit={props.onSubmit}
            onCancel={props.onCancel}
            isProcessing={props.isProcessing}
            submitText={props.submitText}
            stations={props.stations}
        />
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
                                                    <div className='ActionButtons'>
                                                         <button onClick={() => setEditingExercise(exercise)} style={{marginRight: '10px'}}>Edit</button>
                                                         <button onClick={() => handleDeleteExercise(exercise.uid)}>Delete</button>
                                                    </div>
                                                </div>
                                                <p style={{ margin: '5px 0', color: '#A0A0A0' }}>{exercise.description || 'No description.'}</p>
                                                <div style={{ fontSize: '12px', color: '#A0A0A0' }}>
                                                    Points: {exercise.points || 0}
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
        <div className="CardContainer" onClick={onClick}>
            <div className="CardContainerOut">
                <div className="ProfileImageForCard">
                    {imageLoading ? (
                        <div className='ProfileImageForCardAlt'>
                            <div>Loading...</div>
                        </div>
                    ) : badgeImage ? (
                        <img className='ProfileImageForCard'
                            src={badgeImage} 
                            alt="Badge Image" 
                        />
                    ) : (
                        <div className='ProfileImageForCardAlt'>
                            <IconElements.UserIcon />
                        </div>
                    )}
                </div>
                <div className="CardContainerIn">
                    <div className="CardHeader">
                        {badge.name}
                    </div>
                    <div className="CardContents" style={{ color: getRarityColor(badge.rarity) }}>
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
    const [goals, setGoals] = useState([]);
    const [stations, setStations] = useState([]);
    const [isLoadingWorkouts, setIsLoadingWorkouts] = useState(false);
    const [isLoadingGoals, setIsLoadingGoals] = useState(false);
    const [selectedWorkout, setSelectedWorkout] = useState(null);
    const [selectedGoal, setSelectedGoal] = useState(null);
    const [showCreateWorkoutPopup, setShowCreateWorkoutPopup] = useState(false);
    const [showCreateGoalPopup, setShowCreateGoalPopup] = useState(false);
    const [isCreatingWorkout, setIsCreatingWorkout] = useState(false);
    const [isCreatingGoal, setIsCreatingGoal] = useState(false);

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

    const loadGoals = async () => {
        try {
            setIsLoadingGoals(true);
            const goalData = await GoalSystem.getUserGoals(userData.uid);
            setGoals(goalData);

            const stationData = await StationManager.loadAll();
            setStations(stationData);
            
            if (selectedGoal) {
                const updatedSelectedGoal = goalData.find(g => g.uid === selectedGoal.uid);
                if (updatedSelectedGoal) {
                    setSelectedGoal(updatedSelectedGoal);
                } else {
                    setSelectedGoal(null);
                }
            }
        } catch (error) {
            console.error('Failed to load goals:', error);
            setGoals([]);
        } finally {
            setIsLoadingGoals(false);
        }
    };


    useEffect(() => {
        if (activeTab === 'badges') {
            loadBadges();
        } else if (activeTab === 'edit') {
            loadWorkouts();
            loadGoals(); // Load goals when switching to edit tab
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

    const handleGoalCreation = async (data) => {
        setIsCreatingGoal(true);
        try {
            await GoalSystem.createGoal(userData.uid, data);
            setShowCreateGoalPopup(false);
            await loadGoals();
        } catch (error) {
            console.error('Failed to create goal:', error);
            alert('Failed to create goal: ' + error.message);
        } finally {
            setIsCreatingGoal(false);
        }
    };

    const UserTabSection = () => (
        <div className="UserButtonContainer" style={{ 
            position: 'sticky', 
            top: 0, 
            zIndex: 10, 
            backgroundColor: 'var(--background-color)',
            paddingBottom: '10px',
            borderBottom: '1px solid var(--border-color)'
        }}>
            <button 
                className={activeTab === 'badges' ? 'ButtonMediumFilled BadgesButton' : 'ButtonMedium BadgesButton'}
                onClick={() => setActiveTab('badges')}
            >
                <div className='ButtonText'>Badges</div>
            </button>
            <button 
                className={activeTab === 'edit' ? 'ButtonMediumFilled EditButton' : 'ButtonMedium EditButton'}
                onClick={() => setActiveTab('edit')}
            >
                <div className='ButtonText'>Edit</div>
            </button>
        </div>
    );

    const BadgesSection = () => (
        <div className="UserContainer">
            <div className="GuideTitle">Badges</div>
            <div className="GuideText">My Badges</div>

            {isLoadingBadges ? (
                <div style={{ color: '#A0A0A0', textAlign: 'center', padding: '20px' }}>
                    Loading...
                </div>
            ) : badges.length === 0 ? (
                <div style={{ color: '#A0A0A0', textAlign: 'center', padding: '20px' }}>
                    No Badges Found
                </div>
            ) : (
                <div className="BadgeGrid">
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
        <div style={{ 
            flex: 1, 
            overflowY: 'auto', 
            padding: '20px 0' 
        }}>
            <div className="UserInfo">
                <div className="UserProfileSection">
                    <ProfileImageElements.ProfileImageUploader userId={userData.uid} />
                </div>
                <div className="UserDetailsSection">
                    <p>Hallo, {userData.displayName}!</p>
                    <p>E-mail: {userData.email}</p>
                    <p>Level: {userData.level}</p>
                    <p>Active: {userData.isActive}</p>
                    <p>Points: {userData.points}</p>
                    <p>MaxRecord: {userData.longestStreak}</p>
                </div>
            </div>
            
            <div className="WorkoutSection">
                <div className="GuideText">Workout Management</div>
                
                <div className="WorkoutList">
                    {isLoadingWorkouts ? (
                        <div style={{ color: '#A0A0A0', textAlign: 'center', padding: '20px' }}>
                            Loading Workouts...
                        </div>
                    ) : workouts.length === 0 ? (
                        <div style={{ color: '#A0A0A0', textAlign: 'center', padding: '20px' }}>
                            No Workouts Found. Create one to get started!
                        </div>
                    ) : (
                        workouts.map(workout => (
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
                        ))
                    )}
                </div>

                <button
                    className="AdminActionButton"
                    onClick={() => setShowCreateWorkoutPopup(true)}
                    style={{
                        width: '100%',
                        marginTop: '10px'
                    }}
                >
                    Create New Workout
                </button>
            </div>

            <div className="WorkoutSection" style={{ marginTop: '30px' }}>
                <div className="GuideText">Goal Management</div>
                
                <div className="WorkoutList">
                    {isLoadingGoals ? (
                        <div style={{ color: '#A0A0A0', textAlign: 'center', padding: '20px' }}>
                            Loading Goals...
                        </div>
                    ) : goals.length === 0 ? (
                        <div style={{ color: '#A0A0A0', textAlign: 'center', padding: '20px' }}>
                            No Goals Found. Create one to get started!
                        </div>
                    ) : (
                        goals.map(goal => (
                            <div
                                key={goal.uid}
                                className="CardContainer"
                                onClick={() => setSelectedGoal(goal)}
                            >
                                <div className="CardHeader" style={{ color: 'var(--main-color)' }}>
                                    {goal.name}
                                </div>
                                <div className="CardContents">
                                    {goal.description || 'No description available.'}
                                </div>
                                <div className="CardContents">
                                    Progress: {goal.currentValue}/{goal.targetValue} ({Math.round((goal.currentValue / goal.targetValue) * 100)}%)
                                </div>
                                <div className="ProgressBarSmall">
                                    <div 
                                        className="ProgressBarFillSmall" 
                                        style={{ 
                                            width: `${Math.min(Math.round((goal.currentValue / goal.targetValue) * 100), 100)}%`,
                                            backgroundColor: goal.isCompleted ? 'var(--success-color)' : 'var(--main-color)'
                                        }}
                                    ></div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <button
                    className="AdminActionButton"
                    onClick={() => setShowCreateGoalPopup(true)}
                    style={{
                        width: '100%',
                        marginTop: '10px'
                    }}
                >
                    Create New Goal
                </button>
            </div>
        </div>
    );

    return (
        <div className="AppContents">
            <UserTabSection />
            
            <div style={{ 
                flex: 1, 
                overflowY: 'auto', 
                padding: '20px 0' 
            }}>
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

            {showCreateGoalPopup && (
                <GoalForm
                    onSubmit={handleGoalCreation}
                    onCancel={() => setShowCreateGoalPopup(false)}
                    isProcessing={isCreatingGoal}
                    submitText="Create Goal"
                    stations={stations}
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

            {selectedGoal && (
                <GoalDetailPopup
                    goal={selectedGoal}
                    onClose={() => setSelectedGoal(null)}
                    onGoalUpdated={loadGoals}
                    user={userData}
                    stations={stations} // Add this line to pass stations data
                />
            )}
        </div>
    )
}

const UserPageElements = {
    Page
};

export default UserPageElements;

function GoalDetailPopup({ goal, onClose, onGoalUpdated, user, stations }) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [showEditPopup, setShowEditPopup] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [manualProgressValue, setManualProgressValue] = useState(goal.currentValue || 0);

    useEffect(() => {
        if (showEditPopup) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showEditPopup, onClose]);

    const handleDeleteGoal = async () => {
        if (confirm(`Are you sure you want to delete the goal "${goal.name}"? This action cannot be undone.`)) {
            setIsProcessing(true);
            try {
                await GoalSystem.deleteGoal(goal.uid, user.uid);
                onGoalUpdated();
                onClose();
            } catch (error) {
                console.error('Failed to delete goal:', error);
                alert('Failed to delete goal: ' + error.message);
            } finally {
                setIsProcessing(false);
            }
        }
    };
    
    const handleUpdateGoal = async (updates) => {
        setIsUpdating(true);
        try {
            await GoalSystem.updateGoal(goal.uid, user.uid, updates);
            setShowEditPopup(false);
            onGoalUpdated();
        } catch (error) {
            console.error('Failed to update goal:', error);
            alert('Failed to update goal: ' + error.message);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleProgressUpdate = async () => {
        const newValue = parseInt(manualProgressValue, 10);
        if (isNaN(newValue) || newValue < 0) {
            alert('Please enter a valid progress value.');
            return;
        }

        setIsProcessing(true);
        try {
            await GoalSystem.updateGoalProgress(goal.uid, user.uid, newValue);
            onGoalUpdated();
        } catch (error) {
            console.error('Failed to update goal progress:', error);
            alert('Failed to update goal progress: ' + error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    // Calculate progress percentage
    const progressPercentage = Math.min(Math.round((goal.currentValue / goal.targetValue) * 100), 100);
    
    // Format the deadline date if available
    const formattedDeadline = goal.deadline?.toDate ? 
        goal.deadline.toDate().toLocaleDateString() + ' ' + goal.deadline.toDate().toLocaleTimeString() : 
        'No deadline set';

    // Determine if the goal is overdue
    const isOverdue = goal.deadline?.toDate && !goal.isCompleted && 
        new Date() > goal.deadline.toDate();

    const station = stations?.find(s => s.uid === goal.stationId);
    const stationName = station ? station.name : 'No station selected';

    return (
        <div className='PopupBackground'>
            <div className='LargePopupContainer'>
                <h2 style={{ textAlign: 'center' }}>Goal Details</h2>
                <div className='GroupDetailContainer'>
                    <div className='BadgeDetailHeader'>
                        <div className='BadgeInfoContainer'>
                            <div className='BadgeDetailTitle' style={{ color: 'var(--main-color)' }}>
                                {goal.name}
                                {goal.isCompleted && 
                                    <span style={{ color: 'var(--success-color)', fontSize: '16px', marginLeft: '10px' }}>
                                        (Completed)
                                    </span>
                                }
                                {isOverdue && 
                                    <span style={{ color: 'var(--error-color)', fontSize: '16px', marginLeft: '10px' }}>
                                        (Overdue)
                                    </span>
                                }
                            </div>
                        </div>
                    </div>
                    <div className='GroupDetailDescription' style={{ textAlign: 'left' }}>
                        {goal.description || 'No description available.'}
                    </div>
                    <div className='GroupDetailInfo' style={{ textAlign: 'left' }}>
                        <div>Goal ID: {goal.uid}</div>
                        <div>Station: {stationName}</div>
                        <div>Progress: {goal.currentValue} / {goal.targetValue}</div>
                        <div>Deadline: {formattedDeadline}</div>
                        <div>Status: {goal.isCompleted ? 'Completed' : 'In Progress'}</div>
                    </div>

                    <div style={{ marginTop: '20px' }}>
                        <h3 style={{ color: 'var(--main-color)', marginBottom: '10px' }}>Progress</h3>
                        <div className="ProgressBar">
                            <div 
                                className="ProgressBarFill" 
                                style={{ 
                                    width: `${progressPercentage}%`,
                                    backgroundColor: goal.isCompleted ? 'var(--success-color)' : isOverdue ? 'var(--error-color)' : 'var(--main-color)'
                                }}
                            ></div>
                        </div>
                        <div className="ProgressText" style={{ marginBottom: '20px' }}>{progressPercentage}% Complete</div>

                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                            <input
                                type="number"
                                className="Input"
                                value={manualProgressValue}
                                onChange={(e) => setManualProgressValue(e.target.value)}
                                style={{ width: '100px', marginRight: '10px' }}
                                min="0"
                                max={goal.targetValue * 2}
                            />
                            <button
                                className="AdminActionButton"
                                onClick={handleProgressUpdate}
                                disabled={isProcessing}
                                style={{ marginLeft: '10px' }}
                            >
                                Update Progress
                            </button>
                        </div>
                    </div>

                    <div className="GroupActionButtons" style={{ marginTop: '40px' }}>
                        <button
                            className='AdminActionButton'
                            onClick={() => setShowEditPopup(true)}
                            disabled={isProcessing}
                        >
                            Edit Goal
                        </button>
                        <button
                            className='AdminActionButton'
                            onClick={handleDeleteGoal}
                            disabled={isProcessing}
                        >
                            {isProcessing ? 'Deleting...' : 'Delete Goal'}
                        </button>
                    </div>
                </div>
                <div className='Line'></div>
                <div className='Buttonfield'>
                    <button className='CancelButton' onClick={onClose}>Close</button>
                </div>

                {showEditPopup && (
                    <GoalForm
                        goalToEdit={goal}
                        onSubmit={handleUpdateGoal}
                        onCancel={() => setShowEditPopup(false)}
                        isProcessing={isUpdating}
                        submitText="Update Goal"
                        stations={stations}
                    />
                )}
            </div>
        </div>
    );
}