import BaseModel from "./Base.jsx";

export class Highscore extends BaseModel {
    constructor(data = {}) {
        super({
            metric: "",
            score: "",
            userId: null,
            stationId: null,
            exerciseId: null,
            ...data
        });
    }
}