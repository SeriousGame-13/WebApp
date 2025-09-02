/**
 * @fileoverview Workout Management Service
 * 
 * A comprehensive service module for managing workouts and exercises in the fitness application.
 * This service provides a complete CRUD interface for workout operations, automatic data calculations,
 * user progress tracking, and integration with the reward system.
 *
 * Key Features:
 * - Full workout lifecycle management (create, read, update, delete)
 * - Automatic workout data recalculation from exercises
 * - Real-time heart rate statistics calculation
 * - Point and calorie tracking with user progress updates
 * - Integration with highscore, badge, goal, and challenge systems
 * - Background data processing for optimal performance
 * 
 * @module WorkoutManagement
 * @author Igor, Alexander, Hyunu, Robert
 * @version 2.0.0
 * @since 1.0.0
 */

import ChallengeManagement from './ChallengeManagement.jsx';
import { EXERCISE_COLLECTION, WORKOUT_COLLECTION } from './firebase/Collections.jsx';
import FirestoreManager from './firebase/FirestoreManager.jsx';
import GoalSystem from './GoalSystem.jsx';
import HighscoreManager from './HighscoreManager.jsx';
import { Exercise } from './interfaces/Exercise.jsx';
import { Workout } from './interfaces/Workout.jsx';
import RewardSystem from './RewardSystem.jsx';
import UserManagement from './UserManagementSystem.jsx';

/**
 * Creates the Firestore collection path for a user's workouts.
 * 
 * @function createPath
 * @param {string} userId - The unique identifier for the user
 * @returns {string} The complete Firestore collection path for user workouts
 * @example
 * // Returns: "users/user123/workouts"
 * createPath("user123")
 */
const createPath = (userId) => {
    return `${UserManagement.getUserDatabasePath(userId)}${WORKOUT_COLLECTION}`;
}


/**
 * Recalculates and updates workout data based on its exercises.
 * 
 * This function performs comprehensive workout data recalculation including:
 * - Heart rate statistics (min, max, average)
 * - Total points and calories from exercises
 * - Workout duration and time range
 * 
 * Runs as a background operation to avoid blocking the UI. Errors are logged
 * but not propagated to prevent disruption of primary operations.
 * 
 * @async
 * @function recalculateAndUpdateWorkoutData
 * @param {string} userId - The unique identifier for the user
 * @param {string} workoutId - The unique identifier for the workout
 * @returns {Promise<void>} Resolves when calculation and update are complete
 * @throws {Error} Logs errors but does not throw to maintain operation flow
 * 
 * @example
 * await recalculateAndUpdateWorkoutData("user123", "workout456");
 */
const recalculateAndUpdateWorkoutData = async (userId, workoutId) => {
    try {
        const workout = await loadWorkoutById(userId, workoutId);
        workout.recalculateProperties();
        await update(workout);
    } catch (error) {
        console.error(`Failed to calculate and save workout data for workout ${workoutId}:`, error);
        // Do not re-throw, as this is a background task and shouldn't fail the main operation
    }
}

/**
 * Creates a new workout in the database with associated exercises.
 * 
 * This function handles the complete workout creation process:
 * - Validates and converts workout data to Workout instance
 * - Saves workout metadata to Firestore
 * - Creates exercise subcollection documents
 * - Maintains data integrity across related collections
 * 
 * @async
 * @function saveWorkout
 * @param {Workout|Object} workout - The workout data (Workout instance or plain object)
 * @param {string} workout.userId - The user who owns the workout
 * @param {string} workout.name - The workout name
 * @param {string} [workout.description] - Optional workout description
 * @param {Array<Exercise>} [workout.exercises] - Array of exercise objects
 * @returns {Promise<string>} The unique ID of the created workout document
 * @throws {Error} When workout validation fails or database operation errors occur
 * 
 * @example
 * const workoutId = await saveWorkout({
 *   userId: "user123",
 *   name: "Morning Cardio",
 *   description: "30-minute cardio session",
 *   exercises: [exerciseData1, exerciseData2]
 * });
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
 * Retrieves all workouts for a specific user with their exercises.
 * 
 * This function performs a comprehensive data fetch:
 * - Loads all workout documents for the user
 * - Fetches exercise subcollections for each workout
 * - Constructs complete Workout instances with embedded exercises
 * - Returns fully hydrated workout objects ready for use
 * 
 * @async
 * @function loadWorkouts
 * @param {string} userId - The unique identifier for the user
 * @returns {Promise<Array<Workout>>} Array of complete workout objects with exercises
 * @throws {Error} When database access fails or data cannot be processed
 * 
 * @example
 * const userWorkouts = await loadWorkouts("user123");
 * console.log(`Found ${userWorkouts.length} workouts`);
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

/**
 * Post-exercise processing for rewards, goals, and challenges.
 * 
 * Handles all secondary effects after an exercise is added or updated:
 * - Badge system integration for achievement tracking
 * - Goal progress updates based on station and points
 * - Highscore record creation for station-based exercises
 * - Challenge progress updates for active user challenges
 * 
 * @async
 * @function handlePostExercise
 * @param {string} userId - The unique identifier for the user
 * @param {Exercise} exercise - The exercise data to process
 * @param {string} exercise.stationId - Station where exercise was performed
 * @param {number} exercise.points - Points earned from the exercise
 * @returns {Promise<void>} Resolves when all post-processing is complete
 * 
 * @example
 * await handlePostExercise("user123", {
 *   stationId: "station456",
 *   points: 50,
 *   userId: "user123"
 * });
 */
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
 * @description 
 * Comprehensive Firebase service module for workout and exercise management in the fitness application.
 * 
 * This service provides a complete suite of operations for managing workout data including:
 * 
 * **Core Operations:**
 * - Workout CRUD operations (create, read, update, delete)
 * - Exercise management within workouts
 * - Automatic data recalculation and synchronization
 * 
 * **Data Processing:**
 * - Real-time heart rate statistics calculation
 * - Point and calorie aggregation from exercises
 * - Workout duration and time range computation
 * 
 * **System Integration:**
 * - User progress tracking and level updates
 * - Reward system integration for badges and achievements
 * - Goal system updates based on exercise completion
 * - Challenge progress tracking
 * - Highscore management for competitive features
 * 
 * **Performance Features:**
 * - Background data processing for optimal UX
 * - Efficient batch operations for multiple exercises
 * - Error handling with graceful degradation
 * 
 * @example
 * // Create a new workout
 * const workoutId = await WorkoutManager.saveWorkout({
 *   userId: "user123",
 *   name: "Morning Run",
 *   exercises: [exerciseData]
 * });
 * 
 * // Load user's workouts
 * const workouts = await WorkoutManager.loadWorkouts("user123");
 * 
 * // Add exercise to existing workout
 * await WorkoutManager.addExercise("user123", workoutId, exerciseData);
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

