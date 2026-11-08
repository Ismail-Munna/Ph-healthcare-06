/**
 * Healthcare System - Storage & State Service
 * Complete client-side database with persistent LocalStorage,
 * initial demo data, RBAC permissions, and system notifications.
 */

import {
  User,
  PatientProfile,
  DoctorProfile,
  AdminProfile,
  DoctorSchedule,
  Appointment,
  Prescription,
  Invoice,
  SystemEmail,
  OtpRecord,
  UserRole,
} from '../types';
import { formatDate, generateScheduleSlots } from './time';

const STORAGE_KEYS = {
  USERS: 'ph_users_v1',
  PATIENTS: 'ph_patients_v1',
  DOCTORS: 'ph_doctors_v1',
  ADMINS: 'ph_admins_v1',
  SCHEDULES: 'ph_schedules_v1',
  APPOINTMENTS: 'ph_appointments_v1',
  PRESCRIPTIONS: 'ph_prescriptions_v1',
  INVOICES: 'ph_invoices_v1',
  EMAILS: 'ph_emails_v1',
  OTPS: 'ph_otps_v1',
  CURRENT_USER: 'ph_current_user_v1',
  SIMULATED_TIME: 'ph_simulated_time_v1',
  SIMULATED_DATE: 'ph_simulated_date_v1',
};

// Default seed data
const TODAY = formatDate(new Date());

const SEED_USERS: User[] = [
  {
    id: 'usr_superadmin_1',
    email: 'superadmin@healthcare.org',
    role: 'SUPER_ADMIN',
    status: 'active',
    emailVerified: true,
    hasPassword: true,
    createdAt: '2026-01-01T08:00:00Z',
  },
  {
    id: 'usr_admin_1',
    email: 'admin.kareem@healthcare.org',
    role: 'ADMIN',
    status: 'active',
    emailVerified: true,
    hasPassword: true,
    createdAt: '2026-02-15T10:00:00Z',
  },
  {
    id: 'usr_doc_sarah',
    email: 'dr.sarah@healthcare.org',
    role: 'DOCTOR',
    status: 'active',
    emailVerified: true,
    hasPassword: true,
    createdAt: '2026-03-01T09:00:00Z',
  },
  {
    id: 'usr_doc_ahmed',
    email: 'dr.ahmed@healthcare.org',
    role: 'DOCTOR',
    status: 'active',
    emailVerified: true,
    hasPassword: true,
    createdAt: '2026-03-10T11:00:00Z',
  },
  {
    id: 'usr_doc_emily',
    email: 'dr.emily@healthcare.org',
    role: 'DOCTOR',
    status: 'pending_approval',
    emailVerified: true,
    hasPassword: true,
    createdAt: '2026-10-24T14:30:00Z',
  },
  {
    id: 'usr_patient_john',
    email: 'john.doe@example.com',
    role: 'PATIENT',
    status: 'active',
    emailVerified: true,
    hasPassword: true,
    createdAt: '2026-04-01T12:00:00Z',
  },
];

const SEED_PATIENTS: PatientProfile[] = [
  {
    id: 'pat_1',
    userId: 'usr_patient_john',
    name: 'Johnathan Doe',
    phone: '+1 (555) 234-5678',
    dateOfBirth: '1988-06-14',
    gender: 'male',
    bloodGroup: 'O+',
    allergies: ['Penicillin', 'Dust mites'],
    medicalHistory: 'Mild hypertension diagnosed in 2022. Takes occasional antihistamines.',
  },
];

const SEED_DOCTORS: DoctorProfile[] = [
  {
    id: 'doc_sarah',
    userId: 'usr_doc_sarah',
    name: 'Dr. Sarah Jenkins, MD',
    phone: '+1 (555) 432-8765',
    specialization: 'Cardiologist & Preventive Medicine',
    medicalLicenseNumber: 'MED-NY-849201',
    experienceYears: 12,
    degrees: 'MBBS, MD (Cardiology), FACC',
    consultationFee: 50,
    bio: 'Specialist in non-invasive cardiac evaluation, preventive cardiology, hypertension, and patient-centered lifestyle wellness.',
    avatarUrl: '/src/assets/images/avatar_doctor_sarah_1792946656894.jpg',
    applicationDate: '2026-03-01T08:00:00Z',
    reviewedBy: 'usr_superadmin_1',
    reviewedAt: '2026-03-02T10:00:00Z',
  },
  {
    id: 'doc_ahmed',
    userId: 'usr_doc_ahmed',
    name: 'Dr. Arthur J. Finn, MD',
    phone: '+1 (555) 987-6543',
    specialization: 'Internal Medicine & Geriatrics',
    medicalLicenseNumber: 'MED-IL-392018',
    experienceYears: 18,
    degrees: 'MBBS, MD (Internal Medicine), FACP',
    consultationFee: 45,
    bio: 'Over 18 years treating chronic illnesses, metabolic disorders, geriatric health, and acute outpatient medical management.',
    avatarUrl: '/src/assets/images/avatar_doctor_ahmed_1792946656911.jpg',
    applicationDate: '2026-03-10T10:00:00Z',
    reviewedBy: 'usr_admin_1',
    reviewedAt: '2026-03-11T14:00:00Z',
  },
  {
    id: 'doc_emily',
    userId: 'usr_doc_emily',
    name: 'Dr. Emily Chen, MBBS',
    phone: '+1 (555) 345-6789',
    specialization: 'Neurology & Clinical Neurophysiology',
    medicalLicenseNumber: 'MED-CA-601928',
    experienceYears: 8,
    degrees: 'MBBS, Fellowship in Neurology',
    consultationFee: 60,
    bio: 'Focuses on headaches, neuropathies, sleep disorders, and tele-neurology consultations.',
    avatarUrl: '/src/assets/images/avatar_doctor_emily_1792946657050.jpg',
    applicationDate: '2026-10-24T14:30:00Z',
  },
];

