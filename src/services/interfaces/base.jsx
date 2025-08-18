// Base Model Klasse
import { v4 as uuidv4 } from 'uuid';
import { serverTimestamp, Timestamp } from 'firebase/firestore';

export default class BaseModel {
  constructor(data = {}) {
    Object.assign(this, data);
    this.uid = data.uid || uuidv4();
    this.createdAt = data.createdAt || serverTimestamp();
    this.updatedAt = data.updatedAt || serverTimestamp();
  }

  toJSON() {
    return { ...this };
  }

  static fromJSON(data) {
    return new this(data);
  }

  // Helper method für Validierung
  validate() {
    // Überschreibbar in Subklassen
    return true;
  }

  // Deep clone
  clone() {
    return new this.constructor(JSON.parse(JSON.stringify(this)));
  }

  // Update mit neuen Daten
  update(data) {
    Object.assign(this, data);
    return this;
  }

  getCreateAt() {
    const createdAtDate = this.createdAt?.toDate?.() ?? new Date(this.createdAt);
    return createdAtDate.toLocaleString();
  }
  getDurationMinutes(startTime, endTime) {
    try {
      let start, end;

      // Handle Firestore Timestamps
      if (startTime?.toDate && typeof startTime.toDate === 'function') {
        start = startTime.toDate();
      } else if (startTime instanceof Date) {
        start = startTime;
      } else {
        start = new Date(startTime);
      }

      if (endTime?.toDate && typeof endTime.toDate === 'function') {
        end = endTime.toDate();
      } else if (endTime instanceof Date) {
        end = endTime;
      } else {
        end = new Date(endTime);
      }

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        console.warn('Invalid date format:', { startTime, endTime });
        return 0;
      }

      const durationMs = end.getTime() - start.getTime();
      return Math.round(durationMs / (1000 * 60));
    } catch (error) {
      console.error('Error calculating duration:', error, { startTime, endTime });
      return 0;
    }
  }

  formatDuration(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${hours}h ${minutes}m ${seconds}s`;
  }

  // Format duration in minutes to human readable format
  formatDurationMinutes(minutes) {
    if (minutes === 0 || isNaN(minutes)) return '0m';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }

  // Format calories in European format (with thousand separators)
  formatCalories(calories) {
    if (!calories || isNaN(calories)) return '0';
    return new Intl.NumberFormat('de-DE').format(calories);
  }
  // Calculate duration between two dates in minutes
  getDurationMinutes(startTime, endTime) {
    try {
      // Handle ISO strings like '2025-05-29T13:50:00.000Z'
      const start = startTime.toDate();
      const end = endTime.toDate();

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        console.warn('Invalid date format:', { startTime, endTime });
        return 0;
      }

      const durationMs = end.getTime() - start.getTime();
      return Math.round(durationMs / (1000 * 60)); // Convert to minutes
    } catch (error) {
      console.error('Error calculating duration:', error, { startTime, endTime });
      return 0;
    }
  }

  getDurationMs(startTime, endTime) {
    try {
      // Handle ISO strings like '2025-05-29T13:50:00.000Z'
      const start = startTime.toDate();
      const end = endTime.toDate();

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        console.warn('Invalid date format:', { startTime, endTime });
        return 0;
      }

      return end.getTime() - start.getTime();
    } catch (error) {
      console.error('Error calculating duration:', error, { startTime, endTime });
      return 0;
    }
  }

}