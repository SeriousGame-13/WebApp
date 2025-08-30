import FirestoreManager from "./FirestoreManager";
import { HIGHSCORE_COLLECTION } from "./collections";
import { Highscore } from "../interfaces/highscore";
import UserManagement from "./UserManagementSystem";

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
            obj.userId = exercise.userId
            obj.stationId = exercise.stationId
            obj.exerciseId = exercise.uid
            let skipCreate = false
            existingScores.forEach(exScore => {
                const data = exScore.data()
                if (data.metric == obj.metric && data.exerciseId == obj.exerciseId) {
                    delete obj.uid;
                    delete obj.updatedAt;
                    FirestoreManager.updateDocument(HIGHSCORE_COLLECTION, data.uid, { ...obj }, true)
                    skipCreate = true
                }

            });
            if (!skipCreate && obj.score > 0)
                FirestoreManager.createDocument(HIGHSCORE_COLLECTION, { ...obj }, obj.uid)
        }
        );

        await Promise.all(exerSaves);

    } catch (error) {
        console.error('Error updating highscore:', error);
    }
};

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

const HighscoreManager = {
    create,
    loadHighscoresForStation,
}
export default HighscoreManager;