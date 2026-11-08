import React, { useState, useEffect } from 'react';
import { User, DoctorProfile, DoctorSchedule, Appointment, Prescription } from '../../types';
import { api } from '../../lib/api';
import {
  mapBackendDoctor,
  mapBackendSchedule,
  mapBackendAppointment,
} from '../../lib/mappers';
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
  Loader2,
  Trash2,
} from 'lucide-react';
import {
  validateScheduleTimes,
  generateScheduleSlots,
  format12Hour,
  calculateDurationHours,
  formatDate,
  formatReadableDate,
  formatTimeFromISO,
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
  const [doctor, setDoctor] = useState<DoctorProfile | null>(currentUser.doctor || null);
  const [schedules, setSchedules] = useState<DoctorSchedule[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Schedule Modal State
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<DoctorSchedule | null>(null);
  const [scheduleDate, setScheduleDate] = useState(() => formatDate(new Date()));
  const [startTime, setStartTime] = useState('14:00');
  const [endTime, setEndTime] = useState('19:00');
  const [meetLink, setMeetLink] = useState('https://meet.google.com/doc-healthcare');
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);

  // Prescription Modal State
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
  const [selectedAppointmentForRx, setSelectedAppointmentForRx] = useState<Appointment | null>(null);
  const [rxDiagnosis, setRxDiagnosis] = useState('');
  const [rxFindings, setRxFindings] = useState('');
  const [rxMedicines, setRxMedicines] = useState<Array<{ name: string; dosage: string; duration: string; instructions: string }>>([
    {
      name: 'Amoxicillin & Clavulanate',
      dosage: '625 mg',
      duration: '7 Days',
      instructions: 'Take after meals',
    },
    {
      name: 'Paracetamol',
      dosage: '500 mg',
      duration: '3 Days',
      instructions: 'Take if fever > 100°F',
    },
  ]);
  const [isSubmittingRx, setIsSubmittingRx] = useState(false);
  const [rxError, setRxError] = useState<string | null>(null);

  const fetchDoctorData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Fetch current user with doctor profile if missing
      const meRes = await api.auth.getMe();
      if (meRes.data.doctor) {
        setDoctor(mapBackendDoctor(meRes.data.doctor));
      }

      // 2. Fetch doctor schedules
      const schedRes = await api.schedule.getMySchedules({ limit: 50 });
      setSchedules((schedRes.data || []).map(mapBackendSchedule));

      // 3. Fetch doctor appointments
      const apptRes = await api.appointment.getDoctorAppointments({ limit: 50 });
      setAppointments((apptRes.data || []).map(mapBackendAppointment));
      setIsLoading(false);
    } catch (err: any) {
      setIsLoading(false);
      setError(err?.message || 'Failed to load doctor dashboard data.');
    }
  };

  useEffect(() => {
    fetchDoctorData();
  }, [currentUser]);

  // Open Create Schedule Modal
  const handleOpenCreateSchedule = () => {
    setEditingSchedule(null);
    setScheduleDate(formatDate(new Date()));
    setStartTime('14:00');
    setEndTime('19:00');
    setMeetLink(
      doctor?.name
        ? `https://meet.google.com/${doctor.name.toLowerCase().replace(/[^a-z]/g, '')}-healthcare`
        : 'https://meet.google.com/doc-telemed'
    );
    setScheduleError(null);
    setIsScheduleModalOpen(true);
  };

  // Open Edit Schedule Modal
  const handleOpenEditSchedule = (sch: DoctorSchedule) => {
    setEditingSchedule(sch);
    // Extract date and times from startDateTime and endDateTime
    if (sch.startDateTime && sch.endDateTime) {
      const s = new Date(sch.startDateTime);
      const e = new Date(sch.endDateTime);
      setScheduleDate(formatDate(s));
      setStartTime(s.toTimeString().slice(0, 5));
      setEndTime(e.toTimeString().slice(0, 5));
    } else {
      setScheduleDate(sch.date || formatDate(new Date()));
      setStartTime(sch.startTime || '14:00');
      setEndTime(sch.endTime || '19:00');
    }
    setMeetLink(sch.meetingLink || '');
    setScheduleError(null);
    setIsScheduleModalOpen(true);
  };

  // Save Schedule (Create or Edit)
  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setScheduleError(null);

    // Validate 3 to 8 hours & same day
    const timeValidation = validateScheduleTimes(startTime, endTime);
    if (!timeValidation.valid) {
      setScheduleError(timeValidation.error || 'Invalid schedule duration.');
      return;
    }

    if (!meetLink.trim() || !meetLink.startsWith('http')) {
      setScheduleError('A valid Video Call Meet Link (https://...) is required.');
      return;
    }

    setIsSavingSchedule(true);
    try {
      const [year, month, day] = scheduleDate.split('-').map(Number);
      const [startHour, startMin] = startTime.split(':').map(Number);
      const [endHour, endMin] = endTime.split(':').map(Number);

      const startDateTimeObj = new Date(year, month - 1, day, startHour, startMin, 0, 0);
      const endDateTimeObj = new Date(year, month - 1, day, endHour, endMin, 0, 0);

      const startDateTime = startDateTimeObj.toISOString();
      const endDateTime = endDateTimeObj.toISOString();

      if (editingSchedule) {
        // Updating schedule
        await api.schedule.updateSchedule(editingSchedule.id, {
          startDateTime,
          endDateTime,
          meetingLink: meetLink.trim(),
        });
      } else {
        // Creating new schedule in DRAFT
        await api.schedule.createSchedule({
          startDateTime,
          endDateTime,
          meetingLink: meetLink.trim(),
        });
      }

      setIsSavingSchedule(false);
      setIsScheduleModalOpen(false);
      fetchDoctorData();
    } catch (err: any) {
      setIsSavingSchedule(false);
      setScheduleError(err?.message || 'Failed to save schedule. Check date constraints.');
    }
  };

  // Publish Schedule
  const handlePublishSchedule = async (scheduleId: string) => {
    try {
      await api.schedule.publishSchedule(scheduleId);
      fetchDoctorData();
    } catch (err: any) {
      alert(err?.message || 'Failed to publish schedule.');
    }
  };

  // Delete Schedule
  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return;
    try {
      await api.schedule.deleteSchedule(scheduleId);
      fetchDoctorData();
    } catch (err: any) {
      alert(err?.message || 'Failed to delete schedule.');
    }
  };

  // Appointment Status Transitions: CONFIRMED -> ONGOING -> COMPLETED
  const handleStartConsultation = async (app: Appointment) => {
    try {
      await api.appointment.updateAppointmentStatus(app.id, { status: 'ONGOING' });
      fetchDoctorData();
      onOpenVideoRoom({
        ...app,
        meetLink: app.schedule?.meetingLink || app.meetLink,
      });
    } catch (err: any) {
      alert(err?.message || 'Failed to update consultation status.');
    }
  };

  const handleCompleteConsultation = async (appointmentId: string) => {
    try {
      await api.appointment.updateAppointmentStatus(appointmentId, { status: 'COMPLETED' });
      fetchDoctorData();
    } catch (err: any) {
      alert(err?.message || 'Failed to complete consultation.');
    }
  };

  // Open Prescription Builder
  const handleOpenPrescriptionBuilder = (app: Appointment) => {
    if (app.status !== 'COMPLETED') {
      alert('Prescriptions can only be written after the appointment is marked as COMPLETED.');
      return;
    }
    setSelectedAppointmentForRx(app);
    setRxDiagnosis('');
    setRxFindings('');
    setRxError(null);
    setIsPrescriptionModalOpen(true);
  };

  const handleAddMedicine = () => {
    setRxMedicines([
      ...rxMedicines,
      {
        name: '',
        dosage: '',
        duration: '5 Days',
        instructions: 'Take after meals',
      },
    ]);
  };

  const handleUpdateMedicine = (index: number, field: string, value: string) => {
    const updated = [...rxMedicines];
    (updated[index] as any)[field] = value;
    setRxMedicines(updated);
  };

  const handleRemoveMedicine = (index: number) => {
    setRxMedicines(rxMedicines.filter((_, i) => i !== index));
  };

  const handleSubmitPrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppointmentForRx) return;

    if (rxFindings.trim().length < 5) {
      setRxError('Key clinical findings must be at least 5 characters long.');
      return;
    }

    const validMedicines = rxMedicines.filter((m) => m.name.trim() !== '');
    if (validMedicines.length === 0) {
      setRxError('At least one medicine with a name is required.');
      return;
    }

    setIsSubmittingRx(true);
    setRxError(null);
    try {
      const result = await api.prescription.createPrescription({
        appointmentId: selectedAppointmentForRx.id,
        findings: rxFindings.trim(),
        medicines: validMedicines,
      });

      setIsSubmittingRx(false);
      setIsPrescriptionModalOpen(false);
      fetchDoctorData();

      const newRx: Prescription = {
        id: result.data.id || `rx_${Date.now()}`,
        appointmentId: selectedAppointmentForRx.id,
        scheduleId: selectedAppointmentForRx.scheduleId,
        doctorId: doctor?.id || selectedAppointmentForRx.doctorId,
        doctorName: doctor?.name || selectedAppointmentForRx.doctorName,
        doctorSpecialization: doctor?.specialization || selectedAppointmentForRx.doctorSpecialization,
        doctorLicenseNumber: doctor?.medicalLicenseNumber || 'BMDC-VERIFIED',
        doctorDegrees: doctor?.degrees || 'MBBS, FCPS',
        patientId: selectedAppointmentForRx.patientId,
        patientName: selectedAppointmentForRx.patientName || 'Registered Patient',
        consultationDate: selectedAppointmentForRx.date,
        diagnosis: rxFindings.trim(),
        keyFindings: rxFindings.trim(),
        medicines: validMedicines.map((m, idx) => ({
          id: `med_${idx}`,
          name: m.name,
          type: 'Tablet',
          dosage: m.dosage,
          frequency: '1 + 0 + 1',
          duration: m.duration,
          instructions: m.instructions,
        })),
        specialInstructions: 'Follow medicine course as prescribed.',
        createdAt: new Date().toISOString(),
      };

      onOpenPrescriptionModal(newRx);
    } catch (err: any) {
      setIsSubmittingRx(false);
      setRxError(err?.message || 'Failed to generate digital prescription.');
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        <span className="text-xs font-semibold">Loading doctor schedules and patient consultations...</span>
      </div>
    );
  }

  const doctorName = doctor?.name || currentUser.name || 'Dr. Medical Specialist';

  return (
    <div className="space-y-8">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchDoctorData}
            className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg font-bold"
          >
            Retry
          </button>
        </div>
      )}

      {/* Doctor Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 font-bold text-xl shrink-0">
            {doctorName.replace(/Dr\.\s*/, '').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">{doctorName}</h1>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                Verified Physician
              </span>
            </div>
            <p className="text-xs font-medium text-teal-700 mt-0.5">
              {doctor?.specialization || 'Clinical Specialist'}
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
              <span>
                License: <strong className="font-mono text-slate-700">{doctor?.licenseNumber || 'BMDC-VERIFIED'}</strong>
              </span>
              <span>·</span>
              <span>
                Fee: <strong className="font-mono text-slate-900">৳{doctor?.consultationFee || '800'}</strong>/slot
              </span>
              <span>·</span>
              <span>Exp: {doctor?.experienceYears || 5} Years</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleOpenCreateSchedule}
          className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Schedule</span>
        </button>
      </div>

      {/* Today's Appointments Queue */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Patient Consultation Queue</h2>
            <p className="text-xs text-slate-500">
              Manage patient arrivals, launch video consultations, and issue digital prescriptions
            </p>
          </div>
          <span className="text-xs font-mono text-slate-600 font-medium">
            Total Consultations: {appointments.length}
          </span>
        </div>

        {appointments.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500 text-xs">
            No patient appointments booked yet. Once patients book your published schedules, they will appear here with assigned Serial Numbers.
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 shadow-xs">
            {appointments.map((app) => {
              const patientName = app.patient?.name || app.patientName || 'Registered Patient';
              const isConfirmed = app.status === 'CONFIRMED';
              const isOngoing = app.status === 'ONGOING';
              const isCompleted = app.status === 'COMPLETED';

              return (
                <div
                  key={app.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex flex-col items-center justify-center shrink-0">
                      <span className="text-[10px] text-teal-700 font-semibold uppercase">Serial</span>
                      <span className="text-sm font-bold font-mono text-teal-900">#{app.serialNumber || 1}</span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">{patientName}</span>
                        <span
                          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                            isConfirmed
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : isOngoing
                              ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                              : isCompleted
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {app.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                        <span>
                          Joining Time:{' '}
                          <strong className="font-mono text-slate-700">
                            {app.joiningTime ? formatTimeFromISO(app.joiningTime) : (app.slotStartTime ? format12Hour(app.slotStartTime) : 'As Scheduled')}
                          </strong>
                        </span>
                        <span>·</span>
                        <span>
                          Fee:{' '}
                          <strong className="font-mono text-slate-900">
                            ৳{app.fee || app.payment?.amount || doctor?.consultationFee || 800}
                          </strong>
                        </span>
                        {app.patientPhone && (
                          <>
                            <span>·</span>
                            <span>{app.patientPhone}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    {/* CONFIRMED state -> Can Start */}
                    {isConfirmed && (
                      <button
                        onClick={() => handleStartConsultation(app)}
                        className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Start Consultation</span>
                      </button>
                    )}

                    {/* ONGOING state -> Join Video Room & Complete button */}
                    {isOngoing && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            onOpenVideoRoom({
                              ...app,
                              meetLink: app.schedule?.meetingLink || app.meetLink,
                            })
                          }
                          className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 animate-pulse cursor-pointer"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Enter Live Room</span>
                        </button>
                        <button
                          onClick={() => handleCompleteConsultation(app.id)}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Mark Completed</span>
                        </button>
                      </div>
                    )}

                    {/* COMPLETED state -> Write or View Prescription */}
                    {isCompleted && (
                      <>
                        {app.prescriptionUrl ? (
                          <a
                            href={app.prescriptionUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-medium flex items-center gap-1.5"
                          >
                            <FileText className="w-3.5 h-3.5 text-teal-600" />
                            <span>View Rx PDF</span>
                          </a>
                        ) : (
                          <button
                            onClick={() => handleOpenPrescriptionBuilder(app)}
                            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Write Prescription</span>
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

      {/* Consultation Schedules Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">My Consultation Schedules</h2>
            <p className="text-xs text-slate-500">
              Rules: 1 schedule per date, 3 to 8 hours duration, auto 20-min slots. Date locked once published; Time locked once booked.
            </p>
          </div>
        </div>

        {schedules.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500 text-xs">
            You have not created any schedules yet. Click "Create New Schedule" to publish your consultation availability.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {schedules.map((sch) => {
              const isPublished = sch.status === 'PUBLISHED' || sch.status === 'published';
              const bookedCount = sch.bookedSlotsCount;
              const hasBookings = bookedCount > 0;
              const scheduleDateDisplay = sch.startDateTime
                ? formatReadableDate(sch.startDateTime)
                : formatReadableDate(sch.date);

              return (
                <div
                  key={sch.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-teal-600" />
                      <span className="font-bold text-sm text-slate-900 font-mono">
                        {scheduleDateDisplay}
                      </span>
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                          isPublished
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {sch.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {!isPublished && (
                        <button
                          onClick={() => handlePublishSchedule(sch.id)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                        >
                          Publish
                        </button>
                      )}
                      <button
                        onClick={() => handleOpenEditSchedule(sch)}
                        className="text-xs text-teal-700 hover:underline font-semibold cursor-pointer"
                      >
                        Edit
                      </button>
                      {!hasBookings && (
                        <button
                          onClick={() => handleDeleteSchedule(sch.id)}
                          className="p-1 text-slate-400 hover:text-red-600 rounded cursor-pointer"
                          title="Delete Schedule"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Time Range</span>
                      <span className="font-mono font-medium text-slate-800">
                        {sch.startDateTime && sch.endDateTime
                          ? `${formatTimeFromISO(sch.startDateTime)} – ${formatTimeFromISO(sch.endDateTime)}`
                          : `${format12Hour(sch.startTime)} – ${format12Hour(sch.endTime)}`}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Slots</span>
                      <span className="font-mono font-medium text-slate-800">{sch.totalSlots} Slots</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Availability</span>
                      <span className="font-mono font-bold text-teal-800">
                        {sch.totalSlots - bookedCount} Available ({bookedCount} Booked)
                      </span>
                    </div>
                  </div>

                  {/* Lock Rules Indicators with Tooltips */}
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                    <div
                      className="flex items-center gap-1"
                      title={
                        isPublished
                          ? 'Date is permanently locked because the schedule has been published.'
                          : 'Date can be changed while the schedule is in draft.'
                      }
                    >
                      {isPublished ? (
                        <span className="text-amber-700 flex items-center gap-1 font-medium">
                          <Lock className="w-3 h-3" /> Date Locked (Published)
                        </span>
                      ) : (
                        <span className="text-slate-400 flex items-center gap-1">
                          <Unlock className="w-3 h-3" /> Date Editable (Draft)
                        </span>
                      )}
                    </div>

                    <div
                      className="flex items-center gap-1"
                      title={
                        hasBookings
                          ? `Time range is locked because ${bookedCount} slot(s) have been booked.`
                          : 'Time range can be adjusted as long as no appointments are booked.'
                      }
                    >
                      {hasBookings ? (
                        <span className="text-amber-700 flex items-center gap-1 font-medium">
                          <Lock className="w-3 h-3" /> Time Range Locked ({bookedCount} booked)
                        </span>
                      ) : (
                        <span className="text-slate-400 flex items-center gap-1">
                          <Unlock className="w-3 h-3" /> Time Range Editable
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                    <span className="truncate max-w-[200px] font-mono text-[11px]">{sch.meetingLink || sch.meetLink}</span>
                    <a
                      href={sch.meetingLink || sch.meetLink}
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
        )}
      </div>

      {/* Create / Edit Schedule Modal */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingSchedule ? 'Edit Schedule' : 'Create Consultation Schedule'}
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
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                  <span>{scheduleError}</span>
                </div>
              )}

              {/* Date Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-slate-700">Calendar Date</label>
                  {(editingSchedule?.status === 'PUBLISHED' || editingSchedule?.status === 'published') && (
                    <span className="text-[11px] font-medium text-amber-700 flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Locked (Rule: Date locks once published)
                    </span>
                  )}
                </div>
                <input
                  type="date"
                  required
                  disabled={editingSchedule?.status === 'PUBLISHED' || editingSchedule?.status === 'published'}
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
                    {editingSchedule && editingSchedule.bookedSlotsCount > 0 ? (
                      <span className="text-[10px] text-amber-700 flex items-center gap-0.5" title="Locked because appointments exist">
                        <Lock className="w-2.5 h-2.5" /> Locked
                      </span>
                    ) : null}
                  </div>
                  <input
                    type="time"
                    required
                    disabled={Boolean(editingSchedule && editingSchedule.bookedSlotsCount > 0)}
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 disabled:opacity-60 disabled:cursor-not-allowed focus:bg-white focus:border-teal-600 focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-slate-700">End Time</label>
                    {editingSchedule && editingSchedule.bookedSlotsCount > 0 ? (
                      <span className="text-[10px] text-amber-700 flex items-center gap-0.5" title="Locked because appointments exist">
                        <Lock className="w-2.5 h-2.5" /> Locked
                      </span>
                    ) : null}
                  </div>
                  <input
                    type="time"
                    required
                    disabled={Boolean(editingSchedule && editingSchedule.bookedSlotsCount > 0)}
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 disabled:opacity-60 disabled:cursor-not-allowed focus:bg-white focus:border-teal-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Live Computed Slots Preview */}
              <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-xl text-xs flex items-center justify-between">
                <div>
                  <span className="font-semibold text-teal-950">Slot Calculation:</span>
                  <p className="text-[11px] text-teal-800">
                    Duration: {calculateDurationHours(startTime, endTime).toFixed(1)} hrs (Min 3 hrs, Max 8 hrs)
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
                  placeholder="https://meet.google.com/xyz-healthcare"
                  value={meetLink}
                  onChange={(e) => setMeetLink(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
                />
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
                  disabled={isSavingSchedule}
                  className="flex-1 py-2 px-3 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSavingSchedule ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>{editingSchedule ? 'Save Changes' : 'Create Schedule (DRAFT)'}</span>}
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
                  Patient: {selectedAppointmentForRx.patient?.name || selectedAppointmentForRx.patientName} · Serial #{selectedAppointmentForRx.serialNumber || 1}
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
              {rxError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span>{rxError}</span>
                </div>
              )}

              {/* Primary Diagnosis / Findings */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Key Findings & Clinical Diagnosis * <span className="text-slate-400 font-normal">(min 5 chars)</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Patient presents with mild persistent cough for 4 days, clear breath sounds, no fever. Advised to stay hydrated and take prescribed medications..."
                  value={rxFindings}
                  onChange={(e) => setRxFindings(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
                />
              </div>

              {/* Prescribed Medicines */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800">
                    Prescribed Medications (Rx) *
                  </label>
                  <button
                    type="button"
                    onClick={handleAddMedicine}
                    className="text-xs font-medium text-teal-700 hover:text-teal-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Medicine
                  </button>
                </div>

                <div className="space-y-2">
                  {rxMedicines.map((med, index) => (
                    <div key={index} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
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
                          <input
                            type="text"
                            required
                            placeholder="Dosage (500mg)"
                            value={med.dosage}
                            onChange={(e) => handleUpdateMedicine(index, 'dosage', e.target.value)}
                            className="w-full py-1.5 px-2 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                          />
                        </div>
                        <div className="col-span-3">
                          <input
                            type="text"
                            required
                            placeholder="Duration (7 Days)"
                            value={med.duration}
                            onChange={(e) => handleUpdateMedicine(index, 'duration', e.target.value)}
                            className="w-full py-1.5 px-2 bg-white border border-slate-200 rounded-lg text-xs"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-11">
                          <input
                            type="text"
                            placeholder="Instructions (e.g. 1 tablet after meals, twice daily)"
                            value={med.instructions}
                            onChange={(e) => handleUpdateMedicine(index, 'instructions', e.target.value)}
                            className="w-full py-1.5 px-2 bg-white border border-slate-200 rounded-lg text-xs"
                          />
                        </div>
                        <div className="col-span-1 text-right">
                          {rxMedicines.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveMedicine(index)}
                              className="text-red-500 hover:text-red-700 text-xs font-bold cursor-pointer"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
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
                  disabled={isSubmittingRx}
                  className="flex-1 py-2 px-3 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmittingRx ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Submit & Generate Official PDF</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
