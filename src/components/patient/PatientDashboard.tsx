import React, { useState, useEffect } from 'react';
import {
  User,
  DoctorSchedule,
  ScheduleSlot,
  Appointment,
  Invoice,
  Prescription,
  PatientProfile,
} from '../../types';
import { StorageService } from '../../lib/storage';
import {
  Calendar,
  Clock,
  Video,
  CreditCard,
  CheckCircle,
  AlertCircle,
  FileText,
  Search,
  Filter,
  DollarSign,
  CalendarX,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  Info,
  Sparkles,
  Heart,
  Brain,
  Activity,
  Award,
  ArrowRight,
  Star,
  Users,
} from 'lucide-react';
import {
  isScheduleVisibleToPatient,
  calculateRefundEligibility,
  format12Hour,
  formatDate,
} from '../../lib/time';

interface PatientDashboardProps {
  currentUser: User | null;
  activeSubTab: 'browse' | 'appointments' | 'prescriptions';
  onRequireLogin: () => void;
  onOpenInvoiceModal: (invoice: Invoice) => void;
  onOpenPrescriptionModal: (prescription: Prescription) => void;
  onOpenVideoRoom: (appointment: Appointment) => void;
  onNavigateTab?: (tab: string) => void;
  onOpenApplyDoctor?: () => void;
}

