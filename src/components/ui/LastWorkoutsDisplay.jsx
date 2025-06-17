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
        if (!workout.stations) return { totalCalories: 0, totalTime: 0, stationCount: 0, totalPoints: 0 };

        const totalCalories = workout.stations.reduce((total, station) => total + (station.calories || 0), 0);
        const totalPoints = workout.stations.reduce((total, station) => total + (station.points || 0), 0);
        const stationCount = workout.stations.length;

        // Calculate total time from first start to last end
        let totalTime = 0;
        if (workout.stations.length > 0) {
            const sortedStations = [...workout.stations].sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
            const firstStart = sortedStations[0].startTime;
            const lastEnd = sortedStations[sortedStations.length - 1].endTime;
            totalTime = workout.getDurationMinutes(firstStart, lastEnd)
        }

        return { totalCalories, totalTime, stationCount, totalPoints };
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
                                                    {summary.stationCount}
                                                </div>
                                                <div className="stat-label">
                                                    Stationen
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
                                            {workout.stations && workout.stations.length === 0 && (
                                                <p className="no-stations-message">
                                                    Keine Stationen in diesem Workout.
                                                </p>
                                            )}

                                            {workout.stations && workout.stations.map((station, stationIndex) => (
                                                <div key={stationIndex} className="station-item">
                                                    <div className="station-title">
                                                        Station {stationIndex + 1} {station.name && `- ${station.name}`}
                                                    </div>
                                                    <div className="station-detail">
                                                        <span className="label">User:</span>
                                                        {workout.userId}
                                                    </div>
                                                    <div className="station-detail">
                                                        <span className="label">Start:</span>
                                                        {new Date(station.start).toLocaleString('de-DE')}
                                                    </div>
                                                    <div className="station-detail">
                                                        <span className="label">Ende:</span>
                                                        {new Date(station.end).toLocaleString('de-DE')}
                                                    </div>
                                                    <div className="station-detail">
                                                        <span className="label">Punkte:</span>
                                                        {station.points}
                                                    </div>
                                                    <div className="station-detail">
                                                        <span className="label">Kalorien:</span>
                                                        {station.calories}
                                                    </div>
                                                    <div className="station-detail">
                                                        <span className="label">Ø Herzfrequenz:</span>
                                                        {station.heartRateAvg}
                                                    </div>
                                                </div>
                                            ))}

                                            {/* Detailed Summary */}
                                            <div className="workout-summary-details">
                                                <div className="summary-title">
                                                    Workout Summary:
                                                </div>
                                                <div className="station-detail">
                                                    <span className="label">Total Stations:</span>
                                                    {summary.stationCount}
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