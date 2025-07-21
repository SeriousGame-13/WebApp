import { Station, Workout } from '../interfaces/workout.jsx';
import FirestoreManager from './FirestoreManager.jsx';
import UserManagement from './UserManagementSystem.jsx';
import { WORKOUT_COLLECTION, STATION_COLLECTION } from './collections.jsx'


const createPath = (userId) => {
    return `${UserManagement.getUserDatabasePath(userId)}${WORKOUT_COLLECTION}`;
}

const saveWorkout = async (workout) => {
    if (!(workout instanceof Workout)) {
        workout = new Workout(workout);
    }
    try {
        const { stations = [], ...workoutData } = workout;
        //TODO check uid
        let points = workout.getTotalPoints();
        if (points > 0) {
            UserManagement.addPoints(workoutData.userId, points);
        }

        // Save the main document and let Firebase generate the ID
        const workoutRef = await FirestoreManager.createDocument(`${createPath(workoutData.userId)}`, workoutData, workoutData.uid);
        if (!workoutRef) throw new Error('Could not save workout');

        // Save stations as a subcollection
        const stationSaves = stations.map(station =>
            FirestoreManager.createDocument(`${createPath(workoutData.userId)}/${workoutRef.id}/${STATION_COLLECTION}`, station, station.uid)
        );

        await Promise.all(stationSaves);

        return workoutRef.id;
    } catch (error) {
        console.error('Error saving workout:', error);
        throw error;
    }
}

// Load all workouts (without stations initially)
const loadWorkouts = async (userId) => {
    try {
        const snapshot = await FirestoreManager.getAllDocuments(`${createPath(userId)}`);
        const workouts = snapshot.docs.map(doc => ({ ...doc.data() }));
        
        // For each workout, load its stations
        for (const workout of workouts) {
            const stationsSnapshot = await FirestoreManager.getAllDocuments(`${createPath(userId)}/${workout.uid}/${STATION_COLLECTION}`);
            const stations = stationsSnapshot.docs.map(doc => Station.fromJSON(doc.data()));
            workout.stations = stations;
        }

        return workouts;
    } catch (error) {
        console.error('Error loading workouts:', error);
        throw error;
    }
}

// Load a single workout (including stations)
const loadWorkoutById = async (userId, idWorkout) => {
    try {
        const data = await FirestoreManager.readDocument(`${createPath(userId)}`, idWorkout);
        if (!data) throw new Error('Workout not found');

        const stationsSnapshot = await FirestoreManager.getAllDocuments(`${createPath(userId)}/${idWorkout}/${STATION_COLLECTION}`);
        const stations = stationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        return { id: idWorkout, ...data, stations };
    } catch (error) {
        console.error('Error loading workout:', error);
        throw error;
    }
}

const deleteWorkout = async (userId, idWorkout) => {
    try {
        // Delete all stations in the subcollection first
        const stationsSnapshot = await FirestoreManager.getAllDocuments(`${createPath(userId)}/${idWorkout}/${STATION_COLLECTION}`);
        for (let doc of stationsSnapshot.docs) {
            await FirestoreManager.deleteDocument(`${createPath(userId)}/${idWorkout}/${STATION_COLLECTION}`, doc.id);
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
        const { stations = [], ...workoutData } = workout;
        // Note: This function only updates the main workout document.
        // Station updates would need a separate mechanism if required.
        await FirestoreManager.updateDocument(`${createPath(workoutData.userId)}`, workoutData.uid, workoutData, true);

    } catch (error) {
        console.error('Error updating workout:', error);
        throw error;
    }
}

// New function to add a station to an existing workout
const addStation = async (userId, workoutId, stationData) => {
    try {
        const station = new Station(stationData); // Create a new Station instance to get default values and a new uid
        await FirestoreManager.createDocument(
            `${createPath(userId)}/${workoutId}/${STATION_COLLECTION}`,
            station,
            station.uid
        );
    } catch (error) {
        console.error('Error adding station:', error);
        throw error;
    }
};


const WorkoutManager = {
    saveWorkout,
    loadWorkoutById,
    loadWorkouts,
    deleteWorkout,
    update,
    addStation // Export the new function
}
export default WorkoutManager;