const SEED_ADMINS: AdminProfile[] = [
  {
    id: 'adm_1',
    userId: 'usr_superadmin_1',
    name: 'Dr. Zahid Hasan (Super Admin)',
    organizationEmail: 'superadmin@healthcare.org',
    personalEmail: 'zahid.hasan@personalmail.com',
    createdBy: 'system_root',
    createdAt: '2026-01-01T08:00:00Z',
  },
  {
    id: 'adm_2',
    userId: 'usr_admin_1',
    name: 'Kareem Mansoor (Admin)',
    organizationEmail: 'admin.kareem@healthcare.org',
    personalEmail: 'kareem.mansoor@gmail.com',
    createdBy: 'usr_superadmin_1',
    createdByName: 'Dr. Zahid Hasan',
    createdAt: '2026-02-15T10:00:00Z',
  },
];

// Seed Schedules for TODAY:
// Schedule 1: Dr. Sarah from 14:00 to 19:00 (5 hours = 15 slots of 20 mins) - Published!
const sarahSlots = generateScheduleSlots('14:00', '19:00');
const SEED_SCHEDULES: DoctorSchedule[] = [
  {
    id: 'sch_sarah_today',
    doctorId: 'doc_sarah',
    doctorName: 'Dr. Sarah Jenkins, MD',
    doctorSpecialization: 'Cardiologist & Preventive Medicine',
    doctorFee: 50,
    doctorAvatar: '/src/assets/images/avatar_doctor_sarah_1792946656894.jpg',
    date: TODAY,
    startTime: '14:00',
    endTime: '19:00',
    durationHours: 5,
    meetLink: 'https://meet.google.com/abc-healthcare-doc',
    status: 'published',
    totalSlots: sarahSlots.length,
    bookedSlotsCount: 0,
    slots: sarahSlots,
    isTimeRangeLocked: false,
    createdAt: new Date().toISOString(),
    publishedAt: new Date().toISOString(),
  },
  {
    id: 'sch_ahmed_today',
    doctorId: 'doc_ahmed',
    doctorName: 'Dr. Arthur J. Finn, MD',
    doctorSpecialization: 'Internal Medicine & Geriatrics',
    doctorFee: 45,
    doctorAvatar: '/src/assets/images/avatar_doctor_ahmed_1792946656911.jpg',
    date: TODAY,
    startTime: '15:00',
    endTime: '20:00',
    durationHours: 5,
    meetLink: 'https://meet.google.com/fin-med-call',
    status: 'published',
    totalSlots: 15,
    bookedSlotsCount: 0,
    slots: generateScheduleSlots('15:00', '20:00'),
    isTimeRangeLocked: false,
    createdAt: new Date().toISOString(),
    publishedAt: new Date().toISOString(),
  },
];

const SEED_EMAILS: SystemEmail[] = [
  {
    id: 'eml_1',
    to: 'john.doe@example.com',
    subject: 'Welcome to Healthcare System',
    title: 'Your Account is Ready',
    body: 'Welcome to Healthcare System, John! You can now browse verified specialist doctors, book consultation slots on today’s schedules, and join secure telemedicine calls.',
    sentAt: '2026-04-01T12:00:00Z',
    type: 'welcome',
  },
];

