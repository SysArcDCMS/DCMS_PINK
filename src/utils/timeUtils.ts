/**
 * Utility functions for time formatting and conversion
 */

/**
 * Converts military time (24-hour format) to 12-hour AM/PM format
 * @param militaryTime - Time in 24-hour format (e.g., "14:30", "09:00")
 * @returns Time in 12-hour AM/PM format (e.g., "2:30 PM", "9:00 AM")
 */
export function convertMilitaryToAMPM(militaryTime: string): string {
  if (!militaryTime || typeof militaryTime !== 'string') {
    return militaryTime || '';
  }

  // Handle time formats like "14:30" or "9:00"
  const timeParts = militaryTime.split(':');
  if (timeParts.length !== 2) {
    return militaryTime; // Return original if format is invalid
  }

  let hours = parseInt(timeParts[0], 10);
  const minutes = timeParts[1];

  if (isNaN(hours) || hours < 0 || hours > 23) {
    return militaryTime; // Return original if hours are invalid
  }

  const period = hours >= 12 ? 'PM' : 'AM';
  
  // Convert to 12-hour format
  if (hours === 0) {
    hours = 12; // 00:xx becomes 12:xx AM
  } else if (hours > 12) {
    hours = hours - 12; // 13:xx becomes 1:xx PM
  }

  return `${hours}:${minutes} ${period}`;
}

/**
 * Converts a time range string from military time to AM/PM format
 * @param timeRange - Time range in format "14:30-15:45" or "09:00-10:15"
 * @returns Time range in AM/PM format "2:30 PM - 3:45 PM" or "9:00 AM - 10:15 AM"
 */
export function convertTimeRangeToAMPM(timeRange: string): string {
  if (!timeRange || typeof timeRange !== 'string') {
    return timeRange || '';
  }

  // Handle formats like "14:30-15:45" or "09:00-10:15"
  const rangeParts = timeRange.split('-');
  if (rangeParts.length !== 2) {
    return timeRange; // Return original if format is invalid
  }

  const startTime = convertMilitaryToAMPM(rangeParts[0].trim());
  const endTime = convertMilitaryToAMPM(rangeParts[1].trim());

  return `${startTime} - ${endTime}`;
}

/**
 * Converts AM/PM time back to military time (24-hour format)
 * @param ampmTime - Time in 12-hour AM/PM format (e.g., "2:30 PM", "9:00 AM")
 * @returns Time in 24-hour format (e.g., "14:30", "09:00")
 */
export function convertAMPMToMilitary(ampmTime: string): string {
  if (!ampmTime || typeof ampmTime !== 'string') {
    return ampmTime || '';
  }

  const timeParts = ampmTime.trim().split(' ');
  if (timeParts.length !== 2) {
    return ampmTime; // Return original if format is invalid
  }

  const [time, period] = timeParts;
  const [hoursStr, minutes] = time.split(':');
  
  if (!hoursStr || !minutes || !period) {
    return ampmTime; // Return original if format is invalid
  }

  let hours = parseInt(hoursStr, 10);
  const isPM = period.toUpperCase() === 'PM';

  if (isNaN(hours) || hours < 1 || hours > 12) {
    return ampmTime; // Return original if hours are invalid
  }

  // Convert to 24-hour format
  if (isPM && hours !== 12) {
    hours += 12; // 1:xx PM becomes 13:xx
  } else if (!isPM && hours === 12) {
    hours = 0; // 12:xx AM becomes 00:xx
  }

  // Ensure hours are zero-padded
  const hoursStr24 = hours.toString().padStart(2, '0');

  return `${hoursStr24}:${minutes}`;
}

/**
 * Formats a time slot for display (converts to AM/PM if in military format)
 * @param timeSlot - Time slot in any format
 * @returns Formatted time slot for display
 */
export function formatTimeSlotForDisplay(timeSlot: string): string {
  if (!timeSlot) return '';

  // Check if it's a time range (contains '-')
  if (timeSlot.includes('-')) {
    return convertTimeRangeToAMPM(timeSlot);
  }

  // Check if it's already in AM/PM format
  if (timeSlot.toUpperCase().includes('AM') || timeSlot.toUpperCase().includes('PM')) {
    return timeSlot;
  }

  // Assume it's in military format and convert
  return convertMilitaryToAMPM(timeSlot);
}

/**
 * Generate available time slots in AM/PM format
 * @returns Array of time slots in AM/PM format
 */
export function getTimeSlots(): string[] {
  const militarySlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
  ];

  return militarySlots.map(slot => convertMilitaryToAMPM(slot));
}

/**
 * Generate time slots with both display format and value
 * @returns Array of objects with label (AM/PM) and value (military time)
 */
export function getTimeSlotOptions(): Array<{ label: string; value: string }> {
  const militarySlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
  ];

  return militarySlots.map(slot => ({
    label: convertMilitaryToAMPM(slot),
    value: slot
  }));
}

/**
 * Available time slots in military format
 */
export const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
];

/**
 * Available time slots in AM/PM format for display
 */
export const TIME_SLOTS_DISPLAY = TIME_SLOTS.map(slot => convertMilitaryToAMPM(slot));