import FirestoreManager from './FirestoreManager.jsx';

const WORKOUT_COLLECTION = 'workouts';

// Workout speichern (inkl. automatische UUID von Firebase und Stations)
const saveWorkout = async (workout) => {
    try {
        const { stations = [], ...workoutData } = workout;

        // Hauptdokument speichern und ID von Firebase generieren lassen
        const workoutRef = await FirestoreManager.createDocument(WORKOUT_COLLECTION, workoutData.uid, workoutData);
        if (!workoutRef) throw new Error('Workout konnte nicht gespeichert werden');

        // Stations als Subcollection speichern
        const stationSaves = stations.map(station =>
            FirestoreManager.createDocument(`${WORKOUT_COLLECTION}/${workoutRef.id}/stations`, station.uid, station)
        );
        await Promise.all(stationSaves);

        return workoutRef.id;
    } catch (error) {
        console.error('Fehler beim Speichern:', error);
        throw error;
    }
};

// Alle Workouts laden (ohne Stations)
const loadWorkouts = async () => {
    try {
        const snapshot = await FirestoreManager.getAllDocuments(WORKOUT_COLLECTION);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Fehler beim Laden:', error);
        throw error;
    }
};

// Einzelnes Workout laden (inkl. Stations)
const loadWorkoutById = async (id) => {
    try {
        const data = await FirestoreManager.readDocument(WORKOUT_COLLECTION, id);
        if (!data) throw new Error('Workout nicht gefunden');

        const stationsSnapshot = await FirestoreManager.getAllDocuments(`${WORKOUT_COLLECTION}/${id}/stations`);
        const stations = stationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        return { id, ...data, stations };
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