export const PatientDashboard: React.FC<PatientDashboardProps> = ({
  currentUser,
  activeSubTab,
  onRequireLogin,
  onOpenInvoiceModal,
  onOpenPrescriptionModal,
  onOpenVideoRoom,
  onNavigateTab,
  onOpenApplyDoctor,
}) => {
  const simulatedTime = StorageService.getSimulatedTime();
  const simulatedDate = StorageService.getSimulatedDate();

  const [schedules, setSchedules] = useState<DoctorSchedule[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState('ALL');

  // Interactive Symptom Checker State (Extra feature requested)
  const [selectedSymptom, setSelectedSymptom] = useState<string | null>(null);

  // Booking Modal State
  const [selectedSchedule, setSelectedSchedule] = useState<DoctorSchedule | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<ScheduleSlot | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'bkash' | 'nagad'>('card');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('888');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [bookedAppointmentSuccess, setBookedAppointmentSuccess] = useState<Appointment | null>(null);

  // Cancellation Modal State
  const [appointmentToCancel, setAppointmentToCancel] = useState<Appointment | null>(null);

  const loadData = () => {
    setSchedules(StorageService.getSchedules());
    if (currentUser) {
      setAppointments(StorageService.getAppointments().filter((a) => a.patientId === currentUser.id));
      setPrescriptions(StorageService.getPrescriptions().filter((p) => p.patientId === currentUser.id));
    } else {
      setAppointments([]);
      setPrescriptions([]);
    }
  };

  useEffect(() => {
    loadData();
    const handleTimeChange = () => loadData();
    window.addEventListener('ph_time_changed', handleTimeChange);
    return () => window.removeEventListener('ph_time_changed', handleTimeChange);
  }, [currentUser]);

  // Section 7.1 Filter: Today's schedules, visible only up until start time, and not fully booked
  const visibleSchedules = schedules.filter((sch) => {
    const visibility = isScheduleVisibleToPatient(
      sch.date,
      sch.startTime,
      sch.status,
      sch.totalSlots,
      sch.bookedSlotsCount,
      simulatedDate,
      simulatedTime
    );

    if (!visibility.visible) return false;

    // Search query
    const matchesSearch =
      sch.doctorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sch.doctorSpecialization.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSpecialization =
      selectedSpecialization === 'ALL' ||
      sch.doctorSpecialization.toLowerCase().includes(selectedSpecialization.toLowerCase());

    return matchesSearch && matchesSpecialization;
  });

  const specializations = [
    'ALL',
    'Cardiology',
    'Internal Medicine',
    'Neurology',
  ];

  const symptomList = [
    { label: 'Chest Tightness & Palpitations', spec: 'Cardiology', doctorHint: 'Dr. Sarah Jenkins' },
    { label: 'Chronic Headache & Migraine', spec: 'Neurology', doctorHint: 'Dr. Emily Chen' },
    { label: 'High Fever, Fatigue & Blood Sugar', spec: 'Internal Medicine', doctorHint: 'Dr. Arthur J. Finn' },
    { label: 'High Blood Pressure Checkup', spec: 'Cardiology', doctorHint: 'Dr. Sarah Jenkins' },
  ];

  const handleSelectSymptom = (spec: string, label: string) => {
    setSelectedSymptom(label);
    setSelectedSpecialization(spec);
    // Smooth scroll to schedules
    const el = document.getElementById('schedules-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  // Initiate Booking
  const handleSelectSlot = (schedule: DoctorSchedule, slot: ScheduleSlot) => {
    if (!currentUser) {
      onRequireLogin();
      return;
    }
    if (slot.isBooked) return;

    setSelectedSchedule(schedule);
    setSelectedSlot(slot);
    setIsCheckoutOpen(true);
  };

  // Process Booking & Upfront Payment (Section 7.2)
  const handleConfirmPayment = () => {
    if (!selectedSchedule || !selectedSlot || !currentUser) return;
    setIsProcessingPayment(true);

    setTimeout(() => {
      const patientProfile = StorageService.getPatientByUserId(currentUser.id);
      const patientName = patientProfile?.name || currentUser.email.split('@')[0];
      const patientPhone = patientProfile?.phone || '+1 (555) 012-3456';

      // Serial position: count of existing appointments in this schedule + 1
      const scheduleAppointments = StorageService.getAppointments().filter(
        (a) => a.scheduleId === selectedSchedule.id
      );
      const serialNumber = scheduleAppointments.length + 1;

      const newAppointmentId = `appt_${Date.now()}`;
      const transactionId = `TX_${Date.now().toString().slice(-6)}`;

      const newAppointment: Appointment = {
        id: newAppointmentId,
        serialNumber,
        scheduleId: selectedSchedule.id,
        doctorId: selectedSchedule.doctorId,
        doctorName: selectedSchedule.doctorName,
        doctorSpecialization: selectedSchedule.doctorSpecialization,
        patientId: currentUser.id,
        patientName,
        patientEmail: currentUser.email,
        patientPhone,
        date: selectedSchedule.date,
        slotStartTime: selectedSlot.startTime,
        slotEndTime: selectedSlot.endTime,
        slotNumber: selectedSlot.slotNumber,
        meetLink: selectedSchedule.meetLink,
        status: 'booked',
        fee: selectedSchedule.doctorFee,
        paymentMethod,
        transactionId,
        paidAt: new Date().toISOString(),
        refunded: false,
      };

      // Mark slot as booked in schedule
      const updatedSlots = selectedSchedule.slots.map((s) =>
        s.slotNumber === selectedSlot.slotNumber
          ? { ...s, isBooked: true, appointmentId: newAppointmentId }
          : s
      );

      const updatedSchedule: DoctorSchedule = {
        ...selectedSchedule,
        slots: updatedSlots,
        bookedSlotsCount: selectedSchedule.bookedSlotsCount + 1,
        isTimeRangeLocked: true, // Section 6.2: locked once 1st appointment is booked!
      };

      // Generate invoice
      const newInvoice: Invoice = {
        id: `inv_${Date.now()}`,
        invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        appointmentId: newAppointmentId,
        serialNumber,
        patientName,
        patientEmail: currentUser.email,
        doctorName: selectedSchedule.doctorName,
        doctorSpecialization: selectedSchedule.doctorSpecialization,
        date: selectedSchedule.date,
        timeSlot: `${selectedSlot.startTime} - ${selectedSlot.endTime}`,
        meetLink: selectedSchedule.meetLink,
        amount: selectedSchedule.doctorFee,
        paymentMethod: paymentMethod.toUpperCase(),
        transactionId,
        paidAt: new Date().toISOString(),
        status: 'PAID',
      };

      // Save appointment, schedule, invoice
      StorageService.saveAppointment(newAppointment);
      StorageService.saveSchedule(updatedSchedule);
      StorageService.saveInvoice(newInvoice);

      // Section 7.2: Send Invoice Email with Meet Link & Serial Number
      StorageService.sendEmail({
        to: currentUser.email,
        subject: `Appointment Confirmed: Serial #${serialNumber} with ${selectedSchedule.doctorName}`,
        title: 'Appointment Booking & Invoice Confirmation',
        body: `Your appointment is confirmed! Serial Number: #${serialNumber}. Date: ${selectedSchedule.date} at ${format12Hour(selectedSlot.startTime)}. Video Room Link: ${selectedSchedule.meetLink}. Total Paid: $${selectedSchedule.doctorFee}.`,
        type: 'invoice',
        metadata: {
          invoiceId: newInvoice.id,
          meetLink: selectedSchedule.meetLink,
          serialNumber,
        },
      });

      setIsProcessingPayment(false);
      setIsCheckoutOpen(false);
      setBookedAppointmentSuccess(newAppointment);
      loadData();
    }, 600);
  };

  // Section 10: Cancellation & Refund Logic
  const handleConfirmCancelAppointment = (appointment: Appointment) => {
    const schedule = StorageService.getScheduleById(appointment.scheduleId);
    const scheduleStartTime = schedule ? schedule.startTime : appointment.slotStartTime;

    const refundCalc = calculateRefundEligibility(
      appointment.date,
      scheduleStartTime,
      appointment.fee,
      simulatedDate,
      simulatedTime
    );

    appointment.status = 'cancelled';
    appointment.cancelledAt = new Date().toISOString();
    appointment.refunded = refundCalc.eligibleForRefund;
    appointment.refundAmount = refundCalc.refundAmount;
    appointment.refundReason = refundCalc.explanation;

    // Free up slot in schedule
    if (schedule) {
      schedule.slots = schedule.slots.map((s) =>
        s.appointmentId === appointment.id ? { ...s, isBooked: false, appointmentId: undefined } : s
      );
      schedule.bookedSlotsCount = Math.max(0, schedule.bookedSlotsCount - 1);
      StorageService.saveSchedule(schedule);
    }

    // Update invoice
    const invoice = StorageService.getInvoiceByAppointmentId(appointment.id);
    if (invoice) {
      invoice.status = refundCalc.eligibleForRefund ? 'REFUNDED' : 'CANCELLED';
      StorageService.saveInvoice(invoice);
    }

    StorageService.saveAppointment(appointment);

    // Send Cancellation & Refund Email
    StorageService.sendEmail({
      to: appointment.patientEmail,
      subject: `Appointment Cancelled - Serial #${appointment.serialNumber}`,
      title: refundCalc.eligibleForRefund ? 'Appointment Cancelled & 100% Refund Issued' : 'Appointment Cancelled (Non-Refundable)',
      body: `Your appointment with ${appointment.doctorName} on ${appointment.date} has been cancelled. Policy result: ${refundCalc.explanation}`,
      type: 'refund',
    });

    setAppointmentToCancel(null);
    loadData();
  };

  return (
    <div className="space-y-12">
      {/* 1. BROWSE / HOME TAB */}
      {activeSubTab === 'browse' && (
        <div className="space-y-12">
          {/* Hero Section */}
          <div className="relative rounded-3xl overflow-hidden bg-slate-900 text-white p-8 lg:p-14 shadow-lg border border-slate-800">
            <div className="absolute inset-0 opacity-25">
              <img
                src="/src/assets/images/hero_medical_consultation_1792946656975.jpg"
                alt="Medical Room"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="relative z-10 max-w-2xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-teal-950/80 text-teal-400 text-xs font-semibold uppercase tracking-wider border border-teal-800">
                <ShieldCheck className="w-4 h-4 text-teal-400" />
                <span>Verified Telemedicine Platform</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
                Online Doctor Consultations & Digital Prescriptions
              </h1>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                Connect directly with board-certified specialist physicians. Book open 20-minute consultation slots on today's schedule, join secure video calls, and get official digital prescriptions delivered to your inbox.
              </p>

              {/* Exact Spec Rule Banner */}
              <div className="pt-2 flex items-center gap-2 text-xs text-teal-200">
                <Info className="w-4 h-4 text-teal-400 shrink-0" />
                <span>
                  Consultations for today (<strong>{simulatedDate}</strong>). Schedules close automatically once their start time arrives.
                </span>
              </div>

              <div className="pt-3 flex flex-wrap gap-3">
                <a
                  href="#schedules-section"
                  className="px-5 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
                >
                  Book Open Slot Today
                </a>
                {onNavigateTab && (
                  <button
                    onClick={() => onNavigateTab('how_it_works')}
                    className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl transition-colors backdrop-blur-xs"
                  >
                    How Telemedicine Works
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Interactive Feature: Symptom Triage & Specialist Finder */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 text-teal-700 font-bold text-xs uppercase tracking-wider">
                  <Sparkles className="w-4 h-4" />
                  <span>Interactive Clinical Symptom Finder</span>
                </div>
                <h2 className="text-lg font-bold text-slate-900 mt-1">
                  What medical symptoms are you experiencing today?
                </h2>
              </div>
              <span className="text-xs text-slate-500">Click a symptom to view matching specialists</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
              {symptomList.map((item) => (
                <button
                  key={item.label}
                  onClick={() => handleSelectSymptom(item.spec, item.label)}
                  className={`text-left p-3.5 rounded-2xl border transition-all ${
                    selectedSymptom === item.label
                      ? 'border-teal-600 bg-teal-50/80 shadow-xs ring-1 ring-teal-600'
                      : 'border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300'
                  }`}
                >
                  <span className="text-xs font-bold text-slate-900 block">{item.label}</span>
                  <span className="text-[11px] text-teal-700 font-medium block mt-1">
                    Department: {item.spec}
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Recommended: {item.doctorHint}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Today's Schedules & Booking Engine */}
          <div id="schedules-section" className="space-y-6 pt-2">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Today's Available Doctor Schedules</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pick an open 20-minute slot. Upfront payment generates your invoice and meeting link.
                </p>
              </div>

              {/* Specialization Filter Buttons */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto p-1 bg-slate-100 rounded-xl">
                {specializations.map((spec) => (
                  <button
                    key={spec}
                    onClick={() => {
                      setSelectedSpecialization(spec);
                      setSelectedSymptom(null);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                      selectedSpecialization === spec
                        ? 'bg-white text-slate-900 font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {spec}
                  </button>
                ))}
              </div>
            </div>

            {/* Schedule Cards Grid */}
            {visibleSchedules.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-3">
                <CalendarX className="w-12 h-12 text-slate-400 mx-auto" />
                <h3 className="text-base font-bold text-slate-900">No Schedules Available for Booking Right Now</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  Per healthcare platform rules, patients only see today’s published schedules up until their start time. Adjust the Simulated System Clock at the top right to test earlier times (e.g. 10:00 AM)!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {visibleSchedules.map((sch) => {
                  const availableSlots = sch.slots.filter((s) => !s.isBooked);
                  return (
                    <div
                      key={sch.id}
                      className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-5 hover:border-teal-400 transition-colors"
                    >
                      {/* Doctor Info */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <img
                            src={sch.doctorAvatar || '/src/assets/images/avatar_doctor_sarah_1792946656894.jpg'}
                            alt={sch.doctorName}
                            className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shrink-0 shadow-xs"
                          />
                          <div>
                            <h3 className="text-base font-bold text-slate-900">{sch.doctorName}</h3>
                            <p className="text-xs font-semibold text-teal-700">{sch.doctorSpecialization}</p>
                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                              <span>Today: <strong className="font-mono text-slate-700">{format12Hour(sch.startTime)} – {format12Hour(sch.endTime)}</strong></span>
                              <span>·</span>
                              <span>{sch.durationHours} hrs</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-[10px] text-slate-400 block uppercase font-semibold">Fee</span>
                          <span className="text-xl font-bold font-mono text-teal-700">${sch.doctorFee}</span>
                        </div>
                      </div>

                      {/* Slots Selection Grid */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-800">Select 20-Min Appointment Slot:</span>
                          <span className="text-slate-500 font-mono text-[11px]">
                            {availableSlots.length} open
                          </span>
                        </div>

                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {sch.slots.map((slot) => (
                            <button
                              key={slot.slotNumber}
                              disabled={slot.isBooked}
                              onClick={() => handleSelectSlot(sch, slot)}
                              className={`py-2 px-2.5 rounded-xl text-xs font-mono text-center transition-all ${
                                slot.isBooked
                                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed line-through'
                                  : 'bg-slate-50 hover:bg-teal-600 hover:text-white border border-slate-200 hover:border-teal-600 text-slate-800 font-bold hover:shadow-xs'
                              }`}
                            >
                              {format12Hour(slot.startTime)}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Card Footer */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1.5 text-[11px] text-teal-800 font-medium">
                          <Video className="w-3.5 h-3.5 text-teal-600" />
                          Includes Video Consultation
                        </span>
                        <span className="text-[11px] font-semibold text-amber-700">
                          Bookable until {format12Hour(sch.startTime)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 4-Step Visual Telemedicine Journey */}
          <div className="bg-slate-900 text-white rounded-3xl p-8 lg:p-12 border border-slate-800 space-y-8">
            <div>
              <span className="text-xs font-bold text-teal-400 uppercase tracking-wider block mb-1">
                How It Works
              </span>
              <h2 className="text-2xl font-extrabold text-white">The 4-Step Patient Telemedicine Flow</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-2">
                <span className="font-mono text-2xl font-bold text-teal-400">01</span>
                <h4 className="text-sm font-bold text-white">Find Doctor Schedule</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Browse board-certified doctors available today. Verified medical license credentials displayed upfront.
                </p>
              </div>

              <div className="space-y-2">
                <span className="font-mono text-2xl font-bold text-teal-400">02</span>
                <h4 className="text-sm font-bold text-white">Book Slot & Upfront Pay</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Select an open 20-minute slot and complete payment. You receive an instant Serial Number (#1, #2) & invoice PDF.
                </p>
              </div>

              <div className="space-y-2">
                <span className="font-mono text-2xl font-bold text-teal-400">03</span>
                <h4 className="text-sm font-bold text-white">Attend Video Call</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Join the secure video room at your scheduled slot. The doctor starts the call (setting status to ongoing).
                </p>
              </div>

              <div className="space-y-2">
                <span className="font-mono text-2xl font-bold text-teal-400">04</span>
                <h4 className="text-sm font-bold text-white">Digital Prescription</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Doctor writes digital Rx with exact dosages, findings, and advice. Sent directly to your email and patient dashboard.
                </p>
              </div>
            </div>
          </div>

          {/* Patient Reviews & Social Proof */}
          <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xs space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Verified Patient Reviews</h2>
                <p className="text-xs text-slate-500">Real feedback from patients who consulted on PH Healthcare</p>
              </div>
              <div className="flex items-center gap-1 text-amber-500">
                <Star className="w-4 h-4 fill-amber-500" />
                <span className="font-bold text-xs text-slate-800">4.9 / 5.0 (1,240+ consultations)</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                <div className="flex text-amber-400 gap-0.5">
                  {'★★★★★'}
                </div>
                <p className="text-slate-600 leading-relaxed italic">
                  "Dr. Sarah was punctual, attentive, and explained my hypertension medication adjustment clearly. I received the digital prescription in my email immediately after the video call!"
                </p>
                <div className="font-bold text-slate-900">— Robert K., New York</div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                <div className="flex text-amber-400 gap-0.5">
                  {'★★★★★'}
                </div>
                <p className="text-slate-600 leading-relaxed italic">
                  "The 20-minute slot booking system is brilliant. No waiting in clinic lobbies. Had my video consult with Dr. Arthur, and my pharmacy accepted the digital PDF without any issues."
                </p>
                <div className="font-bold text-slate-900">— Maria S., Chicago</div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                <div className="flex text-amber-400 gap-0.5">
                  {'★★★★★'}
                </div>
                <p className="text-slate-600 leading-relaxed italic">
                  "I had to cancel once when a conflict arose 3 hours before start time, and the 100% refund was processed instantly just as promised in the policy."
                </p>
                <div className="font-bold text-slate-900">— David L., California</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. MY APPOINTMENTS TAB */}
      {activeSubTab === 'appointments' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">My Consultation Appointments</h2>
              <p className="text-xs text-slate-500">
                Track status, join video consultations, view invoices, or manage cancellations
              </p>
            </div>
            <span className="text-xs font-mono text-slate-600 font-semibold">
              Total: {appointments.length}
            </span>
          </div>

          {appointments.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-2">
              <Calendar className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">No appointments booked yet</h3>
              <p className="text-xs text-slate-500">
                Browse available doctors above and pick a slot on today’s schedule to consult.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {appointments.map((app) => {
                const schedule = StorageService.getScheduleById(app.scheduleId);
                const scheduleStartTime = schedule ? schedule.startTime : app.slotStartTime;
                const refundCalc = calculateRefundEligibility(
                  app.date,
                  scheduleStartTime,
                  app.fee,
                  simulatedDate,
                  simulatedTime
                );
                const invoice = StorageService.getInvoiceByAppointmentId(app.id);
                const prescription = app.prescriptionId ? StorageService.getPrescriptionById(app.prescriptionId) : null;

                return (
                  <div
                    key={app.id}
                    className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 flex flex-col items-center justify-center shrink-0">
                        <span className="text-[10px] text-teal-700 font-semibold uppercase">Serial</span>
                        <span className="text-base font-bold font-mono text-teal-900">#{app.serialNumber}</span>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-slate-900">{app.doctorName}</h3>
                          <span
                            className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                              app.status === 'booked'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : app.status === 'ongoing'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                                : app.status === 'completed'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-red-50 text-red-700 border border-red-200'
                            }`}
                          >
                            {app.status}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-teal-700 mt-0.5">{app.doctorSpecialization}</p>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                          <span>Date: <strong className="font-mono text-slate-700">{app.date}</strong></span>
                          <span>·</span>
                          <span>Slot: <strong className="font-mono text-slate-700">{format12Hour(app.slotStartTime)} – {format12Hour(app.slotEndTime)}</strong></span>
                          <span>·</span>
                          <span>Fee: <strong className="font-mono text-slate-900">${app.fee}</strong></span>
                        </div>

                        {app.status === 'cancelled' && (
                          <div className="mt-2 text-xs text-red-700 font-medium bg-red-50 p-2 rounded-lg border border-red-200">
                            Cancelled {app.refunded ? `(Full refund of $${app.refundAmount} issued)` : '(No refund - cancelled within 1 hr of schedule start)'}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0 self-end md:self-auto">
                      {/* View Invoice */}
                      {invoice && (
                        <button
                          onClick={() => onOpenInvoiceModal(invoice)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5 text-slate-500" />
                          <span>Invoice</span>
                        </button>
                      )}

                      {/* Join Video Consultation (if booked or ongoing) */}
                      {(app.status === 'booked' || app.status === 'ongoing') && (
                        <button
                          onClick={() => onOpenVideoRoom(app)}
                          className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Join Video Call</span>
                        </button>
                      )}

                      {/* View Prescription (if completed) */}
                      {app.status === 'completed' && prescription && (
                        <button
                          onClick={() => onOpenPrescriptionModal(prescription)}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>View Prescription</span>
                        </button>
                      )}

                      {/* Cancel Appointment (Section 10) */}
                      {app.status === 'booked' && (
                        <button
                          onClick={() => setAppointmentToCancel(app)}
                          className="px-3 py-1.5 text-red-600 hover:bg-red-50 border border-red-200 rounded-lg text-xs font-medium transition-colors"
                        >
                          Cancel Appointment
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 3. MY PRESCRIPTIONS TAB */}
      {activeSubTab === 'prescriptions' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">My Digital Prescriptions</h2>
              <p className="text-xs text-slate-500">
                Official doctor prescriptions, diagnosis, vitals, and medication instructions
              </p>
            </div>
          </div>

          {prescriptions.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-2">
              <FileText className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">No prescriptions on record</h3>
              <p className="text-xs text-slate-500">
                Once a doctor finishes a consultation and submits your prescription, it will appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {prescriptions.map((rx) => (
                <div
                  key={rx.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3 hover:border-teal-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{rx.doctorName}</h3>
                      <p className="text-xs text-teal-700 font-semibold">{rx.doctorSpecialization}</p>
                      <span className="text-[11px] text-slate-400 font-mono">Date: {rx.consultationDate}</span>
                    </div>
                    <button
                      onClick={() => onOpenPrescriptionModal(rx)}
                      className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>View & Print</span>
                    </button>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                    <span className="font-semibold text-slate-800">Diagnosis: </span>
                    <span className="text-slate-600">{rx.diagnosis}</span>
                  </div>

                  <div className="text-xs text-slate-500">
                    <span>Prescribed Medications ({rx.medicines.length}): </span>
                    <strong className="text-slate-700">
                      {rx.medicines.map((m) => m.name).join(', ')}
                    </strong>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Upfront Payment & Checkout Modal (Section 7.2) */}
      {isCheckoutOpen && selectedSchedule && selectedSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Confirm & Pay for Consultation</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Upfront payment secures your 20-minute video slot
                </p>
              </div>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Order summary */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Doctor:</span>
                  <span className="font-bold text-slate-900">{selectedSchedule.doctorName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Specialization:</span>
                  <span className="text-slate-700">{selectedSchedule.doctorSpecialization}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Slot Time:</span>
                  <span className="font-mono font-semibold text-slate-900">
                    {format12Hour(selectedSlot.startTime)} – {format12Hour(selectedSlot.endTime)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 font-bold text-sm">
                  <span className="text-slate-900">Total Consultation Fee:</span>
                  <span className="font-mono text-teal-700">${selectedSchedule.doctorFee.toFixed(2)}</span>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Select Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-colors ${
                      paymentMethod === 'card'
                        ? 'bg-teal-600 text-white border-teal-700 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Credit Card
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('bkash')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-colors ${
                      paymentMethod === 'bkash'
                        ? 'bg-pink-600 text-white border-pink-700 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    bKash
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('nagad')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-colors ${
                      paymentMethod === 'nagad'
                        ? 'bg-orange-600 text-white border-orange-700 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Nagad
                  </button>
                </div>
              </div>

              {paymentMethod === 'card' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Card Number</label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Expiry</label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">CVC / CVV</label>
                      <input
                        type="password"
                        maxLength={4}
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value)}
                        className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === 'bkash' && (
                <div className="p-3 bg-pink-50 border border-pink-200 rounded-xl text-xs text-pink-900 space-y-1">
                  <p className="font-semibold">bKash Payment Gateway Simulator</p>
                  <p className="text-[11px] text-pink-800">Simulating merchant checkout for ${selectedSchedule.doctorFee}. Click confirm to authorize payment.</p>
                </div>
              )}

              {paymentMethod === 'nagad' && (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl text-xs text-orange-900 space-y-1">
                  <p className="font-semibold">Nagad Payment Gateway Simulator</p>
                  <p className="text-[11px] text-orange-800">Simulating merchant checkout for ${selectedSchedule.doctorFee}. Click confirm to authorize payment.</p>
                </div>
              )}

              {/* Refund Notice (Section 10) */}
              <p className="text-[11px] text-slate-500 leading-normal">
                Cancellation policy: You may cancel for a 100% refund up to 1 hour before the schedule’s start time. Within 1 hour of start time, cancellations are non-refundable.
              </p>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCheckoutOpen(false)}
                  className="flex-1 py-2 px-3 border border-slate-200 text-slate-700 rounded-xl text-xs font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isProcessingPayment}
                  onClick={handleConfirmPayment}
                  className="flex-1 py-2 px-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5"
                >
                  {isProcessingPayment ? (
                    <span>Authorizing...</span>
                  ) : (
                    <span>Pay ${selectedSchedule.doctorFee.toFixed(2)} & Book</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Booking Success Confirmation Dialog */}
      {bookedAppointmentSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 text-center space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">Appointment Booked!</h3>
              <p className="text-xs text-slate-500">
                You have been assigned Serial position:
              </p>
              <div className="inline-block px-3 py-1 bg-teal-100 text-teal-900 rounded-lg font-mono font-bold text-lg my-1">
                Serial #{bookedAppointmentSuccess.serialNumber}
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Your invoice and telemedicine video link have been generated and dispatched to your email.
            </p>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  const invoice = StorageService.getInvoiceByAppointmentId(bookedAppointmentSuccess.id);
                  if (invoice) onOpenInvoiceModal(invoice);
                  setBookedAppointmentSuccess(null);
                }}
                className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold"
              >
                View Invoice PDF
              </button>
              <button
                onClick={() => setBookedAppointmentSuccess(null)}
                className="flex-1 py-2 px-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold"
              >
                Go to Appointments
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Section 10 Cancellation & Refund Confirmation Dialog */}
      {appointmentToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2.5 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <h3 className="text-base font-bold text-slate-900">Cancel Appointment</h3>
            </div>

            {(() => {
              const schedule = StorageService.getScheduleById(appointmentToCancel.scheduleId);
              const scheduleStartTime = schedule ? schedule.startTime : appointmentToCancel.slotStartTime;
              const refund = calculateRefundEligibility(
                appointmentToCancel.date,
                scheduleStartTime,
                appointmentToCancel.fee,
                simulatedDate,
                simulatedTime
              );

              return (
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <p className="font-semibold text-slate-900">Appointment Details:</p>
                    <p className="text-slate-600">{appointmentToCancel.doctorName} · Serial #{appointmentToCancel.serialNumber}</p>
                    <p className="font-mono text-slate-600">Slot: {format12Hour(appointmentToCancel.slotStartTime)} – {format12Hour(appointmentToCancel.slotEndTime)}</p>
                  </div>

                  {/* Exact refund calculation according to Section 10 */}
                  <div
                    className={`p-3 rounded-xl border ${
                      refund.eligibleForRefund
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : 'bg-amber-50 border-amber-200 text-amber-900'
                    }`}
                  >
                    <span className="font-bold block mb-1">
                      {refund.eligibleForRefund ? '100% Refund Available' : 'No Refund Policy Applied'}
                    </span>
                    <p className="text-[11px] leading-relaxed">{refund.explanation}</p>
                  </div>

                  <p className="text-[11px] text-slate-500">
                    Rule: Cancellations more than 1 hour before schedule start time qualify for a full refund. Cancellations within 1 hour, during the schedule, or after are non-refundable.
                  </p>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setAppointmentToCancel(null)}
                      className="flex-1 py-2 px-3 border border-slate-200 text-slate-700 rounded-xl text-xs font-medium hover:bg-slate-50"
                    >
                      Keep Appointment
                    </button>
                    <button
                      type="button"
                      onClick={() => handleConfirmCancelAppointment(appointmentToCancel)}
                      className="flex-1 py-2 px-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold shadow-xs"
                    >
                      Confirm Cancellation
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};
