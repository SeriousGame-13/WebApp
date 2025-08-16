import React, { useState, useEffect, useRef } from 'react';
import ExpElements from '../components/ui/ExpBar';
import IconElements from '../components/ui/IconElements';
import ChallengeManagement from '../services/firebase/ChallengeManagement';
import GroupManagement from '../services/firebase/GroupManagementSystem';
import RankingSystem from '../services/firebase/RankingSystem';
import WorkoutManager from '../services/firebase/WorkoutManagement';

import '../components/styles/HomePage.css';
import '../components/styles/LayoutElements.css'


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
        <div className="AppContents" ref={containerRef}>
            <div className={`MainContentWrapper ${isLandscape ? 'landscape' : 'portrait'}`}>
                <div className="TopGridSection">
                    {/* User Name Display */}
                    <div className="user-name-display">
                        {userData?.displayName || 'User'}
                    </div>
                    
                    <ExpElements.NewCircleExpContainer level={userData.level} expnow={userData.points} expmax={userData.currentMaxPoints()} />
                    <div className='HelloText'>
                    </div>

                </div>
                <div className="BottomGridSection">
 
                    
                                {/* Last Workout Section */}
                    <div className='last-workout-title'>
                        Last Workout
                    </div>
                    <div className='GuideText' style={{ marginBottom: '15px' }}>
                        Date: {getWorkoutDate(lastWorkout)}
                    </div>
                    <div className='last-workout-container'>
                        {isLoadingLastWorkout ? (
                            <div className="last-workout-loading">
                                Loading last workout...
                            </div>
                        ) : !lastWorkout ? (
                            <div className="last-workout-empty">
                                No previous workouts found
                            </div>
                        ) : (
                            <div className="last-workout-content">
                                
                                <div className="last-workout-grid">
                                    <div className="last-workout-item">
                                        
                                        <div className="last-workout-label">Time</div>
                                        <div className="last-workout-value">
                                            {getWorkoutDuration(lastWorkout)}
                                        </div>
                                    </div>
                                    
                                    <div className="last-workout-item">
                                        
                                        <div className="last-workout-label">Heart Rate</div>
                                        <div className="last-workout-value">
                                            {lastWorkout.heartRate || '--'}
                                        </div>
                                    </div>
                                    
                                    <div className="last-workout-item">
                                        
                                        <div className="last-workout-label">Calories</div>
                                        <div className="last-workout-value">
                                            {getTotalCalories(lastWorkout)}
                                        </div>
                                    </div>
                                    
                                    <div className="last-workout-item">
                                        
                                        <div className="last-workout-label">Points</div>
                                        <div className="last-workout-value">
                                            {getTotalPoints(lastWorkout)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

const HomePageElements = {
    Page
};

export default HomePageElements;