import BaseModel from "./base";

export class Station extends BaseModel {
    constructor(data = {}) {
        super({
            name: data.name || "",
            ...data
        });
    }
}