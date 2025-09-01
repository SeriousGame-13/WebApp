/**
 * @fileoverview Workout Management Service
 *
 * This module provides comprehensive workout and exercise management functionality for the fitness application.
 * It handles workout creation, exercise tracking, time calculations, highscore processing, and complete
 * workout lifecycle management using Firestore as the backend. The system automatically tracks active
 * and idle times, awards points, and manages exercise-level data within workout sessions.
 *
 * @author Igor, Alexander, Hyunu, Robert
 * @version 1.0.0
 */

import FirestoreManager from './FirestoreManager.jsx';
import { WORKOUT_COLLECTION, EXERCISE_COLLECTION } from './collections.jsx';
import { Timestamp } from 'firebase/firestore';
import { Exercise } from '../interfaces/exercise.jsx';
import { Workout } from '../interfaces/workout.jsx';
import UserManagement from './UserManagementSystem.jsx';
import HighscoreManager from './HighscoreManager.jsx';
import RewardSystem from './RewardSystem.jsx';
import GoalSystem from './GoalSystem.jsx';
import ChallengeManagement from './ChallengeManagement.jsx';

/**
 * Creates the Firestore collection path for a user's workouts.
 * @param {string} userId - The user ID to create the path for
 * @returns {string} The complete Firestore collection path for user workouts
 */
const createPath = (userId) => {
    return `${UserManagement.getUserDatabasePath(userId)}${WORKOUT_COLLECTION}`;
}

/**
 * Safely converts various timestamp formats to a JavaScript Date object.
 * Handles Firestore Timestamps, Date objects, Unix timestamps, and ISO strings.
 * @param {*} timestamp - Can be Firestore Timestamp, Date, number, or string
 * @returns {Date|null} JavaScript Date object or null if conversion fails
 */
function safeTimestampToDate(timestamp) {
    if (!timestamp) return null;

    // If it's a Firestore Timestamp
    if (timestamp?.toDate && typeof timestamp.toDate === 'function') {
        return timestamp.toDate();
    }

    // If it's already a Date object
    if (timestamp instanceof Date) {
        return timestamp;
    }

    // If it's a Firestore Timestamp object with seconds property
    if (timestamp?.seconds && typeof timestamp.seconds === 'number') {
        return new Timestamp(timestamp.seconds, timestamp.nanoseconds || 0).toDate();
    }

    // If it's a number (Unix timestamp in milliseconds)
    if (typeof timestamp === 'number') {
        return new Date(timestamp);
    }

    // If it's a string (ISO date string)
    if (typeof timestamp === 'string') {
        const date = new Date(timestamp);
        return isNaN(date.getTime()) ? null : date;
    }

    console.warn('Unknown timestamp format:', timestamp);
    return null;
}


/**
 * Calculates comprehensive workout data including times and heart rate statistics.
 * Active time is the sum of all exercise durations, idle time is gaps between exercises.
 * @param {Exercise[]} exercises - The list of exercises in the workout
 * @returns {{activeTime: number, idleTime: number, startTime: Date, endTime: Date, avgBpm: number, minBpm: number, maxBpm: number}} Object containing workout statistics
 */
