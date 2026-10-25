import React, { useState } from 'react';
import { StorageService } from '../../lib/storage';
import { User, PatientProfile } from '../../types';
import { X, Mail, Lock, User as UserIcon, Phone, AlertCircle, CheckCircle, Key } from 'lucide-react';

interface RegisterPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLogin: () => void;
  onOpenInbox: () => void;
}

export const RegisterPatientModal: React.FC<RegisterPatientModalProps> = ({
  isOpen,
  onClose,
  onOpenLogin,
  onOpenInbox,
}) => {
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [otpCode, setOtpCode] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const existing = StorageService.getUserByEmail(email.trim());
    if (existing) {
      setError('An account with this email already exists. Please log in.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    // Generate and send OTP via system email service
    const code = StorageService.createOtp(email.trim(), 'patient_registration');
    setGeneratedOtp(code);
    setStep('otp');
  };

  const handleVerifyOtpAndRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const isValid = StorageService.verifyOtp(email.trim(), otpCode, 'patient_registration');
    if (!isValid) {
      setError('Invalid or expired verification code. Please check your system email inbox.');
      return;
    }

    // Create user
    const newUser: User = {
      id: `usr_patient_${Date.now()}`,
      email: email.trim().toLowerCase(),
      role: 'PATIENT',
      status: 'active',
      emailVerified: true,
      hasPassword: true,
      createdAt: new Date().toISOString(),
    };

    const newProfile: PatientProfile = {
      id: `pat_${Date.now()}`,
      userId: newUser.id,
      name: name.trim(),
      phone: phone.trim(),
      bloodGroup,
    };

    StorageService.saveUser(newUser);
    StorageService.savePatient(newProfile);

    // Send Welcome Email (Section 3.8)
    StorageService.sendEmail({
      to: newUser.email,
      subject: 'Welcome to PH Healthcare System',
      title: 'Welcome to Digital Consultations, ' + name.trim(),
      body: `Your patient registration was verified successfully! You can now browse verified specialist doctors, book appointments on today’s schedules, and attend video consultations.`,
      type: 'welcome',
    });

    // Auto-login
    StorageService.setCurrentUser(newUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {step === 'form' ? 'Patient Registration' : 'Verify Email OTP'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {step === 'form'
                ? 'Create your patient account to book telemedicine appointments'
                : `Enter the 6-digit code sent to ${email}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {step === 'form' ? (
            <form onSubmit={handleSendOtp} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
                  />
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="patient@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Phone Number</label>
                  <div className="relative">
                    <input
                      type="tel"
                      required
                      placeholder="+1 (555) 000-0000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-8 pr-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
                    />
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Blood Group</label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Create Password</label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    placeholder="Minimum 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <p className="text-[11px] text-slate-500">
                A one-time verification code (OTP) will be dispatched to your email address.
              </p>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
              >
                Continue & Send Verification Code
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtpAndRegister} className="space-y-4">
              <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-teal-900 text-xs flex items-center justify-between">
                <div>
                  <p className="font-semibold">Code sent to: {email}</p>
                  <p className="text-[11px] text-teal-700">Check your system inbox to view code</p>
                </div>
                <button
                  type="button"
                  onClick={onOpenInbox}
                  className="px-2.5 py-1 bg-teal-600 text-white rounded-md text-[11px] font-medium hover:bg-teal-700"
                >
                  View Inbox
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  6-Digit OTP Code
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="e.g. 123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono tracking-widest text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none text-center"
                  />
                  <Key className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
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
                  Verify & Complete Registration
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center text-xs">
          <button
            onClick={() => {
              onClose();
              onOpenLogin();
            }}
            className="text-slate-600 hover:text-teal-700 font-medium"
          >
            Already have an account? <span className="underline font-semibold">Sign in</span>
          </button>
        </div>
      </div>
    </div>
  );
};
