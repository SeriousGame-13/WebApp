import { Workout, Station } from '../services/interfaces/workout.jsx';
import {
  Timestamp
} from 'firebase/firestore';

import initialData from './dummydata.json';
import UserManagement from '../services/firebase/UserManagementSystem';

import { Badge, UserBadge } from '../services/interfaces/badge.jsx';
import BadgeManager from '../services/firebase/BadgeManagement.jsx';

const DEFAULT_PASSWORD = '1q2w3e4r!';

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomTimeStampIn2025() {
  const year = 2025;
  const month = getRandomInt(0, 6);
  const day = getRandomInt(1, 31);
  const hour = getRandomInt(8, 22);
  const minute = getRandomInt(0, 59);

  return Timestamp.fromDate(new Date(year, month, day, hour, minute));
}

function getDummyStationEntry() {
  const startTime = getRandomTimeStampIn2025();
  const durationMinutes = getRandomInt(10, 90);
  var time = startTime.toDate()
  time.setTime(time.getTime() + durationMinutes * 60000);
  const endTime = Timestamp.fromDate(new Date(time));
  const station = new Station();
  station.startTime = startTime;
  station.endTime = endTime;
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


export function getDummyBadges(numberOf = 10) {
  var badges = [];
  for (let i = 0; i < numberOf; i++) {
    let badge = new Badge();
    badge.rarity = getRandomInt(1, 5);
    badge.points = badge.getRarityWeight() * getRandomInt(1, 500);
    badges.push(badge);
  }

  return badges;
}




export function getDummyUsers() {
  return initialData.users.map(userData => {
    return {
      email: userData.email,
      displayName: userData.displayName,
      createdAt: userData.createdAt,
      isActive: userData.isActive,
      level: userData.level,
      points: userData.points,
      longestStreak: userData.longestStreak,
      isAdmin: userData.isAdmin,
      profileImage: userData.profileImage
    };
  });
}

/**
 * Einzelnen Dummy-Benutzer in Firebase erstellen
 */
async function createSingleDummyUser(userData, index) {
  try {
    console.log(`${index + 1}. Benutzer wird erstellt: ${userData.displayName} (${userData.email})`);

    // 1. Registrierung
    const userLogin = await UserManagement.signupUser(
      userData.displayName,
      userData.email,
      DEFAULT_PASSWORD
    );



    console.log(`Registrierung erfolgreich - UID: ${userLogin.uid}`);

    // 2. Benutzerdaten laden
    // const currentUser = await UserManagement.getUser(userLogin.uid);
    console.log(`Benutzerdaten geladen`);

    // 3. Mit JSON-Daten aktualisieren (createdAt und Email ausgenommen)
    const updateData = {
      level: userData.level,
      points: userData.points,
      longestStreak: userData.longestStreak,
      isAdmin: userData.isAdmin,
      isActive: userData.isActive
    };

    var user = await UserManagement.updateUser(userLogin.uid, updateData);
    console.log(`Daten aktualisiert`);

    const badges = getDummyBadges();
    badges.map(badge => {
      BadgeManager.createBadge(badge);
      BadgeManager.awardBadge(user.uid, badge.uid)
    }
    );

    // 4. Abmelden
    await UserManagement.logoutUser();
    console.log(`Abgemeldet`);

    return {
      success: true,
      uid: userLogin.uid,
      email: userData.email,
      displayName: userData.displayName
    };

  } catch (error) {
    console.error(`Fehler: ${error.message}`);

    // Auch bei Fehler versuchen abzumelden
    try {
      await UserManagement.logoutUser();
    } catch (logoutError) {
      // Abmelde-Fehler ignorieren
    }

    return {
      success: false,
      email: userData.email,
      error: error.message
    };
  }
}

/**
 * Alle Dummy-Benutzer in Firebase erstellen
 */
export async function createAllDummyUsers() {
  const dummyUsers = getDummyUsers();
  const results = [];

  console.log(`Erstelle ${dummyUsers.length} Dummy-Benutzer...`);
  console.log('Passwort:', DEFAULT_PASSWORD);
  console.log('=====================================');

  for (let i = 0; i < dummyUsers.length; i++) {
    const result = await createSingleDummyUser(dummyUsers[i], i);
    results.push(result);

    // Kurze Pause zwischen Benutzererstellungen (Firebase-Belastung vermeiden)
    if (i < dummyUsers.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log('=====================================');
  console.log('Dummy-Benutzer Erstellung abgeschlossen!');

  // Ergebnis-Zusammenfassung
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`Erfolgreich: ${successful.length} Benutzer`);
  console.log(`Fehlgeschlagen: ${failed.length} Benutzer`);

  if (failed.length > 0) {
    console.log('Fehlgeschlagene Benutzer:');
    failed.forEach(f => console.log(`  - ${f.email}: ${f.error}`));
  }

  return {
    total: dummyUsers.length,
    successful: successful.length,
    failed: failed.length,
    successfulUsers: successful,
    failedUsers: failed
  };
}


/**
export function getDummyExerciseDefinitions() {
  return initialData.exercise_definitions.map(exerciseDefinition => {
    return {
      name: exerciseDefinition.name,
      category: exerciseDefinition.category,
      description: exerciseDefinition.description,
      instructions: exerciseDefinition.instructions,
      muscleGroups: exerciseDefinition.muscleGroups,
      unit: exerciseDefinition.unit,
      isActive: exerciseDefinition.isActive,
      createdAt: getRandomDateTimeIn2025(),
      pointsFormula: exerciseDefinition.pointsFormula
    };
  });
}

 * Creates a new Document with given data
 * Exp. newData
 * const newUser = new User({
        uid: userLogin.uid,
        email: email,
        displayName: nickname,
        isAdmin: false,
    });
const createDocument = async (documentName, docId, newData) => {
await FirebaseManager.createDocument(documentName, docId, newData, true);
};


async function createSingleDummyExerciseDefinition(exerciseData, index) {
  try {

    console.log('Exercise data:', exerciseData);
    console.log('Current user:', FireAuthManager.getCurrentUser());

    console.log(`${index + 1}. Exercise Definition wird erstellt: ${exerciseData.name}`);
    const newDummyExerciseDefinition = {
      name: exerciseData.name,
      category: exerciseData.category,
      description: exerciseData.description,
      instructions: exerciseData.instructions,
      muscleGroups: exerciseData.muscleGroups,
      unit: exerciseData.unit,
      isActive: exerciseData.isActive,
      createdAt: exerciseData.createdAt,
      pointsFormula: exerciseData.pointsFormula
    }

    console.log('About to create with data:', newDummyExerciseDefinition); 

    const docRef = await FirebaseManager.createDocumentWithAutoId('exercise_definitions', newDummyExerciseDefinition);
    
    console.log('docRef result:', docRef);
    console.log(`Exercise Definition erstellt`);
    
    return {
      success: true,
      id: docRef.id,
      name: exerciseData.name
    };

  } catch (error) {
    console.error(`Fehler: ${error.message}`);
    console.error('Full error:', error);
    
    return {
      success: false,
      name: exerciseData.name,
      error: error.message
    };
  }
}

export async function createAllExerciseDefinitions() {
  const dummyExerciseDefinitions = getDummyExerciseDefinitions();
  const results = [];
  
  console.log(`Erstelle ${dummyExerciseDefinitions.length} Dummy-Exercise-Definitions...`);
  console.log('=====================================');
  
  for (let i = 0; i < dummyExerciseDefinitions.length; i++) {
    const result = await createSingleDummyExerciseDefinition(dummyExerciseDefinitions[i], i);
    results.push(result);
    
    // Kurze Pause zwischen Benutzererstellungen (Firebase-Belastung vermeiden)
    if (i < dummyExerciseDefinitions.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.log('=====================================');
  console.log('Dummy-Exercise-Definition Erstellung abgeschlossen!');
  
  // Ergebnis-Zusammenfassung
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`Erfolgreich: ${successful.length} Exercise-Definition`);
  console.log(`Fehlgeschlagen: ${failed.length} Exercise-Definition`);
  
  if (failed.length > 0) {
    console.log('Fehlgeschlagene Exercise-Definition:');
  }
  
  return {
    total: dummyExerciseDefinitions.length,
    successful: successful.length,
    failed: failed.length,
    successfulExerciseGeneration: successful,
    failedExerciseGeneration: failed
  };
}



async function createSingleDummyChallenge(challengeData, index, creatorId) {
  try {
    console.log(`${index + 1}. Challenge wird erstellt: ${challengeData.name}`);
    
    let targetExerciseId = null;
    let targetExerciseName = null;
    
    if (challengeData.targetExerciseIndex === 0) {
      const cardioBoxer = await FirebaseManager.findDocumentByField(
        'exercise_definitions', 
        'name', 
        'Cardio Boxer'
      );
      
      if (cardioBoxer) {
        targetExerciseId = cardioBoxer.id;
        targetExerciseName = cardioBoxer.name;
        console.log(`Cardio Boxer gefunden: ID = ${targetExerciseId}`);
      } else {
        console.warn('Cardio Boxer Exercise Definition nicht gefunden');
      }
    }

    const newChallenge = new Challenge({
      name: challengeData.name,
      description: challengeData.description,
      startDate: new Date(challengeData.startDate).getTime(),
      endDate: new Date(challengeData.endDate).getTime(),
      creatorId: creatorId,
      rewardPoints: challengeData.rewardPoints,
      challengeType: challengeData.challengeType,
      targetExerciseId: targetExerciseId,
      targetValue: challengeData.targetValue
    });

    const challengeDataPlain = newChallenge.toJSON();
    
    const cleanedData = Object.fromEntries(
      Object.entries(challengeDataPlain).map(([key, value]) => [
        key, 
        value === undefined ? null : value
      ])
    );

    const docRef = await FirebaseManager.createDocumentWithAutoId('challenges', cleanedData);
    
    if (!docRef) {
      throw new Error('Challenge creation failed');
    }
    
    console.log(`Challenge erstellt mit ID: ${docRef.id}${targetExerciseName ? `, Target: ${targetExerciseName}` : ''}`);
    
    return {
      success: true,
      id: docRef.id,
      name: challengeData.name
    };
    
  } catch (error) {
    console.error(`Fehler: ${error.message}`);
    
    return {
      success: false,
      name: challengeData.name,
      error: error.message
    };
  }
}

export function getDummyChallenges() {
  return initialData.challenges.map(challengeData => {
    return {
      name: challengeData.name,
      description: challengeData.description,
      startDate: challengeData.startDate,
      endDate: challengeData.endDate,
      creatorIndex: challengeData.creatorIndex,
      rewardPoints: challengeData.rewardPoints,
      challengeType: challengeData.challengeType,
      scope: challengeData.scope,
      targetExerciseId: challengeData.targetExerciseId,
      targetExerciseIndex: challengeData.targetExerciseIndex,
      targetValue: challengeData.targetValue,
      unit: challengeData.unit,
      condition: challengeData.condition,
      createdAt: challengeData.createdAt
    };
  });
}

export async function createAllChallenges() {
  const currentUser = FireAuthManager.getCurrentUser();

  const creatorId = currentUser.uid;
  console.log(`Challenge werden erstellt von Benutzer: ${creatorId}`);
  const dummyChallenges = getDummyChallenges();
  const results = [];
  
  console.log(`Erstelle ${dummyChallenges.length} Dummy-Challenges...`);
  console.log('=====================================');
  
  if (!currentUser) {
    console.error('Kein Benutzer eingeloggt - Challenge-Erstellung nicht möglich');
    return {
      total: 0,
      successful: 0,
      failed: 0,
      error: 'Nicht eingeloggt'
    };
  }
  
  for (let i = 0; i < dummyChallenges.length; i++) {
    const result = await createSingleDummyChallenge(dummyChallenges[i], i, creatorId);
    results.push(result);
    
    if (i < dummyChallenges.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.log('=====================================');
  console.log('Dummy-Challenge Erstellung abgeschlossen!');
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`Erfolgreich: ${successful.length} Challenges`);
  console.log(`Fehlgeschlagen: ${failed.length} Challenges`);
  
  if (failed.length > 0) {
    console.log('Fehlgeschlagene Challenges:');
    failed.forEach(f => console.log(`  - ${f.name}: ${f.error}`));
  }
  
  return {
    total: dummyChallenges.length,
    successful: successful.length,
    failed: failed.length,
    successfulChallenges: successful,
    failedChallenges: failed
  };
}
*/