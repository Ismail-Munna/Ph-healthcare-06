import React, { useState, useEffect } from 'react';
import { Appointment } from '../../types';
import {
  X,
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  ExternalLink,
  Clock,
  User,
  HeartPulse,
  FileEdit,
  CheckCircle,
} from 'lucide-react';

interface VideoRoomModalProps {
  appointment: Appointment | null;
  isOpen: boolean;
  onClose: () => void;
  onCompleteConsultation: (appointmentId: string) => void;
  isDoctorView: boolean;
}

export const VideoRoomModal: React.FC<VideoRoomModalProps> = ({
  appointment,
  isOpen,
  onClose,
  onCompleteConsultation,
  isDoctorView,
}) => {
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [clinicalNotes, setClinicalNotes] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setCallDuration(0);
      return;
    }
    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen || !appointment) return null;

  const patient = (appointment as any).patient;
  const doctor = (appointment as any).doctor;

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleFinish = () => {
    onCompleteConsultation(appointment.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4">
      <div className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 w-full max-w-5xl h-[88vh] flex flex-col overflow-hidden text-white animate-in fade-in zoom-in-95 duration-150">
        {/* Top Room Bar */}
        <div className="px-6 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">Live Consultation Room</span>
                <span className="text-xs font-mono text-teal-400 bg-teal-950/80 px-2 py-0.5 rounded border border-teal-800">
                  Serial #{appointment.serialNumber}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {isDoctorView ? `Consulting Patient: ${appointment.patientName}` : `Consulting: ${appointment.doctorName}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 font-mono text-xs bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
              <Clock className="w-3.5 h-3.5 text-teal-400" />
              <span>{formatTimer(callDuration)}</span>
            </div>

            <a
              href={appointment.meetLink}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open External Meet Link</span>
            </a>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Video Stage Split */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 p-4 min-h-0 overflow-hidden">
          {/* Main Video Viewport (3 cols) */}
          <div className="lg:col-span-3 flex flex-col gap-4 min-h-0">
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 min-h-0">
              {/* Doctor Frame */}
              <div className="relative bg-slate-800/90 rounded-xl overflow-hidden border border-slate-700/80 flex items-center justify-center group">
                <img
                  src={appointment.doctorAvatar || doctor?.avatarUrl || doctor?.imageUrl || '/src/assets/images/avatar_doctor_sarah_1792946656894.jpg'}
                  alt={appointment.doctorName}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-3 left-3 flex items-center gap-2">
                  <span className="text-xs font-semibold bg-slate-900/80 backdrop-blur-xs px-2.5 py-1 rounded-md text-white border border-slate-700">
                    {appointment.doctorName} (Doctor)
                  </span>
                </div>
              </div>

              {/* Patient Frame */}
              <div className="relative bg-slate-800/90 rounded-xl overflow-hidden border border-slate-700/80 flex items-center justify-center">
                {videoOn ? (
                  <div className="w-full h-full bg-slate-850 flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-20 h-20 rounded-full bg-teal-800/50 border border-teal-500/30 flex items-center justify-center text-teal-300 font-bold text-2xl mb-3">
                      {appointment.patientName.charAt(0)}
                    </div>
                    <span className="text-sm font-medium text-slate-200">{appointment.patientName}</span>
                    <span className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      HD Video Feed Active
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-500">
                    <VideoOff className="w-12 h-12 mb-2" />
                    <span className="text-xs">Camera is turned off</span>
                  </div>
                )}
                <div className="absolute bottom-3 left-3">
                  <span className="text-xs font-semibold bg-slate-900/80 backdrop-blur-xs px-2.5 py-1 rounded-md text-white border border-slate-700">
                    {appointment.patientName} (Patient)
                  </span>
                </div>
              </div>
            </div>

            {/* In-Call Media Bar */}
            <div className="bg-slate-800/90 border border-slate-700/80 p-3 rounded-xl flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMicOn(!micOn)}
                  className={`p-2.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors ${
                    micOn ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-red-600/80 text-white'
                  }`}
                >
                  {micOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                  <span>{micOn ? 'Mute' : 'Unmuted'}</span>
                </button>

                <button
                  onClick={() => setVideoOn(!videoOn)}
                  className={`p-2.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors ${
                    videoOn ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-red-600/80 text-white'
                  }`}
                >
                  {videoOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                  <span>{videoOn ? 'Stop Camera' : 'Start Camera'}</span>
                </button>
              </div>

              <div className="flex items-center gap-3">
                {isDoctorView ? (
                  <button
                    onClick={handleFinish}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-xs transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Complete Consultation & Write Rx</span>
                  </button>
                ) : (
                  <button
                    onClick={onClose}
                    className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium flex items-center gap-2"
                  >
                    <PhoneOff className="w-4 h-4" />
                    <span>Leave Call</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Clinical Sidebar (1 col) */}
          <div className="lg:col-span-1 bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 flex flex-col gap-4 overflow-y-auto text-xs">
            {/* Patient Info */}
            <div className="border-b border-slate-700 pb-3">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Patient Clinical Profile
              </span>
              <div className="font-bold text-white text-sm">{appointment.patientName}</div>
              <div className="text-slate-400 font-mono text-[11px]">{appointment.patientEmail}</div>
              <div className="text-slate-400 text-[11px] mt-0.5">{appointment.patientPhone}</div>

              {patient?.bloodGroup && (
                <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-700 text-teal-300 font-mono text-xs">
                  Blood Group: {patient.bloodGroup}
                </div>
              )}
            </div>

            {/* Medical History */}
            {patient?.medicalHistory && (
              <div className="border-b border-slate-700 pb-3">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Medical History
                </span>
                <p className="text-slate-300 text-[11px] leading-relaxed">{patient.medicalHistory}</p>
              </div>
            )}

            {/* Allergies */}
            {patient?.allergies && patient.allergies.length > 0 && (
              <div className="border-b border-slate-700 pb-3">
                <span className="text-[10px] font-semibold text-red-400 uppercase tracking-wider block mb-1">
                  Known Allergies
                </span>
                <p className="text-red-300 text-[11px]">{patient.allergies.join(', ')}</p>
              </div>
            )}

            {/* Doctor scratchpad */}
            {isDoctorView && (
              <div className="flex-1 flex flex-col">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
                  <FileEdit className="w-3.5 h-3.5 text-teal-400" />
                  Doctor Consultation Notes
                </span>
                <textarea
                  rows={5}
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  placeholder="Record symptoms, examination notes, and observations..."
                  className="w-full flex-1 p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-teal-500"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