export class StorageService {
  private static getItem<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private static setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('LocalStorage write error', e);
    }
  }

  // Initialization
  static initialize(): void {
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      this.setItem(STORAGE_KEYS.USERS, SEED_USERS);
      this.setItem(STORAGE_KEYS.PATIENTS, SEED_PATIENTS);
      this.setItem(STORAGE_KEYS.DOCTORS, SEED_DOCTORS);
      this.setItem(STORAGE_KEYS.ADMINS, SEED_ADMINS);
      this.setItem(STORAGE_KEYS.SCHEDULES, SEED_SCHEDULES);
      this.setItem(STORAGE_KEYS.APPOINTMENTS, []);
      this.setItem(STORAGE_KEYS.PRESCRIPTIONS, []);
      this.setItem(STORAGE_KEYS.INVOICES, []);
      this.setItem(STORAGE_KEYS.EMAILS, SEED_EMAILS);
      this.setItem(STORAGE_KEYS.OTPS, []);
      // Default to patient login for immediate browsing
      this.setItem(STORAGE_KEYS.CURRENT_USER, SEED_USERS[5]); // John Doe
      this.setItem(STORAGE_KEYS.SIMULATED_TIME, '11:00'); // 11:00 AM so 14:00 schedules are visible
      this.setItem(STORAGE_KEYS.SIMULATED_DATE, TODAY);
    }
  }

  // Reset to initial demo state
  static resetToDefaults(): void {
    Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
    this.initialize();
  }

  // Simulated Time & Date
  static getSimulatedTime(): string {
    return this.getItem(STORAGE_KEYS.SIMULATED_TIME, '11:00');
  }

  static setSimulatedTime(time: string): void {
    this.setItem(STORAGE_KEYS.SIMULATED_TIME, time);
    window.dispatchEvent(new CustomEvent('ph_time_changed'));
  }

  static getSimulatedDate(): string {
    return this.getItem(STORAGE_KEYS.SIMULATED_DATE, TODAY);
  }

  static setSimulatedDate(date: string): void {
    this.setItem(STORAGE_KEYS.SIMULATED_DATE, date);
    window.dispatchEvent(new CustomEvent('ph_time_changed'));
  }

  // Current User / Auth Session
  static getCurrentUser(): User | null {
    return this.getItem<User | null>(STORAGE_KEYS.CURRENT_USER, null);
  }

  static setCurrentUser(user: User | null): void {
    this.setItem(STORAGE_KEYS.CURRENT_USER, user);
    window.dispatchEvent(new CustomEvent('ph_auth_changed'));
  }

  // Users
  static getUsers(): User[] {
    return this.getItem<User[]>(STORAGE_KEYS.USERS, []);
  }

  static getUserById(id: string): User | undefined {
    return this.getUsers().find((u) => u.id === id);
  }

  static getUserByEmail(email: string): User | undefined {
    return this.getUsers().find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  static saveUser(user: User): void {
    const users = this.getUsers();
    const index = users.findIndex((u) => u.id === user.id);
    if (index >= 0) {
      users[index] = user;
    } else {
      users.push(user);
    }
    this.setItem(STORAGE_KEYS.USERS, users);
    // If updating current user, refresh session
    const current = this.getCurrentUser();
    if (current && current.id === user.id) {
      this.setCurrentUser(user);
    }
  }

  // Profiles
  static getPatients(): PatientProfile[] {
    return this.getItem<PatientProfile[]>(STORAGE_KEYS.PATIENTS, []);
  }

  static getPatientByUserId(userId: string): PatientProfile | undefined {
    return this.getPatients().find((p) => p.userId === userId);
  }

  static savePatient(profile: PatientProfile): void {
    const list = this.getPatients();
    const index = list.findIndex((p) => p.id === profile.id);
    if (index >= 0) list[index] = profile;
    else list.push(profile);
    this.setItem(STORAGE_KEYS.PATIENTS, list);
  }

  static getDoctors(): DoctorProfile[] {
    return this.getItem<DoctorProfile[]>(STORAGE_KEYS.DOCTORS, []);
  }

  static getDoctorByUserId(userId: string): DoctorProfile | undefined {
    return this.getDoctors().find((d) => d.userId === userId);
  }

  static getDoctorById(docId: string): DoctorProfile | undefined {
    return this.getDoctors().find((d) => d.id === docId);
  }

  static saveDoctor(doctor: DoctorProfile): void {
    const list = this.getDoctors();
    const index = list.findIndex((d) => d.id === doctor.id);
    if (index >= 0) list[index] = doctor;
    else list.push(doctor);
    this.setItem(STORAGE_KEYS.DOCTORS, list);
  }

  static getAdmins(): AdminProfile[] {
    return this.getItem<AdminProfile[]>(STORAGE_KEYS.ADMINS, []);
  }

  static getAdminByUserId(userId: string): AdminProfile | undefined {
    return this.getAdmins().find((a) => a.userId === userId);
  }

  static saveAdmin(admin: AdminProfile): void {
    const list = this.getAdmins();
    const index = list.findIndex((a) => a.id === admin.id);
    if (index >= 0) list[index] = admin;
    else list.push(admin);
    this.setItem(STORAGE_KEYS.ADMINS, list);
  }

  // Schedules
  static getSchedules(): DoctorSchedule[] {
    return this.getItem<DoctorSchedule[]>(STORAGE_KEYS.SCHEDULES, []);
  }

  static getScheduleById(id: string): DoctorSchedule | undefined {
    return this.getSchedules().find((s) => s.id === id);
  }

  static saveSchedule(schedule: DoctorSchedule): void {
    const list = this.getSchedules();
    const index = list.findIndex((s) => s.id === schedule.id);
    if (index >= 0) list[index] = schedule;
    else list.push(schedule);
    this.setItem(STORAGE_KEYS.SCHEDULES, list);
  }

  // Appointments
  static getAppointments(): Appointment[] {
    return this.getItem<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, []);
  }

  static getAppointmentById(id: string): Appointment | undefined {
    return this.getAppointments().find((a) => a.id === id);
  }

  static saveAppointment(appointment: Appointment): void {
    const list = this.getAppointments();
    const index = list.findIndex((a) => a.id === appointment.id);
    if (index >= 0) list[index] = appointment;
    else list.push(appointment);
    this.setItem(STORAGE_KEYS.APPOINTMENTS, list);
  }

  // Prescriptions
  static getPrescriptions(): Prescription[] {
    return this.getItem<Prescription[]>(STORAGE_KEYS.PRESCRIPTIONS, []);
  }

  static getPrescriptionById(id: string): Prescription | undefined {
    return this.getPrescriptions().find((p) => p.id === id);
  }

  static savePrescription(prescription: Prescription): void {
    const list = this.getPrescriptions();
    const index = list.findIndex((p) => p.id === prescription.id);
    if (index >= 0) list[index] = prescription;
    else list.push(prescription);
    this.setItem(STORAGE_KEYS.PRESCRIPTIONS, list);
  }

  // Invoices
  static getInvoices(): Invoice[] {
    return this.getItem<Invoice[]>(STORAGE_KEYS.INVOICES, []);
  }

  static getInvoiceByAppointmentId(appointmentId: string): Invoice | undefined {
    return this.getInvoices().find((i) => i.appointmentId === appointmentId);
  }

  static saveInvoice(invoice: Invoice): void {
    const list = this.getInvoices();
    const index = list.findIndex((i) => i.id === invoice.id);
    if (index >= 0) list[index] = invoice;
    else list.push(invoice);
    this.setItem(STORAGE_KEYS.INVOICES, list);
  }

  // System Emails & Inbox
  static getEmails(): SystemEmail[] {
    return this.getItem<SystemEmail[]>(STORAGE_KEYS.EMAILS, []);
  }

  static sendEmail(email: Omit<SystemEmail, 'id' | 'sentAt'>): SystemEmail {
    const list = this.getEmails();
    const newEmail: SystemEmail = {
      ...email,
      id: `eml_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      sentAt: new Date().toISOString(),
    };
    list.unshift(newEmail);
    this.setItem(STORAGE_KEYS.EMAILS, list);
    window.dispatchEvent(new CustomEvent('ph_new_email', { detail: newEmail }));
    return newEmail;
  }

  // OTPs
  static createOtp(email: string, purpose: OtpRecord['purpose']): string {
    const otps = this.getItem<OtpRecord[]>(STORAGE_KEYS.OTPS, []);
    // Generate 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const newRecord: OtpRecord = {
      email: email.toLowerCase(),
      otp: code,
      purpose,
      createdAt: Date.now(),
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    };
    // remove previous otps for this email & purpose
    const filtered = otps.filter((o) => !(o.email === newRecord.email && o.purpose === purpose));
    filtered.push(newRecord);
    this.setItem(STORAGE_KEYS.OTPS, filtered);

    // Send email with OTP
    this.sendEmail({
      to: email,
      subject: `Your Healthcare verification code: ${code}`,
      title: 'One-Time Password (OTP) Verification',
      body: `Your verification code is ${code}. This code is valid for 10 minutes. Do not share this code with anyone.`,
      type: 'otp',
      metadata: { otp: code, purpose },
    });

    return code;
  }

  static verifyOtp(email: string, otp: string, purpose: OtpRecord['purpose']): boolean {
    const otps = this.getItem<OtpRecord[]>(STORAGE_KEYS.OTPS, []);
    const record = otps.find(
      (o) => o.email.toLowerCase() === email.toLowerCase() && o.purpose === purpose && o.otp === otp.trim()
    );

    if (!record) return false;
    if (Date.now() > record.expiresAt) return false;

    // Remove used OTP
    const remaining = otps.filter((o) => o !== record);
    this.setItem(STORAGE_KEYS.OTPS, remaining);
    return true;
  }
}
