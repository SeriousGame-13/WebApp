import { Timestamp } from '../services/firebase/FirebaseHelper.jsx';

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
    const h = pad(date.getHours());
    const min = pad(date.getMinutes());
    return `${h}:${min}`;
};

export function toDateTime(date) {
    // Handle Firebase Timestamp objects by converting them to Date objects
    if (date?.toDate && typeof date.toDate === 'function') {
        date = date.toDate();
    } else if (!(date instanceof Date)) {
        // If it's not a Timestamp or a Date object, try to parse it
        const parsedDate = new Date(date);
        if (isNaN(parsedDate.getTime())) {
            console.error('Invalid date value for toDateTime:', date);
            // Return a default or empty value to avoid crashing
            return ''; 
        }
        date = parsedDate;
    }

    const pad = (n) => n.toString().padStart(2, '0');
    const y = date.getFullYear();
    const m = pad(date.getMonth() + 1);
    const d = pad(date.getDate());
    const h = pad(date.getHours());
    const min = pad(date.getMinutes());
    return `${y}-${m}-${d}T${h}:${min}`;
};

export function toDate(date) {
    try {
      // Handle Firebase Timestamp objects
      if (date?.toDate && typeof date.toDate === 'function') {
        return date.toDate();
      }
      
      // Handle serverTimestamp() placeholder (returns current time)
      if (date && typeof date === 'object' && !date.toDate) {
        return new Date();
      }
      
      // Handle regular Date objects or date strings
      if (date instanceof Date) {
        return date;
      }
      
      // Handle date strings
      if (typeof date === 'string' || typeof date === 'number') {
        const nDate = new Date(date);
        if (!isNaN(nDate.getTime())) {
          return nDate;
        }
      }
      
      // Fallback to current time if createdAt is invalid or missing
      return new Date();
    } catch (error) {
      console.error('Error formatting createdAt:', error, date);
      return null;
    }
}

export function toGermanDateFormat(date) {
    date = toDate(date);
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric'});
}


export function toGermanDateLongFormat(date) {
    date = toDate(date);
    return date.toLocaleTimeString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
