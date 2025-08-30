import BaseModel from './base.jsx';
import { serverTimestamp } from 'firebase/firestore';
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
    return serverTimestamp() > this.deadline;
  }

  daysUntilDeadline() {
    const diff = this.deadline - serverTimestamp();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  hoursUntilDeadline() {
    const diff = this.deadline - serverTimestamp();
    return Math.ceil(diff / (1000 * 60 * 60));
  }

  validate() {
    return this.goalId && this.userId && this.exerciseDefId && this.deadline > serverTimestamp();
  }
}
