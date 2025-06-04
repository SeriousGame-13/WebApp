import BaseModel from './base.jsx';
import { CHALLENGE_TYPE } from './constants.jsx';

export class Challenge extends BaseModel {
  constructor(data = {}) {
    super({
      challengeId: '',
      name: '',
      description: '',
      startDate: Date.now(),
      endDate: 0,
      creatorId: '',
      rewardPoints: 0,
      challengeType: CHALLENGE_TYPE.TARGET,
      targetExerciseId: null,
      targetValue: null,
      createdAt: Date.now(),
      participants: [],
      creator: null,
      targetExercise: null,
      ...data
    });
  }

  isActive() {
    const now = Date.now();
    return now >= this.startDate && now <= this.endDate;
  }

  isExpired() {
    return Date.now() > this.endDate;
  }

  hasStarted() {
    return Date.now() >= this.startDate;
  }

  hasNotStarted() {
    return Date.now() < this.startDate;
  }

  getDaysRemaining() {
    const diff = this.endDate - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  getHoursRemaining() {
    const diff = this.endDate - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60));
  }

  getDaysUntilStart() {
    const diff = this.startDate - Date.now();
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
      joinedAt: Date.now(),
      completedAt: null,
      user: null,
      ...data
    });
  }

  complete() {
    this.completedAt = Date.now();
  }

  isCompleted() {
    return this.completedAt !== null;
  }

  getDaysParticipating() {
    const diff = Date.now() - this.joinedAt;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  getDaysToComplete() {
    if (!this.completedAt) return null;
    const diff = this.completedAt - this.joinedAt;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  validate() {
    return this.participantId && this.challengeId && this.userId;
  }
}