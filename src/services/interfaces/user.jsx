import BaseModel from './base.jsx';

export default class User extends BaseModel {
  constructor(data = {}) {
    super({
      email: '',
      displayName: '',
      isActive: true,
      isAdmin: false,
      level: 1,
      points: 0,
      longestStreak: 0,
      workouts: [],
      badges: [],
      challenges: [],
      ...data
    });
  }

  currentMaxPoints() {
    return this.level * 1000;
  }

  isLevelUp(newPoints) {
    return (this.points + newPoints) >= this.currentMaxPoints();
  }

  addPoints(pointsToAdd) {
    this.points += pointsToAdd;
    // Keep leveling up while we have enough points
    while (this.points >= this.level * 1000) {
      this.points -= this.level * 1000; // Subtract points needed for current level
      this.level++; // Level up
    }
  }

  addFriend(friendId) {
    if (!this.friends.includes(friendId)) {
      this.friends.push(friendId);
    }
  }

  removeFriend(friendId) {
    this.friends = this.friends.filter(id => id !== friendId);
  }

  updateStreak(newStreak) {
    if (newStreak > this.longestStreak) {
      this.longestStreak = newStreak;
    }
  }

  deactivate() {
    this.isActive = false;
  }

  activate() {
    this.isActive = true;
  }

  // Validierung
  validate() {
    return this.uid && this.email && this.displayName;
  }

  // Berechne Fortschritt zum nächsten Level
  getLevelProgress() {
    const currentLevelPoints = this.level * 1000;
    return (this.points / currentLevelPoints) * 100;
  }

  getCreatedAtDate() {
    return this.createdAt?.toDate?.() ?? new Date(this.createdAt).toLocaleString();
  }

  getTotalTrainingTime() {
    return this.workouts.reduce((total, workout) => {
      return total + (workout.getTotalTime());
    }, 0);
  }

  getCalories() {
       return this.workouts.reduce((total, workout) => {
      return total + (workout.getCalories());
    }, 0);
  }
}