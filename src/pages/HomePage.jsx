import React, { useState, useEffect } from 'react';
import { Card, Screen, Stat, Avatar, Modal } from '../components/ui/UIComponents';
import RankingSystem from '../services/firebase/RankingSystem';
import WorkoutManager from '../services/firebase/WorkoutManagement';
import StationManagement from '../services/firebase/StationManagement';
import { Timestamp } from 'firebase/firestore';
import BaseModel from '../services/interfaces/base.jsx';

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
  const [addExerciseOpen, setAddExerciseOpen] = useState(false);
  const [eTime, setETime] = useState('');
  const [eHR, setEHR] = useState('');
  const [ePoints, setEPoints] = useState('');
  const [eCals, setECals] = useState('');
  const [eStationId, setEStationId] = useState('');
  const [isAddingExercise, setIsAddingExercise] = useState(false);
  const [eTimeError, setETimeError] = useState('');
  const [wTimeError, setWTimeError] = useState('');

  // Parse duration helper: accepts "mm:ss" or seconds (number)
  const parseDurationInput = (value) => {
    if (!value || value.trim() === '') return { seconds: 0, error: '' };
    const v = value.trim();
    // allow seconds as integer
    if (/^\d+$/.test(v)) {
      return { seconds: parseInt(v, 10), error: '' };
    }
    // allow mm:ss
    const mmssMatch = v.match(/^(\d{1,2}):(\d{2})$/);
    if (mmssMatch) {
      const m = parseInt(mmssMatch[1], 10);
      const s = parseInt(mmssMatch[2], 10);
      if (s >= 60) return { seconds: 0, error: 'Seconds must be 00-59' };
      return { seconds: m * 60 + s, error: '' };
    }
    return { seconds: 0, error: 'Use mm:ss (e.g., 05:30) or seconds (e.g., 330)' };
  };

  // Calculate level progress
  const progress = Math.min(100, Math.round(((userData.points || 0) / (userData.currentMaxPoints() || 1)) * 100));

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
      setIsLoadingLastWorkout(true);

      // Check if workouts are already in userData
      if (userData.workouts && userData.workouts.length > 0) {
        const workouts = userData.workouts;

        // Sort by start time to get the most recent workout
        const sortedWorkouts = workouts.sort((a, b) => {
          const aTime = a?.startTime?.toDate ? a.startTime.toDate().getTime() : 0;
          const bTime = b?.startTime?.toDate ? b.startTime.toDate().getTime() : 0;
          return bTime - aTime;
        });

        setLastWorkout(sortedWorkouts[0]);
      } else {
        // Fallback to WorkoutManager if no workouts in userData
        const workouts = await WorkoutManager.loadWorkouts(userData.uid);

        if (workouts && workouts.length > 0) {
          // Sort by start time to get the most recent workout
          const sortedWorkouts = workouts.sort((a, b) => {
            const aTime = a?.startTime?.toDate ? a.startTime.toDate().getTime() : 0;
            const bTime = b?.startTime?.toDate ? b.startTime.toDate().getTime() : 0;
            return bTime - aTime;
          });

          setLastWorkout(sortedWorkouts[0]);
        } else {
          setLastWorkout(null);
        }
      }
    } catch (error) {
      console.error('Failed to load last workout:', error);
    } finally {
      setLoadingState(prev => ({ ...prev, isLoadingLastWorkout: false }));
    }
  };

  const getWorkoutDuration = (workout) => {
    if (!workout || !workout.startTime || !workout.endTime) return '--';
    const bm = new BaseModel();
    const minutes = bm.getDurationMinutes(workout.startTime, workout.endTime);
    return bm.formatDurationMinutes(minutes);
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
    const bm = new BaseModel({ createdAt: workout.createdAt });
    return bm.getCreateAt();
  };

  const handleExerciseClick = (exercise) => {
    setSelectedExercise(exercise);
    setShowExerciseModal(true);
  };

  const handleAddExercise = () => {
    // Open modal to add an exercise to the latest workout
    setAddExerciseOpen(true);
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
        userId: userData.uid
      };
      
      let updatedWorkout;
      
      if (isEditing && dataState.selectedExercise) {
        // If editing, update the existing exercise
        updatedWorkout = {
          ...lastWorkout,
          exercises: lastWorkout.exercises.map(ex => 
            (ex.uid === dataState.selectedExercise.uid) ? { ...ex, ...exerciseData } : ex
          )
        };
        alert("Exercise updated successfully");
      } else {
        // If adding new, create a new exercise with a UID
        exerciseData.uid = `exercise_${Date.now()}`; // Generate a temporary ID
        
        // Add the exercise to the current workout
        updatedWorkout = {
          ...lastWorkout,
          exercises: [...(lastWorkout.exercises || []), exerciseData]
        };
        alert("Exercise added successfully");
      }

      // Update the workout in the database
      await WorkoutManager.updateWorkout(updatedWorkout);
      
      // Update local state
      setDataState(prev => ({ ...prev, lastWorkout: updatedWorkout }));
      
      // Reset form and close modal
      setModalState(prev => ({ ...prev, addExerciseOpen: false }));
      
    } catch (error) {
      console.error('Failed to save exercise:', error);
      alert('Failed to save exercise. Please try again.');
    }
  };

  const saveWorkout = async () => {
    try {
      // Parse time input (mm:ss or seconds)
      const { seconds: totalSeconds, error } = parseDurationInput(wTime);
      if (error) {
        setWTimeError(error);
        return;
      }

      // Create workout object
      const workoutData = {
        userId: userData.uid,
        startTime: Timestamp.fromDate(new Date(Date.now() - totalSeconds * 1000)), // Firebase Timestamp
        endTime: Timestamp.fromDate(new Date()),
        heartRateAvg: parseInt(wHR) || 0,
        points: parseInt(wPoints) || 0,
        calories: parseInt(wCals) || 0,
        exercises: []
      };

      // Save workout
      await WorkoutManager.saveWorkout(workoutData);

      // Reset form and close modal
      setWTime('');
      setWTimeError('');
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

      {/* Station Section */}
      {!isLoadingLastWorkout && lastWorkout && (
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
            {lastWorkout.exercises.length > 0 && lastWorkout.exercises.map((exercise, index) => (
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
              <input
                value={wTime}
                onChange={e => {
                  const val = e.target.value;
                  setWTime(val);
                  const { error } = parseDurationInput(val);
                  setWTimeError(error);
                }}
                placeholder="05:30 or 330"
                pattern="^\\d+$|^\\d{1,2}:\\d{2}$"
                className="form-input mt-1"
              />
              {wTimeError && <div className="text-red-500 text-xs mt-1">{wTimeError}</div>}
            </label>
            <label className="form-label">Heart Rate (bpm)
              <input type="number" value={wHR} onChange={e => setWHR(e.target.value)} className="form-input mt-1" />
            </label>
            <label className="form-label">Points
              <input type="number" value={wPoints} onChange={e => setWPoints(e.target.value)} className="form-input mt-1" />
            </label>
            <label className="form-label">Calories
              <input type="number" value={wCals} onChange={e => setWCals(e.target.value)} className="form-input mt-1" />
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setWorkoutOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={saveWorkout} className="btn-primary" disabled={!!wTimeError}>Save</button>
          </div>
        </div>
      </Modal>

      {/* Add Exercise Modal */}
      <Modal open={addExerciseOpen} onClose={() => setAddExerciseOpen(false)} title="Add Exercise" size="md">
        <div className="space-y-3">
          <div className="grid-2 gap-3">
            <label className="form-label">Station
              <select
                className="form-input mt-1"
                value={eStationId}
                onChange={e => setEStationId(e.target.value)}
                disabled={isLoadingStations}
              >
                <option value="">Select station</option>
                {stations.map(st => (
                  <option key={st.uid} value={st.uid}>{st.name}</option>
                ))}
              </select>
            </label>
            <label className="form-label">Time (mm:ss)
              <input
                value={eTime}
                onChange={e => {
                  const val = e.target.value;
                  setETime(val);
                  const { error } = parseDurationInput(val);
                  setETimeError(error);
                }}
                placeholder="05:30 or 330"
                pattern="^\\d+$|^\\d{1,2}:\\d{2}$"
                className="form-input mt-1"
              />
              {eTimeError && <div className="text-red-500 text-xs mt-1">{eTimeError}</div>}
            </label>
            <label className="form-label">Heart Rate (bpm)
              <input type="number" value={eHR} onChange={e => setEHR(e.target.value)} className="form-input mt-1" />
            </label>
            <label className="form-label">Points
              <input type="number" value={ePoints} onChange={e => setEPoints(e.target.value)} className="form-input mt-1" />
            </label>
            <label className="form-label">Calories
              <input type="number" value={eCals} onChange={e => setECals(e.target.value)} className="form-input mt-1" />
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setAddExerciseOpen(false)} className="btn-secondary">Cancel</button>
            <button
              onClick={async () => {
                if (!lastWorkout || !lastWorkout.uid) {
                  alert('No workout available. Please create a workout first.');
                  return;
                }
                if (!eStationId) {
                  alert('Please select a station.');
                  return;
                }
                if (eTimeError) {
                  return;
                }
                setIsAddingExercise(true);
                try {
                  // Parse time input (mm:ss or seconds)
                  const { seconds: totalSeconds, error } = parseDurationInput(eTime);
                  if (error) {
                    setETimeError(error);
                    return;
                  }

                  const exerciseData = {
                    stationId: eStationId,
                    points: parseInt(ePoints) || 0,
                    calories: parseInt(eCals) || 0,
                    heartRateAvg: parseInt(eHR) || 0,
                    startTime: Timestamp.fromDate(new Date(Date.now() - totalSeconds * 1000)),
                    endTime: Timestamp.fromDate(new Date()),
                  };

                  await WorkoutManager.addExercise(userData.uid, lastWorkout.uid, exerciseData);

                  // Optional reset
                  setETime('');
                  setETimeError('');
                  setEHR('');
                  setEPoints('');
                  setECals('');
                  setEStationId('');
                  setAddExerciseOpen(false);

                  // Reload just the updated workout to reflect the new exercise
                  try {
                    const updated = await WorkoutManager.loadWorkoutById(userData.uid, lastWorkout.uid);
                    if (updated) {
                      setLastWorkout(updated);
                    } else {
                      // Fallback: reload via aggregate fetch
                      await loadLastWorkout();
                    }
                  } catch (e) {
                    await loadLastWorkout();
                  }
                } catch (error) {
                  console.error('Failed to add exercise:', error);
                  alert('Failed to add exercise. Please try again.');
                } finally {
                  setIsAddingExercise(false);
                }
              }}
              className="btn-primary"
              disabled={isAddingExercise || !eStationId || !!eTimeError}
            >
              {isAddingExercise ? 'Adding...' : 'Add Exercise'}
            </button>
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
                      const bm = new BaseModel();
                      const minutes = bm.getDurationMinutes(selectedExercise.startTime, selectedExercise.endTime);
                      return bm.formatDurationMinutes(minutes);
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
