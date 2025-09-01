import React, { useState, useEffect, useRef } from 'react';
import ExpElements from '../components/ui/ExpBar';
import IconElements from '../components/ui/IconElements';
import { Card, Screen, Stat, Avatar, Modal } from '../components/ui/UIComponents';
import RankingSystem from '../services/firebase/RankingSystem';
import WorkoutManager from '../services/firebase/WorkoutManagement';
import StationManagement from '../services/firebase/StationManagement';

import '../sphere-styles.css';

function Page({ userData }) {
  const [stationOpen, setStationOpen] = useState(null);
  const [rank, setRank] = useState('--');
  const [lastWorkout, setLastWorkout] = useState(null);
  const [isLoadingLastWorkout, setIsLoadingLastWorkout] = useState(true);
  const [stations, setStations] = useState([]);
  const [isLoadingStations, setIsLoadingStations] = useState(true);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [workoutOpen, setWorkoutOpen] = useState(false);
  const [wTime, setWTime] = useState('');
  const [wHR, setWHR] = useState('');
  const [wPoints, setWPoints] = useState('');
  const [wCals, setWCals] = useState('');

  // Calculate level progress
  const progress = Math.min(100, Math.round(((userData.points || 0) / (userData.currentMaxPoints() || 1)) * 100));
  
  // Fetch user rank
  useEffect(() => {
    const fetchUserRank = async () => {
      try {
        const userRank = await RankingSystem.getUserPointsRank(userData.uid);
        setRank(userRank);
      } catch (error) {
        console.error('Failed to fetch user rank:', error);
        setRank('--');
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
        setIsLoadingStations(true);
        const allStations = await StationManagement.loadAll();
        setStations(allStations);
      } catch (error) {
        console.error('Failed to load stations:', error);
        setStations([]);
      } finally {
        setIsLoadingStations(false);
      }
    };

    loadStations();
  }, []);

  const loadLastWorkout = async () => {
    try {
      setIsLoadingLastWorkout(true);
      
      // Check if workouts are already in userData
      if (userData.workouts && userData.workouts.length > 0) {
        const workouts = userData.workouts;
        
        // Sort by start time to get the most recent workout
        const sortedWorkouts = workouts.sort((a, b) => {
          let dateA = getDateFromTimestamp(a.startTime);
          let dateB = getDateFromTimestamp(b.startTime);
          return dateB - dateA;
        });
        
        setLastWorkout(sortedWorkouts[0]);
      } else {
        // Fallback to WorkoutManager if no workouts in userData
        const workouts = await WorkoutManager.loadWorkouts(userData.uid);
        
        if (workouts && workouts.length > 0) {
          // Sort by start time to get the most recent workout
          const sortedWorkouts = workouts.sort((a, b) => {
            let dateA = getDateFromTimestamp(a.startTime);
            let dateB = getDateFromTimestamp(b.startTime);
            return dateB - dateA;
          });
          
          setLastWorkout(sortedWorkouts[0]);
        } else {
          setLastWorkout(null);
        }
      }
    } catch (error) {
      console.error('Failed to load last workout:', error);
      setLastWorkout(null);
    } finally {
      setIsLoadingLastWorkout(false);
    }
  };

  // Helper function to handle different timestamp formats
  const getDateFromTimestamp = (timestamp) => {
    if (timestamp?.toDate) {
      return timestamp.toDate();
    } else if (timestamp?.seconds) {
      return new Date(timestamp.seconds * 1000);
    } else if (timestamp) {
      return new Date(timestamp);
    } else {
      return new Date(0);
    }
  };

  const getWorkoutDuration = (workout) => {
    if (!workout || !workout.startTime || !workout.endTime) return '--';
    
    let startTime = getDateFromTimestamp(workout.startTime);
    let endTime = getDateFromTimestamp(workout.endTime);
    
    const durationMs = endTime - startTime;
    const durationSeconds = Math.floor(durationMs / 1000);
    
    if (userData.formatDuration) {
      return userData.formatDuration(durationSeconds);
    } else {
      const minutes = Math.floor(durationSeconds / 60);
      const seconds = durationSeconds % 60;
      return `${minutes}m ${seconds}s`;
    }
  };

  const getTotalCalories = (workout) => {
    if (!workout || !workout.exercises || workout.exercises.length === 0) return 0;
    return workout.exercises.reduce((total, exercise) => total + (exercise.calories || 0), 0);
  };

  const getTotalPoints = (workout) => {
    if (!workout || !workout.exercises || workout.exercises.length === 0) return 0;
    return workout.exercises.reduce((total, exercise) => total + (exercise.points || 0), 0);
  };

  const getWorkoutDate = (workout) => {
    if (!workout || !workout.createdAt) return '--';
    
    let createdTime = getDateFromTimestamp(workout.createdAt);
    
    const day = String(createdTime.getDate()).padStart(2, '0');
    const month = String(createdTime.getMonth() + 1).padStart(2, '0');
    const year = createdTime.getFullYear();
    
    return `${day}.${month}.${year}`;
  };

  const handleExerciseClick = (exercise) => {
    setSelectedExercise(exercise);
    setShowExerciseModal(true);
  };

  const handleAddExercise = () => {
    // Navigate to exercise creation page
    window.location.href = '/workout/exercise/new';
  };

  const getStationNameById = (stationId) => {
    const station = stations.find(s => s.uid === stationId);
    return station ? station.name : 'Unknown Station';
  };

  const saveWorkout = async () => {
    try {
      // Parse time input (mm:ss format)
      const [minutes, seconds] = wTime.split(':').map(Number);
      const totalSeconds = (minutes || 0) * 60 + (seconds || 0);
      
      // Create workout object
      const workoutData = {
        userId: userData.uid,
        startTime: new Date(Date.now() - totalSeconds * 1000), // Calculate start time based on duration
        endTime: new Date(),
        heartRateAvg: parseInt(wHR) || 0,
        points: parseInt(wPoints) || 0,
        calories: parseInt(wCals) || 0,
        exercises: []
      };
      
      // Save workout
      await WorkoutManager.saveWorkout(workoutData);
      
      // Reset form and close modal
      setWTime('');
      setWHR('');
      setWPoints('');
      setWCals('');
      setWorkoutOpen(false);
      
      // Reload last workout to show the new one
      loadLastWorkout();
    } catch (error) {
      console.error('Failed to save workout:', error);
      alert('Failed to save workout. Please try again.');
    }
  };

  const header = (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Avatar name={userData.displayName} photoURL={userData.photoURL} size={48} />
        <div>
          <h1 className="screen-title">{userData.displayName?.split(' ')[0] || 'User'}</h1>
          <p className="screen-subtitle">Level {userData.level} • Rank #{rank}</p>
        </div>
      </div>
    </div>
  );

  return (
    <Screen titleNode={header}>
      <Card>
        <div className="flex items-center justify-between mb-2">
          <span className="text-slate-400 text-sm">Level Progress</span>
          <span className="text-slate-300 text-sm">{userData.points}/{userData.currentMaxPoints()} Points</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </Card>

      {!isLoadingLastWorkout && lastWorkout && (
        <div className="grid-2 mt-4">
          <Card><Stat label="TIME" value={getWorkoutDuration(lastWorkout)} /></Card>
          <Card><Stat label="HEART RATE" value={<>{lastWorkout.heartRateAvg || '--'} bpm</>} /></Card>
          <Card><Stat label="POINTS" value={getTotalPoints(lastWorkout)} /></Card>
          <Card><Stat label="CALORIES" value={<>{getTotalCalories(lastWorkout)} kcal</>} /></Card>
        </div>
      )}

      <div className="mt-6">
        <button onClick={() => setWorkoutOpen(true)} className="btn-primary w-full py-3">
          Start Workout
        </button>
      </div>

      {/* Station Section */}
      {!isLoadingLastWorkout && lastWorkout && lastWorkout.exercises && lastWorkout.exercises.length > 0 && (
        <div className="mt-8">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold text-gradient">Latest Exercises</h3>
            <button 
              onClick={handleAddExercise}
              className="btn-secondary text-sm px-3 py-1 rounded-full"
            >
              Add Exercise
            </button>
          </div>
          <div className="grid-2 gap-3">
            {lastWorkout.exercises.map((exercise, index) => (
              <Card key={exercise.uid || index} onClick={() => handleExerciseClick(exercise)}>
                <div className="font-medium mb-1">{getStationNameById(exercise.stationId)}</div>
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
        </div>
      )}

      {/* Workout Modal */}
      <Modal open={workoutOpen} onClose={() => setWorkoutOpen(false)} title="Create Workout" size="md">
        <div className="space-y-3">
          <div className="grid-2 gap-3">
            <label className="form-label">Time (mm:ss)
              <input value={wTime} onChange={e=>setWTime(e.target.value)} className="form-input mt-1" />
            </label>
            <label className="form-label">Heart Rate (bpm)
              <input type="number" value={wHR} onChange={e=>setWHR(e.target.value)} className="form-input mt-1" />
            </label>
            <label className="form-label">Points
              <input type="number" value={wPoints} onChange={e=>setWPoints(e.target.value)} className="form-input mt-1" />
            </label>
            <label className="form-label">Calories
              <input type="number" value={wCals} onChange={e=>setWCals(e.target.value)} className="form-input mt-1" />
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={()=>setWorkoutOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={saveWorkout} className="btn-primary">Save</button>
          </div>
        </div>
      </Modal>

      {/* Exercise Detail Modal */}
      {showExerciseModal && selectedExercise && (
        <Modal onClose={() => setShowExerciseModal(false)}>
          <div className="p-4">
            <h3 className="text-xl font-bold mb-4">{getStationNameById(selectedExercise.stationId)}</h3>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <div className="text-sm text-slate-400">Points</div>
                <div className="font-medium">{selectedExercise.points}</div>
              </div>
              <div>
                <div className="text-sm text-slate-400">Calories</div>
                <div className="font-medium">{selectedExercise.calories} kcal</div>
              </div>
              <div>
                <div className="text-sm text-slate-400">Heart Rate</div>
                <div className="font-medium">{selectedExercise.heartRateAvg || '--'} bpm</div>
              </div>
              <div>
                <div className="text-sm text-slate-400">Duration</div>
                <div className="font-medium">
                  {selectedExercise.startTime && selectedExercise.endTime ? 
                    (() => {
                      const startTime = getDateFromTimestamp(selectedExercise.startTime);
                      const endTime = getDateFromTimestamp(selectedExercise.endTime);
                      const durationMs = endTime - startTime;
                      const durationSeconds = Math.floor(durationMs / 1000);
                      const minutes = Math.floor(durationSeconds / 60);
                      const seconds = durationSeconds % 60;
                      return `${minutes}m ${seconds}s`;
                    })() : '--'}
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => setShowExerciseModal(false)} 
              className="btn-primary w-full py-2"
            >
              Close
            </button>
          </div>
        </Modal>
      )}
    </Screen>
  );
}

const HomePageElements = {
    Page
};

export default HomePageElements;