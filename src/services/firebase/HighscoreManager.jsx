/**
 * @fileoverview Highscore Manager Module
 * 
 * This module provides highscore management functionality for the fitness application.
 * It handles creation and retrieval of highscores for different exercise metrics including
 * points, calories, and heart rate data. The system tracks the best performances per station
 * and provides leaderboard functionality.
 * 
 * Highscores are tracked per user, per exercise station, and per metric type to enable
 * comprehensive performance comparison and ranking systems.
 * 
 * @author Igor, Alexander, Hyunu, Robert
 * @version 1.0.0
 */

import FirestoreManager from "./FirestoreManager";
import { HIGHSCORE_COLLECTION } from "./collections";
import { Highscore } from "../interfaces/highscore";
import UserManagement from "./UserManagementSystem";

/**
 * Creates or updates highscore records for an exercise.
 * Processes multiple metrics (points, calories, heart rate) and updates existing records
 * only if the new score is better than the current highscore.
 * @param {Object} exercise - The exercise data object
 * @param {string} exercise.stationId - The unique identifier of the exercise station
 * @param {string} exercise.userId - The unique identifier of the user
 * @param {string} exercise.uid - The unique identifier of the exercise
 * @param {number} exercise.points - The points scored in the exercise
 * @param {number} exercise.calories - The calories burned during the exercise
 * @param {number} exercise.heartRateAvg - The average heart rate during the exercise
 * @returns {Promise<void>} Resolves when all highscore updates are complete
 * @throws {Error} If required IDs are missing or database operations fail
 */
const create = async (exercise) => {
    try {
        if (!exercise.stationId || !exercise.userId) {
            throw new Error("Missing important ID");
        }

        let highscores = [];

        let highscore = new Highscore({ userId: exercise.userId, metric: "points", score: exercise.points });
        highscores.push(highscore);

        highscore = new Highscore({ userId: exercise.userId, metric: "calories", score: exercise.calories });
        highscores.push(highscore);

        highscore = new Highscore({ userId: exercise.userId, metric: "heartRateAvg", score: exercise.heartRateAvg });
        highscores.push(highscore);


        const existingScores = await FirestoreManager.queryDocumentsByFieldValue(HIGHSCORE_COLLECTION, "userId", exercise.userId);
        const exerSaves = highscores.map(obj => {
            obj.userId = exercise.userId;
            obj.stationId = exercise.stationId;
            obj.exerciseId = exercise.uid;
            let skipCreate = false;
            existingScores.forEach(exScore => {
                const data = exScore.data();
                if (data.metric == obj.metric && data.exerciseId == obj.exerciseId) {
                    delete obj.uid;
                    delete obj.updatedAt;
                    FirestoreManager.updateDocument(HIGHSCORE_COLLECTION, data.uid, { ...obj }, true);
                    skipCreate = true;
                }
            });
            if (!skipCreate && obj.score > 0)
                FirestoreManager.createDocument(HIGHSCORE_COLLECTION, { ...obj }, obj.uid);
        });

        await Promise.all(exerSaves);

    } catch (error) {
        console.error('Error updating highscore:', error);
    }
};

/**
 * Loads and returns the highest scores for each metric at a specific station.
 * Retrieves all highscores for the station, determines the best score per metric,
 * and enriches the data with user display names for leaderboard display.
 * @param {string} stationId - The unique identifier of the exercise station
 * @returns {Promise<Object[]>} Array of highscore objects with user information
 * @returns {Promise<Object[]>} result[].metric - The metric type (points, calories, heartRateAvg)
 * @returns {Promise<Object[]>} result[].score - The highest score achieved for this metric
 * @returns {Promise<Object[]>} result[].userId - The unique identifier of the user who achieved this score
 * @returns {Promise<Object[]>} result[].userName - The display name of the user who achieved this score
 * @returns {Promise<Object[]>} result[].stationId - The station identifier
 * @returns {Promise<Object[]>} result[].exerciseId - The exercise identifier where this score was achieved
 */
const loadHighscoresForStation = async (stationId) => {
    try {
        const snapshot = await FirestoreManager.queryDocumentsByFieldValue(HIGHSCORE_COLLECTION, 'stationId', stationId);
        let highscores = {};
        snapshot.forEach(doc => {
            const data = doc.data();
            if (!(data.metric in highscores)) {
                highscores[data.metric] = data
            } else {
                let max = highscores[data.metric];
                if (data.score > max.score) {
                    highscores[data.metric] = data
                }
            }
        });
        highscores = Object.values(highscores);

        const users = await UserManagement.getAllActiveUsers();
        const indexUsers = {};
        users.map(user => {
            indexUsers[user.uid] = user;
        });
        for (let i = 0; i < highscores.length; i++) {
            const userId = highscores[i].userId;
            highscores[i].userName = indexUsers[userId].displayName;
        }

        return highscores;
    } catch (error) {
        console.error('Failed to load highscores for station:', error);
        return [];
    }
};

/**
 * Highscore Manager
 * 
 * Provides highscore management functionality including:
 * - Creating and updating highscore records for multiple exercise metrics
 * - Tracking best performances per user, station, and metric type
 * - Loading station leaderboards with user information
 * - Automatic comparison and updating of existing scores
 * - Support for points, calories, and heart rate metrics
 * 
 * The system ensures only improved scores are recorded and provides
 * comprehensive leaderboard data for competitive features.
 * 
 * @namespace HighscoreManager
 */
const HighscoreManager = {
    create,
    loadHighscoresForStation,
};

export default HighscoreManager;