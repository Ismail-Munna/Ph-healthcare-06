import React, { useState } from 'react';
import { User } from '../../types';
import { api, ApiError } from '../../lib/api';
import { mapBackendUser } from '../../lib/mappers';
import { X, Lock, Key, Mail, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

/**
 * Validate password complexity matching backend ResetPasswordZodSchema:
 * - min 8 chars
 * - at least 1 lowercase letter
 * - at least 1 uppercase letter
 * - at least 1 number
 * - at least 1 special character
 */
export function validatePasswordComplexity(password: string): string | null {
  if (password.length < 8) {
    return 'Password must be at least 8 characters long.';
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least 1 lowercase letter.';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least 1 uppercase letter.';
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least 1 number.';
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return 'Password must contain at least 1 special character (e.g. !@#$%^&*).';
  }
  return null;
}

/* -------------------------------------------------------------
 * 1. Forgot / Reset Password Modal (2-Step OTP + New Password)
 * ----------------------------------------------------------- */
interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLogin: () => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  onOpenLogin,
}) => {
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  // Step 1: Send Password Reset OTP
  const handleSendResetOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await api.auth.forgotPassword({
        email: email.trim().toLowerCase(),
      });
      setIsLoading(false);
      setStep('reset');
    } catch (err: any) {
      setIsLoading(false);
      setError(err?.message || 'Failed to dispatch reset code. Please check your email.');
    }
  };

  // Step 2: Verify OTP and Set New Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const complexityError = validatePasswordComplexity(newPassword);
    if (complexityError) {
      setError(complexityError);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      await api.auth.resetPassword({
        email: email.trim().toLowerCase(),
        otp: otpCode.trim(),
        newPassword,
      });

      setIsLoading(false);
      setSuccess(true);
      setTimeout(() => {
        onClose();
        onOpenLogin();
      }, 1500);
    } catch (err: any) {
      setIsLoading(false);
      setError(err?.message || 'Invalid or expired OTP code.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Reset Account Password</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {step === 'email' ? 'Enter your email to receive an OTP code' : 'Verify code and choose a new password'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
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

          {success ? (
            <div className="text-center py-6 space-y-3">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Password Changed Successfully!</h3>
              <p className="text-xs text-slate-500">Redirecting to login with your new credentials...</p>
            </div>
          ) : step === 'email' ? (
            <form onSubmit={handleSendResetOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Registered Account Email</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Send Reset OTP Code</span>}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <Mail className="w-4 h-4 text-blue-700" />
                  <span>OTP Sent to {email}</span>
                </div>
                <p className="text-[11px] text-blue-800">
                  Enter the 6-digit verification code sent to your email.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">6-Digit OTP Code</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="123456"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-lg font-mono font-bold tracking-widest text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">New Password (min 8 chars)</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep('email')}
                  className="flex-1 py-2 px-3 border border-slate-200 text-slate-700 rounded-xl text-xs font-medium hover:bg-slate-50 cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-2 px-3 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Update Password</span>}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------
 * 2. Change Password Modal (Logged-In Users via OTP Flow)
 * ----------------------------------------------------------- */
interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen || !currentUser) return null;

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await api.auth.forgotPassword({ email: currentUser.email });
      setIsLoading(false);
      setStep('verify');
    } catch (err: any) {
      setIsLoading(false);
      setError(err?.message || 'Failed to send verification code.');
    }
  };

  const handleVerifyAndChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const complexityError = validatePasswordComplexity(newPassword);
    if (complexityError) {
      setError(complexityError);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      await api.auth.resetPassword({
        email: currentUser.email,
        otp: otpCode.trim(),
        newPassword,
      });

      setIsLoading(false);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (err: any) {
      setIsLoading(false);
      setError(err?.message || 'Failed to update password.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Change Account Password</h2>
            <p className="text-xs text-slate-500 mt-0.5">Secure verification via email OTP</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
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

          {success ? (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>Password updated successfully!</span>
            </div>
          ) : step === 'request' ? (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                To change your password, an authentication OTP code will be sent to your account email: <strong>{currentUser.email}</strong>.
              </p>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Send Verification Code</span>}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyAndChange} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Enter OTP Code *</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="123456"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">New Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Minimum 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Confirm New Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Re-type new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2 px-3 border border-slate-200 text-slate-700 rounded-xl text-xs font-medium hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-2 px-3 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Save Password</span>}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------
 * 3. Set Password Modal (Google Patients Setting Password)
 * ----------------------------------------------------------- */
interface SetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
}

export const SetPasswordModal: React.FC<SetPasswordModalProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  return (
    <ChangePasswordModal
      isOpen={isOpen}
      onClose={onClose}
      currentUser={currentUser}
    />
  );
};

/* -------------------------------------------------------------
 * 4. Force Password Change Modal (Doctor & Admin First Login)
 * ----------------------------------------------------------- */
interface ForcePasswordChangeModalProps {
  user: User | null;
  onComplete: (user: User) => void;
}

export const ForcePasswordChangeModal: React.FC<ForcePasswordChangeModalProps> = ({
  user,
  onComplete,
}) => {
  const [step, setStep] = useState<'prompt' | 'form'>('prompt');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!user) return null;

  const roleTitle =
    user.role === 'DOCTOR'
      ? 'Doctor'
      : user.role === 'SUPER_ADMIN'
      ? 'Super Administrator'
      : 'Administrator';

  const destinationConsole =
    user.role === 'DOCTOR' ? 'Doctor Workspace' : 'Administrative Console';

  const handleSendOtp = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await api.auth.forgotPassword({ email: user.email.trim().toLowerCase() });
      setIsLoading(false);
      setStep('form');
    } catch (err: any) {
      setIsLoading(false);
      setError(err?.message || 'Failed to dispatch security code.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const code = otpCode.trim();
    if (code.length !== 6) {
      setError('Security Code must be exactly 6 digits.');
      return;
    }

    const complexityError = validatePasswordComplexity(newPassword);
    if (complexityError) {
      setError(complexityError);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      // 1. Submit password reset to backend endpoint POST /api/v1/auth/reset-password
      await api.auth.resetPassword({
        email: user.email.trim().toLowerCase(),
        otp: code,
        newPassword,
      });

      // 2. Establish authenticated session by logging in with the new password
      // Backend sets httpOnly accessToken and refreshToken cookies
      await api.auth.login({
        email: user.email.trim().toLowerCase(),
        password: newPassword,
      });

      // 3. Fetch authenticated user profile with cookies included
      const meRes = await api.auth.getMe();
      const updatedUser = mapBackendUser(meRes.data);

      // 4. Mark initial password change as fulfilled in client session
      updatedUser.needPasswordChange = false;
      updatedUser.mustChangePassword = false;
      sessionStorage.setItem(`ph_pwd_changed_${user.email.trim().toLowerCase()}`, 'true');

      setIsLoading(false);
      setSuccess(true);

      setTimeout(() => {
        onComplete(updatedUser);
      }, 700);
    } catch (err: any) {
      setIsLoading(false);
      setError(err?.message || 'Failed to update password. Please check your verification code.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-6 border-b border-slate-100 bg-amber-50/60">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-3">
            <Key className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Initial Password Change Required</h2>
          <p className="text-xs text-slate-600 mt-1">
            As a newly verified {roleTitle}, platform security requires that you set a private permanent password before accessing the {destinationConsole}.
          </p>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-3">
              <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600" />
              <div>
                <p className="font-bold">Password Updated Successfully!</p>
                <p className="text-[11px] text-emerald-700 mt-0.5">Entering {destinationConsole}...</p>
              </div>
            </div>
          ) : step === 'prompt' ? (
            <div className="space-y-4">
              <p className="text-xs text-slate-600">
                Click below to send a security confirmation code to your account email (<strong>{user.email}</strong>).
              </p>
              <button
                type="button"
                disabled={isLoading}
                onClick={handleSendOtp}
                className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Send Security Code & Proceed</span>}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-slate-700">Security Code (from email) *</label>
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={handleSendOtp}
                    className="text-[11px] text-teal-700 hover:text-teal-800 underline font-medium cursor-pointer disabled:opacity-50"
                  >
                    Resend code
                  </button>
                </div>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="123456"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">New Permanent Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Minimum 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Must contain: 8+ characters, uppercase, lowercase, number, and special character (!@#$).
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Confirm New Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Re-type password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Update Password & Enter Console</span>}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
