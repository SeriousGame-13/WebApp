/**
 * @fileoverview Station Management Service
 * 
 * This module provides comprehensive station management functionality for the fitness application.
 * It handles station creation, updating, deletion, and retrieval operations using Firestore as the backend.
 * Stations represent exercise equipment or workout areas within the fitness environment.
 * 
 * @author Igor, Alexander, Hyunu, Robert
 * @version 1.0.0
 */

import FirestoreManager from './firebase/FirestoreManager.jsx';
import { STATION_GAMES_COLLECTION } from './firebase/Collections.jsx';

import { StationGame } from './interfaces/Station.jsx';

const save = async (object) => {
    if (!(object instanceof StationGame)) {
        object = new StationGame(object);
    }
    try {
        const stationRef = await FirestoreManager.createDocument(`${STATION_GAMES_COLLECTION}`, object, object.uid);
        if (!stationRef) throw new Error('Could not save object');
        return stationRef.id;
    } catch (error) {
        console.error('Error saving object:', error);
        throw error;
    }
}

const update = async (data) => {
    try {
        const { uid, ...dataToUpdate } = data;
        await FirestoreManager.updateDocument(STATION_GAMES_COLLECTION, uid, dataToUpdate);
    } catch (error) {
        console.error('Error updating:', error);
        throw error;
    }
};

const deleteObject = async (uid) => {
    try {
        await FirestoreManager.deleteDocument(STATION_GAMES_COLLECTION, uid);
    } catch (error) {
        console.error('Error deleting:', error);
        throw error;
    }
};

const loadAll = async () => {
    try {
        const snapshot = await FirestoreManager.getAllDocuments(STATION_GAMES_COLLECTION);
        const stations = [];
        snapshot.forEach(doc => {
            const rawData = doc.data();
            const data = StationGame.fromJSON(rawData);
            stations.push(data);
        });
        return stations;
    } catch (error) {
        console.error('Failed to get all:', error);
        return [];
    }
}


const StationGameManager = {
    save,
    update,
    deleteObject,
    loadAll,
}
export default StationGameManager;