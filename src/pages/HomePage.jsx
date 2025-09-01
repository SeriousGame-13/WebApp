import React, { useState, useEffect } from 'react';
import { Card, Screen, Stat, Avatar, Modal } from '../components/ui/UIComponents';
import RankingSystem from '../services/firebase/RankingSystem';
import WorkoutManager from '../services/firebase/WorkoutManagement';
import StationManagement from '../services/firebase/StationManagement';

import '../sphere-styles.css';

// Header component with user info and level
function UserHeader({ userData }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Avatar name={userData.displayName} photoURL={userData.photoURL} size={48} />
        <div>
          <h1 className="screen-title">{userData.displayName?.split(' ')[0] || 'User'}</h1>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="user-stats text-right">
          <div className="user-stats text-right">
            <div>
              <div className="stat-label">Level</div>
                <div className="stat-value">{userData.level}</div>
            </div>
        </div>
        </div>
      </div>
    </div>
  );
}

// Progress bar for level progress
function LevelProgressBar({ userData }) {
  const progress = Math.min(100, Math.round(((userData.points || 0) / (userData.currentMaxPoints() || 1)) * 100));
  
  return (
    <Card>
      <div className="flex items-center justify-between mb-2">
        <span className="text-slate-400 text-sm">Level Progress</span>
        <span className="text-slate-300 text-sm">{userData.points}/{userData.currentMaxPoints()} Points</span>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>
    </Card>
  );
}

// Stats display for the workout
function WorkoutStats({ lastWorkout, helpers }) {
  if (!lastWorkout) return null;
  
  const { getWorkoutDuration, getTotalPoints, getTotalCalories } = helpers;
  
  return (
    <div className="grid-2 mt-4">
      <Card><Stat label="TIME" value={getWorkoutDuration(lastWorkout)} /></Card>
      <Card><Stat label="HEART RATE" value={<>{lastWorkout.heartRateAvg || '--'} bpm</>} /></Card>
      <Card><Stat label="POINTS" value={getTotalPoints(lastWorkout)} /></Card>
      <Card><Stat label="CALORIES" value={<>{getTotalCalories(lastWorkout)} kcal</>} /></Card>
    </div>
  );
}