function calculateWorkoutData(exercises) {
    const newWorkoutData = {
        activeTime: 0,
        idleTime: 0,
        startTime: null,
        endTime: null,
        heartRateAvg: null,
        heartRateMin: null,
        heartRateMax: null
    };

    if (!exercises || exercises.length === 0) {
        return newWorkoutData;
    }

    // Calculate active time
    const activeTime = exercises.reduce((total, ex) => {
        if (ex.startTime && ex.endTime && ex.endTime > ex.startTime) {
            return total + (ex.endTime - ex.startTime);
        }
        return total;
    }, 0);

    // Sort exercises by start time
    const sortedExercises = exercises
        .filter(ex => ex.startTime && ex.endTime)
        .sort((a, b) => a.startTime - b.startTime);

    let idleTime = 0;
    for (let i = 0; i < sortedExercises.length - 1; i++) {
        const currentExercise = sortedExercises[i];
        const nextExercise = sortedExercises[i + 1];
        if (currentExercise.endTime && nextExercise.startTime && nextExercise.startTime > currentExercise.endTime) {
            idleTime += (nextExercise.startTime - currentExercise.endTime);
        }
    }

    // Calculate workout start and end times
    const startTime = sortedExercises[0].startTime;
    const endTime = sortedExercises[sortedExercises.length - 1].endTime;

    // Calculate heart rate statistics
    const exercisesWithHeartRate = exercises.filter(ex => 
        ex.heartRateAvg && typeof ex.heartRateAvg === 'number' && ex.heartRateAvg > 0
    );
    let heartRateAvg = null;
    let heartRateMin = null;
    let heartRateMax = null;

    if (exercisesWithHeartRate.length > 0) {
        // Calculate average of all exercise averages
        const avgValues = exercisesWithHeartRate.map(ex => ex.heartRateAvg);
        heartRateAvg = Math.round(avgValues.reduce((sum, avg) => sum + avg, 0) / avgValues.length);
        
        // Find overall min and max from all exercises
        const minValues = exercisesWithHeartRate
            .filter(ex => ex.heartRateMin && typeof ex.heartRateMin === 'number')
            .map(ex => ex.heartRateMin);
        const maxValues = exercisesWithHeartRate
            .filter(ex => ex.heartRateMax && typeof ex.heartRateMax === 'number')
            .map(ex => ex.heartRateMax);
        
        if (minValues.length > 0) {
            heartRateMin = Math.min(...minValues);
        }
        if (maxValues.length > 0) {
            heartRateMax = Math.max(...maxValues);
        }
    }
    newWorkoutData.activeTime = Math.round(activeTime / 1000);
    newWorkoutData.idleTime = Math.round(idleTime / 1000);
    newWorkoutData.startTime = startTime;
    newWorkoutData.endTime = endTime;
    newWorkoutData.heartRateAvg = heartRateAvg;
    newWorkoutData.heartRateMin = heartRateMin;
    newWorkoutData.heartRateMax = heartRateMax;
    return newWorkoutData;
}

/**
 * Fetches all exercises for a workout, calculates comprehensive workout data, and updates the workout document.
 * Recalculates active/idle times, start/end times from exercises, and heart rate statistics.
        endTime,
        heartRateAvg,
        heartRateMin,
        heartRateMax
    };
}

/**
 * Fetches all exercises for a workout, calculates comprehensive workout data, and updates the workout document.
 * Recalculates active/idle times, start/end times from exercises, and heart rate statistics.
 * Runs as a background task and does not throw errors to avoid disrupting main operations.
 * @param {string} userId - The ID of the user
 * @param {string} workoutId - The ID of the workout to update
 * @returns {Promise<void>}
 */
const recalculateAndUpdateWorkoutData = async (userId, workoutId) => {
    try {
        const exercisePath = `${createPath(userId)}/${workoutId}/${EXERCISE_COLLECTION}`;
        const exerSnap = await FirestoreManager.getAllDocuments(exercisePath);
        const exercises = exerSnap.docs.map(doc => doc.data());

        const { 
            activeTime, 
            idleTime, 
            startTime, 
            endTime, 
            heartRateAvg, 
            heartRateMin, 
            heartRateMax 
        } = calculateWorkoutData(exercises);

        const workoutPath = createPath(userId);
        const updateData = {
            activeTime,
            idleTime,
            startTime, 
            endTime, 
            heartRateAvg,
            heartRateMin,
            heartRateMax
        };

        await FirestoreManager.updateDocument(workoutPath, workoutId, updateData);

    } catch (error) {
        console.error(`Failed to calculate and save workout data for workout ${workoutId}:`, error);
        // Do not re-throw, as this is a background task and shouldn't fail the main operation
    }
}

/**
 * Saves a new workout to the database with its exercises.
 * Automatically awards points to the user and saves all associated exercises.
 * @param {Workout|Object} workout - The workout data to save (Workout instance or plain object)
 * @returns {Promise<string>} The ID of the created workout document
 * @throws {Error} When workout cannot be saved or validation fails
 */
