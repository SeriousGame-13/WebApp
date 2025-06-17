import { Workout, Station } from '../services/interfaces/workout.jsx';


function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomDateTimeIn2025() {
  const year = 2025;
  const month = getRandomInt(0, 11);
  const day = getRandomInt(1, 31);
  const hour = getRandomInt(8, 22);
  const minute = getRandomInt(0, 59);

  return new Date(year, month, day, hour, minute);
}

function getDummyStationEntry() {
  const startTime = getRandomDateTimeIn2025();
  const durationMinutes = getRandomInt(10, 90);
  const endTime = new Date(startTime.getTime() + durationMinutes * 60000);
  const station = new Station();
  station.startTime = startTime.toISOString();
  station.endTime = endTime.toISOString();
  station.points = getRandomInt(500, 2000);
  station.heartRateAvg = getRandomInt(110, 220);
  station.calories = getRandomInt(200, 1200);
  return station;
}

export function getDummyWorkout(uid, numberOfSessions = 20) {
  const workout = new Workout();
  workout.userId = uid;
  for (let i = 0; i < numberOfSessions; i++) {
    workout.addStation(getDummyStationEntry());
  }
  return workout;
}
