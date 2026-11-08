import React, { useState, useEffect } from 'react';
import { StorageService } from '../../lib/storage';
import { Mail, Clock, Shield, Settings2, RotateCcw, X, ChevronUp, ChevronDown } from 'lucide-react';
import { format12Hour } from '../../lib/time';
import { UserRole } from '../../types';

interface FloatingTestWidgetProps {
  onOpenInbox: () => void;
  unreadEmailCount: number;
  onQuickSwitchUser: (userId: string) => void;
  currentRole: UserRole | 'GUEST';
}

export const FloatingTestWidget: React.FC<FloatingTestWidgetProps> = ({
  onOpenInbox,
  unreadEmailCount,
  onQuickSwitchUser,
  currentRole,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [time, setTime] = useState<string>(StorageService.getSimulatedTime());
  const [date, setDate] = useState<string>(StorageService.getSimulatedDate());

  useEffect(() => {
    const handleTimeChange = () => {
      setTime(StorageService.getSimulatedTime());
      setDate(StorageService.getSimulatedDate());
    };
    window.addEventListener('ph_time_changed', handleTimeChange);
    return () => window.removeEventListener('ph_time_changed', handleTimeChange);
  }, []);

  const handleTimeChange = (newTime: string) => {
    StorageService.setSimulatedTime(newTime);
  };

  const handleDateChange = (newDate: string) => {
    StorageService.setSimulatedDate(newDate);
  };

  const presets = [
    { label: 'Morning 10:00 AM', time: '10:00' },
    { label: '1:30 PM (Pre-start)', time: '13:30' },
    { label: '2:15 PM (Started)', time: '14:15' },
    { label: 'Evening 6:00 PM', time: '18:00' },
  ];

  const allUsers = StorageService.getUsers();
  const currentUser = StorageService.getCurrentUser();

  return (
    <div className="fixed bottom-4 right-4 z-40">
      {isOpen ? (
        <div className="bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700 p-4 w-80 space-y-3.5 text-xs animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-teal-400" />
              <span className="font-bold text-slate-100">Testing & Dev Tools</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-slate-400 hover:text-white rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Inbox */}
          <div className="flex items-center justify-between bg-slate-800 p-2.5 rounded-xl border border-slate-700">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-teal-400" />
              <span>System Email Inbox</span>
            </div>
            <button
              onClick={onOpenInbox}
              className="px-2.5 py-1 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-[11px] font-bold flex items-center gap-1"
            >
              <span>View ({unreadEmailCount})</span>
            </button>
          </div>

          {/* Role Switcher */}
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Active Role Switcher:</label>
            <div className="grid grid-cols-2 gap-1.5 max-h-32 overflow-y-auto pr-1">
              {allUsers.map((u) => {
                const isCurrent = currentUser?.id === u.id;
                return (
                  <button
                    key={u.id}
                    onClick={() => onQuickSwitchUser(u.id)}
                    className={`text-left p-1.5 rounded-lg border text-[10px] truncate transition-colors ${
                      isCurrent
                        ? 'bg-teal-500/20 border-teal-500 text-teal-300 font-bold'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                    }`}
                  >
                    <div className="truncate">{u.email.split('@')[0]}</div>
                    <div className="text-[9px] text-slate-400">{u.role.replace('_', ' ')}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time & Date Adjuster */}
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Simulated System Clock:</label>
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={time}
                onChange={(e) => handleTimeChange(e.target.value)}
                className="bg-slate-800 text-white border border-slate-700 rounded-lg px-2 py-1 text-xs w-1/2 font-mono"
              />
              <input
                type="date"
                value={date}
                onChange={(e) => handleDateChange(e.target.value)}
                className="bg-slate-800 text-white border border-slate-700 rounded-lg px-2 py-1 text-xs w-1/2 font-mono text-[11px]"
              />
            </div>
            <div className="grid grid-cols-2 gap-1 mt-1.5">
              {presets.map((p) => (
                <button
                  key={p.time}
                  onClick={() => handleTimeChange(p.time)}
                  className={`px-1.5 py-1 rounded text-[10px] font-medium transition-colors ${
                    time === p.time
                      ? 'bg-teal-500 text-slate-950 font-bold'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => {
              StorageService.resetToDefaults();
              window.location.reload();
            }}
            className="w-full text-center py-1 text-[11px] text-slate-400 hover:text-red-400 flex items-center justify-center gap-1 border-t border-slate-800 pt-2"
          >
            <RotateCcw className="w-3 h-3" /> Reset Demo Database
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          title="Testing Tools & System Email Inbox"
          className="bg-slate-900/90 hover:bg-slate-900 text-slate-300 hover:text-white px-3 py-2 rounded-full shadow-lg border border-slate-700 flex items-center gap-2 text-xs backdrop-blur-md transition-all hover:scale-105"
        >
          <Settings2 className="w-3.5 h-3.5 text-teal-400" />
          <span className="font-medium text-[11px]">Testing Tools</span>
          {unreadEmailCount > 0 && (
            <span className="bg-teal-500 text-slate-950 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
              {unreadEmailCount}
            </span>
          )}
        </button>
      )}
    </div>
  );
};
