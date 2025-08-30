import React, { useState, useEffect, useRef } from 'react';
import ExpElements from '../components/ui/ExpBar';
import IconElements from '../components/ui/IconElements';
import ChallengeManagement from '../services/firebase/ChallengeManagement';
import GroupManagement from '../services/firebase/GroupManagementSystem';
import RankingSystem from '../services/firebase/RankingSystem';
import WorkoutManager from '../services/firebase/WorkoutManagement';

import '../sphere-styles.css';

function newHome({ onStartWorkout }) {
  const { lastWorkout, name, level, xp, nextLevelXp } = DUMMY_USER;
  const progress = Math.min(100, Math.round(((xp || 0) / (nextLevelXp || 1)) * 100));
  const [stationOpen, setStationOpen] = useState(null);
  const currentStation = stationOpen ? STATIONS.find(s => s.id === stationOpen) : null;

  const header = (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Avatar name={name} size={48} />
        <div>
          <h1 className="screen-title">{name}</h1>
          <p className="screen-subtitle">Level {level}</p>
        </div>
      </div>
    </div>
  );

  return (
    <Screen titleNode={header}>
      <Card>
        <div className="flex items-center justify-between mb-2">
          <span className="text-slate-400 text-sm">Level Progress</span>
          <span className="text-slate-300 text-sm">{xp}/{nextLevelXp} XP</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </Card>

      <div className="grid-2 mt-4">
        <Card><Stat label="TIME" value={secondsToClock(lastWorkout.time)} /></Card>
        <Card><Stat label="HEART RATE" value={<>{lastWorkout.heartRate} bpm</>} /></Card>
        <Card><Stat label="POINTS" value={lastWorkout.points} /></Card>
        <Card><Stat label="CALORIES" value={<>{lastWorkout.calories} kcal</>} /></Card>
      </div>

      <div className="mt-6">
        <button onClick={onStartWorkout} className="btn-primary w-full py-3">
          Start Workout
        </button>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gradient mb-3">Stations</h3>
        <div className="grid-2 gap-3">
          {STATIONS.map(s => (
            <Card key={s.id} onClick={() => setStationOpen(s.id)}>
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-white/10 p-3">{s.icon}</div>
                <div className="flex-1">
                  <p className="font-semibold">{s.name}</p>
                  <p className="text-slate-400 text-sm">Letzte Aktivität: {s.last.date}</p>
                </div>
                <Info className="w-4 h-4 text-slate-400" />
              </div>
            </Card>
          ))}
        </div>
      </div>

      <Modal open={!!currentStation} onClose={() => setStationOpen(null)} title={currentStation?.name} size="sm">
        {currentStation && (
          <div className="space-y-3">
            <div className="grid-2 gap-3">
              <Card><Stat label="TIME" value={secondsToClock(currentStation.last.time)} /></Card>
              <Card><Stat label="HR" value={`${currentStation.last.heartRate} bpm`} /></Card>
              <Card><Stat label="POINTS" value={currentStation.last.points} /></Card>
              <Card><Stat label="CAL" value={`${currentStation.last.calories} kcal`} /></Card>
            </div>
            <p className="text-slate-400 text-sm">Zuletzt am {currentStation.last.date}</p>
          </div>
        )}
      </Modal>
    </Screen>
  );
}