const saveWorkout = async (workout) => {
    if (!(workout instanceof Workout)) {
        workout = new Workout(workout);
    }
    try {
        const exercises = workout.exercises || [];
        // Firebase does not accept arrays directly. Delete before save
        delete workout.exercises;

        const workoutRef = await FirestoreManager.createDocument(`${createPath(workout.userId)}`, workout, workout.uid);
        if (!workoutRef) throw new Error('Could not save workout');

        const exerSaves = exercises.map(exercise =>
            FirestoreManager.createDocument(`${createPath(workout.userId)}/${workoutRef.id}/${EXERCISE_COLLECTION}`, exercise, exercise.uid)
        );

        await Promise.all(exerSaves);

        return workoutRef.id;
    } catch (error) {
        console.error('Error saving workout:', error);
        throw error;
    }
}

/**
 * Loads all workouts for a specific user including their exercises.
 * Retrieves complete workout data with associated exercise collections.
 * @param {string} userId - The user ID to load workouts for
 * @returns {Promise<Object[]>} Array of workout objects with embedded exercises
 * @throws {Error} When workouts cannot be loaded from database
 */
const loadWorkouts = async (userId) => {
    try {
        const snapshot = await FirestoreManager.getAllDocuments(`${createPath(userId)}`);
        const workouts = snapshot.docs.map(doc => new Workout({ ...doc.data() }));
        const workoutPromises = [];

        for (const workout of workouts) {
            const exerSnap = await FirestoreManager.getAllDocuments(`${createPath(userId)}/${workout.uid}/${EXERCISE_COLLECTION}`);
            exerSnap.docs.map(doc => workout.addExercise(Exercise.fromJSON(doc.data())));
            workoutPromises.push(workout);
        }

        return Promise.all(workoutPromises);
    } catch (error) {
        console.error('Error loading workouts:', error);
        throw error;
    }
}

/**
 * Loads a specific workout by ID including all its exercises.
 * Retrieves complete workout data with full exercise details.
 * @param {string} userId - The user ID who owns the workout
 * @param {string} idWorkout - The workout ID to load
 * @returns {Promise<Object>} Complete workout object with exercises array
 * @throws {Error} When workout is not found or cannot be loaded
 */
const loadWorkoutById = async (userId, idWorkout) => {
    try {
        const data = await FirestoreManager.readDocument(`${createPath(userId)}`, idWorkout);
        if (!data) throw new Error('Workout not found');

        const exerSnap = await FirestoreManager.getAllDocuments(`${createPath(userId)}/${idWorkout}/${EXERCISE_COLLECTION}`);
        const exercises = exerSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return new Workout({ ...data, exercises });
    } catch (error) {
        console.error('Error loading workout:', error);
        throw error;
    }
}

/**
 * Deletes a workout and all its associated exercises.
 * Removes the workout document and all exercises in the exercise subcollection.
 * @param {string} userId - The user ID who owns the workout
 * @param {string} idWorkout - The workout ID to delete
 * @returns {Promise<void>}
 * @throws {Error} When workout or exercises cannot be deleted
 */
const deleteWorkout = async (userId, idWorkout) => {
    try {
        const exerSnap = await FirestoreManager.getAllDocuments(`${createPath(userId)}/${idWorkout}/${EXERCISE_COLLECTION}`);
        for (let doc of exerSnap.docs) {
            await deleteExercise(userId, idWorkout, doc.id);
        }

        await FirestoreManager.deleteDocument(`${createPath(userId)}`, idWorkout);
    } catch (error) {
        console.error('Error deleting workout:', error);
        throw error;
    }
}

/**
 * Updates an existing workout's data in the database.
 * Modifies workout-level information but does not affect exercises.
 * @param {Object} workout - The workout data containing uid and fields to update
 * @returns {Promise<void>}
 * @throws {Error} When workout cannot be updated or UID is missing
 */
const update = async (workout) => {
    try {
        const { ...workoutData } = workout;
        await FirestoreManager.updateDocument(`${createPath(workoutData.userId)}`, workoutData.uid, workoutData, true);
    } catch (error) {
        console.error('Error updating workout:', error);
        throw error;
    }
}

/**
 * Adds a new exercise to an existing workout.
 * Creates highscore entries for station-based exercises and recalculates workout times.
 * @param {string} userId - The user ID who owns the workout
 * @param {string} workoutId - The workout ID to add the exercise to
 * @param {Object} exerciseData - The exercise data to add
 * @returns {Promise<void>}
 * @throws {Error} When exercise cannot be added or workout times cannot be updated
 */
