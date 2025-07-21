import React, { useState } from 'react';

import '../styles/LastWorkoutsDisplay.css';
import BaseModel from '../../services/interfaces/base';

// Component for displaying last 5 workouts with collapsible details
const LastWorkoutsDisplay = ({ userData }) => {
    const [expandedWorkouts, setExpandedWorkouts] = useState({});

    const toggleWorkout = (workoutIndex) => {
        setExpandedWorkouts(prev => ({
            ...prev,
            [workoutIndex]: !prev[workoutIndex]
        }));
    };

    const getWorkoutSummary = (workout) => {
        if (!workout.exercises) return { totalCalories: 0, totalTime: 0, exerCount: 0, totalPoints: 0 };

        const totalCalories = workout.exercises.reduce((total, exercise) => total + (exercise.calories || 0), 0);
        const totalPoints = workout.exercises.reduce((total, exercise) => total + (exercise.points || 0), 0);
        const exerCount = workout.exercises.length;

        // Calculate total time from first start to last end
        let totalTime = 0;
        if (workout.exercises.length > 0) {
            const sortedExers = [...workout.exercises].sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
            const firstStart = sortedExers[0].startTime;
            const lastEnd = sortedExers[sortedExers.length - 1].endTime;
            totalTime = workout.getDurationMinutes(firstStart, lastEnd)
        }

        return { totalCalories, totalTime, exerCount, totalPoints };
    };

    const formatTime = (minutes) => {
        if (minutes === 0 || isNaN(minutes)) return 'NaN';
        if (minutes < 60) return `${minutes}m`;
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours}h ${remainingMinutes}m`;
    };

    // Handle Firebase Timestamp or any date-like object
    const parseTimestamp = (timestamp) => {
        if (!timestamp) return null;

        // If it's already a Date object
        if (timestamp instanceof Date) {
            return timestamp;
        }

        // If it's a Firebase Timestamp with toDate() method
        if (timestamp.toDate && typeof timestamp.toDate === 'function') {
            return timestamp.toDate();
        }

        // If it's a Firebase Timestamp with seconds/nanoseconds
        if (timestamp.seconds !== undefined) {
            return new Date(timestamp.seconds * 1000 + (timestamp.nanoseconds || 0) / 1000000);
        }

        // If it's an ISO string or regular timestamp
        try {
            return new Date(timestamp);
        } catch (error) {
            console.error('Unable to parse timestamp:', timestamp);
            return null;
        }
    }

    // Format timestamp to German date only
    const formatTimestampDate = (timestamp) => {
        const date = this.parseTimestamp(timestamp);
        if (!date) return 'Invalid Date';

        try {
            return date.toLocaleDateString('de-DE');
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'Invalid Date';
        }
    }


    return (
        <div className='GuideText'>
            <div className='GuideText'>
                Last Exercises
            </div>

            <div className='HomeInfoContainer'>
                <div className="last-workouts-container">
                    {(!userData.workouts || userData.workouts.length === 0) && (
                        <p className="no-workouts-message">
                            Noch keine Trainings-Daten vorhanden.
                        </p>
                    )}

                    {userData.workouts && userData.workouts
                        .slice(0, 5)
                        .map((workout, workoutIndex) => {
                            const summary = getWorkoutSummary(workout);
                            const isExpanded = expandedWorkouts[workoutIndex];

                            return (
                                <div key={workoutIndex} className="workout-item">
                                    {/* Collapsed Summary View */}
                                    <div className="workout-summary">
                                        <div className="workout-info">
                                            <div className="workout-title">
                                                Workout {workoutIndex + 1}
                                                {workout.name && ` - ${workout.name}`}
                                            </div>
                                            <div className="workout-date">
                                                TODO
                                            </div>
                                        </div>

                                        <div className="workout-stats">
                                            <div className="stat-item">
                                                <div className="stat-value">
                                                    {workout.formatCalories(summary.totalCalories)}
                                                </div>
                                                <div className="stat-label">
                                                    Kalorien
                                                </div>
                                            </div>
                                            <div className="stat-item">
                                                <div className="stat-value">
                                                    {workout.formatDurationMinutes(summary.totalTime)}
                                                </div>
                                                <div className="stat-label">
                                                    Zeit
                                                </div>
                                            </div>
                                            <div className="stat-item">
                                                <div className="stat-value">
                                                    {summary.exerCount}
                                                </div>
                                                <div className="stat-label">
                                                    Exercises
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            className="expand-button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleWorkout(workoutIndex);
                                            }}
                                        >
                                            {isExpanded ? '▲ Weniger' : '▼ Details'}
                                        </button>
                                    </div>

                                    {/* Expanded Details View */}
                                    {isExpanded && (
                                        <div className="workout-details">
                                            {workout.exercises && workout.exercises.length === 0 && (
                                                <p className="no-stations-message">
                                                    Keine Übungen in diesem Workout.
                                                </p>
                                            )}

                                            {workout.exercises && workout.exercises.map((exercise, exerIndex) => (
                                                <div key={exerIndex} className="station-item">
                                                    <div className="station-title">
                                                        Übung {exerIndex + 1} {exercise.name && `- ${exercise.name}`}
                                                    </div>
                                                    <div className="station-detail">
                                                        <span className="label">User:</span>
                                                        {workout.userId}
                                                    </div>
                                                    <div className="station-detail">
                                                        <span className="label">Start:</span>
                                                        {new Date(exercise.start).toLocaleString('de-DE')}
                                                    </div>
                                                    <div className="station-detail">
                                                        <span className="label">Ende:</span>
                                                        {new Date(exercise.end).toLocaleString('de-DE')}
                                                    </div>
                                                    <div className="station-detail">
                                                        <span className="label">Punkte:</span>
                                                        {exercise.points}
                                                    </div>
                                                    <div className="station-detail">
                                                        <span className="label">Kalorien:</span>
                                                        {exercise.calories}
                                                    </div>
                                                    <div className="station-detail">
                                                        <span className="label">Ø Herzfrequenz:</span>
                                                        {exercise.heartRateAvg}
                                                    </div>
                                                </div>
                                            ))}

                                            {/* Detailed Summary */}
                                            <div className="workout-summary-details">
                                                <div className="summary-title">
                                                    Workout Summary:
                                                </div>
                                                <div className="station-detail">
                                                    <span className="label">Total exercises:</span>
                                                    {summary.exerCount}
                                                </div>
                                                <div className="station-detail">
                                                    <span className="label">Total Points:</span>
                                                    {summary.totalPoints}
                                                </div>
                                                <div className="station-detail">
                                                    <span className="label">Total Calories:</span>
                                                    {summary.totalCalories}
                                                </div>
                                                <div className="station-detail">
                                                    <span className="label">Total Time:</span>
                                                    {formatTime(summary.totalTime)}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    }
                </div>
            </div>
        </div>
    );
};

export default LastWorkoutsDisplay;