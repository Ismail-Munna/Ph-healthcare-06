import React, { useState, useEffect } from 'react';
import {
  User,
  DoctorSchedule,
  ScheduleSlot,
  Appointment,
  Invoice,
  Prescription,
} from '../../types';
import { api, ApiError } from '../../lib/api';
import { mapBackendSchedule, mapBackendAppointment } from '../../lib/mappers';
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
  Loader2,
  Download,
  RefreshCw,
} from 'lucide-react';
import {
  isScheduleVisibleToPatient,
  calculateRefundEligibility,
  format12Hour,
  formatDate,
  formatTime24,
  formatReadableDate,
  formatTimeFromISO,
  timeToMinutes,
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

/**
 * Extract payment gateway URL from various backend response shapes
 * (e.g. res.data.paymentUrl, res.data.bkashURL, res.data.data.bkashURL, res.data.gatewayUrl, etc.)
 */
export const extractPaymentUrl = (res: any): string | null => {
  if (!res) return null;
  if (typeof res === 'string' && res.startsWith('http')) return res.trim();
  if (typeof res?.data === 'string' && res.data.startsWith('http')) return res.data.trim();

  const candidates = [
    res.data?.paymentUrl,
    res.data?.bkashURL,
    res.data?.bkashUrl,
    res.data?.paymentURL,
    res.data?.gatewayUrl,
    res.data?.gatewayURL,
    res.data?.redirectUrl,
    res.data?.redirectURL,
    res.data?.url,
    res.data?.data?.paymentUrl,
    res.data?.data?.bkashURL,
    res.data?.data?.bkashUrl,
    res.data?.gatewayResponse?.bkashURL,
    res.data?.gatewayResponse?.paymentUrl,
    res.paymentUrl,
    res.bkashURL,
    res.bkashUrl,
    res.url,
  ];

  for (const url of candidates) {
    if (typeof url === 'string' && url.trim().startsWith('http')) {
      return url.trim();
    }
  }

  for (const url of candidates) {
    if (typeof url === 'string' && url.trim().length > 0) {
      return url.trim();
    }
  }

  return null;
};

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
  const currentDate = formatDate(new Date());
  const currentTime = formatTime24(new Date());

  const [schedules, setSchedules] = useState<DoctorSchedule[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState('ALL');

  // Interactive Symptom Checker State
  const [selectedSymptom, setSelectedSymptom] = useState<string | null>(null);

  // Booking Modal State
  const [selectedSchedule, setSelectedSchedule] = useState<DoctorSchedule | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<ScheduleSlot | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Callback Notification State (from bKash return)
  const [paymentBanner, setPaymentBanner] = useState<{
    type: 'success' | 'error' | 'cancel';
    message: string;
  } | null>(null);

  // Cancellation Modal State
  const [appointmentToCancel, setAppointmentToCancel] = useState<Appointment | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // 1. Fetch available schedules and user appointments from Backend API
  const loadData = async () => {
    setIsLoading(true);
    setDashboardError(null);

    try {
      const allSchedulesMap = new Map<string, DoctorSchedule>();
      const doctorMap = new Map<string, any>();

      // 1. Fetch public doctors first to build comprehensive doctor metadata
      const publicDocsRes = await api.doctor.getAllDoctorsPublic({ limit: 50 }).catch(() => null);
      if (publicDocsRes && Array.isArray(publicDocsRes.data)) {
        for (const doc of publicDocsRes.data) {
          doctorMap.set(doc.id, doc);
        }
      }

      // 2. Fetch doctors available today with attached schedules
      const doctorsTodayRes = await api.doctor.getAvailableDoctorsToday({ limit: 50 }).catch(() => null);
      if (doctorsTodayRes && Array.isArray(doctorsTodayRes.data)) {
        for (const doc of doctorsTodayRes.data) {
          if (!doctorMap.has(doc.id)) {
            doctorMap.set(doc.id, doc);
          }
          if (doc.schedules && Array.isArray(doc.schedules)) {
            for (const s of doc.schedules) {
              const mapped = mapBackendSchedule({
                ...s,
                doctor: {
                  id: doc.id,
                  name: doc.name,
                  email: doc.email || '',
                  specialization: doc.specialization,
                  userId: doc.userId || '',
                  consultationFee: doc.consultationFee,
                  imageUrl: (doc as any).imageUrl,
                },
              });
              allSchedulesMap.set(mapped.id, mapped);
            }
          }
        }
      }

      // 3. Directly call GET /api/v1/schedules/todays-schedule (or /schedule/todays-schedule)
      const todaysSchedRes = await api.schedule.getTodaysSchedules().catch(() => null);
      const rawDirectSchedules: any[] = Array.isArray(todaysSchedRes?.data)
        ? todaysSchedRes.data
        : Array.isArray((todaysSchedRes as any)?.data?.schedules)
          ? (todaysSchedRes as any).data.schedules
          : Array.isArray(todaysSchedRes)
            ? (todaysSchedRes as any)
            : [];

      for (const s of rawDirectSchedules) {
        const doc = s.doctorId ? doctorMap.get(s.doctorId) : s.doctor;
        const mapped = mapBackendSchedule({
          ...s,
          doctor: s.doctor || (doc ? {
            id: doc.id,
            name: doc.name,
            email: doc.email || '',
            specialization: doc.specialization,
            userId: doc.userId || '',
            consultationFee: doc.consultationFee,
            imageUrl: doc.imageUrl,
          } : undefined),
        });
        allSchedulesMap.set(mapped.id, mapped);
      }

      // 4. Query individual doctor schedules for all known doctors to ensure no schedules are missed
      const doctorsToQuery = Array.from(doctorMap.values());
      await Promise.all(
        doctorsToQuery.map(async (doc) => {
          try {
            const docSchedRes = await api.schedule.getTodaysSchedules(doc.id);
            const schedList = Array.isArray(docSchedRes?.data)
              ? docSchedRes.data
              : Array.isArray((docSchedRes as any)?.data?.schedules)
                ? (docSchedRes as any).data.schedules
                : [];
            for (const s of schedList) {
              const mapped = mapBackendSchedule({
                ...s,
                doctor: {
                  id: doc.id,
                  name: doc.name,
                  email: doc.email || '',
                  specialization: doc.specialization,
                  userId: doc.userId || '',
                  consultationFee: doc.consultationFee,
                  imageUrl: doc.imageUrl,
                },
              });
              allSchedulesMap.set(mapped.id, mapped);
            }
          } catch {
            // ignore individual 404s
          }
        })
      );

      setSchedules(Array.from(allSchedulesMap.values()));

      // 5. Fetch logged in patient appointments
      if (currentUser) {
        const apptRes = await api.appointment.getMyAppointments({ limit: 50 }).catch(() => null);
        if (apptRes && Array.isArray(apptRes.data)) {
          setAppointments(apptRes.data.map(mapBackendAppointment));
        } else {
          setAppointments([]);
        }
      } else {
        setAppointments([]);
      }

      setIsLoading(false);
    } catch (err: any) {
      setIsLoading(false);
      setDashboardError(err?.message || 'Failed to load consultation schedules.');
    }
  };

  // 2. Check bKash return query params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const statusParam = params.get('status');
    const errorParam = params.get('error');

    if (statusParam === 'success') {
      setPaymentBanner({
        type: 'success',
        message:
          'Payment Successful! Your appointment has been booked and confirmed. An official invoice with video consultation link was dispatched to your email.',
      });
    } else if (
      statusParam === 'failue' ||
      statusParam === 'failure' ||
      errorParam === 'payment-failed'
    ) {
      setPaymentBanner({
        type: 'error',
        message: 'Payment was not completed. Your appointment has not been booked. Please try again.',
      });
    } else if (statusParam === 'cancel') {
      setPaymentBanner({
        type: 'cancel',
        message: 'bKash checkout was cancelled. No charges were made.',
      });
    }

    // Clean URL query parameters smoothly
    if (statusParam || errorParam) {
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }

    loadData();
  }, [currentUser]);

  // Section 7.1 Filter: Published schedules for today, visible up until end time, and available slots > 0
  const visibleSchedules = schedules.filter((sch) => {
    const visibility = isScheduleVisibleToPatient(
      sch.date,
      sch.startTime,
      sch.status,
      sch.totalSlots,
      sch.bookedSlotsCount,
      currentDate,
      currentTime,
      sch.endTime
    );

    if (!visibility.visible) return false;

    // Search query match
    const matchesSearch =
      !searchQuery.trim() ||
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
    { label: 'Chest Tightness & Palpitations', spec: 'Cardiology', doctorHint: 'Cardiology Specialist' },
    { label: 'Chronic Headache & Migraine', spec: 'Neurology', doctorHint: 'Neurology Specialist' },
    { label: 'High Fever, Fatigue & Blood Sugar', spec: 'Internal Medicine', doctorHint: 'Internal Medicine Specialist' },
    { label: 'High Blood Pressure Checkup', spec: 'Cardiology', doctorHint: 'Cardiology Specialist' },
  ];

  const handleSelectSymptom = (spec: string, label: string) => {
    setSelectedSymptom(label);
    setSelectedSpecialization(spec);
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
    setBookingError(null);
    setIsCheckoutOpen(true);
  };

  // Process Booking & Initiate bKash Payment (Section 7.2)
  const handleConfirmPayment = async () => {
    if (!selectedSchedule || !selectedSlot || !currentUser) return;

    // Slot-level validation: only validate whether this specific slot's start time has passed (not overall schedule start time)
    const isToday = !selectedSchedule.date || selectedSchedule.date.split('T')[0] === currentDate.split('T')[0];
    const isSlotPast = isToday && timeToMinutes(selectedSlot.startTime) < timeToMinutes(currentTime);

    if (isSlotPast) {
      setBookingError(
        `This consultation slot (${format12Hour(selectedSlot.startTime)}) has already passed. Please select an upcoming slot.`
      );
      return;
    }

    setIsProcessingPayment(true);
    setBookingError(null);

    try {
      // 1. Send booking/payment request to the API
      const response = await api.appointment.bookAppointment({
        scheduleId: selectedSchedule.id,
      });

      // 2. Check the API response for the bKash payment URL (e.g., res?.data?.paymentUrl or res?.data?.bkashURL)
      const paymentUrl =
        (response as any)?.data?.paymentUrl ||
        (response as any)?.data?.bkashURL ||
        (response as any)?.data?.redirectUrl ||
        extractPaymentUrl(response);

      // 3. If a payment URL exists, immediately redirect the browser window to that URL
      if (paymentUrl) {
        window.location.href = paymentUrl;
        return;
      }

      throw new Error(
        (response as any)?.message || 'No bKash payment gateway URL found in response.'
      );
    } catch (err: any) {
      setIsProcessingPayment(false);
      const errMsg = String(err?.message || '');

      // Provide clear insight if the backend rejected due to its internal schedule.startDateTime check
      if (errMsg.toLowerCase().includes('already started')) {
        setBookingError(
          `Backend Restriction: The backend server rejected booking with "This Schedule Has Already Started" because backend appointment.service.ts validates against the schedule's initial start time (${format12Hour(selectedSchedule.startTime)}) rather than this slot's time (${format12Hour(selectedSlot.startTime)}).`
        );
      } else {
        setBookingError(
          errMsg || 'Failed to initiate bKash payment. Please ensure the schedule is still available.'
        );
      }
    }
  };

  // Section 10: Cancellation & Refund Logic via Backend API
  const handleConfirmCancelAppointment = async (appointment: Appointment) => {
    setIsCancelling(true);
    try {
      await api.appointment.cancelAppointment(appointment.id);
      setIsCancelling(false);
      setAppointmentToCancel(null);
      await loadData();
    } catch (err: any) {
      setIsCancelling(false);
      alert(err?.message || 'Failed to cancel appointment.');
    }
  };

  // Build Invoice Object for Modal
  const handleOpenInvoice = (app: Appointment) => {
    const inv: Invoice = {
      id: app.payment?.id || `inv_${app.id.slice(0, 8)}`,
      invoiceNumber: `INV-${app.id.slice(0, 8).toUpperCase()}`,
      appointmentId: app.id,
      serialNumber: app.serialNumber || 1,
      patientName: app.patientName || currentUser?.name || 'Registered Patient',
      patientEmail: app.patientEmail || currentUser?.email || '',
      doctorName: app.doctorName,
      doctorSpecialization: app.doctorSpecialization,
      date: app.date,
      timeSlot: `${app.slotStartTime} – ${app.slotEndTime}`,
      meetLink: app.meetLink,
      amount: app.fee,
      paymentMethod: app.paymentMethod?.toUpperCase() || 'BKASH',
      transactionId: app.transactionId || 'TRX-VERIFIED',
      paidAt: app.paidAt || app.createdAt || new Date().toISOString(),
      status: app.status === 'CANCELLED' ? (app.refunded ? 'REFUNDED' : 'CANCELLED') : 'PAID',
    };
    onOpenInvoiceModal(inv);
  };

  // Build Prescription Object for Modal
  const handleOpenPrescription = (app: Appointment) => {
    const rx: Prescription = {
      id: `rx_${app.id.slice(0, 8)}`,
      appointmentId: app.id,
      scheduleId: app.scheduleId,
      doctorId: app.doctorId,
      doctorName: app.doctorName,
      doctorSpecialization: app.doctorSpecialization,
      doctorLicenseNumber: 'BMDC-VERIFIED',
      doctorDegrees: 'MBBS, Specialist',
      patientId: app.patientId,
      patientName: app.patientName || currentUser?.name || 'Registered Patient',
      consultationDate: app.date,
      diagnosis: 'Telemedicine Consultation Completed',
      keyFindings: 'Consultation conducted via video room. Official medical prescription generated.',
      medicines: [
        {
          id: 'med_1',
          name: 'Consultation Prescription PDF Attached',
          type: 'Tablet',
          dosage: 'As Advised',
          frequency: 'As Advised',
          duration: 'Course Duration',
          instructions: 'See attached official PDF for medication details.',
        },
      ],
      specialInstructions: 'Follow physician instructions provided in the consultation PDF.',
      createdAt: app.paidAt || new Date().toISOString(),
    };
    onOpenPrescriptionModal(rx);
  };

  // Prescriptions List derived from completed appointments
  const prescriptionAppointments = appointments.filter(
    (a) => a.status === 'COMPLETED' && (a.prescriptionUrl || a.hasPrescription)
  );

  return (
    <div className="space-y-12">
      {/* Payment Callback Feedback Toast / Banner */}
      {paymentBanner && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between text-xs animate-in fade-in duration-200 ${paymentBanner.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : paymentBanner.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-900'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
        >
          <div className="flex items-center gap-2.5">
            {paymentBanner.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <span className="font-semibold">{paymentBanner.message}</span>
          </div>
          <button
            onClick={() => setPaymentBanner(null)}
            className="p-1 hover:bg-black/5 rounded-lg text-slate-500 font-bold"
          >
            ✕
          </button>
        </div>
      )}

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
                Connect directly with board-certified specialist physicians. Book open 20-minute consultation slots on today's schedule, pay securely via bKash, join secure video calls, and get official digital prescriptions delivered to your inbox.
              </p>

              {/* Exact Spec Rule Banner */}
              <div className="pt-2 flex items-center gap-2 text-xs text-teal-200">
                <Info className="w-4 h-4 text-teal-400 shrink-0" />
                <span>
                  Consultations for today (<strong>{currentDate}</strong>). Schedules close automatically once their start time arrives.
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
                  className={`text-left p-3.5 rounded-2xl border transition-all cursor-pointer ${selectedSymptom === item.label
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
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xl font-bold text-slate-900">Today's Available Doctor Schedules</h2>
                  <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                    {visibleSchedules.length} Available
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pick an open 20-minute consultation slot. Upfront payment via bKash generates your instant serial number and video room link.
                </p>
              </div>

              {/* Search & Specialization Filters */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search doctor or specialty..."
                    className="pl-9 pr-7 py-1.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500 w-full sm:w-52"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1 overflow-x-auto p-1 bg-slate-100 rounded-xl">
                  {specializations.map((spec) => (
                    <button
                      key={spec}
                      onClick={() => {
                        setSelectedSpecialization(spec);
                        setSelectedSymptom(null);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${selectedSpecialization === spec
                          ? 'bg-white text-slate-900 font-bold shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                      {spec}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => loadData()}
                  title="Refresh Schedules"
                  className="p-2 text-slate-600 hover:text-teal-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors cursor-pointer shrink-0 self-center"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Schedule Cards Grid */}
            {isLoading ? (
              <div className="py-16 text-center text-slate-500 text-xs flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
                <span>Loading today's specialist doctor schedules...</span>
              </div>
            ) : visibleSchedules.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-3">
                <CalendarX className="w-12 h-12 text-slate-400 mx-auto" />
                <h3 className="text-base font-bold text-slate-900">No Schedules Available for Booking Right Now</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  {searchQuery || selectedSpecialization !== 'ALL'
                    ? 'No doctor schedules match your current search or specialization filter.'
                    : `No published schedules are available for today (${currentDate}). Please check back soon or consult when doctors publish their open hours.`}
                </p>
                <div className="pt-2 flex items-center justify-center gap-3">
                  {(searchQuery || selectedSpecialization !== 'ALL') && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedSpecialization('ALL');
                      }}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                    >
                      Clear Filters
                    </button>
                  )}
                  <button
                    onClick={() => loadData()}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    Refresh Schedules
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {visibleSchedules.map((sch) => {
                  const isToday = !sch.date || sch.date.split('T')[0] === currentDate.split('T')[0];
                  const currentMin = timeToMinutes(currentTime);

                  // All unbooked 20-minute slots are open and bookable for testing
                  const openSlots = sch.slots.filter((s) => !s.isBooked);

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
                              <span>
                                Today:{' '}
                                <strong className="font-mono text-slate-700">
                                  {format12Hour(sch.startTime)} – {format12Hour(sch.endTime)}
                                </strong>
                              </span>
                              <span>·</span>
                              <span>{sch.durationHours} hrs</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-[10px] text-slate-400 block uppercase font-semibold">Fee</span>
                          <span className="text-xl font-bold font-mono text-teal-700">৳{sch.doctorFee || 800}</span>
                        </div>
                      </div>

                      {/* Slots Selection Grid */}
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-800">Select 20-Min Consultation Slot:</span>
                          <span className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                            {openSlots.length} open slot{openSlots.length !== 1 ? 's' : ''} available
                          </span>
                        </div>

                        {openSlots.length === 0 && (
                          <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                            <span>All consultation slots for this schedule are currently booked.</span>
                          </div>
                        )}

                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {sch.slots.map((slot) => {
                            const isBooked = slot.isBooked;
                            const isActive = !isBooked;

                            return (
                              <button
                                key={slot.slotNumber}
                                disabled={!isActive}
                                onClick={() => handleSelectSlot(sch, slot)}
                                title={
                                  isBooked
                                    ? `Slot #${slot.slotNumber} is booked`
                                    : `Click to select slot #${slot.slotNumber} (${format12Hour(slot.startTime)} - ${format12Hour(slot.endTime)}) & pay via bKash`
                                }
                                className={`py-2 px-2 rounded-xl text-xs font-mono text-center transition-all ${
                                  isActive
                                    ? 'bg-teal-50 hover:bg-teal-600 hover:text-white border border-teal-300 text-teal-950 font-bold shadow-xs hover:shadow-md hover:scale-[1.02] cursor-pointer'
                                    : 'bg-slate-100 text-slate-400 cursor-not-allowed line-through border border-slate-200'
                                }`}
                              >
                                <div>{format12Hour(slot.startTime)}</div>
                                <div className="text-[9px] font-sans font-normal opacity-75">
                                  {isBooked ? 'Booked' : 'Available'}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Card Footer */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1.5 text-[11px] text-teal-800 font-medium">
                          <Video className="w-3.5 h-3.5 text-teal-600" />
                          Includes Video Consultation Room
                        </span>
                        <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-md border border-teal-200">
                          Active until {format12Hour(sch.endTime)}
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
                  Select an open 20-minute slot and complete payment via bKash. You receive an instant Serial Number (#1, #2) & invoice PDF.
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

          {isLoading ? (
            <div className="py-16 text-center text-slate-500 text-xs flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
              <span>Loading your appointments...</span>
            </div>
          ) : appointments.length === 0 ? (
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
                const scheduleStartTime = app.slotStartTime || '14:00';
                const refundCalc = calculateRefundEligibility(
                  app.date,
                  scheduleStartTime,
                  app.fee,
                  currentDate,
                  currentTime
                );

                const isPending = app.status === 'PENDING';
                const isConfirmed = app.status === 'CONFIRMED' || app.status === 'booked';
                const isOngoing = app.status === 'ONGOING' || app.status === 'ongoing';
                const isCompleted = app.status === 'COMPLETED' || app.status === 'completed';
                const isCancelled = app.status === 'CANCELLED' || app.status === 'cancelled';

                return (
                  <div
                    key={app.id}
                    className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 flex flex-col items-center justify-center shrink-0">
                        <span className="text-[10px] text-teal-700 font-semibold uppercase">Serial</span>
                        <span className="text-base font-bold font-mono text-teal-900">
                          #{app.serialNumber || 1}
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-slate-900">{app.doctorName}</h3>
                          <span
                            className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${isConfirmed
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : isOngoing
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                                  : isCompleted
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : isCancelled
                                      ? 'bg-red-50 text-red-700 border border-red-200'
                                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}
                          >
                            {app.status}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-teal-700 mt-0.5">{app.doctorSpecialization}</p>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                          <span>
                            Date: <strong className="font-mono text-slate-700">{app.date}</strong>
                          </span>
                          <span>·</span>
                          <span>
                            Slot:{' '}
                            <strong className="font-mono text-slate-700">
                              {app.joiningTime
                                ? formatTimeFromISO(app.joiningTime)
                                : `${format12Hour(app.slotStartTime)} – ${format12Hour(app.slotEndTime)}`}
                            </strong>
                          </span>
                          <span>·</span>
                          <span>
                            Fee: <strong className="font-mono text-slate-900">৳{app.fee}</strong>
                          </span>
                        </div>

                        {isCancelled && (
                          <div className="mt-2 text-xs text-red-700 font-medium bg-red-50 p-2 rounded-lg border border-red-200">
                            Cancelled {app.refunded ? `(Full refund of ৳${app.refundAmount || app.fee} issued via bKash)` : '(No refund - cancelled within 1 hr of schedule start)'}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0 self-end md:self-auto">
                      {/* Complete Pending Payment via bKash */}
                      {isPending && (
                        <button
                          onClick={async () => {
                            try {
                              const payRes = await api.appointment.payAppointment(app.id);
                              const payUrl = extractPaymentUrl(payRes);
                              if (payUrl) {
                                window.location.href = payUrl;
                              } else {
                                alert('Payment gateway URL not received from server.');
                              }
                            } catch (e: any) {
                              alert(e?.message || 'Payment initiation failed.');
                            }
                          }}
                          className="px-3.5 py-1.5 bg-pink-600 hover:bg-pink-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Pay via bKash</span>
                        </button>
                      )}

                      {/* View Invoice */}
                      {(isConfirmed || isOngoing || isCompleted) && (
                        <button
                          onClick={() => handleOpenInvoice(app)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5 text-slate-500" />
                          <span>Invoice</span>
                        </button>
                      )}

                      {/* Join Video Consultation */}
                      {(isConfirmed || isOngoing) && (
                        <button
                          onClick={() => onOpenVideoRoom(app)}
                          className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Join Video Call</span>
                        </button>
                      )}

                      {/* View Prescription (if completed) */}
                      {isCompleted && (
                        <>
                          {app.prescriptionUrl ? (
                            <a
                              href={app.prescriptionUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Prescription PDF</span>
                            </a>
                          ) : (
                            <button
                              onClick={() => handleOpenPrescription(app)}
                              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Prescription</span>
                            </button>
                          )}
                        </>
                      )}

                      {/* Cancel Appointment (Section 10) */}
                      {isConfirmed && (
                        <button
                          onClick={() => setAppointmentToCancel(app)}
                          className="px-3 py-1.5 text-red-600 hover:bg-red-50 border border-red-200 rounded-lg text-xs font-medium transition-colors cursor-pointer"
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

          {prescriptionAppointments.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-2">
              <FileText className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">No prescriptions on record</h3>
              <p className="text-xs text-slate-500">
                Once a doctor finishes a consultation and submits your prescription, it will appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {prescriptionAppointments.map((app) => (
                <div
                  key={app.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3 hover:border-teal-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{app.doctorName}</h3>
                      <p className="text-xs text-teal-700 font-semibold">{app.doctorSpecialization}</p>
                      <span className="text-[11px] text-slate-400 font-mono">Date: {app.date}</span>
                    </div>
                    {app.prescriptionUrl ? (
                      <a
                        href={app.prescriptionUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download PDF</span>
                      </a>
                    ) : (
                      <button
                        onClick={() => handleOpenPrescription(app)}
                        className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>View Details</span>
                      </button>
                    )}
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-600">
                    Official digital prescription delivered. Serial position #{app.serialNumber || 1}.
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Upfront Payment & Checkout Modal (Section 7.2 - bKash Sandbox Gateway) */}
      {isCheckoutOpen && selectedSchedule && selectedSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Confirm & Pay for Consultation</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Upfront payment via bKash secures your 20-minute video slot
                </p>
              </div>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              {bookingError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                  <span>{bookingError}</span>
                </div>
              )}

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
                  <span className="font-mono text-teal-700">৳{selectedSchedule.doctorFee || 800}</span>
                </div>
              </div>

              {/* bKash Payment Gateway Notice */}
              <div className="p-4 bg-pink-50 border border-pink-200 rounded-xl text-xs text-pink-950 space-y-2">
                <div className="flex items-center gap-2 font-bold text-pink-800">
                  <CreditCard className="w-4 h-4" />
                  <span>bKash Secure Checkout</span>
                </div>
                <p className="text-[11px] text-pink-900 leading-relaxed">
                  Clicking "Pay via bKash" will redirect you to the official bKash sandbox payment gateway to authorize payment of ৳{selectedSchedule.doctorFee || 800}. Once completed, your appointment and video link will be confirmed immediately.
                </p>
              </div>

              {/* Refund Notice (Section 10) */}
              <p className="text-[11px] text-slate-500 leading-normal">
                Cancellation policy: You may cancel for a 100% refund up to 1 hour before the schedule’s start time. Within 1 hour of start time, cancellations are non-refundable.
              </p>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCheckoutOpen(false)}
                  className="flex-1 py-2 px-3 border border-slate-200 text-slate-700 rounded-xl text-xs font-medium hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isProcessingPayment}
                  onClick={handleConfirmPayment}
                  className="flex-1 py-2 px-3 bg-pink-600 hover:bg-pink-700 disabled:opacity-60 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isProcessingPayment ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Connecting bKash...
                    </span>
                  ) : (
                    <span>Pay ৳{selectedSchedule.doctorFee || 800} & Book</span>
                  )}
                </button>
              </div>
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
              const scheduleStartTime = appointmentToCancel.slotStartTime || '14:00';
              const refund = calculateRefundEligibility(
                appointmentToCancel.date,
                scheduleStartTime,
                appointmentToCancel.fee,
                currentDate,
                currentTime
              );

              return (
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <p className="font-semibold text-slate-900">Appointment Details:</p>
                    <p className="text-slate-600">
                      {appointmentToCancel.doctorName} · Serial #{appointmentToCancel.serialNumber || 1}
                    </p>
                    <p className="font-mono text-slate-600">
                      Slot: {format12Hour(appointmentToCancel.slotStartTime)} – {format12Hour(appointmentToCancel.slotEndTime)}
                    </p>
                  </div>

                  {/* Exact refund calculation according to Section 10 */}
                  <div
                    className={`p-3 rounded-xl border ${refund.eligibleForRefund
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
                    Rule: Cancellations more than 1 hour before schedule start time qualify for a full refund via bKash. Cancellations within 1 hour, during the schedule, or after are non-refundable.
                  </p>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      disabled={isCancelling}
                      onClick={() => setAppointmentToCancel(null)}
                      className="flex-1 py-2 px-3 border border-slate-200 text-slate-700 rounded-xl text-xs font-medium hover:bg-slate-50 cursor-pointer"
                    >
                      Keep Appointment
                    </button>
                    <button
                      type="button"
                      disabled={isCancelling}
                      onClick={() => handleConfirmCancelAppointment(appointmentToCancel)}
                      className="flex-1 py-2 px-3 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {isCancelling ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <span>Confirm Cancellation</span>
                      )}
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
