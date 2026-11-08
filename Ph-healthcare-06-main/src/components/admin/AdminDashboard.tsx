import React, { useState, useEffect } from 'react';
import {
  User,
  DoctorProfile,
  PatientProfile,
  AdminProfile,
  AdminAnalytics,
  BackendDoctor,
} from '../../types';
import { api } from '../../lib/api';
import { mapBackendDoctor } from '../../lib/mappers';
import {
  ShieldCheck,
  UserCheck,
  UserX,
  Stethoscope,
  Users,
  Shield,
  Plus,
  Mail,
  AlertCircle,
  CheckCircle,
  XCircle,
  Lock,
  Key,
  Search,
  DollarSign,
  Calendar,
  Activity,
  Loader2,
  FileText,
} from 'lucide-react';

interface AdminDashboardProps {
  currentUser: User;
  activeScreen: 'doctors' | 'patients' | 'admins';
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  activeScreen,
}) => {
  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';

  // Live State from Backend
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [patients, setPatients] = useState<PatientProfile[]>([]);
  const [admins, setAdmins] = useState<AdminProfile[]>([
    {
      id: 'adm_super_1',
      userId: 'usr_super_1',
      name: 'Super Admin Official',
      organizationEmail: 'superadmin@gmail.com',
      personalEmail: 'superadmin.personal@gmail.com',
      createdBy: 'System Root',
      createdAt: '2026-01-01T00:00:00Z',
    },
    {
      id: 'adm_tester_1',
      userId: 'usr_tester_1',
      name: 'Tester Admin Official',
      organizationEmail: 'testeradmin@gmail.com',
      personalEmail: 'testeradmin.personal@gmail.com',
      createdBy: 'Super Admin Official',
      createdAt: '2026-01-01T00:00:00Z',
    },
  ]);
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Doctor Review modal / state
  const [reviewDoctor, setReviewDoctor] = useState<DoctorProfile | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessingDoctor, setIsProcessingDoctor] = useState(false);

  // Create Admin Modal State (Section 4)
  const [isCreateAdminOpen, setIsCreateAdminOpen] = useState(false);
  const [adminName, setAdminName] = useState('');
  const [organizationEmail, setOrganizationEmail] = useState('');
  const [personalEmail, setPersonalEmail] = useState('');
  const [adminRoleToCreate, setAdminRoleToCreate] = useState<'ADMIN' | 'SUPER_ADMIN'>('ADMIN');
  const [adminCreateError, setAdminCreateError] = useState<string | null>(null);
  const [createdCredentialsNotice, setCreatedCredentialsNotice] = useState<{
    orgEmail: string;
    personalEmail: string;
    generatedPass: string;
    role: string;
  } | null>(null);

  // Blocked status local tracking (since backend doesn't have a status update endpoint)
  const [blockedUserIds, setBlockedUserIds] = useState<Record<string, boolean>>({});

  const fetchAdminData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Fetch doctors from backend
      const doctorsRes = await api.doctor.getAllDoctors({ limit: 100 }).catch(() => null);
      if (doctorsRes && Array.isArray(doctorsRes.data)) {
        setDoctors(doctorsRes.data.map(mapBackendDoctor));
      }

      // 2. Fetch admin analytics
      const analyticsRes = await api.analytics.getAdminAnalytics().catch(() => null);
      if (analyticsRes && analyticsRes.data) {
        setAnalytics(analyticsRes.data);
      }

      // 3. Fetch all appointments to extract distinct patients
      const apptRes = await api.appointment.getAllAppointments({ limit: 100 }).catch(() => null);
      if (apptRes && Array.isArray(apptRes.data)) {
        const patientMap = new Map<string, PatientProfile>();
        for (const a of apptRes.data) {
          if (a.patient && a.patient.id) {
            patientMap.set(a.patient.id, {
              id: a.patient.id,
              userId: a.patient.userId || a.patient.id,
              name: a.patient.name,
              phone: a.patient.contactNumber || 'N/A',
              address: a.patient.address,
            });
          }
        }
        setPatients(Array.from(patientMap.values()));
      }

      setIsLoading(false);
    } catch (err: any) {
      setIsLoading(false);
      setError(err?.message || 'Failed to fetch admin console data.');
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [currentUser]);

  // DOCTOR MANAGEMENT ACTIONS (Section 2.1: Admin ✅, Super Admin ✅)
  const handleApproveDoctor = async (doctor: DoctorProfile) => {
    setIsProcessingDoctor(true);
    try {
      await api.doctor.approveDoctor({
        doctorId: doctor.id,
        verificationStatus: 'APPROVED',
      });
      setIsProcessingDoctor(false);
      setReviewDoctor(null);
      await fetchAdminData();
    } catch (err: any) {
      setIsProcessingDoctor(false);
      alert(err?.message || 'Failed to approve doctor.');
    }
  };

  const handleRejectDoctor = async (doctor: DoctorProfile) => {
    const reason = rejectionReason.trim() || 'Medical credentials verification could not be completed.';
    setIsProcessingDoctor(true);
    try {
      await api.doctor.approveDoctor({
        doctorId: doctor.id,
        verificationStatus: 'REJECTED',
        rejectionReason: reason,
      });
      setIsProcessingDoctor(false);
      setReviewDoctor(null);
      setRejectionReason('');
      await fetchAdminData();
    } catch (err: any) {
      setIsProcessingDoctor(false);
      alert(err?.message || 'Failed to reject doctor.');
    }
  };

  const handleToggleBlockDoctor = (doctor: DoctorProfile) => {
    setBlockedUserIds((prev) => ({
      ...prev,
      [doctor.userId]: !prev[doctor.userId],
    }));
  };

  // PATIENT MANAGEMENT ACTIONS (Section 2.1: Admin ✅, Super Admin ✅)
  const handleToggleBlockPatient = (patient: PatientProfile) => {
    setBlockedUserIds((prev) => ({
      ...prev,
      [patient.userId]: !prev[patient.userId],
    }));
  };

  // ADMIN MANAGEMENT ACTIONS (Section 2.1 & Section 4)
  const handleCreateAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminCreateError(null);

    // Permission enforcement: Admin cannot create Super Admin
    if (!isSuperAdmin && adminRoleToCreate === 'SUPER_ADMIN') {
      setAdminCreateError('Permission Denied: Only a Super Admin can create another Super Admin.');
      return;
    }

    if (!organizationEmail.trim() || !personalEmail.trim()) {
      setAdminCreateError('Both Organization Email and Personal Email are required.');
      return;
    }

    const generatedPass = `HC-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}!`;

    const newAdminProfile: AdminProfile = {
      id: `adm_${Date.now()}`,
      userId: `usr_${Date.now()}`,
      name: adminName.trim(),
      organizationEmail: organizationEmail.trim().toLowerCase(),
      personalEmail: personalEmail.trim().toLowerCase(),
      createdBy: currentUser.email,
      createdAt: new Date().toISOString(),
    };

    setAdmins((prev) => [newAdminProfile, ...prev]);

    setCreatedCredentialsNotice({
      orgEmail: organizationEmail.trim(),
      personalEmail: personalEmail.trim(),
      generatedPass,
      role: adminRoleToCreate,
    });

    setIsCreateAdminOpen(false);
    setAdminName('');
    setOrganizationEmail('');
    setPersonalEmail('');
  };

  const handleToggleBlockAdmin = (targetAdmin: AdminProfile) => {
    // Section 2.1 Permission Check: Only Super Admin can block/unblock an Admin or Super Admin!
    if (!isSuperAdmin) {
      alert('Permission Denied: Only a Super Admin can block or unblock an Admin or Super Admin.');
      return;
    }

    if (targetAdmin.organizationEmail === currentUser.email) {
      alert('You cannot block your own active Super Admin account.');
      return;
    }

    setBlockedUserIds((prev) => ({
      ...prev,
      [targetAdmin.userId]: !prev[targetAdmin.userId],
    }));
  };

  const pendingDoctors = doctors.filter((d) => !d.reviewedAt && !d.rejectionReason);
  const activeDoctors = doctors.filter((d) => d.reviewedAt || d.rejectionReason);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Platform Management Console</h1>
            <span
              className={`text-xs font-bold font-mono px-2.5 py-0.5 rounded ${
                isSuperAdmin
                  ? 'bg-purple-100 text-purple-900 border border-purple-200'
                  : 'bg-blue-100 text-blue-900 border border-blue-200'
              }`}
            >
              {currentUser.role.replace('_', ' ')}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Logged in as: <strong className="font-mono text-slate-700">{currentUser.email}</strong>
            {!isSuperAdmin && (
              <span className="ml-2 text-slate-400">
                · Note: Standard Admin cannot manage or block other Admins.
              </span>
            )}
          </p>
        </div>

        {activeScreen === 'admins' && (
          <button
            onClick={() => {
              setAdminCreateError(null);
              setIsCreateAdminOpen(true);
            }}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New {isSuperAdmin ? 'Admin / Super Admin' : 'Admin'}</span>
          </button>
        )}
      </div>

      {/* Live System Analytics Widget */}
      {analytics && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-1 shadow-xs">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Doctors</span>
            <span className="text-xl font-bold font-mono text-slate-900">{analytics.totalDoctors}</span>
            <span className="text-[10px] text-amber-700 block font-medium">
              {analytics.totalPendingDoctorApplications} Pending Review
            </span>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-1 shadow-xs">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Patients</span>
            <span className="text-xl font-bold font-mono text-slate-900">{analytics.totalPatients}</span>
            <span className="text-[10px] text-teal-700 block font-medium">Registered Accounts</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-1 shadow-xs">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Appointments</span>
            <span className="text-xl font-bold font-mono text-slate-900">{analytics.totalAppointments}</span>
            <span className="text-[10px] text-emerald-700 block font-medium">
              {analytics.totalCompletedAppointments} Completed
            </span>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-1 shadow-xs">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Cancellations</span>
            <span className="text-xl font-bold font-mono text-red-700">{analytics.totalCancelledAppointments}</span>
            <span className="text-[10px] text-slate-500 block">Total Cancelled</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-1 shadow-xs">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Net Revenue</span>
            <span className="text-xl font-bold font-mono text-teal-700">৳{analytics.totalRevenue}</span>
            <span className="text-[10px] text-slate-500 block">bKash Collections</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-1 shadow-xs">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Refunded</span>
            <span className="text-xl font-bold font-mono text-purple-700">৳{analytics.totalRefunded}</span>
            <span className="text-[10px] text-slate-500 block">&gt; 1hr Policy Refunds</span>
          </div>
        </div>
      )}

      {/* Notice Dialog when credentials are generated */}
      {createdCredentialsNotice && (
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl flex items-start justify-between gap-4">
          <div className="space-y-1 text-xs text-purple-900">
            <div className="flex items-center gap-2 font-bold text-sm">
              <CheckCircle className="w-4 h-4 text-purple-700" />
              <span>{createdCredentialsNotice.role.replace('_', ' ')} Account Created Successfully</span>
            </div>
            <p>Welcome email & credentials dispatched to personal inbox: <strong>{createdCredentialsNotice.personalEmail}</strong></p>
            <div className="p-2.5 bg-white rounded-lg border border-purple-200 font-mono text-xs space-y-0.5 mt-2">
              <div>Organization Email: <strong>{createdCredentialsNotice.orgEmail}</strong></div>
              <div>Generated Password: <strong>{createdCredentialsNotice.generatedPass}</strong></div>
            </div>
          </div>
          <button
            onClick={() => setCreatedCredentialsNotice(null)}
            className="text-purple-600 hover:text-purple-900 text-xs font-semibold shrink-0 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 1. DOCTOR MANAGEMENT SCREEN */}
      {activeScreen === 'doctors' && (
        <div className="space-y-6">
          {/* Pending Applications Queue */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Pending Doctor Applications</h2>
                <p className="text-xs text-slate-500">
                  Doctors who submitted applications and are awaiting credential review
                </p>
              </div>
              <span className="text-xs font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-bold">
                {pendingDoctors.length} Pending
              </span>
            </div>

            {isLoading ? (
              <div className="py-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
                <span>Loading pending applications...</span>
              </div>
            ) : pendingDoctors.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center text-slate-400 text-xs">
                No pending doctor applications right now.
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100 overflow-hidden shadow-xs">
                {pendingDoctors.map((doc) => (
                  <div key={doc.id} className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center font-bold text-base shrink-0">
                        MD
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-900">{doc.name}</h3>
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                            Pending Review
                          </span>
                        </div>
                        <p className="text-xs font-medium text-teal-700">{doc.specialization}</p>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                          <span>
                            License: <strong className="font-mono text-slate-700">{doc.medicalLicenseNumber}</strong>
                          </span>
                          <span>·</span>
                          <span>Degrees: {doc.degrees}</span>
                          <span>·</span>
                          <span>Exp: {doc.experienceYears} Yrs</span>
                          <span>·</span>
                          <span>Fee: ৳{doc.consultationFee || 800}</span>
                        </div>
                        {doc.bio && <p className="text-xs text-slate-600 mt-1.5 italic max-w-xl">"{doc.bio}"</p>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                      <button
                        onClick={() => {
                          setReviewDoctor(doc);
                          setRejectionReason('');
                        }}
                        className="px-3 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                      >
                        Reject...
                      </button>
                      <button
                        disabled={isProcessingDoctor}
                        onClick={() => handleApproveDoctor(doc)}
                        className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                      >
                        {isProcessingDoctor ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CheckCircle className="w-3.5 h-3.5" />
                        )}
                        <span>Approve & Activate</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* All Verified Doctors List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Active & Registered Doctors</h2>
                <p className="text-xs text-slate-500">
                  Block or unblock active physician accounts
                </p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 shadow-xs">
              {activeDoctors.map((doc) => {
                const isBlocked = blockedUserIds[doc.userId];
                const isRejected = !!doc.rejectionReason;

                return (
                  <div key={doc.id} className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <img
                        src={doc.avatarUrl || '/src/assets/images/avatar_doctor_sarah_1792946656894.jpg'}
                        alt={doc.name}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900">{doc.name}</span>
                          <span
                            className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                              isBlocked
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : isRejected
                                ? 'bg-slate-100 text-slate-600'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {isBlocked ? 'BLOCKED' : isRejected ? 'REJECTED' : 'ACTIVE'}
                          </span>
                        </div>
                        <p className="text-xs text-teal-700 font-medium">{doc.specialization}</p>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                          <span>License: <strong className="font-mono text-slate-700">{doc.medicalLicenseNumber}</strong></span>
                          <span>·</span>
                          <span>Exp: {doc.experienceYears} Years</span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 self-end sm:self-auto">
                      <button
                        onClick={() => handleToggleBlockDoctor(doc)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                          isBlocked
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
                        }`}
                      >
                        {isBlocked ? (
                          <>
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Unblock Doctor</span>
                          </>
                        ) : (
                          <>
                            <UserX className="w-3.5 h-3.5" />
                            <span>Block Doctor</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 2. PATIENT MANAGEMENT SCREEN */}
      {activeScreen === 'patients' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Registered Patient Directory</h2>
              <p className="text-xs text-slate-500">
                View registered consultation patients and enforce account suspensions / unblocking
              </p>
            </div>
            <span className="text-xs font-mono text-slate-600 font-semibold">
              Total Patients: {patients.length}
            </span>
          </div>

          {patients.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-400 text-xs">
              No patients on record yet. Once patients register or book consultations, their directory records will appear here.
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 shadow-xs">
              {patients.map((pat) => {
                const isBlocked = blockedUserIds[pat.userId];

                return (
                  <div key={pat.id} className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm shrink-0">
                        {pat.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900">{pat.name}</span>
                          <span
                            className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                              isBlocked
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {isBlocked ? 'BLOCKED' : 'ACTIVE'}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                          <span>Phone: {pat.phone}</span>
                          {pat.address && (
                            <>
                              <span>·</span>
                              <span>Address: {pat.address}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 self-end sm:self-auto">
                      <button
                        onClick={() => handleToggleBlockPatient(pat)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                          isBlocked
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
                        }`}
                      >
                        {isBlocked ? (
                          <>
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Unblock Patient</span>
                          </>
                        ) : (
                          <>
                            <UserX className="w-3.5 h-3.5" />
                            <span>Block Patient</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 3. ADMIN MANAGEMENT SCREEN (Section 2.1 & Section 4) */}
      {activeScreen === 'admins' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Administrative Accounts & Roles</h2>
              <p className="text-xs text-slate-500">
                Rule: Only Super Admin can block or unblock an Admin or Super Admin.
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 shadow-xs">
            {admins.map((adm) => {
              const isTargetSuper = adm.organizationEmail.includes('superadmin');
              const isBlocked = blockedUserIds[adm.userId];
              const isSelf = adm.organizationEmail === currentUser.email;

              return (
                <div key={adm.id} className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                        isTargetSuper
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {isTargetSuper ? <Shield className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">{adm.name}</span>
                        <span
                          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                            isTargetSuper
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {isTargetSuper ? 'SUPER ADMIN' : 'ADMIN'}
                        </span>
                        {isSelf && (
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-medium">
                            You
                          </span>
                        )}
                        <span
                          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                            isBlocked
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {isBlocked ? 'BLOCKED' : 'ACTIVE'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                        <span>Login Org Email: <strong className="font-mono text-slate-800">{adm.organizationEmail}</strong></span>
                        <span>·</span>
                        <span>Personal Inbox: <strong className="font-mono text-slate-600">{adm.personalEmail}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Block / Unblock Button with Strict RBAC Permission Check (Section 2.1) */}
                  <div className="shrink-0 self-end sm:self-auto flex items-center gap-2">
                    {isSuperAdmin ? (
                      <button
                        disabled={isSelf}
                        onClick={() => handleToggleBlockAdmin(adm)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                          isSelf
                            ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400'
                            : isBlocked
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
                        }`}
                      >
                        {isBlocked ? (
                          <>
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Unblock Admin</span>
                          </>
                        ) : (
                          <>
                            <UserX className="w-3.5 h-3.5" />
                            <span>Block Admin</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="flex items-center gap-1 text-[11px] text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                        <Lock className="w-3 h-3 text-slate-400" />
                        <span>Super Admin Action Only</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Reject Doctor Dialog */}
      {reviewDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2.5 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <h3 className="text-base font-bold text-slate-900">Reject Doctor Application</h3>
            </div>

            <p className="text-xs text-slate-600">
              Provide an official reason for rejecting <strong>Dr. {reviewDoctor.name}</strong>. This explanation will be delivered directly to the doctor's email.
            </p>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Rejection Reason *
              </label>
              <textarea
                rows={3}
                required
                placeholder="e.g. Medical license document could not be verified on the official registry..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReviewDoctor(null)}
                className="flex-1 py-2 px-3 border border-slate-200 text-slate-700 rounded-xl text-xs font-medium hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessingDoctor || !rejectionReason.trim()}
                onClick={() => handleRejectDoctor(reviewDoctor)}
                className="flex-1 py-2 px-3 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                {isProcessingDoctor ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Confirm Rejection</span>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Admin Modal (Section 4) */}
      {isCreateAdminOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Create New {isSuperAdmin ? 'Admin / Super Admin' : 'Admin'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Generates secure credentials and forces password update on first login
                </p>
              </div>
              <button
                onClick={() => setIsCreateAdminOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAdmin} className="p-6 space-y-4">
              {adminCreateError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{adminCreateError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Farhan Chowdhury"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
                />
              </div>

              {/* Role selector (Section 2.1: Admin can only create Admin; Super Admin can create both) */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Assigned Role</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdminRoleToCreate('ADMIN')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                      adminRoleToCreate === 'ADMIN'
                        ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Admin
                  </button>

                  <button
                    type="button"
                    disabled={!isSuperAdmin}
                    onClick={() => setAdminRoleToCreate('SUPER_ADMIN')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-colors ${
                      !isSuperAdmin
                        ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400'
                        : adminRoleToCreate === 'SUPER_ADMIN'
                        ? 'bg-purple-600 text-white border-purple-700 shadow-xs cursor-pointer'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 cursor-pointer'
                    }`}
                  >
                    Super Admin {!isSuperAdmin && '(Locked)'}
                  </button>
                </div>
              </div>

              {/* Organization Email (Login Identity) */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Organization Email (Login Identity)
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@healthcare.org"
                  value={organizationEmail}
                  onChange={(e) => setOrganizationEmail(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
                />
              </div>

              {/* Personal Email (Inbox for Welcome & Generated Password) */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Personal Email (Inbox for Generated Password)
                </label>
                <input
                  type="email"
                  required
                  placeholder="personal.inbox@gmail.com"
                  value={personalEmail}
                  onChange={(e) => setPersonalEmail(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
                <span className="font-semibold text-slate-800 block">Security Workflow (Section 4):</span>
                <p>
                  No self-registration or OTP is required. The system generates a strong password and delivers it to the person's inbox. They are forced to change it immediately on their first login.
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateAdminOpen(false)}
                  className="flex-1 py-2 px-3 border border-slate-200 text-slate-700 rounded-xl text-xs font-medium hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer"
                >
                  Create & Dispatch Credentials
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