// Component for displaying exercise cards
function ExerciseList({ exercises, helpers, onExerciseClick }) {
  const { getStationNameById, getDateFromTimestamp } = helpers;
  
  return (
    <div className="grid-2 gap-3">
      {exercises.map((exercise, index) => (
        <Card 
          key={exercise.uid || index} 
          className="exercise-card" 
          onClick={() => onExerciseClick(exercise)}
        >
          <div className="font-medium mb-1 mt-4">
            {exercise.name || getStationNameById(exercise.stationId)}
          </div>
          <div className="text-xs text-slate-400 mb-1">
            {getStationNameById(exercise.stationId)}
          </div>
          {exercise.startTime && exercise.endTime && (
            <div className="text-xs text-slate-500 mb-2">
              {(() => {
                const startTime = getDateFromTimestamp(exercise.startTime);
                const endTime = getDateFromTimestamp(exercise.endTime);
                const durationMs = endTime - startTime;
                const durationSeconds = Math.floor(durationMs / 1000);
                const minutes = Math.floor(durationSeconds / 60);
                const seconds = durationSeconds % 60;
                return `${minutes}m ${seconds}s`;
              })()}
            </div>
          )}
          <div className="flex justify-between items-center">
            <div className="text-sm text-slate-400">
              {exercise.points} points
            </div>
            <div className="text-xs text-slate-500">
              {exercise.calories} kcal
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

// Modal for creating or editing a workout
function AddEditWorkoutModal({ open, onClose, formData, onChange, onSave, isEditing }) {
  const { workoutName, workoutDescription, workoutStartTime, workoutEndTime } = formData;
  
  const handleChange = (field, value) => {
    onChange({ ...formData, [field]: value });
  };
  
  return (
    <Modal open={open} onClose={onClose} title={isEditing ? "Edit Workout" : "Create Workout"} size="md">
      <div className="space-y-4">
        <div>
          <div className="text-sm text-slate-300 mb-1">Workout Name</div>
          <input 
            value={workoutName} 
            onChange={e => handleChange('workoutName', e.target.value)} 
            className="form-input w-full" 
            placeholder="My Workout"
          />
        </div>
        <div>
          <div className="text-sm text-slate-300 mb-1">Description</div>
          <textarea 
            value={workoutDescription} 
            onChange={e => handleChange('workoutDescription', e.target.value)} 
            className="form-input w-full" 
            rows="3"
            placeholder="Describe your workout"
          />
        </div>
        <div className="grid-2 gap-4">
          <div>
            <div className="text-sm text-slate-300 mb-1">Start Time</div>
            <input 
              type="datetime-local" 
              value={workoutStartTime.toISOString().slice(0, 16)} 
              onChange={e => handleChange('workoutStartTime', new Date(e.target.value))} 
              className="form-input w-full" 
            />
          </div>
          <div>
            <div className="text-sm text-slate-300 mb-1">End Time</div>
            <input 
              type="datetime-local" 
              value={workoutEndTime.toISOString().slice(0, 16)} 
              onChange={e => handleChange('workoutEndTime', new Date(e.target.value))} 
              className="form-input w-full" 
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={onSave} className="btn-primary">{isEditing ? "Update" : "Save"}</button>
        </div>
      </div>
    </Modal>
  );
}

// Modal for adding/editing an exercise
function EditExerciseModal({ open, onClose, formData, onChange, stations, isEditing, onSave, onDelete}) {
  const handleChange = (field, value) => {
    onChange({ ...formData, [field]: value });
  };
  
return (
  <Modal open={open} onClose={onClose} title={isEditing ? "Edit Exercise" : "Add Exercise"} size="md">
    <div className="space-y-4">
      <div className="grid-2 gap-4">
        <div>
          <div className="text-sm text-slate-300 mb-1">Exercise Name</div>
          <input 
            value={formData.exerciseName} 
            onChange={e => handleChange('exerciseName', e.target.value)} 
            className="form-input w-full" 
          />
        </div>
        <div>
          <div className="text-sm text-slate-300 mb-1">Station</div>
          <select 
            value={formData.selectedStation} 
            onChange={e => handleChange('selectedStation', e.target.value)} 
            className="form-input w-full"
          >
            <option value="">Select a station</option>
            {stations.map(station => (
              <option key={station.uid} value={station.uid}>
                {station.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="grid-2 gap-4">
        <div>
          <div className="text-sm text-slate-300 mb-1">Start Time</div>
          <input 
            type="datetime-local" 
            value={formData.exerciseStartTime.toISOString().slice(0, 16)} 
            onChange={e => handleChange('exerciseStartTime', new Date(e.target.value))} 
            className="form-input w-full" 
          />
        </div>
        <div>
          <div className="text-sm text-slate-300 mb-1">End Time</div>
          <input 
            type="datetime-local" 
            value={formData.exerciseEndTime.toISOString().slice(0, 16)} 
            onChange={e => handleChange('exerciseEndTime', new Date(e.target.value))} 
            className="form-input w-full" 
          />
        </div>
      </div>
      
      <div className="grid-2 gap-4">
        <div>
          <div className="text-sm text-slate-300 mb-1">Points</div>
          <input 
            type="number" 
            value={formData.exercisePoints} 
            onChange={e => handleChange('exercisePoints', e.target.value)} 
            className="form-input w-full" 
          />
        </div>
        <div>
          <div className="text-sm text-slate-300 mb-1">Calories</div>
          <input 
            type="number" 
            value={formData.exerciseCals} 
            onChange={e => handleChange('exerciseCals', e.target.value)} 
            className="form-input w-full" 
          />
        </div>
      </div>
      
      <div>
        <div className="text-sm text-slate-300 mb-1">Heart Rate (bpm)</div>
        <div className="grid-3 gap-4">
          <div>
            <div className="text-xs text-slate-400 mb-1">Average</div>
            <input 
              type="number" 
              value={formData.exerciseHR} 
              onChange={e => handleChange('exerciseHR', e.target.value)} 
              className="form-input w-full" 
            />
          </div>
          <div>
            <div className="text-xs text-slate-400 mb-1">Maximum</div>
            <input 
              type="number" 
              value={formData.exerciseMaxHR} 
              onChange={e => handleChange('exerciseMaxHR', e.target.value)} 
              className="form-input w-full" 
            />
          </div>
          <div>
            <div className="text-xs text-slate-400 mb-1">Minimum</div>
            <input 
              type="number" 
              value={formData.exerciseMinHR} 
              onChange={e => handleChange('exerciseMinHR', e.target.value)} 
              className="form-input w-full" 
            />
          </div>
        </div>
      </div>
      
      <div className="flex justify-end gap-2 pt-2">
        <button onClick={onClose} className="btn-secondary">Cancel</button>
        {isEditing && <button onClick={onDelete} className="btn-danger">Delete</button>}
        <button onClick={onSave} className="btn-primary">{isEditing ? "Update" : "Save"}</button>
      </div>
    </div>
  </Modal>
);
}

// Modal for displaying exercise details
function ViewExerciseModal({ 
  open, 
  onClose, 
  exercise, 
  helpers, 
  onEdit, 
}) {
  if (!exercise) return null;
  
  const { getStationNameById, getDateFromTimestamp } = helpers;

  return (
    <Modal 
      open={open} 
      onClose={onClose} 
      title="Exercise Details"
      size="md"
    >
      <div className="space-y-4">
        <div className="grid-2 gap-4">
          <div>
            <div className="text-sm text-slate-300 mb-1">Exercise Name</div>
            <div className="form-input w-full bg-slate-700 text-slate-200">
              {exercise.name || getStationNameById(exercise?.stationId || '')}
            </div>
          </div>
          <div>
            <div className="text-sm text-slate-300 mb-1">Station</div>
            <div className="form-input w-full bg-slate-700 text-slate-200">
              {getStationNameById(exercise.stationId)}
            </div>
          </div>
        </div>

        <div className="grid-2 gap-4">
          <div>
            <div className="text-sm text-slate-300 mb-1">Start Time</div>
            <div className="form-input w-full bg-slate-700 text-slate-200">
              {exercise.startTime ? new Date(getDateFromTimestamp(exercise.startTime)).toLocaleString() : '--'}
            </div>
          </div>
          <div>
            <div className="text-sm text-slate-300 mb-1">End Time</div>
            <div className="form-input w-full bg-slate-700 text-slate-200">
              {exercise.endTime ? new Date(getDateFromTimestamp(exercise.endTime)).toLocaleString() : '--'}
            </div>
          </div>
        </div>

        <div className="grid-2 gap-4">
          <div>
            <div className="text-sm text-slate-300 mb-1">Points</div>
            <div className="form-input w-full bg-slate-700 text-slate-200">
              {exercise.points}
            </div>
          </div>
          <div>
            <div className="text-sm text-slate-300 mb-1">Calories</div>
            <div className="form-input w-full bg-slate-700 text-slate-200">
              {exercise.calories} kcal
            </div>
          </div>
        </div>

        <div>
          <div className="text-sm text-slate-300 mb-1">Heart Rate (bpm)</div>
          <div className="grid-3 gap-4">
            <div>
              <div className="text-xs text-slate-400 mb-1">Average</div>
              <div className="form-input w-full bg-slate-700 text-slate-200">
                {exercise.heartRateAvg || '0'}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400 mb-1">Maximum</div>
              <div className="form-input w-full bg-slate-700 text-slate-200">
                {exercise.heartRateMax || '0'}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400 mb-1">Minimum</div>
              <div className="form-input w-full bg-slate-700 text-slate-200">
                {exercise.heartRateMin || '0'}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <div className="flex gap-2">
            <button onClick={onClose} className="btn-secondary">Cancel</button>
            <button 
              onClick={() => {
                onClose();
                onEdit(exercise);
              }} 
              className="btn-primary"
            >
              Edit
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// Main Page component
function Page({ userData }) {
  // UI visibility state
  const [modalState, setModalState] = useState({
    workoutOpen: false,
    addExerciseOpen: false,
    showExerciseModal: false,
    isEditing: false,
    editingWorkout: false
  });
  
  // Data loading state
  const [loadingState, setLoadingState] = useState({
    isLoadingLastWorkout: true,
    isLoadingStations: true
  });
  
  // Core data state
  const [dataState, setDataState] = useState({
    rank: '--',
    lastWorkout: null,
    stations: [],
    selectedExercise: null
  });
  
  // Form state for workout
  const [workoutForm, setWorkoutForm] = useState({
    workoutName: '',
    workoutDescription: '',
    workoutStartTime: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago default
    workoutEndTime: new Date() // Current time default
  });
  
  // Form state for exercise
  const [exerciseForm, setExerciseForm] = useState({
    selectedStation: '',
    exerciseName: '',
    exerciseStartTime: new Date(),
    exerciseEndTime: new Date(),
    exerciseHR: '',
    exerciseMaxHR: '',
    exerciseMinHR: '',
    exercisePoints: '',
    exerciseCals: ''
  });

  // Helper functions
  const helpers = {
    // Format timestamp to Date object
    getDateFromTimestamp: (timestamp) => {
      if (timestamp?.toDate) {
        return timestamp.toDate();
      } else if (timestamp?.seconds) {
        return new Date(timestamp.seconds * 1000);
      } else if (timestamp) {
        return new Date(timestamp);
      } else {
        return new Date(0);
      }
    },
    
    // Format duration in seconds to readable string
    formatDuration: (durationSeconds) => {
      if (userData.formatDuration) {
        return userData.formatDuration(durationSeconds);
      } else {
        const minutes = Math.floor(durationSeconds / 60);
        const seconds = durationSeconds % 60;
        return `${minutes}m ${seconds}s`;
      }
    },
    
    // Get workout duration
    getWorkoutDuration: (workout) => {
      if (!workout || !workout.startTime || !workout.endTime) return '--';
      
      let startTime = helpers.getDateFromTimestamp(workout.startTime);
      let endTime = helpers.getDateFromTimestamp(workout.endTime);
      return userData.formatDuration(endTime - startTime);
    },
    
    // Get total calories from a workout
    getTotalCalories: (workout) => {
      if (!workout || !workout.exercises || workout.exercises.length === 0) return 0;
      return workout.exercises.reduce((total, exercise) => total + (exercise.calories || 0), 0);
    },
    
    // Get total points from a workout
    getTotalPoints: (workout) => {
      if (!workout || !workout.exercises || workout.exercises.length === 0) return 0;
      return workout.exercises.reduce((total, exercise) => total + (exercise.points || 0), 0);
    },
    
    // Get workout date in dd.mm.yyyy format
    getWorkoutDate: (workout) => {
      if (!workout || !workout.createdAt) return '--';
      
      let createdTime = helpers.getDateFromTimestamp(workout.createdAt);
      
      const day = String(createdTime.getDate()).padStart(2, '0');
      const month = String(createdTime.getMonth() + 1).padStart(2, '0');
      const year = createdTime.getFullYear();
      
      return `${day}.${month}.${year}`;
    },
    
    // Get station name from ID
    getStationNameById: (stationId) => {
      const station = dataState.stations.find(s => s.uid === stationId);
      return station ? station.name : 'Unknown Station';
    }
  };

  // Fetch user rank
  useEffect(() => {
    const fetchUserRank = async () => {
      try {
        const userRank = await RankingSystem.getUserPointsRank(userData.uid);
        setDataState(prev => ({ ...prev, rank: userRank }));
      } catch (error) {
        console.error('Failed to fetch user rank:', error);
      }
    };
    
    fetchUserRank();
  }, [userData.uid]);

  // Load last workout
  useEffect(() => {
    loadLastWorkout();
  }, [userData.uid]);

  // Load stations
  useEffect(() => {
    const loadStations = async () => {
      try {
        setLoadingState(prev => ({ ...prev, isLoadingStations: true }));
        const allStations = await StationManagement.loadAll();
        setDataState(prev => ({ ...prev, stations: allStations }));
      } catch (error) {
        console.error('Failed to load stations:', error);
      } finally {
        setLoadingState(prev => ({ ...prev, isLoadingStations: false }));
      }
    };

    loadStations();
  }, []);

  const loadLastWorkout = async () => {
    try {
      setLoadingState(prev => ({ ...prev, isLoadingLastWorkout: true }));
      const workouts = await WorkoutManager.loadWorkouts(userData.uid);
        
      if (workouts && workouts.length > 0) {
        // Sort by start time to get the most recent workout
        const sortedWorkouts = workouts.sort((a, b) => {
          let dateA = helpers.getDateFromTimestamp(a.startTime);
          let dateB = helpers.getDateFromTimestamp(b.startTime);
          return dateB - dateA;
        });
        
        setDataState(prev => ({ ...prev, lastWorkout: sortedWorkouts[0] }));
      }
    } catch (error) {
      console.error('Failed to load last workout:', error);
    } finally {
      setLoadingState(prev => ({ ...prev, isLoadingLastWorkout: false }));
    }
  };

  const handleExerciseClick = (exercise) => {
    setDataState(prev => ({ ...prev, selectedExercise: exercise }));
    setModalState(prev => ({ ...prev, showExerciseModal: true }));
  };
  
  const handleDeleteExercise = async () => {
    if (!window.confirm("Are you sure you want to delete this exercise?")) {
      return;
    }
    
    try {
      const { lastWorkout } = dataState;
      if (lastWorkout && selectedExercise) {
        await WorkoutManager.deleteExercise(userData.uid, lastWorkout.uid, selectedExercise.uid);
        setModalState(prev => ({ ...prev, showExerciseModal: false }));
        loadLastWorkout();
        setModalState(prev => ({ ...prev, addExerciseOpen: false }));
      }
    } catch (error) {
      console.error("Error deleting exercise:", error);
      alert("Failed to delete exercise");
    }
  };
  
  const handleEditExercise = (exercise) => {
    setModalState(prev => ({ 
      ...prev, 
      isEditing: true,
      showExerciseModal: false,
      addExerciseOpen: true
    }));
    
    setDataState(prev => ({ ...prev, selectedExercise: exercise }));
    
    // Populate form fields with exercise data
    setExerciseForm({
      exerciseName: exercise.name || '',
      selectedStation: exercise.stationId || '',
      exerciseStartTime: exercise.startTime ? new Date(helpers.getDateFromTimestamp(exercise.startTime)) : new Date(),
      exerciseEndTime: exercise.endTime ? new Date(helpers.getDateFromTimestamp(exercise.endTime)) : new Date(),
      exercisePoints: exercise.points?.toString() || '',
      exerciseCals: exercise.calories?.toString() || '',
      exerciseHR: exercise.heartRateAvg?.toString() || '',
      exerciseMaxHR: exercise.heartRateMax?.toString() || '',
      exerciseMinHR: exercise.heartRateMin?.toString() || ''
    });
  };

  const handleEditWorkout = () => {
    const { lastWorkout } = dataState;
    
    if (!lastWorkout) return;
    
    // Set modal state for editing
    setModalState(prev => ({
      ...prev,
      workoutOpen: true,
      editingWorkout: true
    }));
    
    // Populate form with workout data
    setWorkoutForm({
      workoutName: lastWorkout.name || '',
      workoutDescription: lastWorkout.description || '',
      workoutStartTime: lastWorkout.startTime ? 
        new Date(helpers.getDateFromTimestamp(lastWorkout.startTime)) : 
        new Date(Date.now() - 30 * 60 * 1000),
      workoutEndTime: lastWorkout.endTime ? 
        new Date(helpers.getDateFromTimestamp(lastWorkout.endTime)) : 
        new Date()
    });
  };

  const handleAddExercise = () => {
    // Reset form fields for a new exercise
    setModalState(prev => ({ 
      ...prev, 
      isEditing: false,
      addExerciseOpen: true 
    }));
    
    setDataState(prev => ({ ...prev, selectedExercise: null }));
    
    // Set default times (current time for end, 30 minutes earlier for start)
    const now = new Date();
    const thirtyMinutesAgo = new Date(now.getTime() - (30 * 60 * 1000));
    
    setExerciseForm({
      exerciseName: '',
      selectedStation: dataState.stations.length > 0 ? dataState.stations[0].uid : '',
      exerciseStartTime: thirtyMinutesAgo,
      exerciseEndTime: now,
      exerciseHR: '',
      exerciseMaxHR: '',
      exerciseMinHR: '',
      exercisePoints: '',
      exerciseCals: ''
    });
  };

  const saveExercise = async () => {
    try {
      const { lastWorkout } = dataState;
      const { isEditing } = modalState;
      
      if (!lastWorkout) {
        alert('No active workout found. Please start a workout first.');
        return;
      }

      if (!exerciseForm.selectedStation) {
        alert('Please select a station');
        return;
      }

      if (!exerciseForm.exerciseName.trim()) {
        alert('Please enter an exercise name');
        return;
      }
      
      if (!exerciseForm.exerciseStartTime || !exerciseForm.exerciseEndTime) {
        alert('Please set both start and end times');
        return;
      }
      
      if (exerciseForm.exerciseEndTime < exerciseForm.exerciseStartTime) {
        alert('End time must be after start time');
        return;
      }
      
      // Prepare exercise object
      let exerciseData = {
        name: exerciseForm.exerciseName.trim(),
        stationId: exerciseForm.selectedStation,
        startTime: exerciseForm.exerciseStartTime,
        endTime: exerciseForm.exerciseEndTime,
        heartRateAvg: parseInt(exerciseForm.exerciseHR) || 0,
        heartRateMax: parseInt(exerciseForm.exerciseMaxHR) || 0,
        heartRateMin: parseInt(exerciseForm.exerciseMinHR) || 0,
        points: parseInt(exerciseForm.exercisePoints) || 0,
        calories: parseInt(exerciseForm.exerciseCals) || 0,
      };
      
      let updatedWorkout;
      
      if (isEditing && dataState.selectedExercise) {
        dataState.selectedExercise = { ...dataState.selectedExercise, ...exerciseData };
        await WorkoutManager.updateExercise(userData.uid, lastWorkout.uid, dataState.selectedExercise);
        updatedWorkout = {
          ...lastWorkout,
          exercises: lastWorkout.exercises.map(ex => 
            (ex.uid === dataState.selectedExercise.uid) ? { ...ex, ...dataState.selectedExercise } : ex
          )
        };
      } else {
        const uid = await WorkoutManager.addExercise(userData.uid, lastWorkout.uid, exerciseData);
        updatedWorkout = {
          ...lastWorkout,
          exercises: [...(lastWorkout.exercises || []), { ...exerciseData, uid }]
        };
      }

      
      // Update local state
      setDataState(prev => ({ ...prev, lastWorkout: updatedWorkout }));
      
      setModalState(prev => ({ ...prev, addExerciseOpen: false }));
      
    } catch (error) {
      console.error('Failed to save exercise:', error);
      alert('Failed to save exercise. Please try again.');
    }
  };

  const saveWorkout = async () => {
    try {
      if (!workoutForm.workoutName.trim()) {
        alert('Please enter a workout name');
        return;
      }
      
      if (workoutForm.workoutEndTime < workoutForm.workoutStartTime) {
        alert('End time must be after start time');
        return;
      }
            
      const { editingWorkout } = modalState;
      const { lastWorkout } = dataState;
      
      if (editingWorkout && lastWorkout) {
        // If editing, update the existing workout
        const updatedWorkout = {
          ...lastWorkout,
          name: workoutForm.workoutName.trim(),
          description: workoutForm.workoutDescription.trim(),
          startTime: workoutForm.workoutStartTime,
          endTime: workoutForm.workoutEndTime,
        };
        
        // Update workout in database
        await WorkoutManager.saveWorkout(updatedWorkout);
        
        // Update local state
        setDataState(prev => ({ ...prev, lastWorkout: updatedWorkout }));
        
      } else {
        // Create new workout object
        const workoutData = {
          userId: userData.uid,
          name: workoutForm.workoutName.trim(),
          description: workoutForm.workoutDescription.trim(),
          startTime: workoutForm.workoutStartTime,
          endTime: workoutForm.workoutEndTime,
          exercises: []
        };
        
        // Save new workout
        await WorkoutManager.saveWorkout(workoutData);
      }
      
      // Reset form and close modal
      setWorkoutForm({
        workoutName: '',
        workoutDescription: '',
        workoutStartTime: new Date(Date.now() - 30 * 60 * 1000),
        workoutEndTime: new Date()
      });
      
      setModalState(prev => ({ ...prev, workoutOpen: false }));
      
      // Reload last workout to show the new one
      loadLastWorkout();
    } catch (error) {
      console.error('Failed to save workout:', error);
      alert('Failed to save workout. Please try again.');
    }
  };

  // Exercises section header component
  const ExerciseSectionHeader = () => (
    <div className="flex justify-between items-center mb-3">
      <h3 className="text-lg font-semibold text-gradient">Latest Exercises</h3>
      <button 
        onClick={handleAddExercise}
        className="btn-primary text-sm px-3 py-1 rounded-full"
      >
        Add Exercise
      </button>
    </div>
  );

  // Destructuring for cleaner code
  const { rank, lastWorkout, stations, selectedExercise } = dataState;
  const { isLoadingLastWorkout, isLoadingStations } = loadingState;
  const { workoutOpen, addExerciseOpen, showExerciseModal, isEditing } = modalState;

  return (
    <Screen titleNode={<UserHeader userData={userData} />}>
      {/* Level Progress */}
      <LevelProgressBar userData={userData} />

      {/* Workout Stats */}
      {!isLoadingLastWorkout && lastWorkout && (
        <WorkoutStats 
          lastWorkout={lastWorkout} 
          helpers={helpers}
        />
      )}

      {/* Workout Buttons */}
      <div className="mt-6 grid-2 gap-3">
        <button 
          onClick={() => {
            setModalState(prev => ({ ...prev, workoutOpen: true, editingWorkout: false }));
            // Reset form for new workout
            setWorkoutForm({
              workoutName: '',
              workoutDescription: '',
              workoutStartTime: new Date(Date.now() - 30 * 60 * 1000),
              workoutEndTime: new Date()
            });
          }} 
          className="btn-primary py-3"
        >
          Start Workout
        </button>
        
        {!isLoadingLastWorkout && lastWorkout && (
          <button 
            onClick={handleEditWorkout}
            className="btn-secondary py-3"
          >
            Edit Workout
          </button>
        )}
      </div>

      {/* Exercise List Section */}
      {!isLoadingLastWorkout && lastWorkout && (
        <div className="mt-8">
          <ExerciseSectionHeader />
          <ExerciseList 
            exercises={lastWorkout.exercises}
            helpers={helpers}
            onExerciseClick={handleExerciseClick}
          />
        </div>
      )}

      {/* Modals */}
      <AddEditWorkoutModal 
        open={workoutOpen}
        onClose={() => setModalState(prev => ({ ...prev, workoutOpen: false, editingWorkout: false }))}
        formData={workoutForm}
        onChange={setWorkoutForm}
        onSave={saveWorkout}
        isEditing={modalState.editingWorkout}
      />

      <EditExerciseModal
        open={addExerciseOpen}
        onClose={() => setModalState(prev => ({ ...prev, addExerciseOpen: false }))}
        isEditing={isEditing}
        stations={stations}
        formData={exerciseForm}
        onChange={setExerciseForm}
        onSave={saveExercise}
        onDelete={handleDeleteExercise}
      />

      <ViewExerciseModal
        open={showExerciseModal}
        onClose={() => setModalState(prev => ({ ...prev, showExerciseModal: false }))}
        exercise={selectedExercise}
        helpers={helpers}
        userData={userData}
        onEdit={handleEditExercise}
      />
    </Screen>
  );
}

const HomePageElements = {
  Page
};

export default HomePageElements;