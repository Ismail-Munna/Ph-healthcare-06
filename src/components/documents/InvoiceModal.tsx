import React from 'react';
import { Invoice } from '../../types';
import { X, Printer, Download, CheckCircle, Video, Calendar, Clock, CreditCard } from 'lucide-react';
import { format12Hour } from '../../lib/time';

interface InvoiceModalProps {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ invoice, isOpen, onClose }) => {
  if (!isOpen || !invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 print:p-0 print:bg-white">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden print:border-none print:shadow-none animate-in fade-in zoom-in-95 duration-150">
        {/* Modal actions bar (hidden in print) */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700">Official Consultation Invoice</span>
            <span className="text-xs font-mono text-teal-700 font-bold">{invoice.invoiceNumber}</span>
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

        {/* Invoice Printable Sheet */}
        <div className="p-8 space-y-6 text-slate-900 bg-white">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-slate-200 pb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-md bg-teal-600 flex items-center justify-center text-white font-bold text-sm">
                  PH
                </div>
                <h1 className="text-lg font-bold text-slate-900">PH Healthcare System</h1>
              </div>
              <p className="text-xs text-slate-500">Telemedicine Consultation Services</p>
              <p className="text-xs text-slate-500">Tax Reg: HC-9982-TELEMED</p>
            </div>
            <div className="text-right">
              <span className="inline-block px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-xs font-bold uppercase tracking-wider mb-2">
                {invoice.status}
              </span>
              <p className="text-xs text-slate-500">Invoice: <span className="font-mono font-semibold text-slate-900">{invoice.invoiceNumber}</span></p>
              <p className="text-xs text-slate-500">Date: <span className="font-mono text-slate-900">{new Date(invoice.paidAt).toLocaleDateString()}</span></p>
            </div>
          </div>

          {/* Patient & Doctor Two Columns */}
          <div className="grid grid-cols-2 gap-6 text-xs">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Billed To (Patient)</div>
              <div className="font-bold text-sm text-slate-900">{invoice.patientName}</div>
              <div className="text-slate-600 font-mono mt-0.5">{invoice.patientEmail}</div>
              <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center gap-1.5 text-teal-800 font-medium">
                <span>Appointment Serial Number:</span>
                <span className="font-mono font-bold text-sm bg-teal-100 px-1.5 py-0.5 rounded text-teal-900">
                  #{invoice.serialNumber}
                </span>
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Consulting Physician</div>
              <div className="font-bold text-sm text-slate-900">{invoice.doctorName}</div>
              <div className="text-slate-600 mt-0.5">{invoice.doctorSpecialization}</div>
              <div className="mt-2 pt-2 border-t border-slate-200/60 text-slate-700 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-mono font-medium">{invoice.date}</span>
                <span className="text-slate-400">·</span>
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-mono font-medium">{format12Hour(invoice.timeSlot.split('-')[0])}</span>
              </div>
            </div>
          </div>

          {/* Meeting Link Callout (Required in Spec Section 7.2) */}
          <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl flex items-start gap-3">
            <Video className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold text-teal-950 block">Direct Video Call Room Link:</span>
              <a
                href={invoice.meetLink}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-teal-800 underline break-all hover:text-teal-950 mt-0.5 block"
              >
                {invoice.meetLink}
              </a>
              <span className="text-[11px] text-teal-700 block mt-1">
                Please join at your slot time with Serial #{invoice.serialNumber}.
              </span>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Item Description</th>
                  <th className="py-2.5 px-4 text-center">Duration</th>
                  <th className="py-2.5 px-4 text-right">Fee</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-3 px-4">
                    <div className="font-medium text-slate-900">Online Telemedicine Consultation</div>
                    <div className="text-slate-500 text-[11px]">
                      Doctor: {invoice.doctorName} (Slot: {invoice.timeSlot})
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center font-mono">20 Mins</td>
                  <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900">
                    ${invoice.amount.toFixed(2)}
                  </td>
                </tr>
              </tbody>
              <tfoot className="bg-slate-50 border-t border-slate-200">
                <tr>
                  <td colSpan={2} className="py-2.5 px-4 text-right font-semibold text-slate-700">Total Paid:</td>
                  <td className="py-2.5 px-4 text-right font-mono font-bold text-teal-700 text-sm">
                    ${invoice.amount.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Payment & Transaction Info */}
          <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-1.5 font-mono text-[11px]">
              <CreditCard className="w-3.5 h-3.5 text-slate-400" />
              <span>Paid via {invoice.paymentMethod.toUpperCase()}</span>
              <span className="text-slate-300">·</span>
              <span>TxID: {invoice.transactionId}</span>
            </div>
            <div className="flex items-center gap-1 text-emerald-700 font-medium">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Payment Verified Upfront</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
