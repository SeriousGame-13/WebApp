import BaseModel from './BaseModel.jsx';
import { EXERCISE_UNIT } from './constants.jsx';

export class Category extends BaseModel {
  constructor(data = {}) {
    super({
      categoryId: '',
      name: '',
      description: '',
      ...data
    });
  }

  validate() {
    return this.categoryId && this.name;
  }
}

export class ExerciseDefinition extends BaseModel {
  constructor(data = {}) {
    super({
      exerciseDefId: '',
      categoryId: '',
      name: '',
      description: '',
      instructions: '',
      muscleGroups: '',
      unit: EXERCISE_UNIT.REPS,
      isActive: true,
      createdAt: Date.now(),
      pointsFormula: '',
      category: null,
      ...data
    });
  }

  calculatePoints(value) {
    // Einfache Punkteberechnung - kann erweitert werden
    try {
      // Ersetze Variablen in der Formel
      const formula = this.pointsFormula.replace(/value/g, value);
      return eval(formula) || 0;
    // eslint-disable-next-line no-unused-vars
    } catch (error) {
      return Math.floor(value * 0.1); // Fallback
    }
  }

  activate() {
    this.isActive = true;
  }

  deactivate() {
    this.isActive = false;
  }

  validate() {
    return this.exerciseDefId && this.name && this.categoryId;
  }

  // Bekomme Muskelgruppen als Array
  getMuscleGroupsArray() {
    return this.muscleGroups.split(',').map(group => group.trim());
  }
}

export class UserGoal extends BaseModel {
  constructor(data = {}) {
    super({
      goalId: '',
      userId: '',
      exerciseDefId: '',
      createdAt: Date.now(),
      deadline: 0,
      exercise: null,
      ...data
    });
  }

  isExpired() {
    return Date.now() > this.deadline;
  }

  daysUntilDeadline() {
    const diff = this.deadline - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  hoursUntilDeadline() {
    const diff = this.deadline - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60));
  }

  validate() {
    return this.goalId && this.userId && this.exerciseDefId && this.deadline > Date.now();
  }
}

export class ExerciseSet extends BaseModel {
  constructor(data = {}) {
    super({
      setId: '',
      workoutExerciseId: '',
      value: '',
      unit: EXERCISE_UNIT.REPS,
      notes: '',
      ...data
    });
  }

  getNumericValue() {
    return parseFloat(this.value) || 0;
  }

  validate() {
    return this.setId && this.workoutExerciseId && this.value;
  }
}