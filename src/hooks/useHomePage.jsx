
import { useState, useEffect, useCallback } from 'react';
import WorkoutManager from '../services/WorkoutManagement.jsx';
import StationManagement from '../services/StationManagement.jsx';
import GameManager from '../services/GameManager.jsx';

/**
 * Custom hook for managing HomePage state and business logic.
 * 
 * @param {Object} userData - The current user's data
 * @returns {Object} State and handlers for the HomePage component
 */
export function useHomePage(userData) {
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
    isLoadingStations: true,
    isLoadingGames: true
  });
  
  // Core data state
  const [dataState, setDataState] = useState({
    lastWorkout: null,
    allWorkouts: [],
    selectedWorkoutId: null,
    stations: [],
    games: [],
    selectedExercise: null
  });
  
  // Form state for workout
  const [workoutForm, setWorkoutForm] = useState({
    workoutName: '',
    workoutDescription: ''
  });
  
  // Form state for exercise
  const [exerciseForm, setExerciseForm] = useState({
    selectedStation: '',
    gameId: '',
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
    getDateFromTimestamp: (timestamp) => {
      try {
        if (timestamp?.toDate && typeof timestamp.toDate === 'function') {
          return timestamp.toDate();
        }
        if (timestamp?.seconds) {
          return new Date(timestamp.seconds * 1000);
        }
        return new Date(timestamp);
      } catch (error) {
        console.error('Error converting timestamp:', error);
        return new Date();
      }
    },
    getStationNameById: (stationId) => {
      const station = dataState.stations.find(s => s.uid === stationId);
      return station ? station.name : 'Unknown Station';
    },
    getGameNameById: (gameId) => {
      const game = dataState.games.find(g => g.uid === gameId);
      return game ? game.name : '';
    }
  };

  

  // Function to refresh user data (level, points) after exercise changes
  const refreshUserData = () => {
    window.dispatchEvent(new CustomEvent('refreshUserData'));
  };

  const loadLastWorkout = useCallback(async (preferredWorkoutId = null) => {
    try {
      setLoadingState(prev => ({ ...prev, isLoadingLastWorkout: true }));
      const workouts = await WorkoutManager.loadWorkouts(userData.uid);
      
      if (workouts.length > 0) {
        const sortedWorkouts = workouts.sort((a, b) => {
          const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt);
          const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt);
          return bTime.getTime() - aTime.getTime();
        });
        // If a preferred workout is provided and exists, keep it selected; otherwise pick the latest
        const preferred = preferredWorkoutId
          ? sortedWorkouts.find(w => w.uid === preferredWorkoutId)
          : null;
        const nextSelected = preferred ? preferred : sortedWorkouts[0];

        setDataState(prev => ({
          ...prev,
          lastWorkout: nextSelected,
          allWorkouts: sortedWorkouts,
          selectedWorkoutId: nextSelected.uid
        }));
      } else {
        // No workouts found; clear related state to avoid showing stale data
        setDataState(prev => ({
          ...prev,
          lastWorkout: null,
          allWorkouts: [],
          selectedWorkoutId: null
        }));
      }
    } catch (error) {
      console.error('Error loading workouts:', error);
    } finally {
      setLoadingState(prev => ({ ...prev, isLoadingLastWorkout: false }));
    }
  }, [userData.uid]);

  const loadStations = useCallback(async () => {
    try {
      setLoadingState(prev => ({ ...prev, isLoadingStations: true }));
      const stations = await StationManagement.loadAll();
      setDataState(prev => ({ ...prev, stations }));
    } catch (error) {
      console.error('Error loading stations:', error);
    } finally {
      setLoadingState(prev => ({ ...prev, isLoadingStations: false }));
    }
  }, []);

  const loadGames = useCallback(async () => {
    try {
      setLoadingState(prev => ({ ...prev, isLoadingGames: true }));
      const games = await GameManager.loadAll();
      setDataState(prev => ({ ...prev, games }));
    } catch (error) {
      console.error('Error loading games:', error);
    } finally {
      setLoadingState(prev => ({ ...prev, isLoadingGames: false }));
    }
  }, []);

  // Load last workout on mount and when dependencies change
  useEffect(() => {
    loadLastWorkout();
  }, [loadLastWorkout]);

  // Load stations on mount
  useEffect(() => {
    loadStations();
  }, [loadStations]);

  // Load games on mount
  useEffect(() => {
    loadGames();
  }, [loadGames]);

  const handleExerciseClick = (exercise) => {
    setDataState(prev => ({ ...prev, selectedExercise: exercise }));
    setModalState(prev => ({ ...prev, showExerciseModal: true }));
  };

  const handleWorkoutSelection = (workoutId) => {
    const selectedWorkout = dataState.allWorkouts.find(w => w.uid === workoutId);
    setDataState(prev => ({
      ...prev,
      selectedWorkoutId: workoutId,
      lastWorkout: selectedWorkout || null
    }));
  };
  
  const handleDeleteExercise = async () => {
    try {
      await WorkoutManager.deleteExercise(
        userData.uid, 
        dataState.selectedWorkoutId, 
        dataState.selectedExercise.uid
      );
      
  await loadLastWorkout(dataState.selectedWorkoutId);
      refreshUserData();
      
      setModalState(prev => ({ ...prev, addExerciseOpen: false, isEditing: false }));
    } catch (error) {
      console.error('Error deleting exercise:', error);
    }
  };

  const handleDeleteWorkout = async (workoutId) => {
    try {
      await WorkoutManager.deleteWorkout(userData.uid, workoutId);
  await loadLastWorkout();
  // Ensure user-dependent aggregates (level, points) are refreshed
  refreshUserData();
    } catch (error) {
      console.error('Error deleting workout:', error);
    }
  };

  const handleDeleteCurrentWorkout = () => {
    if (dataState.lastWorkout) {
      handleDeleteWorkout(dataState.lastWorkout.uid);
      setModalState(prev => ({ ...prev, workoutOpen: false, editingWorkout: false }));
    }
  };
  
  const handleEditExercise = (exercise) => {
    setExerciseForm({
      selectedStation: exercise.stationId || '',
      gameId: exercise.gameId || '',
      exerciseName: exercise.name || '',
      exerciseStartTime: helpers.getDateFromTimestamp(exercise.startTime),
      exerciseEndTime: helpers.getDateFromTimestamp(exercise.endTime),
      exerciseHR: exercise.heartRateAvg || '',
      exerciseMaxHR: exercise.heartRateMax || '',
      exerciseMinHR: exercise.heartRateMin || '',
      exercisePoints: exercise.points || '',
      exerciseCals: exercise.calories || ''
    });
    
    setDataState(prev => ({ ...prev, selectedExercise: exercise }));
    setModalState(prev => ({ 
      ...prev, 
      addExerciseOpen: true, 
      isEditing: true,
      showExerciseModal: false
    }));
  };

  const handleEditWorkout = () => {
    if (dataState.lastWorkout) {
      setWorkoutForm({
        workoutName: dataState.lastWorkout.name || '',
        workoutDescription: dataState.lastWorkout.description || ''
      });
      
      setModalState(prev => ({ 
        ...prev, 
        workoutOpen: true, 
        editingWorkout: true 
      }));
    }
  };

  const handleAddExercise = () => {
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    
    setExerciseForm({
      selectedStation: dataState.stations.length > 0 ? dataState.stations[0].uid : '',
      exerciseName: '',
      exerciseStartTime: now,
      exerciseEndTime: oneHourLater,
      exerciseHR: '',
      exerciseMaxHR: '',
      exerciseMinHR: '',
      exercisePoints: '',
      exerciseCals: ''
    });
    
    setModalState(prev => ({ 
      ...prev, 
      addExerciseOpen: true, 
      isEditing: false 
    }));
  };

  const saveExercise = async () => {
    try {
      const exerciseData = {
        name: exerciseForm.exerciseName,
        stationId: exerciseForm.selectedStation,
        gameId: exerciseForm.gameId,
        startTime: exerciseForm.exerciseStartTime,
        endTime: exerciseForm.exerciseEndTime,
        heartRateAvg: parseInt(exerciseForm.exerciseHR) || 0,
        heartRateMax: parseInt(exerciseForm.exerciseMaxHR) || 0,
        heartRateMin: parseInt(exerciseForm.exerciseMinHR) || 0,
        points: parseInt(exerciseForm.exercisePoints) || 0,
        calories: parseInt(exerciseForm.exerciseCals) || 0
      };

      if (modalState.isEditing) {
        await WorkoutManager.updateExercise(
          userData.uid, 
          dataState.selectedWorkoutId, 
          { ...exerciseData, uid: dataState.selectedExercise.uid }
        );
      } else {
        await WorkoutManager.addExercise(userData.uid, dataState.selectedWorkoutId, exerciseData);
      }

  await loadLastWorkout(dataState.selectedWorkoutId);
      refreshUserData();
      
      setModalState(prev => ({ ...prev, addExerciseOpen: false, isEditing: false }));
    } catch (error) {
      console.error('Error saving exercise:', error);
    }
  };

  const saveWorkout = async () => {
    try {
      const workoutData = {
        userId: userData.uid,
        name: workoutForm.workoutName,
        description: workoutForm.workoutDescription
      };

      if (modalState.editingWorkout) {
        await WorkoutManager.update({ ...workoutData, uid: dataState.lastWorkout.uid });
      } else {
        await WorkoutManager.saveWorkout(workoutData);
      }

      await loadLastWorkout();
      setModalState(prev => ({ ...prev, workoutOpen: false, editingWorkout: false }));
    } catch (error) {
      console.error('Error saving workout:', error);
    }
  };

  const handleStartWorkout = () => {
    setWorkoutForm({ workoutName: '', workoutDescription: '' });
    setModalState(prev => ({ ...prev, workoutOpen: true, editingWorkout: false }));
  };

  // Return all state and handlers
  return {
    // State
    modalState,
    setModalState,
    loadingState,
    dataState,
    workoutForm,
    setWorkoutForm,
    exerciseForm,
    setExerciseForm,
    helpers,
    
    // Handlers
    handleExerciseClick,
    handleWorkoutSelection,
    handleDeleteExercise,
    handleDeleteCurrentWorkout,
    handleEditExercise,
    handleEditWorkout,
    handleAddExercise,
    handleStartWorkout,
    saveExercise,
    saveWorkout,
  };
}
