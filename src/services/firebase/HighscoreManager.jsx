import FirestoreManager from "./FirestoreManager";
import { HIGHSCORE_COLLECTION } from "./collections";
import { Station } from "../interfaces/station";
import { Highscore } from "../interfaces/highscore";

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

const HighscoreManager = {
    create,
}
export default HighscoreManager;