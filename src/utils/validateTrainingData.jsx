// frontendValidator.js

export function isValidUserID(id) {
  return /^[a-z]{6}$/.test(id);
}

export function isValidISODateString(dateStr) {
  const d = new Date(dateStr);
  return !isNaN(d.getTime()) && dateStr === d.toISOString();
}

export function validateTrainingSession(session) {
  if (typeof session !== "object" || session === null) {
    return "Eintrag ist kein Objekt";
  }

  if (!("userID" in session) || !isValidUserID(session.userID)) {
    return "Ungültige oder fehlende userID (muss 6 Kleinbuchstaben sein)";
  }

  if (!("start" in session) || !isValidISODateString(session.start)) {
    return "Ungültiges oder fehlendes start-Datum (ISO-Format)";
  }

  if (!("end" in session) || !isValidISODateString(session.end)) {
    return "Ungültiges oder fehlendes end-Datum (ISO-Format)";
  }

  const startDate = new Date(session.start);
  const endDate = new Date(session.end);

  if (endDate <= startDate) {
    return "end-Datum liegt nicht nach start-Datum";
  }

  if (!("duration" in session) || typeof session.duration !== "number" || session.duration <= 0) {
    return "Ungültige oder fehlende duration (positive Zahl)";
  }

  // Dauer check: Dauer in Minuten sollte ungefähr (±1 min Toleranz) der Differenz zwischen start und end sein
  const diffMinutes = (endDate - startDate) / 60000;
  if (Math.abs(diffMinutes - session.duration) > 1) {
    return `duration stimmt nicht mit Differenz von start und end überein (Differenz=${diffMinutes.toFixed(2)} Minuten)`;
  }

  if (!("points" in session) || typeof session.points !== "number" || session.points < 0) {
    return "Ungültige oder fehlende points (nicht negative Zahl)";
  }

  if (!("heartRateAvg" in session) || typeof session.heartRateAvg !== "number" || session.heartRateAvg < 40 || session.heartRateAvg > 220) {
    return "Ungültige oder fehlende heartRateAvg (realistisch zwischen 40 und 220)";
  }

  if (!("calories" in session) || typeof session.calories !== "number" || session.calories < 0) {
    return "Ungültige oder fehlende calories (nicht negative Zahl)";
  }

  return null; // Keine Fehler
}

export function validateTrainingDataArray(trainingSessions) {
  if (!Array.isArray(trainingSessions)) {
    return ["Die Daten sind kein Array."];
  }

  const errors = [];

  trainingSessions.forEach((session, index) => {
    const error = validateTrainingSession(session);
    if (error) {
      errors.push(`Fehler in Eintrag #${index} (userID=${session.userID || "undefined"}): ${error}`);
    }
  });

  return errors; // Leeres Array = keine Fehler
}
