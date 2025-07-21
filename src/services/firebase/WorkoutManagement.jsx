import { Exercise, Workout } from '../interfaces/workout.jsx';
import FirestoreManager from './FirestoreManager.jsx';
import UserManagement from './UserManagementSystem.jsx';
import { WORKOUT_COLLECTION, EXERCISE_COLLECTION as EXERCISE_COLLECTION } from './collections.jsx'


const createPath = (userId) => {
    return `${UserManagement.getUserDatabasePath(userId)}${WORKOUT_COLLECTION}`;
}

const saveWorkout = async (workout) => {
    if (!(workout instanceof Workout)) {
        workout = new Workout(workout);
    }
    try {
        const { exercises = [], ...workoutData } = workout;
        //TODO check uid
        let points = workout.getTotalPoints();
        if (points > 0) {
            UserManagement.addPoints(workoutData.userId, points);
        }

        // Save the main document and let Firebase generate the ID
        const workoutRef = await FirestoreManager.createDocument(`${createPath(workoutData.userId)}`, workoutData, workoutData.uid);
        if (!workoutRef) throw new Error('Could not save workout');

        // Save exercises as a subcollection
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

// Load all workouts (without exercises initially)
const loadWorkouts = async (userId) => {
    try {
        const snapshot = await FirestoreManager.getAllDocuments(`${createPath(userId)}`);
        const workouts = snapshot.docs.map(doc => ({ ...doc.data() }));
        
        // For each workout, load its exercises
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

// Load a single workout (including exercises)
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
        // Delete all exercises in the subcollection first
        const exerSnap = await FirestoreManager.getAllDocuments(`${createPath(userId)}/${idWorkout}/${EXERCISE_COLLECTION}`);
        for (let doc of exerSnap.docs) {
            await FirestoreManager.deleteDocument(`${createPath(userId)}/${idWorkout}/${EXERCISE_COLLECTION}`, doc.id);
        }

        // Delete the main workout document
        await FirestoreManager.deleteDocument(`${createPath(userId)}`, idWorkout);
    } catch (error) {
        console.error('Error deleting workout:', error);
        throw error;
    }
}

const update = async (workout) => {
    try {
        const { exercises = [], ...workoutData } = workout;
        // Note: This function only updates the main workout document.
        // exercises updates would need a separate mechanism if required.
        await FirestoreManager.updateDocument(`${createPath(workoutData.userId)}`, workoutData.uid, workoutData, true);

    } catch (error) {
        console.error('Error updating workout:', error);
        throw error;
    }
}

// New function to add a exercises to an existing workout
const addExercise = async (userId, workoutId, exerData) => {
    try {
        const exercise = new Exercise(exerData); // Create a new exercises instance to get default values and a new uid
        await FirestoreManager.createDocument(
            `${createPath(userId)}/${workoutId}/${EXERCISE_COLLECTION}`,
            exercise,
            exercise.uid
        );
    } catch (error) {
        console.error('Error adding exercise:', error);
        throw error;
    }
};


const WorkoutManager = {
    saveWorkout,
    loadWorkoutById,
    loadWorkouts,
    deleteWorkout,
    update,
    addExercise // Export the new function
}
export default WorkoutManager;
