import React from 'react';
import {
  Calendar,
  Clock,
  Video,
  CreditCard,
  FileText,
  ShieldCheck,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  ArrowRight,
  UserCheck,
} from 'lucide-react';

interface HowItWorksPageProps {
  onNavigateDoctors: () => void;
  onOpenApplyDoctor: () => void;
  onOpenRegister: () => void;
}

export const HowItWorksPage: React.FC<HowItWorksPageProps> = ({
  onNavigateDoctors,
  onOpenApplyDoctor,
  onOpenRegister,
}) => {
  return (
    <div className="space-y-12 py-4">
      {/* Hero */}
      <div className="relative rounded-3xl bg-slate-900 text-white p-8 lg:p-12 overflow-hidden border border-slate-800">
        <div className="max-w-3xl space-y-3 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-teal-900/60 text-teal-300 text-xs font-semibold border border-teal-700/50">
            <HelpCircle className="w-4 h-4 text-teal-400" />
            <span>Complete Telemedicine Guide</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            How Healthcare Works
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            A clear, predictable, and transparent telemedicine experience for both patients and healthcare providers. Review how consultations, 20-minute slots, locking rules, and refund policies operate.
          </p>
        </div>
      </div>

      {/* Patient Step-by-Step Flow */}
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">1. The Patient Consultation Journey</h2>
          <p className="text-xs text-slate-500">From finding today's schedule to receiving your digital prescription</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-sm">
              01
            </div>
            <h3 className="text-sm font-bold text-slate-900">Find Today's Doctor</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Patients view today’s published schedules. A doctor's schedule is visible and bookable only up until its start time.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-sm">
              02
            </div>
            <h3 className="text-sm font-bold text-slate-900">Pick 20-Min Slot & Pay</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Select an open 20-minute slot and pay upfront. Your booking receives a sequential Serial Number (e.g. Serial #1, #2).
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-sm">
              03
            </div>
            <h3 className="text-sm font-bold text-slate-900">Attend Live Video Call</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Join the video room via your meeting link at your slot time. The doctor transitions the call from <em>booked</em> to <em>ongoing</em>.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-sm">
              04
            </div>
            <h3 className="text-sm font-bold text-slate-900">Get Digital Prescription</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Once marked completed, the doctor issues your prescription with diagnosis and medications, sent right to your email and portal.
            </p>
          </div>
        </div>
      </div>

      {/* Section 10: Cancellation & Refund Policy Detailed Matrix */}
      <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xs space-y-6">
        <div>
          <span className="text-xs font-bold text-teal-700 uppercase tracking-wider block mb-1">
            Product Specification Section 10
          </span>
          <h2 className="text-xl font-bold text-slate-900">Cancellation & Refund Policy</h2>
          <p className="text-xs text-slate-500 mt-1">
            Whether a patient receives their consultation fee back depends on how close to the schedule's start time they cancel.
          </p>
        </div>

        <div className="border border-slate-200 rounded-2xl overflow-hidden">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
              <tr>
                <th className="py-3 px-5">When the Patient Cancels</th>
                <th className="py-3 px-5">Refund Outcome</th>
                <th className="py-3 px-5">Practical Example</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="bg-emerald-50/40">
                <td className="py-4 px-5 font-semibold text-slate-900 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>More than 1 hour before schedule's start time</span>
                </td>
                <td className="py-4 px-5">
                  <span className="font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-md text-xs">
                    Yes — 100% Full Refund
                  </span>
                </td>
                <td className="py-4 px-5 text-slate-600">
                  Schedule starts at 3:00 PM. Patient cancels at 1:45 PM (more than 1h before start) &rarr; Full refund credited.
                </td>
              </tr>
              <tr className="bg-amber-50/40">
                <td className="py-4 px-5 font-semibold text-slate-900 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>From 1 hour before start time, during running schedule, or after</span>
                </td>
                <td className="py-4 px-5">
                  <span className="font-bold text-amber-800 bg-amber-100/80 px-2.5 py-1 rounded-md text-xs">
                    Cancellation allowed — No Refund
                  </span>
                </td>
                <td className="py-4 px-5 text-slate-600">
                  Schedule starts at 3:00 PM. Patient cancels at 2:15 PM, 3:30 PM, or after &rarr; Slot cancelled, zero refund.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Doctor Schedule & Locking Rules Matrix (Section 6) */}
      <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xs space-y-6">
        <div>
          <span className="text-xs font-bold text-teal-700 uppercase tracking-wider block mb-1">
            Product Specification Section 6
          </span>
          <h2 className="text-xl font-bold text-slate-900">Doctor Schedule & Schedule Locking Rules</h2>
          <p className="text-xs text-slate-500 mt-1">
            Rules governing daily availability and field lock states on published schedules.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <h3 className="font-bold text-slate-900 text-sm">One Schedule Per Day</h3>
            <p className="text-slate-600 leading-relaxed">
              A doctor can have at most one schedule per calendar date. The range must stay strictly within that single date (no crossing midnight).
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <h3 className="font-bold text-slate-900 text-sm">3 to 8 Hours & 20-Min Slots</h3>
            <p className="text-slate-600 leading-relaxed">
              Minimum duration is 3 hours; maximum is 8 hours. The system automatically slices the entire range into 20-minute patient consultation slots.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <h3 className="font-bold text-slate-900 text-sm">Field Lock Transitions</h3>
            <p className="text-slate-600 leading-relaxed">
              <strong>Date:</strong> Locked immediately when published.<br />
              <strong>Time Range:</strong> Locked once the 1st appointment is booked.<br />
              <strong>Meet link:</strong> Editable anytime.
            </p>
          </div>
        </div>

        <div className="pt-4 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100">
          <div className="text-xs text-slate-600">
            Are you a licensed doctor wanting to consult patients online?
          </div>
          <button
            onClick={onOpenApplyDoctor}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold"
          >
            Apply to Become a Doctor
          </button>
        </div>
      </div>
    </div>
  );
};
