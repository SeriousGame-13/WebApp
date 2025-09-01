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
 * Fetches all exercises for a workout, calculates comprehensive workout data, and updates the workout document.
 * Recalculates active/idle times, start/end times from exercises, and heart rate statistics.
 * Runs as a background task and does not throw errors to avoid disrupting main operations.
 * @param {string} userId - The ID of the user
 * @param {string} workoutId - The ID of the workout to update
 * @returns {Promise<void>}
 */
const recalculateAndUpdateWorkoutData = async (userId, workoutId) => {
    try {
        const workout = await loadWorkoutById(userId, workoutId);
        workout.recalculateProperties();
        update(workout);
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
        const exercises = exerSnap.docs.map(doc => ({ ...doc.data() }));
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
        delete workout.exercises; //avoid arrays directly
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
        // Recalculate and save in the background
        recalculateAndUpdateWorkoutData(userId, workoutId);
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

        // Recalculate and save in the background
        recalculateAndUpdateWorkoutData(userId, workoutId);
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
        recalculateAndUpdateWorkoutData(userId, workoutId);
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