function Page({ data }) {
    const userData = data;
    const containerRef = useRef(null);
    const timeRef = useRef(null);
    const [isLandscape, setIsLandscape] = useState(false);
    const [activeChallenges, setActiveChallenges] = useState([]);
    const [groupNames, setGroupNames] = useState({});
    const [isLoadingChallenges, setIsLoadingChallenges] = useState(true);
    const [rank, setRank] = useState('--');
    const [lastWorkout, setLastWorkout] = useState(null);
    const [isLoadingLastWorkout, setIsLoadingLastWorkout] = useState(true);

    const time = userData.formatDuration(userData.getTotalTrainingTime());
    
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

    useEffect(() => {
        loadUserActiveChallenges();
        loadLastWorkout();
    }, [userData.uid]);

    const loadLastWorkout = async () => {
        try {
            setIsLoadingLastWorkout(true);
            console.log('Loading workouts for user:', userData.uid);
            console.log('User data workouts:', userData.workouts);
            
            // Check if workouts are already in userData
            if (userData.workouts && userData.workouts.length > 0) {
                console.log('Using workouts from userData');
                const workouts = userData.workouts;
                
                // Sort by start time to get the most recent workout
                const sortedWorkouts = workouts.sort((a, b) => {
                    let dateA, dateB;
                    
                    console.log('Sorting workout:', a);
                    
                    // Handle different timestamp formats
                    if (a.startTime?.toDate) {
                        dateA = a.startTime.toDate();
                    } else if (a.startTime?.seconds) {
                        dateA = new Date(a.startTime.seconds * 1000);
                    } else if (a.startTime) {
                        dateA = new Date(a.startTime);
                    } else {
                        console.warn('No startTime found for workout:', a);
                        dateA = new Date(0); // fallback to epoch
                    }
                    
                    if (b.startTime?.toDate) {
                        dateB = b.startTime.toDate();
                    } else if (b.startTime?.seconds) {
                        dateB = new Date(b.startTime.seconds * 1000);
                    } else if (b.startTime) {
                        dateB = new Date(b.startTime);
                    } else {
                        console.warn('No startTime found for workout:', b);
                        dateB = new Date(0); // fallback to epoch
                    }
                    
                    return dateB - dateA;
                });
                
                console.log('Most recent workout:', sortedWorkouts[0]);
                console.log('Most recent workout exercises:', sortedWorkouts[0]?.exercises);
                setLastWorkout(sortedWorkouts[0]);
            } else {
                console.log('No workouts found in userData, trying WorkoutManager...');
                
                // Fallback to WorkoutManager if no workouts in userData
                const workouts = await WorkoutManager.loadWorkouts(userData.uid);
                console.log('Loaded workouts from WorkoutManager:', workouts);
                
                if (workouts && workouts.length > 0) {
                    // Sort by start time to get the most recent workout
                    const sortedWorkouts = workouts.sort((a, b) => {
                        let dateA, dateB;
                        
                        if (a.startTime?.toDate) {
                            dateA = a.startTime.toDate();
                        } else if (a.startTime?.seconds) {
                            dateA = new Date(a.startTime.seconds * 1000);
                        } else if (a.startTime) {
                            dateA = new Date(a.startTime);
                        } else {
                            dateA = new Date(0);
                        }
                        
                        if (b.startTime?.toDate) {
                            dateB = b.startTime.toDate();
                        } else if (b.startTime?.seconds) {
                            dateB = new Date(b.startTime.seconds * 1000);
                        } else if (b.startTime) {
                            dateB = new Date(b.startTime);
                        } else {
                            dateB = new Date(0);
                        }
                        
                        return dateB - dateA;
                    });
                    
                    console.log('Most recent workout from WorkoutManager:', sortedWorkouts[0]);
                    setLastWorkout(sortedWorkouts[0]);
                } else {
                    console.log('No workouts found');
                    setLastWorkout(null);
                }
            }
        } catch (error) {
            console.error('Failed to load last workout:', error);
            console.error('Error details:', error.message);
            setLastWorkout(null);
        } finally {
            setIsLoadingLastWorkout(false);
        }
    };

    const loadUserActiveChallenges = async () => {
        try {
            setIsLoadingChallenges(true);
            
            const userGroups = await GroupManagement.getUserGroups(userData.uid);
            
            const allGroupChallenges = [];
            const groupNamesMap = {};
            
            for (const group of userGroups) {
                const groupChallenges = await ChallengeManagement.getGroupChallenges(group.groupId);
                const activeChallenges = groupChallenges.filter(challenge => 
                    challenge.isActive() || challenge.hasNotStarted()
                );
                
                groupNamesMap[group.groupId] = group.name;
                
                allGroupChallenges.push(...activeChallenges);
            }
            
            setActiveChallenges(allGroupChallenges);
            setGroupNames(groupNamesMap);
        } catch (error) {
            console.error('Failed to load active challenges:', error);
            setActiveChallenges([]);
        } finally {
            setIsLoadingChallenges(false);
        }
    };

    useEffect(() => {
        const checkOrientation = () => {
            if (containerRef.current) {
                const { width, height } = containerRef.current.getBoundingClientRect();
                setIsLandscape(width > height);
            }
        };

        checkOrientation();

        const resizeObserver = new ResizeObserver(() => {
            checkOrientation();
        });

        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        window.addEventListener('resize', () => {
            checkOrientation();
        });

        return () => {
            resizeObserver.disconnect();
            window.removeEventListener('resize', checkOrientation);
        };
    }, [time]);

    const getStatusText = (challenge) => {
        if (challenge.hasNotStarted()) return 'Starting Soon';
        if (challenge.isActive()) return 'Active';
        return 'Unknown';
    };

    const getStatusColor = (challenge) => {
        if (challenge.hasNotStarted()) return '#A0A0A0';
        if (challenge.isActive()) return '#00FF94';
        return '#A0A0A0';
    };

    const getWorkoutDuration = (workout) => {
        if (!workout || !workout.startTime || !workout.endTime) return '--';
        
        let startTime, endTime;
        
        // Handle different timestamp formats
        if (workout.startTime?.toDate) {
            startTime = workout.startTime.toDate();
        } else if (workout.startTime?.seconds) {
            startTime = new Date(workout.startTime.seconds * 1000);
        } else {
            startTime = new Date(workout.startTime);
        }
        
        if (workout.endTime?.toDate) {
            endTime = workout.endTime.toDate();
        } else if (workout.endTime?.seconds) {
            endTime = new Date(workout.endTime.seconds * 1000);
        } else {
            endTime = new Date(workout.endTime);
        }
        
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
        
        let createdTime;
        
        // Handle different timestamp formats
        if (workout.createdAt?.toDate) {
            createdTime = workout.createdAt.toDate();
        } else if (workout.createdAt?.seconds) {
            createdTime = new Date(workout.createdAt.seconds * 1000);
        } else {
            createdTime = new Date(workout.createdAt);
        }
        
        const day = String(createdTime.getDate()).padStart(2, '0');
        const month = String(createdTime.getMonth() + 1).padStart(2, '0');
        const year = createdTime.getFullYear();
        
        return `${day}.${month}.${year}`;
    };

    return (
        <div className="app-container">
            <div className="screen">
                <div className="background">
                    <div className="bg-gradient-1"></div>
                    <div className="bg-gradient-2"></div>
                    <div className="bg-overlay"></div>
                </div>
                <header className="screen-header">
                    <h1 className="screen-title">{userData?.displayName || 'User'}</h1>
                    <p className="screen-subtitle">Level {userData.level}</p>
                </header>
                
                <main className="screen-main">
                    <div className="card mb-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-slate-400 text-sm">Level Progress</span>
                            <span className="text-slate-300 text-sm">{userData.points}/{userData.currentMaxPoints()} XP</span>
                        </div>
                        <div className="progress-bar">
                            <div className="progress-fill" style={{ width: `${(userData.points / userData.currentMaxPoints()) * 100}%` }} />
                        </div>
                    </div>

                    <h2 className="text-lg font-semibold text-gradient mb-3">Last Workout</h2>
                    <p className="text-sm text-slate-400 mb-3">Date: {getWorkoutDate(lastWorkout)}</p>
                    
                    <div className="card">
                        {isLoadingLastWorkout ? (
                            <div className="text-center text-slate-400 py-3">
                                Loading last workout...
                            </div>
                        ) : !lastWorkout ? (
                            <div className="text-center text-slate-400 py-3">
                                No previous workouts found
                            </div>
                        ) : (
                            <div className="grid-2 gap-3">
                                <div className="card">
                                    <div className="text-slate-400 text-sm">Time</div>
                                    <div className="text-lg font-semibold">
                                        {getWorkoutDuration(lastWorkout)}
                                    </div>
                                </div>
                                
                                <div className="card">
                                    <div className="text-slate-400 text-sm">Heart Rate</div>
                                    <div className="text-lg font-semibold">
                                        {lastWorkout.heartRate || '--'}
                                    </div>
                                </div>
                                
                                <div className="card">
                                    <div className="text-slate-400 text-sm">Calories</div>
                                    <div className="text-lg font-semibold">
                                        {getTotalCalories(lastWorkout)}
                                    </div>
                                </div>
                                
                                <div className="card">
                                    <div className="text-slate-400 text-sm">Points</div>
                                    <div className="text-lg font-semibold">
                                        {getTotalPoints(lastWorkout)}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    {activeChallenges.length > 0 && (
                        <div className="mt-6">
                            <h2 className="text-lg font-semibold text-gradient mb-3">Active Challenges</h2>
                            <div className="space-y-3">
                                {activeChallenges.map((challenge) => (
                                    <div key={challenge.uid} className="card">
                                        <div className="font-medium mb-1">{challenge.name}</div>
                                        <div className="text-sm text-slate-400 mb-2">
                                            Group: {groupNames[challenge.groupId] || 'Unknown'}
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs" style={{ color: getStatusColor(challenge) }}>
                                                {getStatusText(challenge)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

const HomePageElements = {
    Page,
    newHome
};

export default HomePageElements;