import React, { useState } from 'react';
import { StorageService } from '../../lib/storage';
import { SystemEmail } from '../../types';
import { Mail, X, CheckCircle, Key, FileText, Calendar, Trash2 } from 'lucide-react';

interface NotificationInboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectOtp?: (otp: string) => void;
}

export const NotificationInboxModal: React.FC<NotificationInboxModalProps> = ({
  isOpen,
  onClose,
  onSelectOtp,
}) => {
  const [selectedEmail, setSelectedEmail] = useState<SystemEmail | null>(null);
  const emails = StorageService.getEmails();

  if (!isOpen) return null;

  const getIcon = (type: SystemEmail['type']) => {
    switch (type) {
      case 'otp':
        return <Key className="w-4 h-4 text-amber-600" />;
      case 'invoice':
        return <FileText className="w-4 h-4 text-emerald-600" />;
      case 'prescription':
        return <FileText className="w-4 h-4 text-blue-600" />;
      case 'admin_credentials':
        return <Key className="w-4 h-4 text-purple-600" />;
      default:
        return <Mail className="w-4 h-4 text-teal-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center text-teal-700">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">System Notification & Email Inbox</h2>
              <p className="text-xs text-slate-500">
                Log of real system emails (Welcome, OTP, Credentials, Invoices & Prescriptions)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body split */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 flex-1 overflow-hidden">
          {/* Email list */}
          <div className="overflow-y-auto max-h-[60vh] divide-y divide-slate-100">
            {emails.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                No system emails sent yet. Actions like registration, OTP verification, booking, or admin invites will appear here.
              </div>
            ) : (
              emails.map((email) => {
                const isSelected = selectedEmail?.id === email.id;
                return (
                  <button
                    key={email.id}
                    onClick={() => setSelectedEmail(email)}
                    className={`w-full text-left p-4 hover:bg-slate-50 transition-colors flex items-start gap-3 ${
                      isSelected ? 'bg-teal-50/70 border-l-2 border-teal-600' : ''
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">{getIcon(email.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-900 truncate">
                          To: {email.to}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0">
                          {new Date(email.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-slate-800 truncate mt-0.5">{email.subject}</p>
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">{email.body}</p>

                      {email.metadata?.otp && (
                        <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 bg-amber-50 border border-amber-200 rounded text-amber-800 font-mono text-xs font-bold">
                          OTP: {email.metadata.otp}
                          {onSelectOtp && (
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectOtp(email.metadata?.otp);
                                onClose();
                              }}
                              className="text-[10px] font-sans underline cursor-pointer text-amber-900 hover:text-black ml-1"
                            >
                              Auto-fill
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Email Preview Detail */}
          <div className="p-6 overflow-y-auto max-h-[60vh] bg-slate-50/50">
            {selectedEmail ? (
              <div className="space-y-4">
                <div className="border-b border-slate-200 pb-3">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1 font-mono">
                    <span>From: notifications@phhealthcare.org</span>
                    <span>{new Date(selectedEmail.sentAt).toLocaleString()}</span>
                  </div>
                  <div className="text-xs text-slate-700 font-semibold mb-1">
                    To: <span className="font-mono text-teal-700">{selectedEmail.to}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{selectedEmail.subject}</h3>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                  <h4 className="text-sm font-semibold text-slate-800">{selectedEmail.title}</h4>
                  <p className="text-xs leading-relaxed text-slate-600 whitespace-pre-line">
                    {selectedEmail.body}
                  </p>

                  {selectedEmail.metadata?.generatedPassword && (
                    <div className="p-3 bg-purple-50 rounded-lg border border-purple-200 text-xs">
                      <div className="text-purple-900 font-semibold mb-1">Your Login Credentials:</div>
                      <div className="font-mono text-purple-950">
                        Email: <strong>{selectedEmail.to}</strong>
                      </div>
                      <div className="font-mono text-purple-950">
                        Generated Password: <strong>{selectedEmail.metadata.generatedPassword}</strong>
                      </div>
                      <p className="text-[11px] text-purple-700 mt-1">
                        * You will be prompted to change this password immediately on your first login.
                      </p>
                    </div>
                  )}

                  {selectedEmail.metadata?.meetLink && (
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-xs">
                      <div className="text-blue-900 font-semibold mb-1">Telemedicine Video Link:</div>
                      <a
                        href={selectedEmail.metadata.meetLink}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-blue-700 underline break-all"
                      >
                        {selectedEmail.metadata.meetLink}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-8">
                <Mail className="w-10 h-10 text-slate-300 mb-2" />
                <p className="text-xs">Select any email on the left to read full contents</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-white flex items-center justify-between text-xs text-slate-500">
          <span>Total notifications: {emails.length}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
