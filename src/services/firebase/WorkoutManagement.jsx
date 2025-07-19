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
        UserManagement.addPoints(workoutData.userId, points);

        // Hauptdokument speichern und ID von Firebase generieren lassen
        const workoutRef = await FirestoreManager.createDocument(`${createPath(workoutData.userId)}`, workoutData, workoutData.uid);
        if (!workoutRef) throw new Error('Workout konnte nicht gespeichert werden');

        // Stations als Subcollection speichern
        const stationSaves = stations.map(station =>
            FirestoreManager.createDocument(`${createPath(workoutData.userId)}/${workoutRef.id}/${STATION_COLLECTION}`, station, station.uid)
        );

        await Promise.all(stationSaves);

        return workoutRef.id;
    } catch (error) {
        console.error('Fehler beim Speichern:', error);
        throw error;
    }
}

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
}

// Einzelnes Workout laden (inkl. Stations)
const loadWorkoutById = async (userId, idWorkout) => {
    try {
        const data = await FirestoreManager.readDocument(`${createPath(userId)}`, idWorkout);
        if (!data) throw new Error('Workout nicht gefunden');

        const stationsSnapshot = await FirestoreManager.getAllDocuments(`${createPath(userId)}/${idWorkout}/${STATION_COLLECTION}`);
        const stations = stationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        return { id: idWorkout, ...data, stations };
    } catch (error) {
        console.error('Fehler beim Laden des Workouts:', error);
        throw error;
    }
}

const deleteWorkout = async (userId, idWorkout) => {
    try {
        const stationsSnapshot = await FirestoreManager.getAllDocuments(`${createPath(userId)}/${idWorkout}/${STATION_COLLECTION}`);
        for (let doc of stationsSnapshot.docs) {
            await FirestoreManager.deleteDocument(`${createPath(userId)}/${idWorkout}/${STATION_COLLECTION}`, doc.id);
        }

        await FirestoreManager.deleteDocument(`${createPath(userId)}`, idWorkout);
    } catch (error) {
        console.error('Fehler beim Laden des Workouts:', error);
        throw error;
    }
}

const update = async (workout) => {
    try {
        const { stations = [], ...workoutData } = workout;
        //TODO handle update points somehow ...
        // let points = workout.getTotalPoints();
        // UserManagement.addPoints(workoutData.userId, points);

        // Hauptdokument speichern und ID von Firebase generieren lassen
        await FirestoreManager.updateDocument(`${createPath(workoutData.userId)}`, workoutData.uid, workoutData, true);

        // TODO: Stations als Subcollection updaten
        // const stationSaves = stations.map(station =>
        //     FirestoreManager.createDocument(`${createPath(workoutData.userId)}/${workoutRef.id}/${STATION_COLLECTION}`, station, station.uid)
        // );
        // await Promise.all(stationSaves);

    } catch (error) {
        console.error('Fehler beim Speichern:', error);
        throw error;
    }
}

const WorkoutManager = {
    saveWorkout,
    loadWorkoutById,
    loadWorkouts,
    deleteWorkout,
    update
}
export default WorkoutManager;