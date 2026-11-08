import React, { useState } from 'react';
import { User, UserRole } from '../../types';
import { api } from '../../lib/api';
import {
  Stethoscope,
  LogOut,
  ChevronDown,
  User as UserIcon,
  Calendar,
  FileText,
  Shield,
  Menu,
  X,
} from 'lucide-react';

interface HeaderProps {
  currentUser: User | null;
  currentRole: UserRole | 'GUEST';
  onOpenLogin: () => void;
  onOpenRegister: () => void;
  onOpenApplyDoctor: () => void;
  onOpenChangePassword: () => void;
  onOpenSetPassword: () => void;
  onLogout?: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  currentRole,
  onOpenLogin,
  onOpenRegister,
  onOpenApplyDoctor,
  onOpenChangePassword,
  onOpenSetPassword,
  onLogout,
  activeTab,
  setActiveTab,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const displayName =
    currentUser?.doctor?.name ||
    currentUser?.patient?.name ||
    currentUser?.name ||
    currentUser?.email?.split('@')[0] ||
    'Guest User';

  const handleLogout = async () => {
    try {
      await api.auth.logout();
    } catch (err) {
      console.error('Logout error:', err);
    }
    setShowUserMenu(false);
    if (onLogout) {
      onLogout();
    }
    setActiveTab('home');
  };

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'doctors', label: 'Find Doctors' },
    { id: 'specialties', label: 'Specialties' },
    { id: 'how_it_works', label: 'How It Works' },
    { id: 'about', label: 'About Us' },
    { id: 'contact', label: 'Contact' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Left: Logo & Title (Preserved as requested) */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setActiveTab('home')}
              className="flex items-center gap-3 text-left group focus-visible:outline-none"
            >
              <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white font-bold text-lg shadow-sm group-hover:bg-teal-700 transition-colors">
                <Stethoscope className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-xl font-extrabold tracking-tight text-slate-900 group-hover:text-teal-700 transition-colors whitespace-nowrap block">
                  Healthcare
                </span>
                <span className="text-[11px] text-teal-700 font-semibold tracking-wide uppercase block -mt-0.5">
                  Telemedicine Platform
                </span>
              </div>
            </button>
          </div>

          {/* Center: Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-slate-600">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => setActiveTab(link.id)}
                className={`whitespace-nowrap transition-colors py-1 ${activeTab === link.id
                    ? 'text-teal-700 font-bold border-b-2 border-teal-600'
                    : 'hover:text-slate-900'
                  }`}
              >
                {link.label}
              </button>
            ))}

            {/* Authenticated quick dashboard links */}
            {currentRole === 'PATIENT' && (
              <button
                onClick={() => setActiveTab('my_appointments')}
                className={`whitespace-nowrap transition-colors py-1 ${activeTab === 'my_appointments' ? 'text-teal-700 font-bold border-b-2 border-teal-600' : 'hover:text-slate-900'
                  }`}
              >
                My Appointments
              </button>
            )}

            {currentRole === 'DOCTOR' && (
              <button
                onClick={() => setActiveTab('doctor_schedule')}
                className={`whitespace-nowrap transition-colors py-1 ${activeTab === 'doctor_schedule' ? 'text-teal-700 font-bold border-b-2 border-teal-600' : 'hover:text-slate-900'
                  }`}
              >
                Doctor Console
              </button>
            )}

            {(currentRole === 'ADMIN' || currentRole === 'SUPER_ADMIN') && (
              <button
                onClick={() => setActiveTab('admin_doctors')}
                className={`whitespace-nowrap transition-colors py-1 ${activeTab === 'admin_doctors' ? 'text-teal-700 font-bold border-b-2 border-teal-600' : 'hover:text-slate-900'
                  }`}
              >
                Admin Console
              </button>
            )}
          </nav>

          {/* Right: Only Login & Register (or User Profile if logged in) */}
          <div className="flex items-center gap-3 shrink-0">
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2.5 py-1.5 px-3 rounded-xl hover:bg-slate-100 text-slate-800 transition-colors border border-slate-200"
                >
                  <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center text-xs font-bold uppercase">
                    {displayName.charAt(0)}
                  </div>
                  <div className="text-left hidden sm:block">
                    <div className="text-xs font-bold text-slate-900 max-w-[120px] truncate leading-tight">
                      {displayName}
                    </div>
                    <div className="text-[10px] text-teal-700 font-semibold uppercase">
                      {currentUser.role.replace('_', ' ')}
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 text-left">
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-900 truncate">{displayName}</p>
                      <p className="text-[11px] text-slate-500 font-mono truncate">{currentUser.email}</p>
                      <span className="inline-block mt-1.5 text-[10px] font-bold text-teal-700 uppercase bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                        {currentUser.role.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="py-1 text-xs text-slate-700">
                      {currentUser.role === 'PATIENT' && (
                        <>
                          <button
                            onClick={() => {
                              setActiveTab('my_appointments');
                              setShowUserMenu(false);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2"
                          >
                            <Calendar className="w-4 h-4 text-teal-600" />
                            <span>My Appointments</span>
                          </button>
                          <button
                            onClick={() => {
                              setActiveTab('my_prescriptions');
                              setShowUserMenu(false);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2"
                          >
                            <FileText className="w-4 h-4 text-teal-600" />
                            <span>My Prescriptions</span>
                          </button>
                        </>
                      )}

                      {currentUser.role === 'DOCTOR' && (
                        <button
                          onClick={() => {
                            setActiveTab('doctor_schedule');
                            setShowUserMenu(false);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2"
                        >
                          <Stethoscope className="w-4 h-4 text-teal-600" />
                          <span>Doctor Workspace</span>
                        </button>
                      )}

                      {(currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN') && (
                        <button
                          onClick={() => {
                            setActiveTab('admin_doctors');
                            setShowUserMenu(false);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2"
                        >
                          <Shield className="w-4 h-4 text-teal-600" />
                          <span>Admin Console</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          onOpenChangePassword();
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-slate-50"
                      >
                        Change Password
                      </button>

                      {currentUser.role === 'PATIENT' && !currentUser.hasPassword && (
                        <button
                          onClick={() => {
                            onOpenSetPassword();
                            setShowUserMenu(false);
                          }}
                          className="w-full text-left px-4 py-2 text-teal-700 hover:bg-teal-50 font-semibold"
                        >
                          Set Password for Email Login
                        </button>
                      )}
                    </div>

                    <div className="pt-1 border-t border-slate-100 text-xs">
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium"
                      >
                        <LogOut className="w-4 h-4" />
                        Log out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Right: Only Login & Register buttons */
              <div className="flex items-center gap-3">
                <button
                  onClick={onOpenLogin}
                  className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-teal-700 hover:bg-slate-50 rounded-xl transition-colors whitespace-nowrap"
                >
                  Log In
                </button>
                <button
                  onClick={onOpenRegister}
                  className="px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-colors whitespace-nowrap shadow-sm shadow-teal-600/20"
                >
                  Register
                </button>
              </div>
            )}

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-4 space-y-2">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => {
                setActiveTab(link.id);
                setMobileMenuOpen(false);
              }}
              className={`block w-full text-left px-3 py-2 rounded-lg text-sm font-medium ${activeTab === link.id ? 'bg-teal-50 text-teal-700 font-bold' : 'text-slate-700'
                }`}
            >
              {link.label}
            </button>
          ))}
          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={() => {
                onOpenApplyDoctor();
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left px-3 py-2 text-sm text-teal-700 font-semibold"
            >
              Apply as a Doctor
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
