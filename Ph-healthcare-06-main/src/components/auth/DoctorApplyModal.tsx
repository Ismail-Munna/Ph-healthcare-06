import React, { useState } from 'react';
import { ApplyAsDoctorPayload } from '../../types';
import { api, ApiError } from '../../lib/api';
import {
  X,
  Stethoscope,
  Mail,
  Lock,
  Phone,
  Award,
  DollarSign,
  FileBadge,
  Key,
  AlertCircle,
  CheckCircle,
  Upload,
  Loader2,
} from 'lucide-react';

interface DoctorApplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLogin: () => void;
}

export const DoctorApplyModal: React.FC<DoctorApplyModalProps> = ({
  isOpen,
  onClose,
  onOpenLogin,
}) => {
  const [step, setStep] = useState<'form' | 'otp' | 'success'>('form');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('Dhaka, Bangladesh');
  const [specialization, setSpecialization] = useState('Cardiology');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [qualifications, setQualifications] = useState('MBBS, FCPS');
  const [experienceYears, setExperienceYears] = useState(5);
  const [consultationFee, setConsultationFee] = useState(800);
  const [bio, setBio] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  // Step 1: Submit Application Form
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanName = name.trim().startsWith('Dr.') ? name.trim() : `Dr. ${name.trim()}`;
    if (cleanName.length < 2) {
      setError('Doctor Name must be at least 2 characters long.');
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setError('A valid email address is required.');
      return;
    }

    if (!specialization.trim()) {
      setError('Specialization is required.');
      return;
    }

    if (licenseNumber.trim().length < 3) {
      setError('Official Medical License Number must be at least 3 characters.');
      return;
    }

    if (!qualifications.trim()) {
      setError('Qualifications (e.g. MBBS, FCPS) are required.');
      return;
    }

    const expYearsNum = Math.max(0, Math.round(Number(experienceYears) || 0));
    const feeNum = Math.max(0, Number(consultationFee) || 0);

    const cleanAddress = address.trim();
    if (cleanAddress && cleanAddress.length < 5) {
      setError('Address must be at least 5 characters long if provided.');
      return;
    }

    const cleanPhone = phone.trim();
    if (cleanPhone && cleanPhone.length < 5) {
      setError('Phone / Contact number must be at least 5 characters long if provided.');
      return;
    }

    setIsLoading(true);
    try {
      // Backend ApplyAsDoctorValidationZodSchema expects:
      // req.body.data = JSON.stringify({ user: { name, email }, doctor: { ... } })
      const doctorPayload: ApplyAsDoctorPayload = {
        user: {
          name: cleanName,
          email: cleanEmail,
        },
        doctor: {
          specialization: specialization.trim(),
          licenseNumber: licenseNumber.trim(),
          qualifications: qualifications.trim(),
          experienceYears: expYearsNum,
          consultationFee: feeNum,
          ...(cleanAddress.length >= 5 ? { address: cleanAddress } : {}),
          ...(cleanPhone.length >= 5 ? { contactNumber: cleanPhone } : {}),
          bio: bio.trim()
            ? bio.trim().slice(0, 1000)
            : 'Experienced specialist physician providing telemedicine consultations.',
        },
      };

      const formData = new FormData();
      formData.append('data', JSON.stringify(doctorPayload));

      // Backend multer upload.fields(['resume', 'additionalFiles'])
      // Cloudinary upload stream expects a buffer for resume
      const effectiveResume =
        resumeFile ||
        new File(
          [
            `Doctor Curriculum Vitae\n` +
              `======================\n` +
              `Name: ${cleanName}\n` +
              `Email: ${cleanEmail}\n` +
              `Specialization: ${specialization.trim()}\n` +
              `Medical License: ${licenseNumber.trim()}\n` +
              `Qualifications: ${qualifications.trim()}\n` +
              `Experience: ${expYearsNum} years\n` +
              `Consultation Fee: BDT ${feeNum}\n` +
              `Contact: ${cleanPhone || 'Not provided'}\n` +
              `Address: ${cleanAddress || 'Not provided'}\n\n` +
              `Bio:\n${bio.trim() || 'Experienced specialist physician.'}\n`,
          ],
          `${cleanName.replace(/[^a-zA-Z0-9]/g, '_')}_CV.txt`,
          { type: 'text/plain' }
        );

      formData.append('resume', effectiveResume);

      await api.doctor.applyAsDoctor(formData);

      setIsLoading(false);
      setStep('otp');
    } catch (err: any) {
      setIsLoading(false);
      setError(err?.message || 'Failed to submit application. Please check your details.');
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtpAndApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (otpCode.trim().length < 4) {
      setError('Please enter a valid OTP code.');
      return;
    }

    setIsLoading(true);
    try {
      await api.doctor.verifyDoctorEmail({
        email: email.trim().toLowerCase(),
        otp: otpCode.trim(),
      });

      setIsLoading(false);
      setStep('success');
    } catch (err: any) {
      setIsLoading(false);
      setError(err?.message || 'Invalid or expired OTP code.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Apply to Become a Doctor</h2>
              <p className="text-xs text-slate-500">
                Join our telemedicine network of board-certified specialist physicians
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
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
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Doctor Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sarah Jenkins"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Email address *</label>
                  <input
                    type="email"
                    required
                    placeholder="dr.sarah@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Specialization *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cardiology"
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Medical License Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BMDC-A-99214"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Qualifications *</label>
                  <input
                    type="text"
                    required
                    placeholder="MBBS, MD, FCPS"
                    value={qualifications}
                    onChange={(e) => setQualifications(e.target.value)}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Experience (Years) *</label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    required
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(Number(e.target.value))}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Consultation Fee (৳) *</label>
                  <input
                    type="number"
                    min={100}
                    step={50}
                    required
                    value={consultationFee}
                    onChange={(e) => setConsultationFee(Number(e.target.value))}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+880 1712 345678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Upload Medical Resume / CV (Optional)
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                    className="w-full py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Professional Bio</label>
                <textarea
                  rows={2}
                  placeholder="Summary of clinical background, areas of expertise, and patient care philosophy..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
                />
              </div>

              <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-xl text-[11px] text-teal-950 space-y-1">
                <span className="font-semibold block">Credentialing Workflow (Section 5):</span>
                <p>
                  Doctors verify their email via OTP, then sit in PENDING review. Once approved by an Admin/Super Admin, a secure random password is auto-generated and emailed to you.
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Submit Application & Verify Email</span>}
              </button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleVerifyOtpAndApply} className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <Mail className="w-4 h-4 text-blue-700" />
                  <span>Verification Code Dispatched</span>
                </div>
                <p className="text-[11px] text-blue-800">
                  We sent an email verification OTP to <strong>{email}</strong>. Enter it below to complete your application submission.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  6-Digit Verification Code *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center text-lg font-mono font-bold tracking-widest text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
                  />
                  <Key className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep('form')}
                  className="flex-1 py-2 px-3 border border-slate-200 text-slate-700 rounded-xl text-xs font-medium hover:bg-slate-50 cursor-pointer"
                >
                  Back to Details
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-2.5 px-4 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Verify & Submit</span>}
                </button>
              </div>
            </form>
          )}

          {step === 'success' && (
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900">Application Submitted for Review!</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Your email has been verified and your medical license credentials are now in the administrative review queue.
                </p>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 text-left space-y-1 max-w-md mx-auto">
                <span className="font-bold block">Account Status: PENDING REVIEW</span>
                <p className="text-[11px] leading-relaxed">
                  Per platform security rules, doctors cannot log in until approved. Once an administrator approves your license, a secure temporary password will be sent to your email (<strong>{email}</strong>).
                </p>
              </div>

              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer"
              >
                Close & Return to Home
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {step !== 'success' && (
          <div className="p-4 bg-slate-50 border-t border-slate-100 text-center text-xs">
            <span className="text-slate-500">Already approved? </span>
            <button
              onClick={() => {
                onClose();
                onOpenLogin();
              }}
              className="text-teal-700 hover:text-teal-800 font-semibold underline cursor-pointer"
            >
              Log in to doctor dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
