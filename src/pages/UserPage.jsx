import ProfileImageElements from '../utils/profileImageManager';
import { Workout } from '../services/interfaces/workout.jsx';
import { getDummyWorkout } from '../utils/dummyDataGenerator.jsx';
import UserModel from '../services/interfaces/user.jsx';
import { GROUP_ROLE } from '../services/interfaces/constants.jsx';
import WorkoutManager from './../services/firebase/WorkoutManagement.jsx';
import React, { useState } from 'react';

function Page({ data }) {
    const userData = data;

    const [workout, setWorkout] = useState(new Workout());

    const handleGenerate = () => {
        const newData = getDummyWorkout(userData.uid, 30);
        setWorkout(newData);
    };

    const handleSave = async () => {
        WorkoutManager.saveWorkout(workout);
    }
    
    return (
        <div className="AppContents">
            <ProfileImageElements.ProfileImageUploader userId={userData.uid} />
            <div>
                <p>Hallo, {userData.displayName}!</p>
                <p>E-mail: {userData.email}</p>
                <p>Level: {userData.level}</p>
                <p>Active: {userData.isActive}</p>
                <p>Points: {userData.points}</p>
                <p>MaxRecord: {userData.longestStreak}</p>
            </div>

            <button
                onClick={handleGenerate}
                style={{
                    backgroundColor: '#a0ff78',
                    color: '#2e2f29',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    margin: '0 auto 1rem',
                    display: 'block'
                }}
            >
                Trainings-Daten generieren
            </button>

            <div style={{
                maxHeight: '300px',
                overflowY: 'auto',
                backgroundColor: '#3b3c36',
                borderRadius: '10px',
                padding: '1rem',
                color: '#a0ff78',
                fontFamily: 'sans-serif'
            }}>
                {workout.exercises.length === 0 && (
                    <p style={{ textAlign: 'center', color: '#aaa' }}>
                        Noch keine Trainings-Daten generiert.
                    </p>
                )}
                {workout.exercises.map((entry, index) => (
                    <div key={index} style={{
                        marginBottom: '1rem',
                        paddingBottom: '0.75rem',
                        borderBottom: '1px solid #555'
                    }}>
                        <div><span style={{ color: '#ccc' }}>User:</span> {workout.userId}</div>
                        <div><span style={{ color: '#ccc' }}>Start:</span> {new Date(entry.start).toLocaleString()}</div>
                        <div><span style={{ color: '#ccc' }}>Ende:</span> {new Date(entry.end).toLocaleString()}</div>
                        <div><span style={{ color: '#ccc' }}>Punkte:</span> {entry.points}</div>
                        <div><span style={{ color: '#ccc' }}>Kalorien:</span> {entry.calories}</div>
                        <div><span style={{ color: '#ccc' }}>Ø Herzfrequenz:</span> {entry.heartRateAvg}</div>
                    </div>
                ))}
            </div>

            <button
                onClick={handleSave}
                style={{
                    backgroundColor: '#a0ff78',
                    color: '#2e2f29',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    margin: '0 auto 1rem',
                    display: 'block'
                }}
            >
                Trainings-Daten speichern
            </button>

        </div>

    )
}

const UserPageElements = {
    Page
};

export default UserPageElements;
