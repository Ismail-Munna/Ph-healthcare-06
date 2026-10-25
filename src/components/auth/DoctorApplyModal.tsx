import React, { useState } from 'react';
import { StorageService } from '../../lib/storage';
import { User, DoctorProfile } from '../../types';
import { X, Stethoscope, Mail, Lock, Phone, Award, DollarSign, FileBadge, Key, AlertCircle, CheckCircle } from 'lucide-react';

interface DoctorApplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLogin: () => void;
  onOpenInbox: () => void;
}

export const DoctorApplyModal: React.FC<DoctorApplyModalProps> = ({
  isOpen,
  onClose,
  onOpenLogin,
  onOpenInbox,
}) => {
  const [step, setStep] = useState<'form' | 'otp' | 'success'>('form');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [specialization, setSpecialization] = useState('Cardiology & Heart Health');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [degrees, setDegrees] = useState('MBBS, MD');
  const [experienceYears, setExperienceYears] = useState(5);
  const [fee, setFee] = useState(50);
  const [bio, setBio] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const existing = StorageService.getUserByEmail(email.trim());
    if (existing) {
      setError('An account with this email already exists.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (!licenseNumber.trim()) {
      setError('Medical license number is required for verification.');
      return;
    }

    const code = StorageService.createOtp(email.trim(), 'doctor_application');
    setGeneratedOtp(code);
    setStep('otp');
  };

  const handleVerifyOtpAndApply = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const isValid = StorageService.verifyOtp(email.trim(), otpCode, 'doctor_application');
    if (!isValid) {
      setError('Invalid or expired verification code.');
      return;
    }

    // Create doctor user with pending_approval status (Section 5)
    const newUser: User = {
      id: `usr_doc_${Date.now()}`,
      email: email.trim().toLowerCase(),
      role: 'DOCTOR',
      status: 'pending_approval', // Pending admin review!
      emailVerified: true,
      hasPassword: true,
      createdAt: new Date().toISOString(),
    };

    const newProfile: DoctorProfile = {
      id: `doc_${Date.now()}`,
      userId: newUser.id,
      name: name.startsWith('Dr.') ? name.trim() : `Dr. ${name.trim()}`,
      phone: phone.trim(),
      specialization: specialization.trim(),
      medicalLicenseNumber: licenseNumber.trim(),
      experienceYears: Number(experienceYears),
      degrees: degrees.trim(),
      consultationFee: Number(fee),
      bio: bio.trim() || 'Experienced medical professional offering telemedicine consultations.',
      applicationDate: new Date().toISOString(),
    };

    StorageService.saveUser(newUser);
    StorageService.saveDoctor(newProfile);

    // Notify administrators
    StorageService.sendEmail({
      to: 'superadmin@phhealthcare.org',
      subject: `New Doctor Application: ${newProfile.name}`,
      title: 'Doctor Application Pending Review',
      body: `${newProfile.name} (${newProfile.specialization}, License: ${newProfile.medicalLicenseNumber}) has submitted an application and verified their email. Review in Doctor Management.`,
      type: 'welcome',
    });

    setStep('success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Doctor Partner Application</h2>
              <p className="text-xs text-slate-500">Apply to consult patients on PH Healthcare</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {step === 'form' && (
            <form onSubmit={handleSendOtp} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Full Legal Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Arthur Conan"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="doctor@clinic.org"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    placeholder="+1 (555) 000-0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Specialization</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cardiology, Pediatrics"
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Medical License #</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MED-NY-991204"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Degrees / Credentials</label>
                  <input
                    type="text"
                    required
                    placeholder="MBBS, MD, FCPS"
                    value={degrees}
                    onChange={(e) => setDegrees(e.target.value)}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Experience (Years)</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(Number(e.target.value))}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Consultation Fee ($)</label>
                  <input
                    type="number"
                    min={10}
                    max={500}
                    value={fee}
                    onChange={(e) => setFee(Number(e.target.value))}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Short Professional Bio</label>
                <textarea
                  rows={2}
                  placeholder="Summary of your medical background, expertise and clinical care philosophy..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
                />
              </div>

              <p className="text-[11px] text-slate-500">
                You will verify your email via OTP. Once submitted, an Administrator will review and approve your credentials before you can log in and publish schedules.
              </p>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-xs"
              >
                Send Verification OTP to Email
              </button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleVerifyOtpAndApply} className="space-y-4">
              <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-teal-900 text-xs flex items-center justify-between">
                <div>
                  <p className="font-semibold">Code sent to: {email}</p>
                  <p className="text-[11px] text-teal-700">Check system notification inbox</p>
                </div>
                <button
                  type="button"
                  onClick={onOpenInbox}
                  className="px-2.5 py-1 bg-teal-600 text-white rounded-md text-[11px] font-medium"
                >
                  View Inbox
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">6-Digit Verification Code</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="e.g. 654321"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono tracking-widest text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none text-center"
                />
                {generatedOtp && (
                  <p className="text-[11px] text-slate-400 mt-1 text-center font-mono">
                    (Demo hint: code is {generatedOtp})
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep('form')}
                  className="flex-1 py-2 px-3 border border-slate-200 text-slate-700 rounded-xl text-xs font-medium hover:bg-slate-50"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold"
                >
                  Verify & Submit Application
                </button>
              </div>
            </form>
          )}

          {step === 'success' && (
            <div className="text-center py-6 space-y-3">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Application Submitted!</h3>
              <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                Your email has been verified. Your doctor application is now pending review in Doctor Management. An Admin or Super Admin will review your credentials.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => {
                    onClose();
                    onOpenLogin();
                  }}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-medium"
                >
                  Return to Sign In
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
