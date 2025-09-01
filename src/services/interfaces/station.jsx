import BaseModel from "./base";

export class Station extends BaseModel {
    constructor(data = {}) {
        super({
            name: data.name || "",
            gameId: data.gameId || "",
            ...data
        });
    }
}

export class StationGame extends BaseModel {
    constructor(data = {}) {
        super({
            name: data.name || "",
            stationId: data.stationId || null,
            ...data
        });
    }
}