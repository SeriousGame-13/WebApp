/**
 * @fileoverview Unit tests for DateUtils utility functions
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import {
    localDateTimeStringToTimestamp,
    localTime,
    toDateTime,
    toDate,
    toGermanDateFormat,
    toGermanDateLongFormat
} from '../../utils/DateUtils.jsx';
import { Timestamp } from '../../services/firebase/FirebaseHelper.jsx';

// Mock Firebase Timestamp
vi.mock('../../services/firebase/FirebaseHelper.jsx', () => ({
    Timestamp: {
        fromDate: vi.fn((date) => ({
            seconds: Math.floor(date.getTime() / 1000),
            nanoseconds: 0,
            toDate: () => date
        }))
    }
}));

describe('DateUtils', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Mock current date for consistent testing
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2025-08-20T10:30:00.000Z'));
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks();
    });

    describe('localDateTimeStringToTimestamp', () => {
        test('should convert time string to timestamp with today\'s date', () => {
            const result = localDateTimeStringToTimestamp('14:30');
            
            expect(Timestamp.fromDate).toHaveBeenCalled();
            const calledDate = vi.mocked(Timestamp.fromDate).mock.calls[0][0];
            expect(calledDate.getHours()).toBe(14);
            expect(calledDate.getMinutes()).toBe(30);
            expect(calledDate.getSeconds()).toBe(0);
        });

        test('should convert datetime-local string to timestamp', () => {
            const result = localDateTimeStringToTimestamp('2025-08-20T14:30');
            
            expect(Timestamp.fromDate).toHaveBeenCalled();
            const calledDate = vi.mocked(Timestamp.fromDate).mock.calls[0][0];
            expect(calledDate.getFullYear()).toBe(2025);
            expect(calledDate.getMonth()).toBe(7); // 0-based month
            expect(calledDate.getDate()).toBe(20);
            expect(calledDate.getHours()).toBe(14);
            expect(calledDate.getMinutes()).toBe(30);
        });

        test('should handle edge cases for time', () => {
            localDateTimeStringToTimestamp('00:00');
            const calledDate = vi.mocked(Timestamp.fromDate).mock.calls[0][0];
            expect(calledDate.getHours()).toBe(0);
            expect(calledDate.getMinutes()).toBe(0);

            vi.mocked(Timestamp.fromDate).mockClear();
            
            localDateTimeStringToTimestamp('23:59');
            const calledDate2 = vi.mocked(Timestamp.fromDate).mock.calls[0][0];
            expect(calledDate2.getHours()).toBe(23);
            expect(calledDate2.getMinutes()).toBe(59);
        });

        test('should return null for invalid format', () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            
            const result = localDateTimeStringToTimestamp('invalid');
            expect(result).toBeNull();
            expect(consoleSpy).toHaveBeenCalledWith('Ungültiges Format für localDateTimeStringToTimestamp:', 'invalid');
            
            consoleSpy.mockRestore();
        });

        test('should return null for empty value', () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            
            const result = localDateTimeStringToTimestamp('');
            expect(result).toBeNull();
            
            consoleSpy.mockRestore();
        });

        test('should return null for null value', () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            
            const result = localDateTimeStringToTimestamp(null);
            expect(result).toBeNull();
            
            consoleSpy.mockRestore();
        });
    });

    describe('localTime', () => {
        test('should format timestamp to local time string', () => {
            const mockTimestamp = {
                toDate: () => new Date('2025-08-20T14:30:45')
            };
            
            const result = localTime(mockTimestamp);
            expect(result).toBe('14:30');
        });

        test('should pad single digits with zero', () => {
            const mockTimestamp = {
                toDate: () => new Date('2025-08-20T09:05:45')
            };
            
            const result = localTime(mockTimestamp);
            expect(result).toBe('09:05');
        });

        test('should handle midnight', () => {
            const mockTimestamp = {
                toDate: () => new Date('2025-08-20T00:00:00')
            };
            
            const result = localTime(mockTimestamp);
            expect(result).toBe('00:00');
        });
    });

    describe('toDateTime', () => {
        test('should format timestamp to datetime-local string', () => {
            const mockTimestamp = {
                toDate: () => new Date('2025-08-20T14:30:45')
            };
            
            const result = toDateTime(mockTimestamp);
            expect(result).toBe('2025-08-20T14:30');
        });

        test('should pad single digits with zero', () => {
            const mockTimestamp = {
                toDate: () => new Date('2025-01-05T09:05:45')
            };
            
            const result = toDateTime(mockTimestamp);
            expect(result).toBe('2025-01-05T09:05');
        });

        test('should handle different months and days', () => {
            const mockTimestamp = {
                toDate: () => new Date('2025-12-31T23:59:59')
            };
            
            const result = toDateTime(mockTimestamp);
            expect(result).toBe('2025-12-31T23:59');
        });
    });

    describe('toDate', () => {
        test('should convert Firebase timestamp to Date', () => {
            const mockTimestamp = {
                toDate: vi.fn(() => new Date('2025-08-20T14:30:00'))
            };
            
            const result = toDate(mockTimestamp);
            expect(result).toBeInstanceOf(Date);
            expect(mockTimestamp.toDate).toHaveBeenCalled();
        });

        test('should handle serverTimestamp placeholder', () => {
            const mockServerTimestamp = { _methodName: 'serverTimestamp' };
            
            const result = toDate(mockServerTimestamp);
            expect(result).toBeInstanceOf(Date);
        });

        test('should handle regular Date objects', () => {
            const date = new Date('2025-08-20T14:30:00');
            const result = toDate(date);
            expect(result).toBeInstanceOf(Date);
        });

        test('should handle date strings', () => {
            const result = toDate('2025-08-20T14:30:00');
            expect(result).toBeInstanceOf(Date);
            expect(result.getFullYear()).toBe(2025);
        });

        test('should handle timestamp numbers', () => {
            const timestamp = new Date('2025-08-20T14:30:00').getTime();
            const result = toDate(timestamp);
            expect(result).toBeInstanceOf(Date);
            expect(result.getFullYear()).toBe(2025);
        });

        test('should return current date for invalid inputs', () => {
            const result = toDate('invalid-date');
            expect(result).toBeInstanceOf(Date);
        });

        test('should return current date for null/undefined', () => {
            const result1 = toDate(null);
            const result2 = toDate(undefined);
            expect(result1).toBeInstanceOf(Date);
            expect(result2).toBeInstanceOf(Date);
        });

        test('should handle errors gracefully', () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            const mockBadTimestamp = {
                toDate: () => { throw new Error('Conversion error'); }
            };
            
            const result = toDate(mockBadTimestamp);
            expect(result).toBeNull();
            expect(consoleSpy).toHaveBeenCalled();
            
            consoleSpy.mockRestore();
        });
    });

    describe('toGermanDateFormat', () => {
        test('should format date to German format', () => {
            const result = toGermanDateFormat({ toDate: () => new Date('2025-08-20T14:30:00') });
            expect(result).toBe('20.08.2025');
        });

        test('should handle timestamp input', () => {
            const mockTimestamp = {
                toDate: () => new Date('2025-01-05T14:30:00')
            };
            const result = toGermanDateFormat(mockTimestamp);
            expect(result).toBe('05.01.2025');
        });

        test('should pad single digits', () => {
            const result = toGermanDateFormat({ toDate: () => new Date('2025-01-05T14:30:00') });
            expect(result).toBe('05.01.2025');
        });

        test('should handle different years', () => {
            const result = toGermanDateFormat({ toDate: () => new Date('2030-12-31T14:30:00') });
            expect(result).toBe('31.12.2030');
        });
    });

    describe('toGermanDateLongFormat', () => {
        test('should format date to German long format', () => {
            const result = toGermanDateLongFormat({ toDate: () => new Date('2025-08-20T14:30:45') });
            expect(result).toBe('20.08.2025, 14:30:45');
        });

        test('should handle timestamp input', () => {
            const mockTimestamp = {
                toDate: () => new Date('2025-01-05T09:05:05')
            };
            const result = toGermanDateLongFormat(mockTimestamp);
            expect(result).toBe('05.01.2025, 09:05:05');
        });

        test('should handle midnight', () => {
            const result = toGermanDateLongFormat({ toDate: () => new Date('2025-08-20T00:00:00') });
            expect(result).toBe('20.08.2025, 00:00:00');
        });

        test('should handle end of day', () => {
            const result = toGermanDateLongFormat({ toDate: () => new Date('2025-08-20T23:59:59') });
            expect(result).toBe('20.08.2025, 23:59:59');
        });
    });

    describe('Integration Tests', () => {
        test('should work together - convert time string to timestamp and back to formatted string', () => {
            const timeString = '14:30';
            const timestamp = localDateTimeStringToTimestamp(timeString);
            
            if (timestamp) {
                const formattedTime = localTime(timestamp);
                expect(formattedTime).toBe('14:30');
            }
        });

        test('should work together - convert datetime string to timestamp and back', () => {
            const datetimeString = '2025-08-20T14:30';
            const timestamp = localDateTimeStringToTimestamp(datetimeString);
            
            if (timestamp) {
                const formattedDateTime = toDateTime(timestamp);
                expect(formattedDateTime).toBe('2025-08-20T14:30');
            }
        });

        test('should handle full workflow with German formatting', () => {
            const datetimeString = '2025-08-20T14:30';
            const timestamp = localDateTimeStringToTimestamp(datetimeString);
            
            if (timestamp) {
                const germanDate = toGermanDateFormat(timestamp);
                const germanDateTime = toGermanDateLongFormat(timestamp);
                
                expect(germanDate).toBe('20.08.2025');
                expect(germanDateTime).toBe('20.08.2025, 14:30:00');
            }
        });
    });
});
