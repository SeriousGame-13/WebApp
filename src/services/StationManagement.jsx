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

import { STATION_COLLECTION } from './firebase/Collections.jsx';
import FirestoreManager from './firebase/FirestoreManager.jsx';

import { Station } from './interfaces/Station.jsx';

/**
 * Saves a new station to the database.
 * Automatically converts plain objects to Station instances if needed.
 * @param {Station|Object} station - The station data to save (Station instance or plain object)
 * @returns {Promise<string>} The ID of the created station document
 * @throws {Error} When station cannot be saved or validation fails
 */
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

/**
 * Updates an existing station in the database.
 * Extracts the station UID and updates all other provided fields.
 * @param {Object} stationData - The station data containing uid and fields to update
 * @param {string} stationData.uid - The unique identifier of the station to update
 * @returns {Promise<void>} Resolves when the station is successfully updated
 * @throws {Error} When the station cannot be updated or UID is missing
 */
const update = async (stationData) => {
    try {
        const { uid, ...dataToUpdate } = stationData;
        await FirestoreManager.updateDocument(STATION_COLLECTION, uid, dataToUpdate);
    } catch (error) {
        console.error('Error updating station:', error);
        throw error;
    }
};

/**
 * Deletes a station from the database.
 * Note: Future enhancement should include cleanup of references to this station in exercises.
 * @param {string} stationId - The unique identifier of the station to delete
 * @returns {Promise<void>} Resolves when the station is successfully deleted
 * @throws {Error} When the station cannot be deleted or ID is invalid
 */
const deleteStation = async (stationId) => {
    try {
        // Future enhancement: Clean up references to this station in exercises.
        await FirestoreManager.deleteDocument(STATION_COLLECTION, stationId);
    } catch (error) {
        console.error('Error deleting station:', error);
        throw error;
    }
};

/**
 * Retrieves all stations from the database.
 * Converts raw Firestore data to Station instances for consistent data handling.
 * @returns {Promise<Station[]>} Array of Station instances, or empty array if retrieval fails
 */
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

/**
 * @namespace StationManager
 * @description Firebase service module for comprehensive station management.
 * Provides functionality to create, read, update, and delete exercise stations
 * in the fitness application, with proper data validation and error handling.
 */
const StationManager = {
    save: saveStation,
    update,
    delete: deleteStation,
    loadAll,
}
export default StationManager;