/**
 * Healthcare System - TypeScript Type Definitions
 * Covers all roles, authentication, schedules, appointments, prescriptions, and invoices.
 */

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'DOCTOR' | 'PATIENT';

export type UserStatus = 'active' | 'blocked' | 'pending_approval' | 'rejected' | 'ACTIVE' | 'BLOCKED' | 'DELETED';

export interface User {
  id: string;
  name?: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  mustChangePassword?: boolean;
  needPasswordChange?: boolean;
  hasPassword?: boolean; // false for Google-only patients until they set one
  passwordHash?: string;
  googleId?: string;
  imageUrl?: string;
  imagePublicId?: string;
  doctor?: DoctorProfile;
  patient?: PatientProfile;
  createdAt: string;
  lastLogin?: string;
}

export interface PatientProfile {
  id: string;
  userId: string;
  name: string;
  phone: string;
  contactNumber?: string;
  address?: string;
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
  licenseNumber?: string;
  experienceYears: number;
  degrees: string;
  qualifications?: string;
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

export type ScheduleStatus = 'draft' | 'published' | 'DRAFT' | 'PUBLISHED';

export interface DoctorSchedule {
  id: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialization: string;
  doctorAvatar?: string;
  doctorFee: number;
  date: string; // "YYYY-MM-DD"
  startTime: string; // "09:00"
  endTime: string; // "17:00"
  startDateTime?: string;
  endDateTime?: string;
  durationHours: number; // e.g. 6 (between 3 and 8)
  meetLink: string;
  meetingLink?: string;
  status: ScheduleStatus;
  totalSlots: number;
  availableSlots?: number;
  bookedSlotsCount: number;
  slots: ScheduleSlot[];
  isTimeRangeLocked: boolean; // locked once 1st appointment is booked
  createdAt: string;
  publishedAt?: string;
  appointments?: any[];
}

export type AppointmentStatus =
  | 'booked'
  | 'ongoing'
  | 'completed'
  | 'cancelled'
  | 'PENDING'
  | 'CONFIRMED'
  | 'ONGOING'
  | 'COMPLETED'
  | 'CANCELLED';

export interface Appointment {
  id: string;
  serialNumber: number; // Serial position in the schedule (#1, #2, etc.)
  scheduleId: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialization: string;
  doctorAvatar?: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  date: string; // "YYYY-MM-DD"
  slotStartTime: string;
  slotEndTime: string;
  slotNumber: number;
  joiningTime?: string;
  meetLink: string;
  status: AppointmentStatus;
  fee: number;
  paymentMethod: 'card' | 'bkash' | 'nagad' | 'stripe' | string;
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
  prescriptionUrl?: string;
  patient?: any;
  doctor?: any;
  schedule?: any;
  payment?: any;
  createdAt?: string;
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
  doctorAvatar?: string;
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

// =============================================================
// Backend API Matching Types & Enums
// =============================================================

export type BackendRole = 'SUPER_ADMIN' | 'ADMIN' | 'DOCTOR' | 'PATIENT';
export type BackendUserStatus = 'ACTIVE' | 'BLOCKED' | 'DELETED';
export type BackendDoctorVerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type BackendScheduleStatus = 'DRAFT' | 'PUBLISHED';
export type BackendAppointmentStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'ONGOING' | 'COMPLETED';
export type BackendPaymentStatus = 'UNPAID' | 'PAID' | 'FAILED' | 'CANCELLED' | 'REFUNDED';

export interface ApiResponse<T> {
  statusCode: number;
  success: boolean;
  message: string;
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface BackendUser {
  id: string;
  name: string;
  email: string;
  role: BackendRole;
  status: BackendUserStatus;
  needPasswordChange: boolean;
  emailVerified: boolean;
  imageUrl?: string;
  imagePublicId?: string;
  patient?: BackendPatient;
  doctor?: BackendDoctor;
  createdAt: string;
  updatedAt: string;
}

export interface BackendPatient {
  id: string;
  name: string;
  email: string;
  contactNumber?: string;
  address?: string;
  userId: string;
  createdAt: string;
}

export interface BackendDoctor {
  id: string;
  name: string;
  email: string;
  address?: string;
  specialization: string;
  licenseNumber: string;
  qualifications: string;
  experienceYears: number;
  bio?: string;
  consultationFee?: number | string;
  contactNumber?: string;
  verificationStatus: BackendDoctorVerificationStatus;
  rejectionReason?: string;
  resume?: string;
  additionalFiles?: any;
  userId: string;
  user?: BackendUser;
  schedules?: BackendSchedule[];
  createdAt: string;
}

export interface BackendSchedule {
  id: string;
  startDateTime: string;
  endDateTime: string;
  totalSlots: number;
  availableSlots: number;
  meetingLink: string;
  status: BackendScheduleStatus;
  doctorId: string;
  doctor?: {
    id: string;
    name: string;
    email: string;
    specialization: string;
    userId: string;
    consultationFee?: number | string;
  };
  appointments?: BackendAppointment[];
  createdAt: string;
  updatedAt: string;
}

export interface BackendAppointment {
  id: string;
  status: BackendAppointmentStatus;
  joiningTime?: string;
  serialNumber?: number;
  recordUrl?: string;
  prescriptionUrl?: string;
  patientId: string;
  doctorId: string;
  scheduleId: string;
  patient?: BackendPatient;
  doctor?: {
    id: string;
    name: string;
    specialization: string;
    imageUrl?: string;
  };
  schedule?: BackendSchedule;
  payment?: BackendPayment;
  createdAt: string;
  updatedAt: string;
}

export interface BackendPayment {
  id: string;
  status: BackendPaymentStatus;
  amount: number | string;
  currency: string;
  paymentGateway: string;
  merchantInvoiceNumber: string;
  bkashPaymentId?: string;
  bkashTrxId?: string;
  paidAt?: string;
  refundTrxId?: string;
  refundAmount?: number | string;
  refundReason?: string;
  refundedAt?: string;
  appointmentId: string;
  appointment?: BackendAppointment;
  createdAt: string;
}

// Payload Interfaces
export interface RegisterPatientPayload {
  name: string;
  email: string;
  password?: string;
  patient?: {
    contactNumber?: string;
    address?: string;
  };
}

export interface VerifyEmailPayload {
  email: string;
  otp: string;
}

export interface LoginPayload {
  email: string;
  password?: string;
}

export interface GoogleLoginPayload {
  idToken: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  email: string;
  otp: string;
  newPassword: string;
}

export interface DoctorApplicationPayload {
  name: string;
  email: string;
  specialization: string;
  licenseNumber: string;
  qualifications: string;
  experienceYears: number;
  bio?: string;
  consultationFee: number;
  contactNumber?: string;
  address?: string;
}

export interface CreateSchedulePayload {
  startDateTime: string;
  endDateTime: string;
  meetingLink: string;
}

export interface UpdateSchedulePayload {
  startDateTime?: string;
  endDateTime?: string;
  meetingLink?: string;
}

export interface BookAppointmentPayload {
  scheduleId: string;
}

export interface UpdateAppointmentStatusPayload {
  status: 'CONFIRMED' | 'ONGOING' | 'COMPLETED';
}

export interface CreatePrescriptionPayload {
  appointmentId: string;
  findings: string;
  medicines: Array<{
    name: string;
    dosage: string;
    duration: string;
    instructions?: string;
  }>;
}

export interface ApplyAsDoctorPayload {
  user: {
    name: string;
    email: string;
  };
  doctor: {
    address?: string;
    specialization: string;
    licenseNumber: string;
    qualifications: string;
    experienceYears: number;
    bio?: string;
    consultationFee?: number;
    contactNumber?: string;
  };
}

export interface ApproveDoctorPayload {
  doctorId: string;
  verificationStatus: 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
}

// Analytics Interfaces
export interface AdminAnalytics {
  totalDoctors: number;
  totalPendingDoctorApplications: number;
  totalApprovedDoctors: number;
  totalRejectedDoctors: number;
  totalPatients: number;
  totalAppointments: number;
  totalCompletedAppointments: number;
  totalCancelledAppointments: number;
  totalRevenue: number;
  totalRefunded: number;
}

export interface DoctorAnalytics {
  totalAppointments: number;
  totalCompletedAppointments: number;
  totalUpcomingAppointments: number;
  totalCancelledAppointments: number;
  totalPatients: number;
  totalSchedules: number;
  totalPublishedSchedules: number;
  totalUnpublishedSchedules: number;
  totalEarnings: number;
}

export interface PatientAnalytics {
  totalAppointments: number;
  totalCompletedAppointments: number;
  totalUpcomingAppointments: number;
  totalCancelledAppointments: number;
  totalDoctorConsulted: number;
  totalSpent: number;
}

