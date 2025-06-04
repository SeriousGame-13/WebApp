import BaseModel from './base.jsx';

export class Workout extends BaseModel {
  constructor(data = {}) {
    super({
      workoutId: '',
      userId: '',
      startTime: Date.now(),
      endTime: 0,
      createdAt: Date.now(),
      exercises: [],
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

  addExercise(exercise) {
    this.exercises.push(exercise);
  }

  removeExercise(exerciseId) {
    this.exercises = this.exercises.filter(ex => ex.workoutExerciseId !== exerciseId);
  }

  finishWorkout() {
    this.endTime = Date.now();
  }

  isFinished() {
    return this.endTime > 0;
  }

  isActive() {
    return this.endTime === 0;
  }

  validate() {
    return this.workoutId && this.userId && this.startTime;
  }

  // Berechne Gesamtpunkte des Workouts
  getTotalPoints() {
    return this.exercises.reduce((total, exercise) => {
      return total + (exercise.getPoints ? exercise.getPoints() : 0);
    }, 0);
  }

  // Bekomme alle Übungen einer bestimmten Kategorie
  getExercisesByCategory(categoryId) {
    return this.exercises.filter(ex => 
      ex.exercise && ex.exercise.categoryId === categoryId
    );
  }
}

export class WorkoutExercise extends BaseModel {
  constructor(data = {}) {
    super({
      workoutExerciseId: '',
      workoutId: '',
      exerciseDefId: '',
      exercise: null,
      sets: [],
      ...data
    });
  }

  addSet(set) {
    this.sets.push(set);
  }

  removeSet(setId) {
    this.sets = this.sets.filter(set => set.setId !== setId);
  }

  getTotalVolume() {
    return this.sets.reduce((total, set) => {
      const value = parseFloat(set.value) || 0;
      return total + value;
    }, 0);
  }

  getAverageValue() {
    if (this.sets.length === 0) return 0;
    return this.getTotalVolume() / this.sets.length;
  }

  getMaxValue() {
    if (this.sets.length === 0) return 0;
    return Math.max(...this.sets.map(set => parseFloat(set.value) || 0));
  }

  getSetCount() {
    return this.sets.length;
  }

  validate() {
    return this.workoutExerciseId && this.workoutId && this.exerciseDefId;
  }

  // Berechne Punkte für diese Übung
  getPoints() {
    if (!this.exercise || !this.exercise.calculatePoints) return 0;
    return this.sets.reduce((total, set) => {
      return total + this.exercise.calculatePoints(parseFloat(set.value) || 0);
    }, 0);
  }
}