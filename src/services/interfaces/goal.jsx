import BaseModel from './base.jsx';
import { Timestamp } from 'firebase/firestore';
export class UserGoal extends BaseModel {
  constructor(data = {}) {
    super({
      goalId: '',
      userId: '',
      exerciseDefId: '',
      deadline: null,
      exercise: null,
      ...data
    });
  }

  isExpired() {
    if (!this.deadline) return false;
    const deadlineDate = this.deadline?.toDate ? this.deadline.toDate() : new Date(this.deadline);
    return Date.now() > deadlineDate.getTime();
  }

  daysUntilDeadline() {
    if (!this.deadline) return 0;
    const deadlineDate = this.deadline?.toDate ? this.deadline.toDate() : new Date(this.deadline);
    const diff = deadlineDate.getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  hoursUntilDeadline() {
    if (!this.deadline) return 0;
    const deadlineDate = this.deadline?.toDate ? this.deadline.toDate() : new Date(this.deadline);
    const diff = deadlineDate.getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60));
  }

  validate() {
    if (!this.goalId || !this.userId || !this.exerciseDefId || !this.deadline) return false;
    const deadlineDate = this.deadline?.toDate ? this.deadline.toDate() : new Date(this.deadline);
    return deadlineDate.getTime() > Date.now();
  }
}
