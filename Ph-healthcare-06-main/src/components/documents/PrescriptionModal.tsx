import React from 'react';
import { Prescription } from '../../types';
import { X, Printer, Stethoscope, HeartPulse, Pill, Calendar, User as UserIcon } from 'lucide-react';

interface PrescriptionModalProps {
  prescription: Prescription | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PrescriptionModal: React.FC<PrescriptionModalProps> = ({
  prescription,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !prescription) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 print:p-0 print:bg-white">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden print:max-h-none print:border-none print:shadow-none animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Controls (hidden in print) */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 print:hidden shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700">Digital Medical Prescription</span>
            <span className="text-xs font-mono text-teal-700 font-bold">{prescription.id}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Prescription Body */}
        <div className="p-8 overflow-y-auto space-y-6 text-slate-900 bg-white">
          {/* Doctor & Clinic Header */}
          <div className="flex items-start justify-between border-b-2 border-teal-600 pb-5">
            <div>
              <h1 className="text-xl font-bold text-slate-900">{prescription.doctorName}</h1>
              <p className="text-xs font-medium text-teal-700">{prescription.doctorSpecialization}</p>
              <p className="text-xs text-slate-500 font-mono mt-0.5">{prescription.doctorDegrees}</p>
              <p className="text-[11px] text-slate-500 font-mono">Reg / License: {prescription.doctorLicenseNumber}</p>
            </div>
            <div className="text-right">
              <div className="inline-flex items-center gap-1.5 text-slate-900 font-bold text-sm">
                <Stethoscope className="w-4 h-4 text-teal-600" />
                <span>Healthcare System</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">E-Prescription Service</p>
              <p className="text-xs font-mono text-slate-600 mt-0.5">Date: {prescription.consultationDate}</p>
            </div>
          </div>

          {/* Patient Details & Vitals Strip */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-400 uppercase text-[10px] font-semibold block">Patient Name</span>
              <span className="font-bold text-slate-900 text-sm">{prescription.patientName}</span>
            </div>
            {prescription.patientAge && (
              <div>
                <span className="text-slate-400 uppercase text-[10px] font-semibold block">Age / Gender</span>
                <span className="font-medium text-slate-800">{prescription.patientAge} Yrs / {prescription.patientGender || 'N/A'}</span>
              </div>
            )}
            {prescription.vitals?.bloodPressure && (
              <div>
                <span className="text-slate-400 uppercase text-[10px] font-semibold block">Blood Pressure</span>
                <span className="font-mono font-medium text-slate-800">{prescription.vitals.bloodPressure} mmHg</span>
              </div>
            )}
            {prescription.vitals?.pulseRate && (
              <div>
                <span className="text-slate-400 uppercase text-[10px] font-semibold block">Pulse Rate</span>
                <span className="font-mono font-medium text-slate-800">{prescription.vitals.pulseRate} bpm</span>
              </div>
            )}
          </div>

          {/* Clinical Findings & Diagnosis */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
              <HeartPulse className="w-3.5 h-3.5 text-teal-600" /> Clinical Assessment & Diagnosis
            </h3>
            <div className="p-3.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs text-slate-800 space-y-1">
              <div>
                <span className="font-semibold text-slate-900">Diagnosis: </span>
                <span>{prescription.diagnosis}</span>
              </div>
              {prescription.keyFindings && (
                <div>
                  <span className="font-semibold text-slate-900">Key Findings / Symptoms: </span>
                  <span className="text-slate-600">{prescription.keyFindings}</span>
                </div>
              )}
            </div>
          </div>

          {/* Rx Symbol & Prescribed Medicines Table */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-serif font-black text-teal-800">℞</span>
              <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">
                Prescribed Medications
              </span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Medicine & Dosage</th>
                    <th className="py-2.5 px-3">Frequency</th>
                    <th className="py-2.5 px-3">Duration</th>
                    <th className="py-2.5 px-3">Special Instructions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {prescription.medicines.map((m, idx) => (
                    <tr key={m.id || idx} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-900">
                        <span className="text-[10px] text-teal-700 uppercase font-semibold mr-1.5">[{m.type}]</span>
                        {m.name} ({m.dosage})
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 font-mono">{m.frequency}</td>
                      <td className="py-2.5 px-3 text-slate-700">{m.duration}</td>
                      <td className="py-2.5 px-3 text-slate-500 italic">{m.instructions || 'As advised'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Special Advice / Next Follow-up */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider">
              General Advice & Follow-Up
            </h3>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1">
              <p>{prescription.specialInstructions || 'Stay hydrated, get adequate rest, and report any adverse reactions immediately.'}</p>
              {prescription.nextFollowUpDate && (
                <div className="pt-1.5 flex items-center gap-1.5 font-medium text-teal-800">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Next Recommended Follow-Up: </span>
                  <span className="font-mono font-bold">{prescription.nextFollowUpDate}</span>
                </div>
              )}
            </div>
          </div>

          {/* Doctor Signature Block */}
          <div className="pt-8 flex items-end justify-between border-t border-slate-200 text-xs">
            <div className="text-[11px] text-slate-400 max-w-xs">
              * Valid digital prescription issued through Healthcare Telemedicine. For verified pharmacy dispensing.
            </div>
            <div className="text-center">
              <div className="font-serif italic text-base text-slate-800 border-b border-slate-400 pb-1 mb-1 font-semibold">
                {prescription.doctorName}
              </div>
              <span className="text-[11px] text-slate-500 uppercase tracking-wider block">
                Authorized Medical Signature
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
