/**
 * PH Healthcare System - TypeScript Type Definitions
 * Covers all roles, authentication, schedules, appointments, prescriptions, and invoices.
 */

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'DOCTOR' | 'PATIENT';

export type UserStatus = 'active' | 'blocked' | 'pending_approval' | 'rejected';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  mustChangePassword?: boolean;
  hasPassword?: boolean; // false for Google-only patients until they set one
  passwordHash?: string;
  googleId?: string;
  createdAt: string;
  lastLogin?: string;
}

export interface PatientProfile {
  id: string;
  userId: string;
  name: string;
  phone: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  bloodGroup?: string;
  allergies?: string[];
  medicalHistory?: string;
  avatarUrl?: string;
}

export interface DoctorProfile {
  id: string;
  userId: string;
  name: string;
  phone: string;
  specialization: string;
  medicalLicenseNumber: string;
  experienceYears: number;
  degrees: string;
  consultationFee: number;
  bio: string;
  avatarUrl?: string;
  applicationDate: string;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

export interface AdminProfile {
  id: string;
  userId: string;
  name: string;
  organizationEmail: string; // Account login identity
  personalEmail: string; // Person's inbox for welcome & credentials
  createdBy: string;
  createdByName?: string;
  createdAt: string;
}

export interface ScheduleSlot {
  slotNumber: number; // 1, 2, 3...
  startTime: string; // "15:00"
  endTime: string; // "15:20"
  isBooked: boolean;
  appointmentId?: string;
}

export type ScheduleStatus = 'draft' | 'published';

export interface DoctorSchedule {
  id: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialization: string;
  doctorFee: number;
  doctorAvatar?: string;
  date: string; // "YYYY-MM-DD"
  startTime: string; // "09:00"
  endTime: string; // "17:00"
  durationHours: number; // e.g. 6 (between 3 and 8)
  meetLink: string;
  status: ScheduleStatus;
  totalSlots: number;
  bookedSlotsCount: number;
  slots: ScheduleSlot[];
  isTimeRangeLocked: boolean; // locked once 1st appointment is booked
  createdAt: string;
  publishedAt?: string;
}

export type AppointmentStatus = 'booked' | 'ongoing' | 'completed' | 'cancelled';

export interface Appointment {
  id: string;
  serialNumber: number; // Serial position in the schedule (#1, #2, etc.)
  scheduleId: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialization: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  date: string; // "YYYY-MM-DD"
  slotStartTime: string;
  slotEndTime: string;
  slotNumber: number;
  meetLink: string;
  status: AppointmentStatus;
  fee: number;
  paymentMethod: 'card' | 'bkash' | 'nagad' | 'stripe';
  transactionId: string;
  paidAt: string;
  cancelledAt?: string;
  refunded: boolean;
  refundAmount?: number;
  refundReason?: string;
  consultationStartedAt?: string;
  consultationCompletedAt?: string;
  hasPrescription?: boolean;
  prescriptionId?: string;
}

export interface MedicineItem {
  id: string;
  name: string;
  type: 'Tablet' | 'Capsule' | 'Syrup' | 'Injection' | 'Drop' | 'Ointment';
  dosage: string; // e.g. "500 mg"
  frequency: string; // e.g. "1 + 0 + 1 (After meal)"
  duration: string; // e.g. "7 Days"
  instructions?: string;
}

export interface Prescription {
  id: string;
  appointmentId: string;
  scheduleId: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialization: string;
  doctorLicenseNumber: string;
  doctorDegrees: string;
  patientId: string;
  patientName: string;
  patientAge?: number;
  patientGender?: string;
  consultationDate: string;
  diagnosis: string;
  keyFindings: string;
  vitals?: {
    bloodPressure?: string;
    pulseRate?: string;
    temperature?: string;
    weightKg?: string;
  };
  medicines: MedicineItem[];
  specialInstructions: string;
  nextFollowUpDate?: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  appointmentId: string;
  serialNumber: number;
  patientName: string;
  patientEmail: string;
  doctorName: string;
  doctorSpecialization: string;
  date: string;
  timeSlot: string;
  meetLink: string;
  amount: number;
  paymentMethod: string;
  transactionId: string;
  paidAt: string;
  status: 'PAID' | 'REFUNDED' | 'CANCELLED';
}

export interface SystemEmail {
  id: string;
  to: string;
  subject: string;
  title: string;
  body: string;
  sentAt: string;
  type: 'welcome' | 'otp' | 'doctor_approval' | 'admin_credentials' | 'invoice' | 'prescription' | 'refund';
  metadata?: Record<string, any>;
}

export interface OtpRecord {
  email: string;
  otp: string;
  purpose: 'patient_registration' | 'doctor_application' | 'password_reset';
  createdAt: number;
  expiresAt: number;
}
