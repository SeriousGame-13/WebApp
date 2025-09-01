import BaseModel from './base.jsx';
import {
  serverTimestamp
} from 'firebase/firestore';

export class Workout extends BaseModel {
  constructor(data = {}) {
    super({
      userId: data.userId || '',
      startTime: data.startTime || serverTimestamp(),
      endTime: data.endTime || null,
      exercises: data.exercises || [],
      idleTime: data.idleTime || 0,
      activeTime: data.activeTime || 0,
      ...data
    });
  }

  getDuration() {
    const start = this.startTime?.toDate ? this.startTime.toDate().getTime() : new Date(this.startTime).getTime();
    const end = this.endTime?.toDate ? this.endTime.toDate().getTime() : (this.endTime ? new Date(this.endTime).getTime() : Date.now());
    if (isNaN(start)) return 0;
    return Math.max(0, end - start);
  }

  getDurationInMinutes() {
    return Math.floor(this.getDuration() / (1000 * 60));
  }

  getDurationInHours() {
    return Math.floor(this.getDuration() / (1000 * 60 * 60));
  }

  addExercise(exercise) {
    this.exercises.push(exercise);
  }

  removeExercise(exerciseId) {
    this.exercises = this.exercises.filter(st => st.exerciseId !== exerciseId);
  }

  validate() {
    return this.workoutId && this.userId && this.startTime;
  }

  // Berechne Gesamtpunkte des Workouts
  getTotalPoints() {
    return this.exercises.reduce((total, exercise) => {
      return total + (exercise.points ? exercise.points : 0);
    }, 0);
  }

  getTotalTime() {
    if (!this.exercises || this.exercises.length === 0) return 0;

    return (this.exercises.reduce((total, exercise) => {
      if (exercise.startTime && exercise.endTime) {
        return total + exercise.getDurationMinutes(exercise.startTime, exercise.endTime);
      }
      return total;
    }, 0));
  }

  getCalories() {
    if (!this.exercises || this.exercises.length === 0) return 0;
    return (this.exercises.reduce((total, exer) => {
      return total + exer.calories;
    }, 0));
  }
}


