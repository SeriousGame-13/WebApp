import FirestoreManager from './FirestoreManager.jsx';
import { WORKOUT_COLLECTION, EXERCISE_COLLECTION } from './collections.jsx';
import { Timestamp } from 'firebase/firestore';
import { Exercise } from '../interfaces/exercise.jsx';
import { Workout } from '../interfaces/workout.jsx';
import UserManagement from './UserManagementSystem.jsx';
import HighscoreManager from './HighscoreManager.jsx';

const createPath = (userId) => {
    return `${UserManagement.getUserDatabasePath(userId)}${WORKOUT_COLLECTION}`;
}

/**
 * Safely converts a timestamp to a JavaScript Date object
 * @param {*} timestamp - Can be Firestore Timestamp, Date, or number
 * @returns {Date|null} - JavaScript Date object or null
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
 * Calculates the total active and idle time for a workout based on its exercises.
 * This is a helper function and is not exported.
 * @param {Array} exercises - The list of exercises in the workout.
 * @returns {{activeTime: number, idleTime: number}} - An object containing active and idle time in seconds.
 */
function calculateWorkoutTimes(exercises) {
    if (!exercises || exercises.length === 0) {
        return { activeTime: 0, idleTime: 0 };
    }

    const processedExercises = exercises.map(ex => ({
        ...ex,
        startTime: safeTimestampToDate(ex.startTime),
        endTime: safeTimestampToDate(ex.endTime),
    })).filter(ex => ex.startTime && ex.endTime); // Only keep exercises with valid timestamps

    const activeTime = processedExercises.reduce((total, ex) => {
        if (ex.startTime && ex.endTime && ex.endTime > ex.startTime) {
            return total + (ex.endTime.getTime() - ex.startTime.getTime());
        }
        return total;
    }, 0);

    const sortedExercises = processedExercises
        .filter(ex => ex.startTime && ex.endTime)
        .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

    let idleTime = 0;
    for (let i = 0; i < sortedExercises.length - 1; i++) {
        const currentExercise = sortedExercises[i];
        const nextExercise = sortedExercises[i + 1];
        if (currentExercise.endTime && nextExercise.startTime && nextExercise.startTime > currentExercise.endTime) {
            idleTime += (nextExercise.startTime.getTime() - currentExercise.endTime.getTime());
        }
    }

    return {
        activeTime: Math.round(activeTime / 1000),
        idleTime: Math.round(idleTime / 1000)
    };
}

/**
 * Fetches all exercises for a workout, calculates active/idle times, and updates the workout document.
 * This is a helper function and is not exported.
 * @param {string} userId - The ID of the user.
 * @param {string} workoutId - The ID of the workout to update.
 */
const calculateAndSaveWorkoutTimes = async (userId, workoutId) => {
    try {
        const exercisePath = `${createPath(userId)}/${workoutId}/${EXERCISE_COLLECTION}`;
        const exerSnap = await FirestoreManager.getAllDocuments(exercisePath);
        const exercises = exerSnap.docs.map(doc => doc.data());

        const { activeTime, idleTime } = calculateWorkoutTimes(exercises);

        const workoutPath = createPath(userId);
        await FirestoreManager.updateDocument(workoutPath, workoutId, { activeTime, idleTime });

    } catch (error) {
        console.error(`Failed to calculate and save times for workout ${workoutId}:`, error);
        // Do not re-throw, as this is a background task and shouldn't fail the main operation.
    }
}

const saveWorkout = async (workout) => {
    if (!(workout instanceof Workout)) {
        workout = new Workout(workout);
    }
    try {
        const { exercises = [], ...workoutData } = workout;
        let points = workout.getTotalPoints();
        if (points > 0) {
            UserManagement.addPoints(workoutData.userId, points);
        }

        const workoutRef = await FirestoreManager.createDocument(`${createPath(workoutData.userId)}`, workoutData, workoutData.uid);
        if (!workoutRef) throw new Error('Could not save workout');

        const exerSaves = exercises.map(exercise =>
            FirestoreManager.createDocument(`${createPath(workoutData.userId)}/${workoutRef.id}/${EXERCISE_COLLECTION}`, exercise, exercise.uid)
        );

        await Promise.all(exerSaves);

        return workoutRef.id;
    } catch (error) {
        console.error('Error saving workout:', error);
        throw error;
    }
}

