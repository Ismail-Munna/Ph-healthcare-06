/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, UserRole, Appointment, Invoice, Prescription } from './types';
import { api } from './lib/api';
import { mapBackendUser } from './lib/mappers';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { LoginModal } from './components/auth/LoginModal';
import { RegisterPatientModal } from './components/auth/RegisterPatientModal';
import { DoctorApplyModal } from './components/auth/DoctorApplyModal';
import {
  ForgotPasswordModal,
  ChangePasswordModal,
  SetPasswordModal,
  ForcePasswordChangeModal,
} from './components/auth/PasswordModals';
import { PatientDashboard } from './components/patient/PatientDashboard';
import { DoctorDashboard } from './components/doctor/DoctorDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { SpecialtiesPage } from './components/pages/SpecialtiesPage';
import { HowItWorksPage } from './components/pages/HowItWorksPage';
import { AboutUsPage } from './components/pages/AboutUsPage';
import { ContactPage } from './components/pages/ContactPage';
import { InvoiceModal } from './components/documents/InvoiceModal';
import { PrescriptionModal } from './components/documents/PrescriptionModal';
import { VideoRoomModal } from './components/consultation/VideoRoomModal';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('home');

  // Modals state
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isApplyDoctorOpen, setIsApplyDoctorOpen] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isSetPasswordOpen, setIsSetPasswordOpen] = useState(false);
  const [forcePasswordUser, setForcePasswordUser] = useState<User | null>(null);

  // Document & Consultation Modals
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [activeVideoAppointment, setActiveVideoAppointment] = useState<Appointment | null>(null);

  // 1. Restore authenticated session on mount from backend cookies
  useEffect(() => {
    let mounted = true;
    const restoreSession = async () => {
      try {
        const res = await api.auth.getMe();
        if (mounted && res && res.data) {
          const user = mapBackendUser(res.data);
          const alreadyChanged = sessionStorage.getItem(`ph_pwd_changed_${user.email.toLowerCase()}`) === 'true';
          if (alreadyChanged) {
            user.needPasswordChange = false;
            user.mustChangePassword = false;
          }
          setCurrentUser(user);

          // Force password change if newly created admin or mustChangePassword
          if ((user.mustChangePassword || user.needPasswordChange) && !alreadyChanged) {
            setForcePasswordUser(user);
          }
        }
      } catch {
        // Unauthenticated guest user
      } finally {
        if (mounted) setIsSessionLoading(false);
      }
    };

    restoreSession();

    // Listen for auth session expiration from api client (401 refresh failure)
    const handleSessionExpired = () => {
      setCurrentUser(null);
      setActiveTab('home');
      setIsLoginOpen(true);
    };

    window.addEventListener('ph_auth_session_expired', handleSessionExpired);

    return () => {
      mounted = false;
      window.removeEventListener('ph_auth_session_expired', handleSessionExpired);
    };
  }, []);

  // 2. Handle bKash Payment Return Callback URLs
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pathname = window.location.pathname;

    if (
      pathname.includes('my-appointments') ||
      params.has('status') ||
      params.has('paymentID') ||
      params.has('error')
    ) {
      setActiveTab('my_appointments');
    }
  }, []);

  // 3. Role-based Route Guarding
  useEffect(() => {
    if (isSessionLoading) return;

    // Doctor workspace guarding
    if ((activeTab === 'doctor_schedule' || activeTab === 'doctor_consultations') && currentUser?.role !== 'DOCTOR') {
      if (!currentUser) {
        setIsLoginOpen(true);
      }
      setActiveTab('home');
    }

    // Admin console guarding
    if (
      (activeTab === 'admin_doctors' || activeTab === 'admin_patients' || activeTab === 'admin_admins') &&
      currentUser?.role !== 'ADMIN' &&
      currentUser?.role !== 'SUPER_ADMIN'
    ) {
      if (!currentUser) {
        setIsLoginOpen(true);
      }
      setActiveTab('home');
    }

    // Patient protected screens guarding
    if ((activeTab === 'my_appointments' || activeTab === 'my_prescriptions') && !currentUser) {
      setIsLoginOpen(true);
      setActiveTab('home');
    }
  }, [activeTab, currentUser, isSessionLoading]);

  const currentRole: UserRole | 'GUEST' = currentUser ? currentUser.role : 'GUEST';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-teal-500 selection:text-white">
      {/* 1. Navigation Bar */}
      <Header
        currentUser={currentUser}
        currentRole={currentRole}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenLogin={() => setIsLoginOpen(true)}
        onOpenRegister={() => setIsRegisterOpen(true)}
        onOpenApplyDoctor={() => setIsApplyDoctorOpen(true)}
        onOpenChangePassword={() => setIsChangePasswordOpen(true)}
        onOpenSetPassword={() => setIsSetPasswordOpen(true)}
        onLogout={() => {
          setCurrentUser(null);
          setActiveTab('home');
        }}
      />

      {/* 2. Main Dynamic Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page 1: Home (Browse Doctors, Symptom Checker, Today's Schedules, 4-Step Flow, Reviews) */}
        {activeTab === 'home' && (
          <PatientDashboard
            currentUser={currentUser}
            activeSubTab="browse"
            onRequireLogin={() => setIsLoginOpen(true)}
            onOpenInvoiceModal={(inv) => setSelectedInvoice(inv)}
            onOpenPrescriptionModal={(rx) => setSelectedPrescription(rx)}
            onOpenVideoRoom={(app) => setActiveVideoAppointment(app)}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onOpenApplyDoctor={() => setIsApplyDoctorOpen(true)}
          />
        )}

        {/* Page 2: Find Doctors */}
        {activeTab === 'doctors' && (
          <PatientDashboard
            currentUser={currentUser}
            activeSubTab="browse"
            onRequireLogin={() => setIsLoginOpen(true)}
            onOpenInvoiceModal={(inv) => setSelectedInvoice(inv)}
            onOpenPrescriptionModal={(rx) => setSelectedPrescription(rx)}
            onOpenVideoRoom={(app) => setActiveVideoAppointment(app)}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onOpenApplyDoctor={() => setIsApplyDoctorOpen(true)}
          />
        )}

        {/* Page 3: Specialties & Clinical Departments */}
        {activeTab === 'specialties' && (
          <SpecialtiesPage
            onSelectSpecialty={() => {}}
            onNavigateDoctors={() => setActiveTab('doctors')}
          />
        )}

        {/* Page 4: How It Works & Patient Guide */}
        {activeTab === 'how_it_works' && (
          <HowItWorksPage
            onNavigateDoctors={() => setActiveTab('doctors')}
            onOpenApplyDoctor={() => setIsApplyDoctorOpen(true)}
            onOpenRegister={() => setIsRegisterOpen(true)}
          />
        )}

        {/* Page 5: About Us & Medical Leadership */}
        {activeTab === 'about' && (
          <AboutUsPage
            onNavigateDoctors={() => setActiveTab('doctors')}
            onOpenApplyDoctor={() => setIsApplyDoctorOpen(true)}
          />
        )}

        {/* Page 6: Contact & Emergency Tele-Support */}
        {activeTab === 'contact' && <ContactPage />}

        {/* Patient: My Appointments */}
        {activeTab === 'my_appointments' && (
          <PatientDashboard
            currentUser={currentUser}
            activeSubTab="appointments"
            onRequireLogin={() => setIsLoginOpen(true)}
            onOpenInvoiceModal={(inv) => setSelectedInvoice(inv)}
            onOpenPrescriptionModal={(rx) => setSelectedPrescription(rx)}
            onOpenVideoRoom={(app) => setActiveVideoAppointment(app)}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        )}

        {/* Patient: My Prescriptions */}
        {activeTab === 'my_prescriptions' && (
          <PatientDashboard
            currentUser={currentUser}
            activeSubTab="prescriptions"
            onRequireLogin={() => setIsLoginOpen(true)}
            onOpenInvoiceModal={(inv) => setSelectedInvoice(inv)}
            onOpenPrescriptionModal={(rx) => setSelectedPrescription(rx)}
            onOpenVideoRoom={(app) => setActiveVideoAppointment(app)}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        )}

        {/* Doctor Console: Schedules & Consultations */}
        {(activeTab === 'doctor_schedule' || activeTab === 'doctor_consultations') && currentUser?.role === 'DOCTOR' && (
          <DoctorDashboard
            currentUser={currentUser}
            onOpenVideoRoom={(app) => setActiveVideoAppointment(app)}
            onOpenPrescriptionModal={(rx) => setSelectedPrescription(rx)}
          />
        )}

        {/* Admin / Super Admin: Doctor Management */}
        {activeTab === 'admin_doctors' && (currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN') && (
          <AdminDashboard currentUser={currentUser} activeScreen="doctors" />
        )}

        {/* Admin / Super Admin: Patient Management */}
        {activeTab === 'admin_patients' && (currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN') && (
          <AdminDashboard currentUser={currentUser} activeScreen="patients" />
        )}

        {/* Admin / Super Admin: Admin Management */}
        {activeTab === 'admin_admins' && (currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN') && (
          <AdminDashboard currentUser={currentUser} activeScreen="admins" />
        )}
      </main>

      {/* 3. Comprehensive Hospital & Telemedicine Footer */}
      <Footer
        onNavigate={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenApplyDoctor={() => setIsApplyDoctorOpen(true)}
        onOpenRegister={() => setIsRegisterOpen(true)}
      />

      {/* 4. Authentication & Security Modals */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onOpenRegister={() => setIsRegisterOpen(true)}
        onOpenApplyDoctor={() => setIsApplyDoctorOpen(true)}
        onOpenForgotPassword={() => setIsForgotPasswordOpen(true)}
        onRequireForcePasswordChange={(user) => setForcePasswordUser(user)}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          if (user.role === 'DOCTOR') setActiveTab('doctor_schedule');
          else if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') setActiveTab('admin_doctors');
          else setActiveTab('my_appointments');
        }}
      />

      <RegisterPatientModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onOpenLogin={() => setIsLoginOpen(true)}
        onRegisterSuccess={(user) => {
          setCurrentUser(user);
          setActiveTab('my_appointments');
        }}
      />

      <DoctorApplyModal
        isOpen={isApplyDoctorOpen}
        onClose={() => setIsApplyDoctorOpen(false)}
        onOpenLogin={() => setIsLoginOpen(true)}
      />

      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
        onOpenLogin={() => setIsLoginOpen(true)}
      />

      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
        currentUser={currentUser}
      />

      <SetPasswordModal
        isOpen={isSetPasswordOpen}
        onClose={() => setIsSetPasswordOpen(false)}
        currentUser={currentUser}
      />

      {forcePasswordUser && (
        <ForcePasswordChangeModal
          user={forcePasswordUser}
          onComplete={(updatedUser) => {
            setForcePasswordUser(null);
            setCurrentUser(updatedUser);
            if (updatedUser.role === 'DOCTOR') setActiveTab('doctor_schedule');
            else if (updatedUser.role === 'ADMIN' || updatedUser.role === 'SUPER_ADMIN') setActiveTab('admin_doctors');
            else setActiveTab('my_appointments');
          }}
        />
      )}

      {/* 5. Document & Consultation Modals */}
      <InvoiceModal
        invoice={selectedInvoice}
        isOpen={Boolean(selectedInvoice)}
        onClose={() => setSelectedInvoice(null)}
      />

      <PrescriptionModal
        prescription={selectedPrescription}
        isOpen={Boolean(selectedPrescription)}
        onClose={() => setSelectedPrescription(null)}
      />

      <VideoRoomModal
        appointment={activeVideoAppointment}
        isOpen={Boolean(activeVideoAppointment)}
        onClose={() => setActiveVideoAppointment(null)}
        isDoctorView={currentUser?.role === 'DOCTOR'}
        onCompleteConsultation={async (appId) => {
          try {
            await api.appointment.updateAppointmentStatus(appId, { status: 'COMPLETED' });
          } catch (err) {
            console.error('Failed to complete consultation:', err);
          }
        }}
      />
    </div>
  );
}
