/**
 * Healthcare System - Centralized API Client
 * Interacts with backend at http://localhost:5000/api/v1
 * Supports cookie-based JWT authentication, automatic token refresh on 401,
 * and strongly typed endpoints matching the backend routes.
 */

import {
  ApiResponse,
  LoginPayload,
  RegisterPatientPayload,
  VerifyEmailPayload,
  GoogleLoginPayload,
  ForgotPasswordPayload,
  ResetPasswordPayload,
  DoctorApplicationPayload,
  CreateSchedulePayload,
  UpdateSchedulePayload,
  BookAppointmentPayload,
  UpdateAppointmentStatusPayload,
  CreatePrescriptionPayload,
  ApproveDoctorPayload,
  BackendUser,
  BackendDoctor,
  BackendSchedule,
  BackendAppointment,
  BackendPayment,
  AdminAnalytics,
  DoctorAnalytics,
  PatientAnalytics,
} from '../types';

export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:5000/api/v1';

export class ApiError extends Error {
  statusCode: number;
  data: any;

  constructor(message: string, statusCode: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.data = data;
  }
}

// Token refresh queue lock
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

/**
 * Core fetch wrapper with credentials and 401 refresh handling
 */
export async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  // If body is NOT FormData, default to application/json
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const config: RequestInit = {
    ...options,
    headers,
    credentials: 'include', // Backend sets httpOnly cookies (accessToken, refreshToken)
  };

  try {
    const response = await fetch(url, config);

    // Handle 401 Unauthorized (attempt refresh once)
    if (
      response.status === 401 &&
      !endpoint.includes('/auth/login') &&
      !endpoint.includes('/auth/refresh-token') &&
      !endpoint.includes('/auth/register')
    ) {
      if (isRefreshing) {
        // Wait for token refresh to complete
        await new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        });
        return request<T>(endpoint, options);
      }

      isRefreshing = true;

      try {
        const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
          method: 'POST',
          credentials: 'include',
        });

        if (!refreshRes.ok) {
          throw new ApiError('Session expired. Please log in again.', 401);
        }

        processQueue(null);
        return request<T>(endpoint, options);
      } catch (refreshErr) {
        processQueue(refreshErr as Error);
        // Dispatch logout event so UI can clean up state
        window.dispatchEvent(new CustomEvent('ph_auth_session_expired'));
        throw refreshErr;
      } finally {
        isRefreshing = false;
      }
    }

    const json = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMessage =
        json?.message ||
        json?.errorSources?.[0]?.message ||
        `Request failed with status ${response.status}`;
      throw new ApiError(errorMessage, response.status, json);
    }

    return json as ApiResponse<T>;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError((error as Error).message || 'Network request failed', 0);
  }
}

// -------------------------------------------------------------
// Unified API Methods
// -------------------------------------------------------------

