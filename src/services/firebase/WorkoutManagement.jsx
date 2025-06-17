import { Station } from '../interfaces/workout.jsx';
import FirestoreManager from './FirestoreManager.jsx';
import UserManagement from './UserManagementSystem.jsx';

const WORKOUT_COLLECTION = 'workouts';
const STATION_COLLECTION = 'stations';

const createPath = (userId) => {
    return `${UserManagement.getUserDatabasePath(userId)}${WORKOUT_COLLECTION}`;
}

// Workout speichern (inkl. automatische UUID von Firebase und Stations)
const saveWorkout = async (workout) => {
    try {
        const { stations = [], ...workoutData } = workout;

        // Hauptdokument speichern und ID von Firebase generieren lassen
        const workoutRef = await FirestoreManager.createDocument(`${createPath(workoutData.userId)}`, workoutData.uid, workoutData);
        if (!workoutRef) throw new Error('Workout konnte nicht gespeichert werden');

        // Stations als Subcollection speichern
        const stationSaves = stations.map(station =>
            FirestoreManager.createDocument(`${createPath(workoutData.userId)}/${workoutRef.id}/${STATION_COLLECTION}`, station.uid, station)
        );
        await Promise.all(stationSaves);

        return workoutRef.id;
    } catch (error) {
        console.error('Fehler beim Speichern:', error);
        throw error;
    }
};

// Alle Workouts laden (ohne Stations)
const loadWorkouts = async (userId) => {
    try {
        const snapshot = await FirestoreManager.getAllDocuments(`${createPath(userId)}`);
        const workouts = snapshot.docs.map(doc => ({ ...doc.data() }));
        for (const element of workouts) {
            const stationsSnapshot = await FirestoreManager.getAllDocuments(`${createPath(userId)}/${element.uid}/${STATION_COLLECTION}`);
            const stations = stationsSnapshot.docs.map(doc => Station.fromJSON(doc.data()));
            element.stations = stations;
        }

        return workouts;
    } catch (error) {
        console.error('Fehler beim Laden:', error);
        throw error;
    }
};

// Einzelnes Workout laden (inkl. Stations)
const loadWorkoutById = async (userId, idWorkout) => {
    try {
        const data = await FirestoreManager.readDocument(`${createPath(userId)}`, idWorkout);
        if (!data) throw new Error('Workout nicht gefunden');

        const stationsSnapshot = await FirestoreManager.getAllDocuments(`${createPath(userId)}/${STATION_COLLECTION}`);
        const stations = stationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        return { id: idWorkout, ...data, stations };
    } catch (error) {
        console.error('Fehler beim Laden des Workouts:', error);
        throw error;
    }
};

const WorkoutManager = {
    saveWorkout,
    loadWorkoutById,
    loadWorkouts
}
export default WorkoutManager;