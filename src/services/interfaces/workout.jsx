import BaseModel from './base.jsx';

export class Workout extends BaseModel {
  constructor(data = {}) {
    super({
      userId: '',
      startTime: Date.now(),
      endTime: null,
      stations: [],
      ...data
    });
  }

  getDuration() {
    if (this.endTime > 0) {
      return this.endTime - this.startTime;
    }
    return Date.now() - this.startTime;
  }

  getDurationInMinutes() {
    return Math.floor(this.getDuration() / (1000 * 60));
  }

  getDurationInHours() {
    return Math.floor(this.getDuration() / (1000 * 60 * 60));
  }

  addStation(station) {
    this.stations.push(station);
  }

  removeStation(stationId) {
    this.stations = this.stations.filter(st => st.stationId !== stationId);
  }

  validate() {
    return this.workoutId && this.userId && this.startTime;
  }

  // Berechne Gesamtpunkte des Workouts
  getTotalPoints() {
    return this.stations.reduce((total, station) => {
      return total + (station.points ? station.points : 0);
    }, 0);
  }

  getTotalTime() {
    if (!this.stations || this.stations.length === 0) return 0;

    return (this.stations.reduce((total, station) => {
      if (station.startTime && station.endTime) {
        return total + station.getDurationMs(station.startTime, station.endTime);
      }
      return total;
    }, 0));
  }
}

export class Station extends BaseModel {
  constructor(data = {}) {
    super({
      points: 0,
      startTime: "",
      endTime: "",
      heartRateAvg: null,
      calories: 0,
      ...data
    });
  }
}