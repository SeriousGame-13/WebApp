import BaseModel from './Base.jsx';


export class Workout extends BaseModel {
  /**
   * Creates a new Workout instance.
   * 
   * @param {Object} data - The workout data
   * @param {string} [data.uid] - Unique identifier (auto-generated if not provided)
   * @param {string} data.userId - The user who owns this workout
   * @param {string} [data.name=''] - The workout name
   * @param {string} [data.description=''] - The workout description
   * @param {Array<Exercise>} [data.exercises=[]] - Array of exercises in this workout
   */
  constructor(data = {}) {
    super({
      uid: data.uid,
      userId: data.userId || '',
      name: data.name || '',
      description: data.description || '',
      exercises: data.exercises || [],
    });
    
    this.recalculateProperties();
  }

  /**
   * Recalculates all workout properties based on current exercises.
   * 
   * This method updates all calculated fields including heart rate statistics,
   * total calories, total points, and workout time range. Should be called
   * whenever exercises are added, removed, or modified.
   * 
   * @method recalculateProperties
   * @returns {void}
   */
  recalculateProperties() {
    this.calculateHeartRateStats();
    this.calculateCalories();
    this.calculatePoints();
    this.calculateTimeRange();
  }

  /**
   * Calculate heart rate statistics from all exercises.
   * 
   * Computes average, minimum, and maximum heart rate values across all
   * exercises that have heart rate data. Sets values to null if no
   * heart rate data is available.
   * 
   * @method calculateHeartRateStats
   * @returns {void}
   * @private
   */
  calculateHeartRateStats() {
    const exercisesWithHeartRate = this.exercises.filter(ex => 
      ex.heartRateAvg && typeof ex.heartRateAvg === 'number' && ex.heartRateAvg > 0
    );

    if (exercisesWithHeartRate.length === 0) {
      this.heartRateAvg = null;
      this.heartRateMin = null;
      this.heartRateMax = null;
      return;
    }

    // Calculate average of all exercise averages
    const avgValues = exercisesWithHeartRate.map(ex => ex.heartRateAvg);
    this.heartRateAvg = Math.round(avgValues.reduce((sum, avg) => sum + avg, 0) / avgValues.length);

    // Find overall min and max from all exercises
    const minValues = exercisesWithHeartRate
      .filter(ex => ex.heartRateMin && typeof ex.heartRateMin === 'number')
      .map(ex => ex.heartRateMin);
    const maxValues = exercisesWithHeartRate
      .filter(ex => ex.heartRateMax && typeof ex.heartRateMax === 'number')
      .map(ex => ex.heartRateMax);

    this.heartRateMin = minValues.length > 0 ? Math.min(...minValues) : null;
    this.heartRateMax = maxValues.length > 0 ? Math.max(...maxValues) : null;
  }

  /**
   * Calculate total calories burned from all exercises.
   * 
   * @method calculateCalories
   * @returns {void}
   * @private
   */
  calculateCalories() {
    this.calories = this.exercises.reduce((total, exercise) => {
      return total + (exercise.calories || 0);
    }, 0);
  }

  /**
   * Calculate total points earned from all exercises.
   * 
   * @method calculatePoints
   * @returns {void}
   * @private
   */
  calculatePoints() {
    this.points = this.exercises.reduce((total, exercise) => {
      return total + (exercise.points || 0);
    }, 0);
  }

  /**
   * Calculate workout start and end times from exercises.
   * 
   * Determines the earliest start time and latest end time across all
   * exercises to establish the overall workout duration.
   * 
   * @method calculateTimeRange
   * @returns {void}
   * @private
   */
  calculateTimeRange() {
    const exercisesWithTimes = this.exercises.filter(ex => ex.startTime && ex.endTime);
    
    if (exercisesWithTimes.length === 0) {
      this.startTime = null;
      this.endTime = null;
      return;
    }

    // Convert timestamps to Date objects for comparison
    const startTimes = exercisesWithTimes.map(ex => this.safeTimestampToDate(ex.startTime));
    const endTimes = exercisesWithTimes.map(ex => this.safeTimestampToDate(ex.endTime));

    // Find earliest start time and latest end time
    this.startTime = new Date(Math.min(...startTimes.map(date => date.getTime())));
    this.endTime = new Date(Math.max(...endTimes.map(date => date.getTime())));
  }

  /**
   * Safely converts various timestamp formats to a JavaScript Date object.
   * 
   * Handles multiple timestamp formats including Firestore Timestamps,
   * JavaScript Date objects, Unix timestamps, and ISO date strings.
   * 
   * @method safeTimestampToDate
   * @param {*} timestamp - The timestamp to convert
   * @returns {Date} A valid Date object, or epoch date if conversion fails
   * @private
   */
  safeTimestampToDate(timestamp) {
    if (!timestamp) return new Date(0);

    // If it's a Firestore Timestamp
    if (timestamp?.toDate && typeof timestamp.toDate === 'function') {
      return timestamp.toDate();
    }

    // If it's already a Date object
    if (timestamp instanceof Date) {
      return timestamp;
    }

    // If it's a Firestore Timestamp object with seconds property
    if (timestamp?.seconds && typeof timestamp.seconds === 'number') {
      return new Date(timestamp.seconds * 1000);
    }

    // If it's a number (Unix timestamp in milliseconds)
    if (typeof timestamp === 'number') {
      return new Date(timestamp);
    }

    // If it's a string (ISO date string)
    if (typeof timestamp === 'string') {
      const date = new Date(timestamp);
      return isNaN(date.getTime()) ? new Date(0) : date;
    }

    return new Date(0);
  }

