import React, { useState } from 'react';
import { StorageService } from '../../lib/storage';
import { User } from '../../types';
import { X, Lock, Mail, AlertCircle, ArrowRight, ShieldCheck, Check } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenRegister: () => void;
  onOpenApplyDoctor: () => void;
  onOpenForgotPassword: () => void;
  onRequireForcePasswordChange: (user: User) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onOpenRegister,
  onOpenApplyDoctor,
  onOpenForgotPassword,
  onRequireForcePasswordChange,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleEmailPasswordLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const user = StorageService.getUserByEmail(email.trim());

    if (!user) {
      setError('No account found with this email address.');
      return;
    }

    if (user.status === 'blocked') {
      setError('This account has been suspended by an administrator. Please contact support.');
      return;
    }

    if (user.status === 'pending_approval' && user.role === 'DOCTOR') {
      setError('Your doctor application is currently pending administrative review. You will receive an email once approved.');
      return;
    }

    if (user.status === 'rejected' && user.role === 'DOCTOR') {
      setError('Your doctor application was reviewed and not approved at this time.');
      return;
    }

    // Check force password change for newly invited admins
    if (user.mustChangePassword) {
      onClose();
      onRequireForcePasswordChange(user);
      return;
    }

    // Success login
    StorageService.setCurrentUser(user);
    onClose();
  };

  // Google Login (Patient-only per Section 2 & 3.3)
  const handleGoogleLogin = () => {
    setError(null);
    setIsLoading(true);

    setTimeout(() => {
      // Check if user already exists
      const existingPatient = StorageService.getUserByEmail('john.doe@example.com') ||
        StorageService.getUsers().find((u) => u.role === 'PATIENT');

      if (existingPatient) {
        if (existingPatient.status === 'blocked') {
          setError('This patient account is currently blocked.');
          setIsLoading(false);
          return;
        }
        StorageService.setCurrentUser(existingPatient);
      } else {
        // Create new patient via Google
        const newUser: User = {
          id: `usr_patient_g_${Date.now()}`,
          email: 'google.patient@gmail.com',
          role: 'PATIENT',
          status: 'active',
          emailVerified: true,
          hasPassword: false, // Patient joined via Google, no password yet
          googleId: 'g_auth_12345',
          createdAt: new Date().toISOString(),
        };
        StorageService.saveUser(newUser);
        StorageService.savePatient({
          id: `pat_${Date.now()}`,
          userId: newUser.id,
          name: 'Google Patient User',
          phone: '+1 (555) 789-0123',
          gender: 'other',
        });
        StorageService.sendEmail({
          to: newUser.email,
          subject: 'Welcome to PH Healthcare System',
          title: 'Welcome to Telemedicine Consultations',
          body: 'You have signed in securely using your Google account. You can now book open doctor slots today.',
          type: 'welcome',
        });
        StorageService.setCurrentUser(newUser);
      }

      setIsLoading(false);
      onClose();
    }, 400);
  };

  // Quick Demo fill helper
  const fillDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('demoPass123!');
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Sign in to PH Healthcare</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Access your appointments, consultations, and medical records
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

          {/* Google Sign In (PATIENTS ONLY per Spec Section 2) */}
          <div className="space-y-2">
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white border border-slate-300 hover:bg-slate-50 hover:border-slate-400 text-slate-700 rounded-xl text-xs font-semibold shadow-2xs transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google (Patients only)</span>
            </button>
            <p className="text-[11px] text-center text-slate-400">
              Doctors and Admins log in with email and password below
            </p>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-3 text-slate-400 text-xs">or email credentials</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleEmailPasswordLogin} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Email address</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none transition-colors"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-slate-700">Password</label>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenForgotPassword();
                  }}
                  className="text-xs text-teal-700 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none transition-colors"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              Log in to Account
            </button>
          </form>

          {/* Quick Demo Pre-fill Links */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-[11px] space-y-1.5">
            <span className="font-semibold text-slate-700">Quick Test Credentials:</span>
            <div className="grid grid-cols-2 gap-1.5 pt-0.5">
              <button
                type="button"
                onClick={() => fillDemo('superadmin@phhealthcare.org')}
                className="text-left px-2 py-1 bg-white hover:bg-teal-50 border border-slate-200 rounded text-slate-700 font-mono text-[10px] truncate"
              >
                Super Admin
              </button>
              <button
                type="button"
                onClick={() => fillDemo('admin.kareem@phhealthcare.org')}
                className="text-left px-2 py-1 bg-white hover:bg-teal-50 border border-slate-200 rounded text-slate-700 font-mono text-[10px] truncate"
              >
                Admin (Kareem)
              </button>
              <button
                type="button"
                onClick={() => fillDemo('dr.sarah@phhealthcare.org')}
                className="text-left px-2 py-1 bg-white hover:bg-teal-50 border border-slate-200 rounded text-slate-700 font-mono text-[10px] truncate"
              >
                Doctor (Sarah)
              </button>
              <button
                type="button"
                onClick={() => fillDemo('john.doe@example.com')}
                className="text-left px-2 py-1 bg-white hover:bg-teal-50 border border-slate-200 rounded text-slate-700 font-mono text-[10px] truncate"
              >
                Patient (John)
              </button>
            </div>
          </div>
        </div>

        {/* Footer links */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs gap-2">
          <button
            onClick={() => {
              onClose();
              onOpenRegister();
            }}
            className="text-slate-600 hover:text-teal-700 font-medium"
          >
            New patient? <span className="underline font-semibold">Register here</span>
          </button>
          <button
            onClick={() => {
              onClose();
              onOpenApplyDoctor();
            }}
            className="text-teal-700 hover:text-teal-800 font-medium underline"
          >
            Apply to become a Doctor
          </button>
        </div>
      </div>
    </div>
  );
};
