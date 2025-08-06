import { serverTimestamp } from "firebase/firestore";
import BaseModel from "./base";

export class Exercise extends BaseModel {
  constructor(data = {}) {
    super({
      points: data.points || 0,
      startTime: data.startTime || serverTimestamp(),
      endTime: data.endTime || serverTimestamp(),
      heartRateAvg: data.heartRateAvg || 0,
      calories: data.calories || 0,
      userId: data.userId || null,
      stationId: data.stationId || null,
      ...data
    });
  }
}