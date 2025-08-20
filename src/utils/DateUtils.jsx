import { Timestamp } from 'firebase/firestore';

/**
 * Wandelt einen String im Format "HH:mm" oder "YYYY-MM-DDTHH:mm"
 * in einen Timestamp um. Bei reiner Zeitangabe wird das heutige Datum verwendet.
 * @param {string} value Der Zeit- oder Datums-Zeit-String.
 * @returns {Timestamp} Ein Timestamp-Objekt.
 */
export function localDateTimeStringToTimestamp(value) {
    let dateToConvert;

    // Prüfen, ob es sich nur um eine Uhrzeit handelt (kein 'T' vorhanden)
    if (value && value.includes(':') && !value.includes('T')) {
        // Nur Uhrzeit, z.B. "14:30"
        const [hour, minute] = value.split(':').map(Number);
        
        const today = new Date(); // Heutiges Datum holen
        today.setHours(hour, minute, 0, 0); // Uhrzeit auf dem heutigen Datum setzen
        dateToConvert = today;

    } else if (value && value.includes('T')) {
        // Vollständiger datetime-local String, z.B. "2025-08-20T14:30"
        const [date, time] = value.split('T');
        const [year, month, day] = date.split('-').map(Number);
        const [hour, minute] = time.split(':').map(Number);
        
        // Monat ist 0-basiert, daher month - 1
        dateToConvert = new Date(year, month - 1, day, hour, minute);
        
    } else {
        // Falls das Format ungültig ist oder der Wert leer ist, null zurückgeben
        console.error("Ungültiges Format für localDateTimeStringToTimestamp:", value);
        return null;
    }

    return Timestamp.fromDate(dateToConvert);
}

export function localTime(date) {
    date = date.toDate();
    const pad = (n) => n.toString().padStart(2, '0');
    const y = date.getFullYear();
    const m = pad(date.getMonth() + 1);
    const d = pad(date.getDate());
    const h = pad(date.getHours());
    const min = pad(date.getMinutes());
    return `${h}:${min}`;
};
