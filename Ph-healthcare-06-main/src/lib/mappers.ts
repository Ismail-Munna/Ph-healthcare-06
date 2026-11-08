import {
  BackendSchedule,
  BackendAppointment,
  BackendUser,
  DoctorSchedule,
  Appointment,
  User,
  DoctorProfile,
  BackendDoctor,
  BackendPatient,
  PatientProfile,
} from '../types';
import {
  formatDate,
  formatTime24,
  calculateDurationHours,
  generateScheduleSlots,
  minutesToTime,
  timeToMinutes,
} from './time';

/**
 * Map backend schedule to frontend DoctorSchedule
 */
export function mapBackendSchedule(s: BackendSchedule): DoctorSchedule {
  const startDate = new Date(s.startDateTime);
  const endDate = new Date(s.endDateTime);
  const dateStr = formatDate(startDate);
  const startStr = formatTime24(startDate);
  const endStr = formatTime24(endDate);
  const durationHours = calculateDurationHours(startStr, endStr);

  const rawSlots = generateScheduleSlots(startStr, endStr);
  const activeAppts = (s.appointments || []).filter(
    (a) => a.status === 'CONFIRMED' || a.status === 'ONGOING' || a.status === 'COMPLETED'
  );
  const totalSlotsCount = s.totalSlots || rawSlots.length;
  const bookedSlotsCount = Math.max(
    activeAppts.length,
    s.availableSlots !== undefined ? Math.max(0, totalSlotsCount - s.availableSlots) : 0
  );

  const slots = rawSlots.map((slot, index) => {
    const matchingAppt = activeAppts.find((a) => {
      if (!a.joiningTime) return false;
      const jDate = new Date(a.joiningTime);
      return formatTime24(jDate) === slot.startTime;
    });

    const isBooked = matchingAppt
      ? true
      : activeAppts.length === 0
        ? index < bookedSlotsCount
        : false;

    return {
      ...slot,
      isBooked,
      appointmentId: matchingAppt?.id,
    };
  });

  return {
    id: s.id,
    doctorId: s.doctorId,
    doctorName: s.doctor?.name || (s as any).doctorName || 'Specialist Doctor',
    doctorSpecialization: s.doctor?.specialization || (s as any).doctorSpecialization || 'General Consultation',
    doctorAvatar: (s as any).doctorAvatar || (s.doctor as any)?.imageUrl || (s.doctor as any)?.avatarUrl || undefined,
    doctorFee: Number(s.doctor?.consultationFee || (s as any).doctorFee || 800),
    date: dateStr,
    startTime: startStr,
    endTime: endStr,
    startDateTime: s.startDateTime,
    endDateTime: s.endDateTime,
    durationHours,
    meetLink: s.meetingLink || '',
    meetingLink: s.meetingLink || '',
    status: (s.status || 'PUBLISHED') as any,
    totalSlots: totalSlotsCount,
    availableSlots: s.availableSlots ?? Math.max(0, totalSlotsCount - bookedSlotsCount),
    bookedSlotsCount,
    slots,
    isTimeRangeLocked: bookedSlotsCount > 0,
    createdAt: s.createdAt,
    appointments: s.appointments,
  };
}

/**
 * Map backend appointment to frontend Appointment
 */
export function mapBackendAppointment(b: BackendAppointment): Appointment {
  const schedStart = b.schedule?.startDateTime ? new Date(b.schedule.startDateTime) : null;
  const joinTime = b.joiningTime ? new Date(b.joiningTime) : schedStart;
  const slotStart = joinTime ? formatTime24(joinTime) : '';
  const slotEnd = joinTime ? minutesToTime(timeToMinutes(slotStart) + 20) : '';

  return {
    id: b.id,
    serialNumber: b.serialNumber || 1,
    scheduleId: b.scheduleId,
    doctorId: b.doctorId,
    doctorName: b.doctor?.name || '',
    doctorSpecialization: b.doctor?.specialization || '',
    doctorAvatar: b.doctor?.imageUrl || undefined,
    patientId: b.patientId,
    patientName: b.patient?.name || '',
    patientEmail: b.patient?.email || '',
    patientPhone: b.patient?.contactNumber || '',
    date: schedStart ? formatDate(schedStart) : '',
    slotStartTime: slotStart,
    slotEndTime: slotEnd,
    slotNumber: b.serialNumber || 1,
    joiningTime: b.joiningTime,
    meetLink: b.schedule?.meetingLink || '',
    status: b.status,
    fee: Number(b.payment?.amount || (b.schedule as any)?.doctor?.consultationFee || 0),
    paymentMethod: (b.payment?.paymentGateway as any) || 'bkash',
    transactionId: b.payment?.bkashTrxId || b.payment?.merchantInvoiceNumber || '',
    paidAt: b.payment?.paidAt || b.createdAt,
    cancelledAt: b.status === 'CANCELLED' ? b.updatedAt : undefined,
    refunded: b.payment?.status === 'REFUNDED',
    refundAmount: Number(b.payment?.refundAmount || 0),
    refundReason: b.payment?.refundReason || undefined,
    prescriptionUrl: b.prescriptionUrl || undefined,
    prescriptionId: b.prescriptionUrl ? b.id : undefined,
    patient: b.patient,
    doctor: b.doctor,
    schedule: b.schedule,
    payment: b.payment,
    createdAt: b.createdAt,
  };
}

/**
 * Map backend patient to frontend PatientProfile
 */
export function mapBackendPatient(p?: BackendPatient): PatientProfile | undefined {
  if (!p) return undefined;
  return {
    id: p.id,
    userId: p.userId,
    name: p.name,
    phone: p.contactNumber || '',
    contactNumber: p.contactNumber,
    address: p.address,
  };
}

/**
 * Map backend user to frontend User
 */
export function mapBackendUser(u: BackendUser): User {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    status: (u.status.toLowerCase() as any),
    emailVerified: u.emailVerified,
    mustChangePassword: u.needPasswordChange,
    needPasswordChange: u.needPasswordChange,
    imageUrl: u.imageUrl,
    doctor: u.doctor ? mapBackendDoctor(u.doctor) : undefined,
    patient: mapBackendPatient(u.patient),
    createdAt: u.createdAt,
  };
}

/**
 * Map backend doctor to frontend DoctorProfile
 */
export function mapBackendDoctor(d: BackendDoctor): DoctorProfile {
  return {
    id: d.id,
    userId: d.userId,
    name: d.name,
    phone: d.contactNumber || '',
    specialization: d.specialization,
    medicalLicenseNumber: d.licenseNumber,
    experienceYears: d.experienceYears,
    degrees: d.qualifications,
    consultationFee: Number(d.consultationFee || 0),
    bio: d.bio || '',
    avatarUrl: d.user?.imageUrl,
    applicationDate: d.createdAt,
    rejectionReason: d.rejectionReason,
  };
}