  /**
   * Get workout duration in milliseconds.
   * 
   * @method getDuration
   * @returns {number} Duration in milliseconds, 0 if times are not available
   */
  getDuration() {
    if (!this.startTime || !this.endTime) return 0;
    return this.endTime.getTime() - this.startTime.getTime();
  }

  /**
   * Get workout duration formatted as HH:MM:SS.
   * 
   * @method getDurationFormatted
   * @returns {string} Formatted duration string (e.g., "01:30:45")
   */
  getDurationFormatted() {
    const durationMs = this.getDuration();
    return this.formatDurationMs(durationMs);
  }

  /**
   * Format a duration in milliseconds to HH:MM:SS.
   *
   * @method formatDurationMs
   * @param {number} durationMs - Duration in milliseconds
   * @returns {string} Formatted duration string
   * @private
   */
  formatDurationMs(durationMs) {
    if (!durationMs || durationMs <= 0) return "00:00:00";

    const totalSeconds = Math.floor(durationMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Get total active time based on summed exercise durations.
   * Overlaps are not de-duplicated. If there are gaps between exercises,
   * they will be considered idle time.
   *
   * @method getActiveTimeMs
   * @returns {number} Active time in milliseconds
   */
  getActiveTimeMs() {
    if (!Array.isArray(this.exercises) || this.exercises.length === 0) return 0;

    // Build list of valid intervals [startMs, endMs]
    const intervals = this.exercises
      .map(ex => {
        const s = this.safeTimestampToDate(ex.startTime).getTime();
        const e = this.safeTimestampToDate(ex.endTime).getTime();
        return [Math.min(s, e), Math.max(s, e)];
      })
      .filter(([s, e]) => isFinite(s) && isFinite(e) && e > s)
      .sort((a, b) => a[0] - b[0]);

    if (intervals.length === 0) return 0;

    // Merge overlapping intervals
    const merged = [];
    let [curS, curE] = intervals[0];
    for (let i = 1; i < intervals.length; i++) {
      const [s, e] = intervals[i];
      if (s <= curE) {
        // overlap: extend current
        curE = Math.max(curE, e);
      } else {
        merged.push([curS, curE]);
        [curS, curE] = [s, e];
      }
    }
    merged.push([curS, curE]);

    // Sum merged durations
    const total = merged.reduce((acc, [s, e]) => acc + (e - s), 0);
    return Math.max(0, total);
  }

  /**
   * Get idle time as the difference between total workout window and active time.
   *
   * @method getIdleTimeMs
   * @returns {number} Idle time in milliseconds (clamped to [0, total])
   */
  getIdleTimeMs() {
    const total = this.getDuration();
    const active = this.getActiveTimeMs();
    const idle = total - active;
    // Clamp to [0, total] to avoid negatives due to overlapping exercises
    return Math.max(0, Math.min(total, idle));
  }

  /**
   * Get formatted active time.
   *
   * @method getActiveTimeFormatted
   * @returns {string}
   */
  getActiveTimeFormatted() {
    return this.formatDurationMs(this.getActiveTimeMs());
  }

  /**
   * Get formatted idle time.
   *
   * @method getIdleTimeFormatted
   * @returns {string}
   */
  getIdleTimeFormatted() {
    return this.formatDurationMs(this.getIdleTimeMs());
  }

  /**
   * Add an exercise to this workout and recalculate properties.
   * 
   * @method addExercise
   * @param {Exercise} exercise - The exercise to add
   * @returns {void}
   */
  addExercise(exercise) {
    this.exercises.push(exercise);
    this.recalculateProperties();
  }

  /**
   * Remove an exercise from this workout and recalculate properties.
   * 
   * @method removeExercise
   * @param {string} exerciseId - The unique ID of the exercise to remove
   * @returns {void}
   */
  removeExercise(exerciseId) {
    this.exercises = this.exercises.filter(ex => ex.uid !== exerciseId);
    this.recalculateProperties();
  }

  /**
   * Update an exercise in this workout and recalculate properties.
   * 
   * @method updateExercise
   * @param {string} exerciseId - The unique ID of the exercise to update
   * @param {Object} updatedData - The new exercise data
   * @returns {void}
   */
  updateExercise(exerciseId, updatedData) {
    const exerciseIndex = this.exercises.findIndex(ex => ex.uid === exerciseId);
    if (exerciseIndex !== -1) {
      this.exercises[exerciseIndex] = { ...this.exercises[exerciseIndex], ...updatedData };
      this.recalculateProperties();
    }
  }

  /**
   * Validate the workout object.
   * 
   * @method validate
   * @returns {boolean} True if the workout has required fields
   */
  validate() {
    return this.uid && this.userId;
  }

}