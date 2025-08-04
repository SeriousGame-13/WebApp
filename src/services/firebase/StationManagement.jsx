import FirestoreManager from './FirestoreManager.jsx';
import { STATION_COLLECTION } from './collections.jsx';

import { Station } from '../interfaces/station.jsx';
import HighscoreManager from './HighscoreManager.jsx';


const saveStation = async (station) => {
    if (!(station instanceof Station)) {
        station = new Station(station);
    }
    try {
        const stationRef = await FirestoreManager.createDocument(`${STATION_COLLECTION}`, station, station.uid);
        if (!stationRef) throw new Error('Could not save station');
        return stationRef.id;
    } catch (error) {
        console.error('Error saving Station:', error);
        throw error;
    }
}

// Added: Function to update an existing station
const update = async (stationData) => {
    try {
        const { uid, ...dataToUpdate } = stationData;
        await FirestoreManager.updateDocument(STATION_COLLECTION, uid, dataToUpdate);
    } catch (error) {
        console.error('Error updating station:', error);
        throw error;
    }
};

// Added: Function to delete a station
const deleteStation = async (stationId) => {
    try {
        // Future enhancement: Clean up references to this station in exercises.
        await FirestoreManager.deleteDocument(STATION_COLLECTION, stationId);
    } catch (error) {
        console.error('Error deleting station:', error);
        throw error;
    }
};


const loadAll = async () => {
    try {
        const snapshot = await FirestoreManager.getAllDocuments(STATION_COLLECTION);
        const stations = [];
        snapshot.forEach(doc => {
            const rawData = doc.data();
            const stationData = Station.fromJSON(rawData);
            stations.push(stationData);
        });
        return stations;
    } catch (error) {
        console.error('Failed to get all stations:', error);
        return [];
    }
}

const StationManager = {
    save: saveStation,
    update, // Added
    delete: deleteStation, // Added
    loadAll,
}
export default StationManager;