export const api = {
  // 1. Authentication & Session
  auth: {
    register: (payload: RegisterPatientPayload) =>
      request<{ email: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),

    verifyEmail: (payload: VerifyEmailPayload) =>
      request<{
        accessToken: string;
        refreshToken: string;
        user: BackendUser;
        patient: any;
      }>('/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),

    login: (payload: LoginPayload) =>
      request<{ accessToken: string; refreshToken: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),

    googleLogin: (payload: GoogleLoginPayload) =>
      request<{ accessToken: string; refreshToken: string }>('/auth/google', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),

    getMe: () => request<BackendUser>('/auth/me', { method: 'GET' }),

    refreshToken: () =>
      request<{ accessToken: string; refreshToken: string }>('/auth/refresh-token', {
        method: 'POST',
      }),

    forgotPassword: (payload: ForgotPasswordPayload) =>
      request<null>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),

    resetPassword: (payload: ResetPasswordPayload) =>
      request<null>('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),

    logout: () => request<null>('/auth/logout', { method: 'POST' }),
  },

  // 2. Doctor Management & Public Discovery
  doctor: {
    applyAsDoctor: (formData: FormData) =>
      request<{ doctor: BackendDoctor }>('/doctor/apply-as-doctor', {
        method: 'POST',
        body: formData, // multer upload with fields: data (JSON), resume, additionalFiles
      }),

    verifyDoctorEmail: (payload: VerifyEmailPayload) =>
      request<null>('/doctor/apply-as-doctor/verify-email', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),

    approveDoctor: (payload: ApproveDoctorPayload) =>
      request<BackendDoctor>('/doctor/approve-doctor', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),

    getAllDoctors: (params?: {
      page?: number;
      limit?: number;
      searchTerm?: string;
      specialization?: string;
      verificationStatus?: string;
    }) => {
      const query = new URLSearchParams();
      if (params?.page) query.set('page', String(params.page));
      if (params?.limit) query.set('limit', String(params.limit));
      if (params?.searchTerm) query.set('searchTerm', params.searchTerm);
      if (params?.specialization) query.set('specialization', params.specialization);
      if (params?.verificationStatus) query.set('verificationStatus', params.verificationStatus);
      const qs = query.toString();
      return request<BackendDoctor[]>(`/doctor/all-doctors${qs ? `?${qs}` : ''}`, {
        method: 'GET',
      });
    },

    getAvailableDoctorsToday: (params?: {
      page?: number;
      limit?: number;
      searchTerm?: string;
      specialization?: string;
    }) => {
      const query = new URLSearchParams();
      if (params?.page) query.set('page', String(params.page));
      if (params?.limit) query.set('limit', String(params.limit));
      if (params?.searchTerm) query.set('searchTerm', params.searchTerm);
      if (params?.specialization) query.set('specialization', params.specialization);
      const qs = query.toString();
      return request<any[]>(`/doctor/public/available-today${qs ? `?${qs}` : ''}`, {
        method: 'GET',
      });
    },

    getAllDoctorsPublic: (params?: {
      page?: number;
      limit?: number;
      searchTerm?: string;
      specialization?: string;
    }) => {
      const query = new URLSearchParams();
      if (params?.page) query.set('page', String(params.page));
      if (params?.limit) query.set('limit', String(params.limit));
      if (params?.searchTerm) query.set('searchTerm', params.searchTerm);
      if (params?.specialization) query.set('specialization', params.specialization);
      const qs = query.toString();
      return request<BackendDoctor[]>(`/doctor/public/all-doctors${qs ? `?${qs}` : ''}`, {
        method: 'GET',
      });
    },

    getSingleDoctorPublic: (doctorId: string) =>
      request<BackendDoctor>(`/doctor/public/${doctorId}`, { method: 'GET' }),

    updateMyProfile: (payload: Partial<BackendDoctor>) =>
      request<BackendDoctor>('/doctor/update-my-profile', {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),
  },

  // 3. Schedule Management
  schedule: {
    createSchedule: (payload: CreateSchedulePayload) =>
      request<BackendSchedule>('/schedule/create-schedule', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),

    getMySchedules: (params?: { page?: number; limit?: number; status?: string }) => {
      const query = new URLSearchParams();
      if (params?.page) query.set('page', String(params.page));
      if (params?.limit) query.set('limit', String(params.limit));
      if (params?.status) query.set('status', params.status);
      const qs = query.toString();
      return request<BackendSchedule[]>(`/schedule/my-schedules${qs ? `?${qs}` : ''}`, {
        method: 'GET',
      });
    },

    getTodaysSchedules: (doctorId?: string, params?: { page?: number; limit?: number }) => {
      const query = new URLSearchParams();
      if (doctorId) query.set('doctorId', doctorId);
      if (params?.page) query.set('page', String(params.page));
      if (params?.limit) query.set('limit', String(params.limit));
      const qs = query.toString();
      const endpoint1 = `/schedule/todays-schedule${qs ? `?${qs}` : ''}`;
      const endpoint2 = `/schedules/todays-schedule${qs ? `?${qs}` : ''}`;
      return request<BackendSchedule[]>(endpoint1, { method: 'GET' }).catch(() =>
        request<BackendSchedule[]>(endpoint2, { method: 'GET' })
      );
    },

    getAllSchedules: (params?: {
      page?: number;
      limit?: number;
      doctorId?: string;
      email?: string;
    }) => {
      const query = new URLSearchParams();
      if (params?.page) query.set('page', String(params.page));
      if (params?.limit) query.set('limit', String(params.limit));
      if (params?.doctorId) query.set('doctorId', params.doctorId);
      if (params?.email) query.set('email', params.email);
      const qs = query.toString();
      return request<BackendSchedule[]>(`/schedule/all-schedules${qs ? `?${qs}` : ''}`, {
        method: 'GET',
      });
    },

    getScheduleById: (scheduleId: string) =>
      request<BackendSchedule>(`/schedule/${scheduleId}`, { method: 'GET' }),

    updateSchedule: (scheduleId: string, payload: UpdateSchedulePayload) =>
      request<BackendSchedule>(`/schedule/update-schedule/${scheduleId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),

    publishSchedule: (scheduleId: string) =>
      request<BackendSchedule>(`/schedule/publish-schedule/${scheduleId}`, {
        method: 'PATCH',
      }),

    deleteSchedule: (scheduleId: string) =>
      request<null>(`/schedule/${scheduleId}`, {
        method: 'DELETE',
      }),
  },

  // 4. Appointments & Video Consultations
  appointment: {
    bookAppointment: (payload: BookAppointmentPayload) =>
      request<{ paymentUrl?: string; bkashURL?: string;[key: string]: any }>(
        '/appointment/book-appointment',
        {
          method: 'POST',
          body: JSON.stringify(payload),
        }
      ),

    payAppointment: (appointmentId: string) =>
      request<{ paymentUrl?: string; bkashURL?: string;[key: string]: any }>(
        '/appointment/pay-appointment',
        {
          method: 'POST',
          body: JSON.stringify({ appointmentId }),
        }
      ),

    cancelAppointment: (appointmentId: string) =>
      request<{ appointment: BackendAppointment; payment?: BackendPayment }>(
        '/appointment/cancel-appointment',
        {
          method: 'POST',
          body: JSON.stringify({ appointmentId }),
        }
      ),

    getMyAppointments: (params?: { page?: number; limit?: number; status?: string }) => {
      const query = new URLSearchParams();
      if (params?.page) query.set('page', String(params.page));
      if (params?.limit) query.set('limit', String(params.limit));
      if (params?.status) query.set('status', params.status);
      const qs = query.toString();
      return request<BackendAppointment[]>(`/appointment/my-appointments${qs ? `?${qs}` : ''}`, {
        method: 'GET',
      });
    },

    getDoctorAppointments: (params?: { page?: number; limit?: number; status?: string }) => {
      const query = new URLSearchParams();
      if (params?.page) query.set('page', String(params.page));
      if (params?.limit) query.set('limit', String(params.limit));
      if (params?.status) query.set('status', params.status);
      const qs = query.toString();
      return request<BackendAppointment[]>(
        `/appointment/doctor-appointments${qs ? `?${qs}` : ''}`,
        { method: 'GET' }
      );
    },

    getAllAppointments: (params?: { page?: number; limit?: number; status?: string }) => {
      const query = new URLSearchParams();
      if (params?.page) query.set('page', String(params.page));
      if (params?.limit) query.set('limit', String(params.limit));
      if (params?.status) query.set('status', params.status);
      const qs = query.toString();
      return request<BackendAppointment[]>(`/appointment/all-appointments${qs ? `?${qs}` : ''}`, {
        method: 'GET',
      });
    },

    getSingleAppointment: (appointmentId: string) =>
      request<BackendAppointment>(`/appointment/${appointmentId}`, { method: 'GET' }),

    updateAppointmentStatus: (
      appointmentId: string,
      payload: UpdateAppointmentStatusPayload
    ) =>
      request<BackendAppointment>(`/appointment/update-status/${appointmentId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),
  },

  // 5. Prescriptions
  prescription: {
    createPrescription: (payload: CreatePrescriptionPayload) =>
      request<BackendAppointment>('/prescription/create-prescription', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),

    getSinglePrescription: (appointmentId: string) =>
      request<{ appointment: BackendAppointment; prescription: string }>(
        `/prescription/${appointmentId}`,
        { method: 'GET' }
      ),
  },

  // 6. Payments
  payment: {
    getMyPayments: (params?: { page?: number; limit?: number }) => {
      const query = new URLSearchParams();
      if (params?.page) query.set('page', String(params.page));
      if (params?.limit) query.set('limit', String(params.limit));
      const qs = query.toString();
      return request<BackendPayment[]>(`/payment/my-payments${qs ? `?${qs}` : ''}`, {
        method: 'GET',
      });
    },

    getAllPayments: (params?: { page?: number; limit?: number; patientEmail?: string }) => {
      const query = new URLSearchParams();
      if (params?.page) query.set('page', String(params.page));
      if (params?.limit) query.set('limit', String(params.limit));
      if (params?.patientEmail) query.set('patientEmail', params.patientEmail);
      const qs = query.toString();
      return request<BackendPayment[]>(`/payment/all-payments${qs ? `?${qs}` : ''}`, {
        method: 'GET',
      });
    },

    getSinglePayment: (paymentId: string) =>
      request<BackendPayment>(`/payment/${paymentId}`, { method: 'GET' }),
  },

  // 7. Analytics
  analytics: {
    getAdminAnalytics: () => request<AdminAnalytics>('/analytics/admin-analytics', { method: 'GET' }),
    getDoctorAnalytics: () => request<DoctorAnalytics>('/analytics/doctor-analytics', { method: 'GET' }),
    getPatientAnalytics: () => request<PatientAnalytics>('/analytics/patient-analytics', { method: 'GET' }),
  },

  // 8. User Profile & Image Upload
  user: {
    uploadProfileImage: (file: File) => {
      const formData = new FormData();
      formData.append('profileImage', file);
      return request<{ imageUrl: string; imagePublicId: string }>('/user/profile-image', {
        method: 'PATCH',
        body: formData,
      });
    },
  },
};