const addExercise = async (userId, workoutId, exerciseData) => {
    try {
        const exercise = new Exercise({ ...exerciseData, userId });
        await FirestoreManager.createDocument(
            `${createPath(userId)}/${workoutId}/${EXERCISE_COLLECTION}`,
            exercise,
            exercise.uid
        );

        UserManagement.addPoints(userId, exercise.points);
        // Recalculate and save times after adding the exercise
        await recalculateAndUpdateWorkoutData(userId, workoutId);
        handlePostExercise(userId, exercise);
        return exercise.uid;
    } catch (error) {
        console.error('Error adding exercise:', error);
        throw error;
    }
};

/**
 * Updates an existing exercise within a workout.
 * Updates highscore entries for station-based exercises and recalculates workout times.
 * @param {string} userId - The user ID who owns the workout
 * @param {string} workoutId - The workout ID containing the exercise
 * @param {Object} exerciseData - The exercise data with updated fields (must include uid)
 * @returns {Promise<void>}
 * @throws {Error} When exercise cannot be updated or workout times cannot be recalculated
 */
const updateExercise = async (userId, workoutId, exerciseData) => {
    try {
        const exercisePath = `${createPath(userId)}/${workoutId}/${EXERCISE_COLLECTION}`;
        const dataToUpdate = { ...exerciseData };
        const oldExer = await FirestoreManager.readDocument(exercisePath, exerciseData.uid);

        if (dataToUpdate.points)
            await UserManagement.addPoints(userId, -oldExer.points);

        delete dataToUpdate.uid;
        await FirestoreManager.updateDocument(exercisePath, exerciseData.uid, dataToUpdate);

        if (dataToUpdate.points)
            await UserManagement.addPoints(userId, dataToUpdate.points);

        // Recalculate and save times after updating the exercise
        await recalculateAndUpdateWorkoutData(userId, workoutId);
        handlePostExercise(userId, exerciseData);
    } catch (error) {
        console.error('Error updating exercise:', error);
        throw error;
    }
};

/**
 * Deletes an exercise from a workout.
 * Removes the exercise document and recalculates workout times.
 * @param {string} userId - The user ID who owns the workout
 * @param {string} workoutId - The workout ID containing the exercise
 * @param {string} exerciseId - The exercise ID to delete
 * @returns {Promise<void>}
 * @throws {Error} When exercise cannot be deleted or workout times cannot be recalculated
 */
const deleteExercise = async (userId, workoutId, exerciseId) => {
    try {
        const exercisePath = `${createPath(userId)}/${workoutId}/${EXERCISE_COLLECTION}`;
        const oldExer = await FirestoreManager.readDocument(exercisePath, exerciseId);
        UserManagement.addPoints(userId, -oldExer.points);

        await FirestoreManager.deleteDocument(exercisePath, exerciseId);

        // Recalculate and save times after deleting the exercise
        await recalculateAndUpdateWorkoutData(userId, workoutId);
    } catch (error) {
        console.error('Error deleting exercise:', error);
        throw error;
    }
};

async function handlePostExercise(userId, exercise) {
    RewardSystem.awardBadges(userId);
    GoalSystem.updateGoalsFromWorkout(userId, exercise.stationId, exercise.points);
    exercise.userId = userId;
    if (exercise.stationId && exercise.userId) {
        HighscoreManager.create(exercise);
    }

    const challenges = await ChallengeManagement.getUserChallenges(userId);
    challenges.forEach(obj => {
        ChallengeManagement.updateProgress(obj.uid);
    });
}


/**
 * @namespace WorkoutManager
 * @description Firebase service module for comprehensive workout and exercise management.
 * Provides functionality to create, read, update, and delete workouts and exercises,
 * with automatic time tracking, point calculation, highscore processing, and complete
 * workout session lifecycle management for the fitness application.
 */
const WorkoutManager = {
    saveWorkout,
    loadWorkoutById,
    loadWorkouts,
    deleteWorkout,
    update,
    addExercise,
    updateExercise,
    deleteExercise,
}
export default WorkoutManager;

