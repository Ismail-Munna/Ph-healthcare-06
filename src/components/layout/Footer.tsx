import React from 'react';
import {
  Stethoscope,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  Clock,
  Heart,
  ChevronRight,
  Award,
  Video,
} from 'lucide-react';

interface FooterProps {
  onNavigate: (tab: string) => void;
  onOpenApplyDoctor: () => void;
  onOpenRegister: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onNavigate,
  onOpenApplyDoctor,
  onOpenRegister,
}) => {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800">
          {/* Col 1 & 2: Brand Information */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                <Stethoscope className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-xl font-extrabold tracking-tight text-white block">
                  PH Healthcare System
                </span>
                <span className="text-xs text-teal-400 font-medium block">
                  Digital Telemedicine & Clinical Prescriptions
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              PH Healthcare connects patients with board-certified physicians for live video consultations, 20-minute daily schedule booking, and secure digital prescription delivery.
            </p>

            <div className="space-y-2 text-xs text-slate-300 pt-1">
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-teal-400 shrink-0" />
                <span>24/7 Hotline: <strong className="text-white font-mono">+1 (800) 456-MEDIC</strong></span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-teal-400 shrink-0" />
                <span>Support: <strong className="text-white font-mono">support@phhealthcare.org</strong></span>
              </div>
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-teal-400 shrink-0" />
                <span>Clinical HQ: 450 Health Avenue, Suite 1200, Medical District</span>
              </div>
            </div>
          </div>

          {/* Col 3: Medical Specialties */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Medical Specialties</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <button onClick={() => onNavigate('specialties')} className="hover:text-teal-400 transition-colors">
                  Cardiology & Hypertension
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('specialties')} className="hover:text-teal-400 transition-colors">
                  Internal Medicine & Geriatrics
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('specialties')} className="hover:text-teal-400 transition-colors">
                  Neurology & Brain Health
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('specialties')} className="hover:text-teal-400 transition-colors">
                  Pediatrics & Child Care
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('specialties')} className="hover:text-teal-400 transition-colors">
                  Preventive Medicine & Wellness
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Patient Services */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Patient Services</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <button onClick={() => onNavigate('doctors')} className="hover:text-teal-400 transition-colors">
                  Find a Doctor Today
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('how_it_works')} className="hover:text-teal-400 transition-colors">
                  How Consultation Works
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('how_it_works')} className="hover:text-teal-400 transition-colors">
                  Cancellation & Refund Rules
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('my_prescriptions')} className="hover:text-teal-400 transition-colors">
                  Prescription Download Portal
                </button>
              </li>
              <li>
                <button onClick={onOpenRegister} className="hover:text-teal-400 transition-colors">
                  Patient Registration
                </button>
              </li>
              <li className="pt-1">
                <a
                  href="/ph-healthcare-system.zip"
                  download="ph-healthcare-system.zip"
                  className="text-emerald-400 hover:text-emerald-300 font-bold transition-colors flex items-center gap-1"
                >
                  <span>⬇ Download Project ZIP</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Col 5: Doctors & Compliance */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">For Physicians</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <button onClick={onOpenApplyDoctor} className="text-teal-400 hover:text-teal-300 font-semibold transition-colors">
                  Apply to Consult as a Doctor
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('how_it_works')} className="hover:text-teal-400 transition-colors">
                  Doctor Verification Process
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('about')} className="hover:text-teal-400 transition-colors">
                  Clinical Quality Standards
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('contact')} className="hover:text-teal-400 transition-colors">
                  Administrative Support
                </button>
              </li>
            </ul>

            <div className="pt-2">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                Security & Standards
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-teal-400 border border-slate-700 font-mono">
                  HIPAA Compliant
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-teal-400 border border-slate-700 font-mono">
                  256-bit SSL
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © {new Date().getFullYear()} PH Healthcare System. All rights reserved. Confidential and secure telehealth services.
          </div>
          <div className="flex items-center gap-6 text-[11px]">
            <button onClick={() => onNavigate('about')} className="hover:text-slate-400">Privacy Policy</button>
            <button onClick={() => onNavigate('how_it_works')} className="hover:text-slate-400">Terms of Consultation</button>
            <button onClick={() => onNavigate('contact')} className="hover:text-slate-400">Emergency Protocol</button>
          </div>
        </div>
      </div>
    </footer>
  );
};
