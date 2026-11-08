import React, { useState } from 'react';
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Send,
  CheckCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export const ContactPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('Appointment Query');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setName('');
      setEmail('');
      setMessage('');
      setSubmitted(false);
    }, 4000);
  };

  const faqs = [
    {
      q: 'How do I book a consultation with a doctor?',
      a: 'Browse the available doctors on the Home or Find Doctors page. Pick any open 20-minute slot on today’s published schedule, pay the consultation fee upfront, and you will instantly receive your Serial Number and Video Call link via email and your patient dashboard.',
    },
    {
      q: 'Why can I only see today’s schedules?',
      a: 'Per Healthcare System rules, doctors publish schedules on a day-by-day basis. Patients only see today’s published schedules up until their start time. Once a schedule reaches its start time, it closes for new bookings to ensure punctuality.',
    },
    {
      q: 'What is the appointment cancellation and refund policy?',
      a: 'If you cancel more than 1 hour before the schedule’s start time, you receive a full 100% refund. Cancellations made within 1 hour of the start time, during the schedule, or after are non-refundable as the doctor has reserved that clinical time for you.',
    },
    {
      q: 'How do I receive my digital prescription?',
      a: 'Once your video consultation is marked completed by the doctor, they prepare your digital prescription with diagnosis, vital signs, and prescribed medicines. It is immediately generated and emailed to you, and remains permanently stored in your "My Prescriptions" portal.',
    },
    {
      q: 'Can doctors register and start seeing patients immediately?',
      a: 'No. Doctors submit a public application with their medical license, degrees, and consultation fee. They verify their email via OTP, and an Admin or Super Admin reviews their credentials before approving their account.',
    },
  ];

  return (
    <div className="space-y-12 py-4">
      {/* Hero */}
      <div className="relative rounded-3xl bg-slate-900 text-white p-8 lg:p-12 overflow-hidden border border-slate-800">
        <div className="max-w-3xl space-y-3 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-teal-900/60 text-teal-300 text-xs font-semibold border border-teal-700/50">
            <Phone className="w-4 h-4 text-teal-400" />
            <span>24/7 Telemedicine Support</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Contact Clinical Support & Inquiries
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Need assistance with a scheduled video consultation, invoice question, or prescription? Our administrative and technical team is on standby 24 hours a day.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Contact Info Cards (1 col) */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900">Immediate Contact</h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-slate-400 uppercase text-[10px] font-semibold block">24/7 Patient Hotline</span>
                  <strong className="text-slate-900 text-sm font-mono">+1 (800) 456-MEDIC</strong>
                  <p className="text-[11px] text-slate-500 mt-0.5">Toll-free virtual triage line</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-slate-400 uppercase text-[10px] font-semibold block">Email Inquiries</span>
                  <strong className="text-slate-900 font-mono">support@healthcare.org</strong>
                  <p className="text-[11px] text-slate-500 mt-0.5">Average response under 15 minutes</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-slate-400 uppercase text-[10px] font-semibold block">Medical HQ & Clinics</span>
                  <strong className="text-slate-900">Healthcare Telemedicine Complex</strong>
                  <p className="text-[11px] text-slate-500 mt-0.5">450 Health Avenue, Suite 1200, Medical District</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-teal-50 border border-teal-200 rounded-2xl p-5 text-xs text-teal-900 space-y-2">
            <span className="font-bold flex items-center gap-1.5 text-sm">
              <Clock className="w-4 h-4 text-teal-700" /> Medical Emergency Warning
            </span>
            <p className="text-[11px] leading-relaxed text-teal-800">
              If you or a family member is experiencing severe chest pain, sudden paralysis, severe respiratory distress, or heavy trauma, please dial <strong>911</strong> or visit the nearest emergency room immediately.
            </p>
          </div>
        </div>

        {/* Message Form (2 cols) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-8 shadow-xs space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Send an Administrative Inquiry</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Have a question about appointment schedules or account verification? Fill out the form below.
            </p>
          </div>

          {submitted ? (
            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2 text-emerald-900">
              <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto" />
              <h4 className="text-sm font-bold">Message Dispatched Successfully</h4>
              <p className="text-xs text-emerald-800">
                Thank you, {name}. A clinical care coordinator will review your inquiry and reply via email shortly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Your Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Your Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="john@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Inquiry Topic</label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
                >
                  <option value="Appointment Query">Appointment Booking & Video Room Link</option>
                  <option value="Cancellation & Refund">Cancellation & Refund Status</option>
                  <option value="Doctor Application">Doctor Credentialing Application</option>
                  <option value="Prescription Assistance">Prescription Download Assistance</option>
                  <option value="General Support">General Platform Inquiries</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Your Message</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Describe your query or provide your appointment Serial Number..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Message</span>
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Frequently Asked Questions */}
      <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xs space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Frequently Asked Questions</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Key details on how Healthcare System conducts online consultations
          </p>
        </div>

        <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div key={index} className="bg-white">
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full py-4 px-5 text-left flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <span className="text-xs font-bold text-slate-900">{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-teal-600 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 text-xs text-slate-600 leading-relaxed border-t border-slate-50 bg-slate-50/50">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
