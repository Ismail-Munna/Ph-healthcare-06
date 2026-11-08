/**
 * Time and Schedule Utilities for Healthcare System
 * Handles 20-minute slot calculations, date/time formatting,
 * schedule validation, and refund eligibility computations.
 */

import { ScheduleSlot } from '../types';

/**
 * Format date as YYYY-MM-DD
 */
export function formatDate(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format time as HH:mm (24-hour)
 */
export function formatTime24(d: Date): string {
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Convert HH:mm to minutes from midnight
 */
export function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Convert minutes from midnight to HH:mm string
 */
export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Format 24-hour time "15:20" to human friendly "3:20 PM"
 */
export function format12Hour(timeStr: string): string {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
}

/**
 * Calculate duration in hours between two HH:mm times on the same day
 */
export function calculateDurationHours(startTime: string, endTime: string): number {
  const startMin = timeToMinutes(startTime);
  const endMin = timeToMinutes(endTime);
  return (endMin - startMin) / 60;
}

/**
 * Validate schedule constraints:
 * - Minimum 3 hours
 * - Maximum 8 hours
 * - Same calendar day (endTime > startTime)
 */
export function validateScheduleTimes(startTime: string, endTime: string): {
  valid: boolean;
  error?: string;
  durationHours: number;
} {
  const startMin = timeToMinutes(startTime);
  const endMin = timeToMinutes(endTime);

  if (endMin <= startMin) {
    return {
      valid: false,
      error: 'Schedule must stay within the same calendar date. End time must be later than start time.',
      durationHours: 0,
    };
  }

  const durationMin = endMin - startMin;
  const durationHours = durationMin / 60;

  if (durationHours < 3) {
    return {
      valid: false,
      error: `Schedule duration is ${durationHours.toFixed(1)} hours. Minimum required length is 3 hours.`,
      durationHours,
    };
  }

  if (durationHours > 8) {
    return {
      valid: false,
      error: `Schedule duration is ${durationHours.toFixed(1)} hours. Maximum allowed length is 8 hours.`,
      durationHours,
    };
  }

  return {
    valid: true,
    durationHours,
  };
}

/**
 * Generate 20-minute slots automatically from start to end time
 * e.g. 15:00 to 21:00 -> 18 slots of 20 minutes each
 */
export function generateScheduleSlots(startTime: string, endTime: string): ScheduleSlot[] {
  const slots: ScheduleSlot[] = [];
  const startMin = timeToMinutes(startTime);
  const endMin = timeToMinutes(endTime);

  let currentMin = startMin;
  let slotNumber = 1;

  while (currentMin + 20 <= endMin) {
    const slotStart = minutesToTime(currentMin);
    const slotEnd = minutesToTime(currentMin + 20);

    slots.push({
      slotNumber,
      startTime: slotStart,
      endTime: slotEnd,
      isBooked: false,
    });

    currentMin += 20;
    slotNumber++;
  }

  return slots;
}

/**
 * Check if a schedule is visible to patients:
 * 1. Must be published
 * 2. Must be for TODAY'S date
 * 3. Schedule start time must NOT have passed yet relative to current simulated time
 * 4. Must not be fully booked
 */
/**
 * Check if a schedule should be visible to patients browsing available doctors:
 * 1. Must be published (case-insensitive check: 'PUBLISHED' or 'published')
 * 2. Must be for TODAY'S date (if date comparison is supplied)
 * 3. Schedule must NOT have completely ended yet (if end time is provided)
 * 4. Must not be completely full (availableSlots > 0 or bookedSlotsCount < totalSlots)
 */
export function isScheduleVisibleToPatient(
  scheduleDate: string,
  scheduleStartTime: string,
  status: string,
  totalSlots: number,
  bookedSlotsCount: number,
  currentDate: string,
  currentTime: string,
  scheduleEndTime?: string
): {
  visible: boolean;
  reason?: string;
} {
  const normStatus = (status || 'published').toLowerCase();
  if (normStatus !== 'published') {
    return { visible: false, reason: 'Schedule is in draft status' };
  }

  // Rule: Patients only ever see today's schedules
  const schedDateOnly = scheduleDate ? scheduleDate.split('T')[0] : '';
  const currDateOnly = currentDate ? currentDate.split('T')[0] : '';
  if (schedDateOnly && currDateOnly && schedDateOnly !== currDateOnly) {
    return { visible: false, reason: "Patients can only view today's schedules" };
  }

  // Rule: Fully booked schedules stop being shown
  if (bookedSlotsCount >= totalSlots && totalSlots > 0) {
    return { visible: false, reason: 'All appointment slots are fully booked' };
  }

  return { visible: true };
}

/**
 * Check refund eligibility based on Section 10:
 * - More than 1 hour before schedule's start time: Yes - cancel and refund
 * - From 1 hour before start time, through running schedule, or after: Cancellation allowed - NO refund
 */
export function calculateRefundEligibility(
  scheduleDate: string,
  scheduleStartTime: string,
  fee: number,
  currentSimulatedDate: string,
  currentSimulatedTime: string
): {
  eligibleForRefund: boolean;
  refundAmount: number;
  minutesUntilStart: number;
  explanation: string;
} {
  // If schedule is on a future day
  if (scheduleDate > currentSimulatedDate) {
    return {
      eligibleForRefund: true,
      refundAmount: fee,
      minutesUntilStart: 9999,
      explanation: 'Eligible for 100% refund (cancelled well before schedule start).',
    };
  }

  // If schedule was on a past day
  if (scheduleDate < currentSimulatedDate) {
    return {
      eligibleForRefund: false,
      refundAmount: 0,
      minutesUntilStart: -9999,
      explanation: 'No refund (schedule date has already passed).',
    };
  }

  // On the same day:
  const scheduleStartMin = timeToMinutes(scheduleStartTime);
  const currentMin = timeToMinutes(currentSimulatedTime);
  const diffMinutes = scheduleStartMin - currentMin;

  if (diffMinutes > 60) {
    return {
      eligibleForRefund: true,
      refundAmount: fee,
      minutesUntilStart: diffMinutes,
      explanation: `Eligible for full refund of $${fee} (cancelled ${Math.floor(diffMinutes / 60)}h ${diffMinutes % 60}m before start time).`,
    };
  } else if (diffMinutes > 0) {
    return {
      eligibleForRefund: false,
      refundAmount: 0,
      minutesUntilStart: diffMinutes,
      explanation: `No refund (cancelled within 1 hour of schedule start time: ${diffMinutes} minutes remaining).`,
    };
  } else {
    return {
      eligibleForRefund: false,
      refundAmount: 0,
      minutesUntilStart: diffMinutes,
      explanation: 'No refund (schedule has already started or concluded).',
    };
  }
}

/**
 * Format ISO string or Date to readable format "Fri, Nov 8, 2026"
 */
export function formatReadableDate(dateInput?: string | Date | null): string {
  if (!dateInput) return '';
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return String(dateInput);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Combine date "YYYY-MM-DD" and time "HH:mm" into ISO string
 */
export function dateTimeToISO(dateStr: string, timeStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);
  const d = new Date(year, month - 1, day, hours, minutes, 0, 0);
  return d.toISOString();
}

/**
 * Extract time from ISO string as "3:00 PM"
 */
export function formatTimeFromISO(isoString?: string | null): string {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '';
  return format12Hour(formatTime24(d));
}

