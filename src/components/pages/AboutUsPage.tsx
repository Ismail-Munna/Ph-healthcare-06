import React from 'react';
import {
  ShieldCheck,
  Award,
  Users,
  HeartHandshake,
  Stethoscope,
  Building2,
  CheckCircle,
} from 'lucide-react';

interface AboutUsPageProps {
  onNavigateDoctors: () => void;
  onOpenApplyDoctor: () => void;
}

export const AboutUsPage: React.FC<AboutUsPageProps> = ({
  onNavigateDoctors,
  onOpenApplyDoctor,
}) => {
  return (
    <div className="space-y-12 py-4">
      {/* Hero */}
      <div className="relative rounded-3xl bg-slate-900 text-white p-8 lg:p-14 overflow-hidden border border-slate-800">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center relative z-10">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-teal-900/60 text-teal-300 text-xs font-semibold border border-teal-700/50">
              <Building2 className="w-4 h-4 text-teal-400" />
              <span>About PH Healthcare</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Transforming Access to Certified Medical Specialists
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              PH Healthcare System was architected to eliminate the friction between patients needing immediate clinical counsel and licensed physicians seeking a structured, transparent consultation schedule.
            </p>
          </div>

          <div className="rounded-2xl overflow-hidden shadow-lg border border-slate-700">
            <img
              src="/src/assets/images/hospital_clinic_modern_1792947889065.jpg"
              alt="PH Healthcare Center"
              className="w-full h-64 object-cover"
            />
          </div>
        </div>
      </div>

      {/* Core Values */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Vetted Physician Network</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Every applying doctor undergoes strict administrative credentialing, medical license validation, and degree verification before they can publish availability.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Clinical Integrity & Rx</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Consultations follow strict medical protocols: 20-minute focused slots, HD video rooms, and structured digital prescriptions with exact dosages and advice.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Fair Patient Protections</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Upfront transparent fees, immediate PDF invoices with serial tracking, and a guaranteed 100% refund policy when cancelling over 1 hour before start time.
          </p>
        </div>
      </div>

      {/* Leadership & Clinical Board */}
      <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xs space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Clinical Leadership & Advisory Board</h2>
          <p className="text-xs text-slate-500 mt-1">
            Experienced medical directors overseeing telehealth safety, provider credentialing, and clinical guidelines.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-4">
            <img
              src="/src/assets/images/avatar_doctor_ahmed_1792946656911.jpg"
              alt="Dr. Arthur J. Finn"
              className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
            />
            <div>
              <h4 className="text-sm font-bold text-slate-900">Dr. Arthur J. Finn, MD</h4>
              <p className="text-xs text-teal-700 font-medium">Chief of Telemedicine Medicine</p>
              <p className="text-[11px] text-slate-500 mt-1">18+ years internal medicine & geriatric health</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-4">
            <img
              src="/src/assets/images/avatar_doctor_sarah_1792946656894.jpg"
              alt="Dr. Sarah Jenkins"
              className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
            />
            <div>
              <h4 className="text-sm font-bold text-slate-900">Dr. Sarah Jenkins, MD</h4>
              <p className="text-xs text-teal-700 font-medium">Director of Cardiology</p>
              <p className="text-[11px] text-slate-500 mt-1">FACC specialist in non-invasive cardiac telemedicine</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-4">
            <img
              src="/src/assets/images/avatar_doctor_emily_1792946657050.jpg"
              alt="Dr. Emily Chen"
              className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
            />
            <div>
              <h4 className="text-sm font-bold text-slate-900">Dr. Emily Chen, MBBS</h4>
              <p className="text-xs text-teal-700 font-medium">Head of Tele-Neurology</p>
              <p className="text-[11px] text-slate-500 mt-1">Expert in migraine protocols and neurological care</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
