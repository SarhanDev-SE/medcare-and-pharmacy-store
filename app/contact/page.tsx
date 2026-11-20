'use client';

import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import Breadcrumbs from '@/components/Breadcrumbs';

export default function ContactPage() {
  const { settings, showToast } = useStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [saveInfo, setSaveInfo] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      showToast('Please complete all required contact fields.');
      return;
    }
    setSent(true);
    showToast('Your message has been sent to Xmedcar Support.');
    setMessage('');
  };

  return (
    <div className="bg-white">
      <Breadcrumbs
        items={[{ label: 'Home', href: '/' }, { label: 'Contact Us' }]}
        title="Contact Us"
        subtitle="Get in touch with us for inquiries, prescription support, or pharmacy collaboration."
      />

      {/* Info Card + Map Split */}
      <section className="max-w-[1320px] mx-auto px-4 py-6">
        <div className="rounded-2xl overflow-hidden border border-slate-200 grid grid-cols-1 lg:grid-cols-12">
          <div className="lg:col-span-5 bg-[#FAF8FC] p-7 sm:p-10 space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-[#082A66]">How Can We Help You?</h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1.5">
                Have a question? Please contact us using the customer support channels below.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <p className="font-bold text-[#082A66]">Phone:</p>
                <p className="text-slate-600 mt-1 tabular-nums">{settings.phone}</p>
              </div>
              <div>
                <p className="font-bold text-[#082A66]">Email:</p>
                <p className="text-slate-600 mt-1">{settings.email}</p>
              </div>
            </div>

            <div className="text-xs">
              <p className="font-bold text-[#082A66]">Address:</p>
              <p className="text-slate-600 mt-1">{settings.contactAddress}</p>
            </div>

            <div className="text-xs space-y-1">
              <p className="font-bold text-[#082A66]">Open Time:</p>
              <p className="text-slate-600">
                Mon - Sat: <strong className="text-[#082A66]">{settings.hoursWeekday}</strong>
              </p>
              <p className="text-slate-600">
                Sunday: <strong className="text-[#082A66]">{settings.hoursSunday}</strong>
              </p>
            </div>
          </div>

          <div className="lg:col-span-7 min-h-[300px] bg-slate-100">
            <img
              src={settings.contactMapImage}
              alt="Map showing Xmedcar pharmacy location"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Get In Touch Form */}
      <section className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#082A66]">Get In Touch</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Use the form below to get in touch with our pharmacy care team
          </p>
        </div>

        {sent ? (
          <div className="border border-emerald-200 bg-emerald-50/50 rounded-2xl p-8 text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <h3 className="text-lg font-bold text-[#082A66]">Message Received</h3>
            <p className="text-xs text-slate-600">
              Thank you, {name}. A licensed Xmedcar support specialist will reply to {email} shortly.
            </p>
            <button
              type="button"
              onClick={() => setSent(false)}
              className="px-6 py-2 rounded-full bg-[#7B3CA1] text-white text-xs font-semibold cursor-pointer"
            >
              Send Another Message
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="contact-name" className="block text-xs font-bold text-[#082A66] mb-1.5">
                  Your Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="contact-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Smith"
                  className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#7B3CA1]"
                />
              </div>
              <div>
                <label htmlFor="contact-email" className="block text-xs font-bold text-[#082A66] mb-1.5">
                  Your Email <span className="text-red-500">*</span>
                </label>
                <input
                  id="contact-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email (private)"
                  className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#7B3CA1]"
                />
              </div>
            </div>

            <div>
              <label htmlFor="contact-msg" className="block text-xs font-bold text-[#082A66] mb-1.5">
                Your Message <span className="text-red-500">*</span>
              </label>
              <textarea
                id="contact-msg"
                rows={5}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your message"
                className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#7B3CA1]"
              />
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={saveInfo}
                onChange={(e) => setSaveInfo(e.target.checked)}
                className="rounded accent-[#7B3CA1]"
              />
              Save my name, email, and website in this browser for the next time I comment.
            </label>

            <div className="text-center pt-2">
              <button
                type="submit"
                className="px-8 py-3 rounded-full bg-[#7B3CA1] hover:bg-[#662F87] text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Send Message
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
