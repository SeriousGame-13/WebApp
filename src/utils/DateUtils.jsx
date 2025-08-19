import { Timestamp } from 'firebase/firestore';

export function localDateTimeStringToTimestamp(value) {
    const [date, time] = value.split('T');
    const [year, month, day] = date.split('-').map(Number);
    const [hour, minute] = time.split(':').map(Number);
    const localDate = new Date(year, month - 1, day, hour, minute); // interpreted in local timezone
    return Timestamp.fromDate(localDate);
}

export function localISODateTime(date) {
    date = date.toDate();
    const pad = (n) => n.toString().padStart(2, '0');
    const y = date.getFullYear();
    const m = pad(date.getMonth() + 1);
    const d = pad(date.getDate());
    const h = pad(date.getHours());
    const min = pad(date.getMinutes());
    return `${y}-${m}-${d}T${h}:${min}`;
};
