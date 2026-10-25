/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, UserRole, Appointment, Invoice, Prescription } from './types';
import { StorageService } from './lib/storage';
import { Header } from './components/layout/Header';
import { FloatingTestWidget } from './components/layout/FloatingTestWidget';
import { Footer } from './components/layout/Footer';
import { NotificationInboxModal } from './components/layout/NotificationInboxModal';
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
  // Initialize local database on first mount
  useEffect(() => {
    StorageService.initialize();
  }, []);

  const [currentUser, setCurrentUser] = useState<User | null>(() => StorageService.getCurrentUser());
  const [activeTab, setActiveTab] = useState<string>('home');

  // Modals state
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isApplyDoctorOpen, setIsApplyDoctorOpen] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isSetPasswordOpen, setIsSetPasswordOpen] = useState(false);
  const [forcePasswordUser, setForcePasswordUser] = useState<User | null>(null);
  const [isInboxOpen, setIsInboxOpen] = useState(false);

  // Document & Consultation Modals
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [activeVideoAppointment, setActiveVideoAppointment] = useState<Appointment | null>(null);

  // Email count tracking
  const [emailCount, setEmailCount] = useState<number>(() => StorageService.getEmails().length);

  // Listen to auth and email changes
  useEffect(() => {
    const handleAuthChange = () => {
      const user = StorageService.getCurrentUser();
      setCurrentUser(user);
    };

    const handleEmailChange = () => {
      setEmailCount(StorageService.getEmails().length);
    };

    window.addEventListener('ph_auth_changed', handleAuthChange);
    window.addEventListener('ph_new_email', handleEmailChange);

    return () => {
      window.removeEventListener('ph_auth_changed', handleAuthChange);
      window.removeEventListener('ph_new_email', handleEmailChange);
    };
  }, []);

  // Quick switch between accounts for instant evaluation
  const handleQuickSwitchUser = (userId: string) => {
    const user = StorageService.getUserById(userId);
    if (user) {
      if (user.mustChangePassword) {
        setForcePasswordUser(user);
        return;
      }
      StorageService.setCurrentUser(user);
      if (user.role === 'DOCTOR') setActiveTab('doctor_schedule');
      else if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') setActiveTab('admin_doctors');
      else setActiveTab('home');
    }
  };

  const currentRole: UserRole | 'GUEST' = currentUser ? currentUser.role : 'GUEST';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-teal-500 selection:text-white">
      {/* 1. Navigation Bar (Left: Logo, Center: Nav Pages, Right: Only Login & Register) */}
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
      />

      {/* 3. Main Dynamic Content Viewport */}
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

      {/* 4. Comprehensive Hospital & Telemedicine Footer */}
      <Footer
        onNavigate={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenApplyDoctor={() => setIsApplyDoctorOpen(true)}
        onOpenRegister={() => setIsRegisterOpen(true)}
      />

      {/* 5. Modals Container */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onOpenRegister={() => setIsRegisterOpen(true)}
        onOpenApplyDoctor={() => setIsApplyDoctorOpen(true)}
        onOpenForgotPassword={() => setIsForgotPasswordOpen(true)}
        onRequireForcePasswordChange={(user) => setForcePasswordUser(user)}
      />

      <RegisterPatientModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onOpenLogin={() => setIsLoginOpen(true)}
        onOpenInbox={() => setIsInboxOpen(true)}
      />

      <DoctorApplyModal
        isOpen={isApplyDoctorOpen}
        onClose={() => setIsApplyDoctorOpen(false)}
        onOpenLogin={() => setIsLoginOpen(true)}
        onOpenInbox={() => setIsInboxOpen(true)}
      />

      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
        onOpenLogin={() => setIsLoginOpen(true)}
        onOpenInbox={() => setIsInboxOpen(true)}
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
          onComplete={() => setForcePasswordUser(null)}
        />
      )}

      <NotificationInboxModal
        isOpen={isInboxOpen}
        onClose={() => setIsInboxOpen(false)}
      />

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
        onCompleteConsultation={(appId) => {
          const app = StorageService.getAppointmentById(appId);
          if (app) {
            app.status = 'completed';
            app.consultationCompletedAt = new Date().toISOString();
            StorageService.saveAppointment(app);
          }
        }}
      />

      {/* Floating Testing Tools (Discreet bottom-right button) */}
      <FloatingTestWidget
        onOpenInbox={() => setIsInboxOpen(true)}
        unreadEmailCount={emailCount}
        onQuickSwitchUser={handleQuickSwitchUser}
        currentRole={currentRole}
      />
    </div>
  );
}
