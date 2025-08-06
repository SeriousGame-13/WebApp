import FirestoreManager from './FirestoreManager.jsx';
import { WORKOUT_COLLECTION, EXERCISE_COLLECTION } from './collections.jsx';

import { Exercise } from '../interfaces/exercise.jsx';
import { Workout } from '../interfaces/workout.jsx';
import UserManagement from './UserManagementSystem.jsx';
import StationManager from './StationManagement.jsx';
import HighscoreManager from './HighscoreManager.jsx';


const createPath = (userId) => {
    return `${UserManagement.getUserDatabasePath(userId)}${WORKOUT_COLLECTION}`;
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
    } catch (error) {
        console.error('Error updating exercise:', error);
        throw error;
    }
};

const deleteExercise = async (userId, workoutId, exerciseId) => {
    try {
        const exercisePath = `${createPath(userId)}/${workoutId}/${EXERCISE_COLLECTION}`;
        await FirestoreManager.deleteDocument(exercisePath, exerciseId);
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