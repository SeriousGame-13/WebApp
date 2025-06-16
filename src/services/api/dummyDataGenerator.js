// src/services/api/dummyDataGenerator.js

import {Workout, Station} from '../interfaces/workout.jsx';


function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomUserID(length = 6) {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(getRandomInt(0, chars.length - 1));
  }
  return result;
}

function getRandomDateTimeIn2025() {
  const year = 2025;
  const month = getRandomInt(0, 11);
  const day = getRandomInt(1, 28);
  const hour = getRandomInt(8, 19);
  const minute = getRandomInt(0, 59);

  return new Date(year, month, day, hour, minute);
}

function generateTrainingSession() {
  const startTime = getRandomDateTimeIn2025();
  const durationMinutes = getRandomInt(30, 90);
  const endTime = new Date(startTime.getTime() + durationMinutes * 60000);

  return {
    workoutId: '',
    start: startTime.toISOString(),
    end: endTime.toISOString(),
    points: getRandomInt(500, 2000),
    heartRateAvg: getRandomInt(110, 160),
    calories: getRandomInt(300, 800),
  };
}

export function generateDummyData(uid, numberOfSessions = 20) {
  const workout = new Workout();
  workout.userId = uid;
  for (let i = 0; i < numberOfSessions; i++) {
    workout.addStation(generateTrainingSession());
  }
  return workout;
}
