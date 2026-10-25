import React, { useState } from 'react';
import { User, DoctorProfile, DoctorSchedule, Appointment, Prescription, MedicineItem } from '../../types';
import { StorageService } from '../../lib/storage';
import {
  Calendar,
  Clock,
  Video,
  Plus,
  Lock,
  Unlock,
  CheckCircle,
  Play,
  FileText,
  AlertCircle,
  User as UserIcon,
  Check,
  CalendarCheck,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import {
  validateScheduleTimes,
  generateScheduleSlots,
  format12Hour,
  calculateDurationHours,
  formatDate,
} from '../../lib/time';

interface DoctorDashboardProps {
  currentUser: User;
  onOpenVideoRoom: (appointment: Appointment) => void;
  onOpenPrescriptionModal: (prescription: Prescription) => void;
}

export const DoctorDashboard: React.FC<DoctorDashboardProps> = ({
  currentUser,
  onOpenVideoRoom,
  onOpenPrescriptionModal,
}) => {
  const doctor = StorageService.getDoctorByUserId(currentUser.id);
  const simulatedDate = StorageService.getSimulatedDate();
  const simulatedTime = StorageService.getSimulatedTime();

  // All schedules for this doctor
  const [schedules, setSchedules] = useState<DoctorSchedule[]>(() =>
    StorageService.getSchedules().filter((s) => s.doctorId === doctor?.id)
  );

  // Appointments for this doctor
  const [appointments, setAppointments] = useState<Appointment[]>(() =>
    StorageService.getAppointments().filter((a) => a.doctorId === doctor?.id)
  );

  // Schedule Modal State
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<DoctorSchedule | null>(null);
  const [scheduleDate, setScheduleDate] = useState(simulatedDate);
  const [startTime, setStartTime] = useState('14:00');
  const [endTime, setEndTime] = useState('19:00');
  const [meetLink, setMeetLink] = useState(
    doctor ? `https://meet.google.com/${doctor.name.toLowerCase().replace(/[^a-z]/g, '')}-telemed` : 'https://meet.google.com/doc-phhc'
  );
  const [scheduleStatus, setScheduleStatus] = useState<'draft' | 'published'>('draft');
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  // Prescription Modal State
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
  const [selectedAppointmentForRx, setSelectedAppointmentForRx] = useState<Appointment | null>(null);
  const [rxDiagnosis, setRxDiagnosis] = useState('');
  const [rxFindings, setRxFindings] = useState('');
  const [rxBp, setRxBp] = useState('120/80');
  const [rxPulse, setRxPulse] = useState('74');
  const [rxWeight, setRxWeight] = useState('70');
  const [rxTemp, setRxTemp] = useState('98.6');
  const [rxAdvice, setRxAdvice] = useState('Drink plenty of water and rest well.');
  const [rxFollowUp, setRxFollowUp] = useState('');
  const [rxMedicines, setRxMedicines] = useState<MedicineItem[]>([
    {
      id: 'med_1',
      name: 'Amoxicillin & Clavulanate',
      type: 'Tablet',
      dosage: '625 mg',
      frequency: '1 + 0 + 1 (After meals)',
      duration: '7 Days',
      instructions: 'Complete full course',
    },
    {
      id: 'med_2',
      name: 'Paracetamol',
      type: 'Tablet',
      dosage: '500 mg',
      frequency: '1 + 1 + 1 (If fever > 100°F)',
      duration: '3 Days',
      instructions: 'Take after meal',
    },
  ]);

  if (!doctor) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center text-slate-500">
        Doctor profile not found.
      </div>
    );
  }

  const refreshData = () => {
    setSchedules(StorageService.getSchedules().filter((s) => s.doctorId === doctor.id));
    setAppointments(StorageService.getAppointments().filter((a) => a.doctorId === doctor.id));
  };

  // Open Create Schedule Modal
  const handleOpenCreateSchedule = () => {
    setEditingSchedule(null);
    setScheduleDate(simulatedDate);
    setStartTime('14:00');
    setEndTime('19:00');
    setScheduleStatus('draft');
    setScheduleError(null);
    setIsScheduleModalOpen(true);
  };

  // Open Edit Schedule Modal
  const handleOpenEditSchedule = (sch: DoctorSchedule) => {
    setEditingSchedule(sch);
    setScheduleDate(sch.date);
    setStartTime(sch.startTime);
    setEndTime(sch.endTime);
    setMeetLink(sch.meetLink);
    setScheduleStatus(sch.status);
    setScheduleError(null);
    setIsScheduleModalOpen(true);
  };

  // Save Schedule (Create or Edit)
  const handleSaveSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    setScheduleError(null);

    // Rule: One schedule per calendar date
    const existingSameDate = schedules.find(
      (s) => s.date === scheduleDate && (!editingSchedule || s.id !== editingSchedule.id)
    );
    if (existingSameDate) {
      setScheduleError(
        `You already have a schedule for ${scheduleDate}. The platform strictly limits doctors to at most one schedule per calendar date.`
      );
      return;
    }

    // Validate 3 to 8 hours & same day
    const timeValidation = validateScheduleTimes(startTime, endTime);
    if (!timeValidation.valid) {
      setScheduleError(timeValidation.error || 'Invalid time range.');
      return;
    }

    if (editingSchedule) {
      // Editing existing schedule
      // Rule 6.2: Date locked as soon as published!
      const isDateLocked = editingSchedule.status === 'published';
      const targetDate = isDateLocked ? editingSchedule.date : scheduleDate;

      // Rule 6.2: Time range locked once first appointment is booked into it!
      const hasBookings = editingSchedule.bookedSlotsCount > 0;
      const targetStart = hasBookings ? editingSchedule.startTime : startTime;
      const targetEnd = hasBookings ? editingSchedule.endTime : endTime;

      const slots = hasBookings
        ? editingSchedule.slots
        : generateScheduleSlots(targetStart, targetEnd);

      const updated: DoctorSchedule = {
        ...editingSchedule,
        date: targetDate,
        startTime: targetStart,
        endTime: targetEnd,
        durationHours: timeValidation.durationHours,
        meetLink: meetLink.trim(),
        status: scheduleStatus,
        totalSlots: slots.length,
        slots,
        isTimeRangeLocked: hasBookings,
        publishedAt:
          scheduleStatus === 'published' && !editingSchedule.publishedAt
            ? new Date().toISOString()
            : editingSchedule.publishedAt,
      };

      StorageService.saveSchedule(updated);
    } else {
      // Creating new schedule
      const slots = generateScheduleSlots(startTime, endTime);
      const newSchedule: DoctorSchedule = {
        id: `sch_${doctor.id}_${Date.now()}`,
        doctorId: doctor.id,
        doctorName: doctor.name,
        doctorSpecialization: doctor.specialization,
        doctorFee: doctor.consultationFee,
        doctorAvatar: doctor.avatarUrl,
        date: scheduleDate,
        startTime,
        endTime,
        durationHours: timeValidation.durationHours,
        meetLink: meetLink.trim(),
        status: scheduleStatus,
        totalSlots: slots.length,
        bookedSlotsCount: 0,
        slots,
        isTimeRangeLocked: false,
        createdAt: new Date().toISOString(),
        publishedAt: scheduleStatus === 'published' ? new Date().toISOString() : undefined,
      };

      StorageService.saveSchedule(newSchedule);
    }

    setIsScheduleModalOpen(false);
    refreshData();
  };

  // Appointment Status Transitions (Section 8: booked -> ongoing -> completed)
  const handleStartConsultation = (app: Appointment) => {
    app.status = 'ongoing';
    app.consultationStartedAt = new Date().toISOString();
    StorageService.saveAppointment(app);
    refreshData();
    onOpenVideoRoom(app);
  };

  const handleCompleteConsultation = (appointmentId: string) => {
    const app = StorageService.getAppointmentById(appointmentId);
    if (app) {
      app.status = 'completed';
      app.consultationCompletedAt = new Date().toISOString();
      StorageService.saveAppointment(app);
      refreshData();
    }
  };

  // Open Prescription Builder
  const handleOpenPrescriptionBuilder = (app: Appointment) => {
    if (app.status !== 'completed') {
      alert('Prescriptions can only be written after the appointment is marked as Completed.');
      return;
    }
    setSelectedAppointmentForRx(app);
    setRxDiagnosis('');
    setRxFindings('');
    setIsPrescriptionModalOpen(true);
  };

  // Add Medicine Item
  const handleAddMedicine = () => {
    setRxMedicines([
      ...rxMedicines,
      {
        id: `med_${Date.now()}`,
        name: '',
        type: 'Tablet',
        dosage: '',
        frequency: '1 + 0 + 1',
        duration: '5 Days',
        instructions: '',
      },
    ]);
  };

  const handleUpdateMedicine = (index: number, field: keyof MedicineItem, value: string) => {
    const updated = [...rxMedicines];
    (updated[index] as any)[field] = value;
    setRxMedicines(updated);
  };

  const handleRemoveMedicine = (index: number) => {
    setRxMedicines(rxMedicines.filter((_, i) => i !== index));
  };

  // Submit Prescription (Section 9)
  const handleSubmitPrescription = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppointmentForRx) return;

    if (!rxDiagnosis.trim()) {
      alert('Please enter a diagnosis.');
      return;
    }

    const prescription: Prescription = {
      id: `rx_${Date.now()}`,
      appointmentId: selectedAppointmentForRx.id,
      scheduleId: selectedAppointmentForRx.scheduleId,
      doctorId: doctor.id,
      doctorName: doctor.name,
      doctorSpecialization: doctor.specialization,
      doctorLicenseNumber: doctor.medicalLicenseNumber,
      doctorDegrees: doctor.degrees,
      patientId: selectedAppointmentForRx.patientId,
      patientName: selectedAppointmentForRx.patientName,
      consultationDate: selectedAppointmentForRx.date,
      diagnosis: rxDiagnosis.trim(),
      keyFindings: rxFindings.trim(),
      vitals: {
        bloodPressure: rxBp,
        pulseRate: rxPulse,
        weightKg: rxWeight,
        temperature: rxTemp,
      },
      medicines: rxMedicines.filter((m) => m.name.trim() !== ''),
      specialInstructions: rxAdvice.trim(),
      nextFollowUpDate: rxFollowUp || undefined,
      createdAt: new Date().toISOString(),
    };

    StorageService.savePrescription(prescription);

    // Update appointment
    selectedAppointmentForRx.hasPrescription = true;
    selectedAppointmentForRx.prescriptionId = prescription.id;
    StorageService.saveAppointment(selectedAppointmentForRx);

    // Email Prescription to Patient (Section 9)
    StorageService.sendEmail({
      to: selectedAppointmentForRx.patientEmail,
      subject: `Prescription from ${doctor.name} - Appt #${selectedAppointmentForRx.serialNumber}`,
      title: 'Digital Prescription Issued',
      body: `Your consultation with ${doctor.name} has concluded. Your official digital prescription for diagnosis "${prescription.diagnosis}" is now attached and accessible in your patient portal.`,
      type: 'prescription',
      metadata: { prescriptionId: prescription.id },
    });

    setIsPrescriptionModalOpen(false);
    refreshData();
    onOpenPrescriptionModal(prescription);
  };

  return (
    <div className="space-y-8">
      {/* Doctor Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <img
            src={doctor.avatarUrl || '/src/assets/images/avatar_doctor_sarah_1792946656894.jpg'}
            alt={doctor.name}
            className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">{doctor.name}</h1>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                Verified Physician
              </span>
            </div>
            <p className="text-xs font-medium text-teal-700 mt-0.5">{doctor.specialization}</p>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
              <span>License: <strong className="font-mono text-slate-700">{doctor.medicalLicenseNumber}</strong></span>
              <span>·</span>
              <span>Fee: <strong className="font-mono text-slate-900">${doctor.consultationFee}</strong>/slot</span>
              <span>·</span>
              <span>Exp: {doctor.experienceYears} Years</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleOpenCreateSchedule}
          className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Publish New Schedule</span>
        </button>
      </div>

      {/* Today's Appointments Queue */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Today's Consultation Queue</h2>
            <p className="text-xs text-slate-500">
              Manage patient arrivals, launch video consultations, and issue digital prescriptions
            </p>
          </div>
          <span className="text-xs font-mono text-slate-600 font-medium">
            Total Booked: {appointments.length}
          </span>
        </div>

        {appointments.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500 text-xs">
            No patient appointments booked yet today. When a patient books an open slot, it will appear here with an assigned Serial Number.
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 shadow-xs">
            {appointments.map((app) => {
              const existingRx = app.prescriptionId ? StorageService.getPrescriptionById(app.prescriptionId) : null;
              return (
                <div key={app.id} className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex flex-col items-center justify-center shrink-0">
                      <span className="text-[10px] text-teal-700 font-semibold uppercase">Serial</span>
                      <span className="text-sm font-bold font-mono text-teal-900">#{app.serialNumber}</span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">{app.patientName}</span>
                        <span
                          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                            app.status === 'booked'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : app.status === 'ongoing'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                              : app.status === 'completed'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {app.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                        <span>Slot: <strong className="font-mono text-slate-700">{format12Hour(app.slotStartTime)} – {format12Hour(app.slotEndTime)}</strong></span>
                        <span>·</span>
                        <span>Fee Paid: <strong className="font-mono text-slate-900">${app.fee}</strong></span>
                        <span>·</span>
                        <span>{app.patientPhone}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    {app.status === 'booked' && (
                      <button
                        onClick={() => handleStartConsultation(app)}
                        className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Start Consultation</span>
                      </button>
                    )}

                    {app.status === 'ongoing' && (
                      <button
                        onClick={() => onOpenVideoRoom(app)}
                        className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 animate-pulse"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Enter Live Room</span>
                      </button>
                    )}

                    {app.status === 'completed' && (
                      <>
                        {app.hasPrescription && existingRx ? (
                          <button
                            onClick={() => onOpenPrescriptionModal(existingRx)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-medium flex items-center gap-1.5"
                          >
                            <FileText className="w-3.5 h-3.5 text-teal-600" />
                            <span>View Rx</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleOpenPrescriptionBuilder(app)}
                            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Write Digital Prescription</span>
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Published Schedules List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">My Consultation Schedules</h2>
            <p className="text-xs text-slate-500">
              Rules: 1 schedule per date, 3 to 8 hours duration, auto 20-min slots. Date locked once published; Time locked once booked.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {schedules.map((sch) => {
            const hasBookings = sch.bookedSlotsCount > 0;
            return (
              <div
                key={sch.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-teal-600" />
                    <span className="font-bold text-sm text-slate-900 font-mono">{sch.date}</span>
                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                        sch.status === 'published'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {sch.status}
                    </span>
                  </div>

                  <button
                    onClick={() => handleOpenEditSchedule(sch)}
                    className="text-xs text-teal-700 hover:underline font-semibold"
                  >
                    Edit Schedule
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Time Range</span>
                    <span className="font-mono font-medium text-slate-800">
                      {format12Hour(sch.startTime)} – {format12Hour(sch.endTime)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Duration</span>
                    <span className="font-mono font-medium text-slate-800">{sch.durationHours} Hours</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">20-Min Slots</span>
                    <span className="font-mono font-bold text-teal-800">
                      {sch.bookedSlotsCount} / {sch.totalSlots} Booked
                    </span>
                  </div>
                </div>

                {/* Lock rules indicator */}
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                  <div className="flex items-center gap-1">
                    {sch.status === 'published' ? (
                      <span className="text-amber-700 flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Date Locked (Published)
                      </span>
                    ) : (
                      <span className="text-slate-400 flex items-center gap-1">
                        <Unlock className="w-3 h-3" /> Date Editable (Draft)
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {hasBookings ? (
                      <span className="text-amber-700 flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Time Range Locked ({sch.bookedSlotsCount} booked)
                      </span>
                    ) : (
                      <span className="text-slate-400 flex items-center gap-1">
                        <Unlock className="w-3 h-3" /> Time Range Editable
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                  <span className="truncate max-w-[200px] font-mono text-[11px]">{sch.meetLink}</span>
                  <a
                    href={sch.meetLink}
                    target="_blank"
                    rel="noreferrer"
                    className="text-teal-700 hover:underline flex items-center gap-1 shrink-0 font-medium"
                  >
                    Test Meet Link <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Create / Edit Schedule Modal */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingSchedule ? 'Edit Published Schedule' : 'Create & Publish Schedule'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Set daily availability (min 3 hrs, max 8 hrs, 20-min slots)
                </p>
              </div>
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSchedule} className="p-6 space-y-4">
              {scheduleError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{scheduleError}</span>
                </div>
              )}

              {/* Date Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-slate-700">Calendar Date</label>
                  {editingSchedule?.status === 'published' && (
                    <span className="text-[11px] font-medium text-amber-700 flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Locked (Rule: Date locks once published)
                    </span>
                  )}
                </div>
                <input
                  type="date"
                  required
                  disabled={editingSchedule?.status === 'published'}
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 disabled:opacity-60 disabled:cursor-not-allowed focus:bg-white focus:border-teal-600 focus:outline-none"
                />
              </div>

              {/* Time Range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-slate-700">Start Time</label>
                    {editingSchedule?.bookedSlotsCount ? (
                      <span className="text-[10px] text-amber-700 flex items-center gap-0.5">
                        <Lock className="w-2.5 h-2.5" /> Locked
                      </span>
                    ) : null}
                  </div>
                  <input
                    type="time"
                    required
                    disabled={Boolean(editingSchedule?.bookedSlotsCount && editingSchedule.bookedSlotsCount > 0)}
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 disabled:opacity-60 disabled:cursor-not-allowed focus:bg-white focus:border-teal-600 focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-slate-700">End Time</label>
                    {editingSchedule?.bookedSlotsCount ? (
                      <span className="text-[10px] text-amber-700 flex items-center gap-0.5">
                        <Lock className="w-2.5 h-2.5" /> Locked
                      </span>
                    ) : null}
                  </div>
                  <input
                    type="time"
                    required
                    disabled={Boolean(editingSchedule?.bookedSlotsCount && editingSchedule.bookedSlotsCount > 0)}
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 disabled:opacity-60 disabled:cursor-not-allowed focus:bg-white focus:border-teal-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Computed Slots Preview */}
              <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-xl text-xs flex items-center justify-between">
                <div>
                  <span className="font-semibold text-teal-950">Slot Calculation:</span>
                  <p className="text-[11px] text-teal-800">
                    Duration: {calculateDurationHours(startTime, endTime).toFixed(1)} hrs (Must be 3 to 8 hrs)
                  </p>
                </div>
                <div className="text-right font-mono">
                  <span className="text-base font-bold text-teal-900">
                    {generateScheduleSlots(startTime, endTime).length}
                  </span>
                  <span className="text-[11px] text-teal-700 block">Slots (20 min ea)</span>
                </div>
              </div>

              {/* Video Meet Link */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Video Call Meet Link (Always editable)
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://meet.google.com/xyz-phhc"
                  value={meetLink}
                  onChange={(e) => setMeetLink(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
                />
              </div>

              {/* Status Selector */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Schedule Visibility Status
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setScheduleStatus('draft')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-colors ${
                      scheduleStatus === 'draft'
                        ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Draft (Hidden from Patients)
                  </button>
                  <button
                    type="button"
                    onClick={() => setScheduleStatus('published')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-colors ${
                      scheduleStatus === 'published'
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Published (Visible Today)
                  </button>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="flex-1 py-2 px-3 border border-slate-200 text-slate-700 rounded-xl text-xs font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-xs"
                >
                  {editingSchedule ? 'Save Changes' : 'Save & Publish Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Write Prescription Builder Modal */}
      {isPrescriptionModalOpen && selectedAppointmentForRx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Write Digital Prescription
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Patient: {selectedAppointmentForRx.patientName} · Serial #{selectedAppointmentForRx.serialNumber}
                </p>
              </div>
              <button
                onClick={() => setIsPrescriptionModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitPrescription} className="p-6 overflow-y-auto space-y-4">
              {/* Diagnosis */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Primary Clinical Diagnosis *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Essential Hypertension / Upper Respiratory Infection"
                  value={rxDiagnosis}
                  onChange={(e) => setRxDiagnosis(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
                />
              </div>

              {/* Key Findings */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Key Findings & Clinical Symptoms
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Mild bilateral headache for 3 days, no chest pain or shortness of breath..."
                  value={rxFindings}
                  onChange={(e) => setRxFindings(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
                />
              </div>

              {/* Vitals Row */}
              <div className="grid grid-cols-4 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">Blood Pressure</label>
                  <input
                    type="text"
                    value={rxBp}
                    onChange={(e) => setRxBp(e.target.value)}
                    placeholder="120/80"
                    className="w-full py-1 px-2 bg-white border border-slate-200 rounded text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">Pulse Rate (bpm)</label>
                  <input
                    type="text"
                    value={rxPulse}
                    onChange={(e) => setRxPulse(e.target.value)}
                    placeholder="72"
                    className="w-full py-1 px-2 bg-white border border-slate-200 rounded text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">Weight (kg)</label>
                  <input
                    type="text"
                    value={rxWeight}
                    onChange={(e) => setRxWeight(e.target.value)}
                    placeholder="70"
                    className="w-full py-1 px-2 bg-white border border-slate-200 rounded text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">Temp (°F)</label>
                  <input
                    type="text"
                    value={rxTemp}
                    onChange={(e) => setRxTemp(e.target.value)}
                    placeholder="98.6"
                    className="w-full py-1 px-2 bg-white border border-slate-200 rounded text-xs font-mono"
                  />
                </div>
              </div>

              {/* Prescribed Medicines */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800">
                    Prescribed Medications (Rx)
                  </label>
                  <button
                    type="button"
                    onClick={handleAddMedicine}
                    className="text-xs font-medium text-teal-700 hover:text-teal-800 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Medication
                  </button>
                </div>

                <div className="space-y-2">
                  {rxMedicines.map((med, index) => (
                    <div key={med.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <div className="grid grid-cols-12 gap-2">
                        <div className="col-span-6">
                          <input
                            type="text"
                            required
                            placeholder="Medicine Name (e.g. Amoxicillin)"
                            value={med.name}
                            onChange={(e) => handleUpdateMedicine(index, 'name', e.target.value)}
                            className="w-full py-1.5 px-2.5 bg-white border border-slate-200 rounded-lg text-xs"
                          />
                        </div>
                        <div className="col-span-3">
                          <select
                            value={med.type}
                            onChange={(e) => handleUpdateMedicine(index, 'type', e.target.value as any)}
                            className="w-full py-1.5 px-2 bg-white border border-slate-200 rounded-lg text-xs"
                          >
                            <option value="Tablet">Tablet</option>
                            <option value="Capsule">Capsule</option>
                            <option value="Syrup">Syrup</option>
                            <option value="Injection">Injection</option>
                            <option value="Drop">Drop</option>
                            <option value="Ointment">Ointment</option>
                          </select>
                        </div>
                        <div className="col-span-3">
                          <input
                            type="text"
                            placeholder="Dosage (500mg)"
                            value={med.dosage}
                            onChange={(e) => handleUpdateMedicine(index, 'dosage', e.target.value)}
                            className="w-full py-1.5 px-2 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-4">
                          <input
                            type="text"
                            placeholder="Frequency (1-0-1)"
                            value={med.frequency}
                            onChange={(e) => handleUpdateMedicine(index, 'frequency', e.target.value)}
                            className="w-full py-1.5 px-2 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                          />
                        </div>
                        <div className="col-span-4">
                          <input
                            type="text"
                            placeholder="Duration (7 Days)"
                            value={med.duration}
                            onChange={(e) => handleUpdateMedicine(index, 'duration', e.target.value)}
                            className="w-full py-1.5 px-2 bg-white border border-slate-200 rounded-lg text-xs"
                          />
                        </div>
                        <div className="col-span-3">
                          <input
                            type="text"
                            placeholder="Instructions"
                            value={med.instructions}
                            onChange={(e) => handleUpdateMedicine(index, 'instructions', e.target.value)}
                            className="w-full py-1.5 px-2 bg-white border border-slate-200 rounded-lg text-xs"
                          />
                        </div>
                        <div className="col-span-1 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveMedicine(index)}
                            className="text-red-500 hover:text-red-700 text-xs font-bold"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Special Instructions & Follow-up */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Special Advice / Lifestyle Recommendations
                  </label>
                  <textarea
                    rows={2}
                    value={rxAdvice}
                    onChange={(e) => setRxAdvice(e.target.value)}
                    className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Next Follow-Up Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={rxFollowUp}
                    onChange={(e) => setRxFollowUp(e.target.value)}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsPrescriptionModalOpen(false)}
                  className="flex-1 py-2 px-3 border border-slate-200 text-slate-700 rounded-xl text-xs font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-xs"
                >
                  Submit & Email Prescription to Patient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
