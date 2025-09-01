import { serverTimestamp } from 'firebase/firestore';
import BaseModel from './base.jsx';
import { CHALLENGE_STYLE, CHALLENGE_TYPE, CHALLENGE_STATUS, CHALLENGE_PARTICIPATION_STATUS } from './constants.jsx';

export class Challenge extends BaseModel {
  constructor(data = {}) {
    super({
      name: data.name || '',
      description: data.description || '',
      startDate: data.startDate || null,
      endDate: data.endDate || null,
      creatorId: data.creatorId || '',
      rewardPoints: data.rewardPoints || 0,
      challengeType: data.challengeType || CHALLENGE_TYPE.TARGET,
      challengeStyle: data.challengeStyle || CHALLENGE_STYLE.INDIVIDUAL,
      targetValue: data.targetValue || null,
      targetField: data.targetField || null,
      participants: data.participants || [],
      status: data.status || CHALLENGE_STATUS.OPEN,
      progress: data.progress || 0,
      conditions: data.conditions || [],
      ...data
    });
  }

  isPublic() {
    return this.visibility === CHALLENGE_VISIBILITY.PUBLIC;
  }

  isHidden() {
    return this.visibility === CHALLENGE_VISIBILITY.HIDDEN;
  }

  isGroupChallenge() {
    return this.visibility === CHALLENGE_VISIBILITY.GROUP;
  }

  isActive() {
    const now = Date.now();
    const start = this.startDate?.toDate ? this.startDate.toDate().getTime() : new Date(this.startDate).getTime();
    const end = this.endDate?.toDate ? this.endDate.toDate().getTime() : new Date(this.endDate).getTime();
    return (!isNaN(start) ? now >= start : true) && (!isNaN(end) ? now <= end : true);
  }

  isExpired() {
    const end = this.endDate?.toDate ? this.endDate.toDate().getTime() : new Date(this.endDate).getTime();
    return !isNaN(end) && Date.now() > end;
  }

  hasStarted() {
    const start = this.startDate?.toDate ? this.startDate.toDate().getTime() : new Date(this.startDate).getTime();
    return !isNaN(start) && Date.now() >= start;
  }

  hasNotStarted() {
    const start = this.startDate?.toDate ? this.startDate.toDate().getTime() : new Date(this.startDate).getTime();
    return !isNaN(start) && Date.now() < start;
  }

  getDaysRemaining() {
    const end = this.endDate?.toDate ? this.endDate.toDate().getTime() : new Date(this.endDate).getTime();
    const diff = end - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  getHoursRemaining() {
    const end = this.endDate?.toDate ? this.endDate.toDate().getTime() : new Date(this.endDate).getTime();
    const diff = end - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60));
  }

  getDaysUntilStart() {
    const start = this.startDate?.toDate ? this.startDate.toDate().getTime() : new Date(this.startDate).getTime();
    const diff = start - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  addParticipant(participant) {
    this.participants.push(participant);
  }

  removeParticipant(participantId) {
    this.participants = this.participants.filter(p => p.participantId !== participantId);
  }

  getParticipantCount() {
    return this.participants.length;
  }

  getCompletedParticipants() {
    return this.participants.filter(p => p.isCompleted());
  }

  getCompletionRate() {
    if (this.participants.length === 0) return 0;
    return (this.getCompletedParticipants().length / this.participants.length) * 100;
  }

  validate() {
    return this.challengeId && this.name && this.creatorId && this.endDate > this.startDate;
  }

  // Check ob User bereits teilnimmt
  hasParticipant(userId) {
    return this.participants.some(p => p.userId === userId);
  }

  // Bekomme Participant eines Users
  getParticipant(userId) {
    return this.participants.find(p => p.userId === userId);
  }
}

export class ChallengeParticipant extends BaseModel {
  constructor(data = {}) {
    super({
      participantId: '',
      challengeId: '',
      userId: '',
      joinedAt: serverTimestamp(),
      completedAt: null,
      currentValue: 0,
      status: CHALLENGE_PARTICIPATION_STATUS.ACTIVE,
      ...data
    });
  }

  complete() {
    this.completedAt = serverTimestamp();
  }

  isCompleted() {
    return this.completedAt !== null;
  }

  getDaysParticipating() {
    const joined = this.joinedAt?.toDate ? this.joinedAt.toDate().getTime() : new Date(this.joinedAt).getTime();
    const diff = Date.now() - joined;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  getDaysToComplete() {
    if (!this.completedAt) return null;
    const completed = this.completedAt?.toDate ? this.completedAt.toDate().getTime() : new Date(this.completedAt).getTime();
    const joined = this.joinedAt?.toDate ? this.joinedAt.toDate().getTime() : new Date(this.joinedAt).getTime();
    const diff = completed - joined;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  validate() {
    return this.participantId && this.challengeId && this.userId;
  }
}