import BaseModel from './base.jsx';
import { serverTimestamp } from 'firebase/firestore';
export class UserGoal extends BaseModel {
  constructor(data = {}) {
    super({
      userId: '',
      stationId: '',
      deadline: 0,
      exercise: null,
      ...data
    });
  }

  isExpired() {
    return  Date.now() > this.deadline.toDate();
  }

  daysUntilDeadline() {
    const diff = this.deadline.toDate() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  hoursUntilDeadline() {
    const diff = this.deadline.toDate() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60));
  }

  validate() {
    return this.uid && this.userId && this.stationId && this.deadline.toDate() > Date.now();
  }
}
