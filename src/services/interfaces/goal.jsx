import BaseModel from './base.jsx';
export class UserGoal extends BaseModel {
  constructor(data = {}) {
    super({
      goalId: '',
      userId: '',
      exerciseDefId: '',
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
