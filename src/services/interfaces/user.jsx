import BaseModel from './base.jsx';

export default class User extends BaseModel {
  constructor(data = {}) {
    super({
      uid: '',
      email: '',
      displayName: '',
      isActive: true,
      level: 1,
      points: 0,
      longestStreak: 0,
      goals: [],
      badges: [],
      workouts: [],
      friends: [],
      ...data
    });
  }

  // Helper methods
  isLevelUp(newPoints) {
    const currentLevelPoints = this.level * 1000; // Beispiel: 1000 Punkte pro Level
    return (this.points + newPoints) >= currentLevelPoints;
  }

  addPoints(points) {
    this.points += points;
    if (this.isLevelUp(0)) {
      this.level++;
      this.points = this.points - (this.level - 1) * 1000; // Übertrage Restpunkte
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

  getCreatedAtDate(){
    return this.createdAt?.toDate?.() ?? new Date(this.createdAt).toLocaleString();
  }
}