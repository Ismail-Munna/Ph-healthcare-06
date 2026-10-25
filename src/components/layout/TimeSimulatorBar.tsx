import React, { useState, useEffect } from 'react';
import { StorageService } from '../../lib/storage';
import { Clock, Calendar, FastForward, Info } from 'lucide-react';
import { format12Hour } from '../../lib/time';

export const TimeSimulatorBar: React.FC = () => {
  const [time, setTime] = useState<string>(StorageService.getSimulatedTime());
  const [date, setDate] = useState<string>(StorageService.getSimulatedDate());
  const [isOpen, setIsOpen] = useState(false);

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
    { label: 'Morning 10:00 AM', time: '10:00', note: 'All afternoon schedules open & refundable' },
    { label: '1:30 PM (Pre-start)', time: '13:30', note: '30m before 2 PM (non-refundable window)' },
    { label: '2:15 PM (Started)', time: '14:15', note: '2 PM schedule disappears from patient view' },
    { label: 'Evening 6:00 PM', time: '18:00', note: 'During evening consultations' },
  ];

  return (
    <div className="bg-slate-900 text-slate-100 border-b border-slate-800 text-xs py-2 px-4">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-medium text-teal-400">
            <Clock className="w-3.5 h-3.5" />
            <span>Simulated System Clock:</span>
          </div>

          <div className="flex items-center gap-2 font-mono tabular-nums bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
            <Calendar className="w-3 h-3 text-slate-400" />
            <span>{date}</span>
            <span className="text-slate-500">·</span>
            <span className="font-semibold text-white">{format12Hour(time)}</span>
            <span className="text-slate-400 text-[10px]">({time})</span>
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-slate-400 hover:text-white transition-colors underline decoration-dotted text-[11px]"
          >
            {isOpen ? 'Close Clock Adjuster' : 'Adjust Time to Test Rules'}
          </button>
        </div>

        {/* Quick jump presets */}
        <div className="flex items-center gap-2 overflow-x-auto">
          <span className="text-[11px] text-slate-400 hidden sm:inline">Test Rule Presets:</span>
          {presets.map((p) => (
            <button
              key={p.time}
              onClick={() => handleTimeChange(p.time)}
              title={p.note}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors whitespace-nowrap ${
                time === p.time
                  ? 'bg-teal-500 text-slate-950 font-semibold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {isOpen && (
        <div className="max-w-7xl mx-auto mt-2 pt-2 border-t border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Set Clock Time (HH:mm 24-hr):</label>
            <input
              type="time"
              value={time}
              onChange={(e) => handleTimeChange(e.target.value)}
              className="bg-slate-800 text-white border border-slate-700 rounded px-2.5 py-1 text-xs w-full focus:outline-teal-500"
            />
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Set System Date (YYYY-MM-DD):</label>
            <input
              type="date"
              value={date}
              onChange={(e) => handleDateChange(e.target.value)}
              className="bg-slate-800 text-white border border-slate-700 rounded px-2.5 py-1 text-xs w-full focus:outline-teal-500"
            />
          </div>

          <div className="flex items-start gap-2 bg-slate-800/60 p-2 rounded text-[11px] text-slate-300">
            <Info className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
            <p>
              Rule verification: Changing the clock tests real-time visibility (schedules vanish at their start time) and refund policies (refund allowed if &gt; 1hr before start time, zero refund if &le; 1hr).
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