const loadWorkouts = async (userId) => {
    try {
        const snapshot = await FirestoreManager.getAllDocuments(`${createPath(userId)}`);
        const workouts = snapshot.docs.map(doc => ({ ...doc.data() }));

        for (const workout of workouts) {
            const exerSnap = await FirestoreManager.getAllDocuments(`${createPath(userId)}/${workout.uid}/${EXERCISE_COLLECTION}`);
            const exercises = exerSnap.docs.map(doc => Exercise.fromJSON(doc.data()));
            workout.exercises = exercises;
        }

        return workouts;
    } catch (error) {
        console.error('Error loading workouts:', error);
        throw error;
    }
}

const loadWorkoutById = async (userId, idWorkout) => {
    try {
        const data = await FirestoreManager.readDocument(`${createPath(userId)}`, idWorkout);
        if (!data) throw new Error('Workout not found');

        const exerSnap = await FirestoreManager.getAllDocuments(`${createPath(userId)}/${idWorkout}/${EXERCISE_COLLECTION}`);
        const exercises = exerSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        return { id: idWorkout, ...data, exercises };
    } catch (error) {
        console.error('Error loading workout:', error);
        throw error;
    }
}

const deleteWorkout = async (userId, idWorkout) => {
    try {
        const exerSnap = await FirestoreManager.getAllDocuments(`${createPath(userId)}/${idWorkout}/${EXERCISE_COLLECTION}`);
        for (let doc of exerSnap.docs) {
            await FirestoreManager.deleteDocument(`${createPath(userId)}/${idWorkout}/${EXERCISE_COLLECTION}`, doc.id);
        }

        await FirestoreManager.deleteDocument(`${createPath(userId)}`, idWorkout);
    } catch (error) {
        console.error('Error deleting workout:', error);
        throw error;
    }
}

const update = async (workout) => {
    try {
        const { ...workoutData } = workout;
        await FirestoreManager.updateDocument(`${createPath(workoutData.userId)}`, workoutData.uid, workoutData, true);
    } catch (error) {
        console.error('Error updating workout:', error);
        throw error;
    }
}

const addExercise = async (userId, workoutId, exerData) => {
    try {
        const exercise = new Exercise({ ...exerData, userId }); 
        await FirestoreManager.createDocument(
            `${createPath(userId)}/${workoutId}/${EXERCISE_COLLECTION}`,
            exercise,
            exercise.uid
        );
        if (exercise.stationId) {
            await HighscoreManager.create(exercise);
        }
        // Recalculate and save times after adding the exercise
        await calculateAndSaveWorkoutTimes(userId, workoutId);
    } catch (error) {
        console.error('Error adding exercise:', error);
        throw error;
    }
};

const updateExercise = async (userId, workoutId, exerciseData) => {
    try {
        const exercisePath = `${createPath(userId)}/${workoutId}/${EXERCISE_COLLECTION}`;
        const dataToUpdate = { ...exerciseData };
        delete dataToUpdate.uid;
        await FirestoreManager.updateDocument(exercisePath, exerciseData.uid, dataToUpdate);
        
        exerciseData.userId = userId;
        await HighscoreManager.create(exerciseData);
        
        // Recalculate and save times after updating the exercise
        await calculateAndSaveWorkoutTimes(userId, workoutId);
    } catch (error) {
        console.error('Error updating exercise:', error);
        throw error;
    }
};

const deleteExercise = async (userId, workoutId, exerciseId) => {
    try {
        const exercisePath = `${createPath(userId)}/${workoutId}/${EXERCISE_COLLECTION}`;
        await FirestoreManager.deleteDocument(exercisePath, exerciseId);

        // Recalculate and save times after deleting the exercise
        await calculateAndSaveWorkoutTimes(userId, workoutId);
    } catch (error) {
        console.error('Error deleting exercise:', error);
        throw error;
    }
};

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