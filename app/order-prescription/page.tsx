'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Camera, CheckCircle2, Lock } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import Breadcrumbs from '@/components/Breadcrumbs';
import PrescriptionUploader from '@/components/PrescriptionUploader';
import ScanRxModal from '@/components/ScanRxModal';
import type { PrescriptionFileMeta, PrescriptionRequest } from '@/lib/types';

export default function OrderPrescriptionPage() {
  const { user, openAuthModal, submitRxRequest, showToast } = useStore();

  const [fullNameDraft, setFullNameDraft] = useState<string | null>(null);
  const [phoneDraft, setPhoneDraft] = useState<string | null>(null);
  const [rxFile, setRxFile] = useState<PrescriptionFileMeta | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submittedReq, setSubmittedReq] = useState<PrescriptionRequest | null>(null);
  const [scanModalOpen, setScanModalOpen] = useState(false);

  const fullName = fullNameDraft ?? user?.name ?? '';
  const phone = phoneDraft ?? user?.phone ?? '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim()) {
      setFormError('Please enter your full name and phone number.');
      return;
    }
    if (!rxFile) {
      setFileError('Please upload your valid prescription file (PNG, JPEG, or PDF).');
      return;
    }

    setFormError(null);
    setFileError(null);
    setSubmitting(true);

    try {
      const req = await submitRxRequest({
        fullName: fullName.trim(),
        phone: phone.trim(),
        file: rxFile,
      });
      setSubmittedReq(req);
    } catch {
      setFormError('Unable to upload prescription right now. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFloatingScanClick = () => {
    if (!user) {
      showToast('Please sign in to scan your paper prescription.');
      openAuthModal('signin', '/order-prescription');
      return;
    }
    setScanModalOpen(true);
  };

  return (
    <div className="bg-white">
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Order via Prescription' },
        ]}
        title="Order Via Prescription"
      />

      <section className="max-w-3xl mx-auto px-4 py-8 pb-24">
        {!user ? (
          /* Screen 15: Login Gate */
          <div className="bg-[#FAF8FC] border border-purple-100 rounded-2xl p-10 sm:p-14 text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-red-50 text-[#DC3545] flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-[#082A66]">Login Required</h2>
            <p className="text-xs sm:text-sm text-slate-600">
              You must be logged in to upload a prescription and place an order.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => openAuthModal('signin', '/order-prescription')}
                className="px-8 py-3 rounded-full bg-[#7B3CA1] hover:bg-[#662F87] text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Login / Register
              </button>
            </div>
          </div>
        ) : submittedReq ? (
          /* Confirmation after upload */
          <div className="bg-emerald-50/50 border border-emerald-200 rounded-2xl p-8 text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-600 text-white flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-[#082A66]">
              Prescription Request {submittedReq.requestNumber} Submitted
            </h2>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              Our licensed pharmacists are reviewing <strong>{submittedReq.file.name}</strong> and
              will convert it into a fulfillment order shortly.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                href="/account?tab=prescriptions"
                className="px-6 py-2.5 rounded-full bg-[#7B3CA1] hover:bg-[#662F87] text-white text-xs font-semibold"
              >
                View Prescription Orders
              </Link>
              <button
                type="button"
                onClick={() => {
                  setSubmittedReq(null);
                  setRxFile(null);
                }}
                className="px-6 py-2.5 rounded-full border border-slate-200 text-[#082A66] text-xs font-semibold cursor-pointer"
              >
                Upload Another Prescription
              </button>
            </div>
          </div>
        ) : (
          /* Screen 16: Logged-in Upload Form */
          <div className="bg-[#FAF8FC] border border-purple-100 rounded-2xl p-6 sm:p-10">
            <div className="text-center mb-7">
              <h2 className="text-2xl font-bold text-[#082A66]">Order Via Prescription</h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Upload your valid prescription or tap Scan Rx to photograph it directly, and our pharmacists will create an order for you.
              </p>
            </div>

            {formError && (
              <p role="alert" className="mb-4 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg px-3.5 py-2">
                {formError}
              </p>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="rx-fullname" className="block text-xs font-bold text-[#082A66] mb-1.5">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="rx-fullname"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullNameDraft(e.target.value)}
                    placeholder="Xmedcar"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#7B3CA1]"
                  />
                </div>
                <div>
                  <label htmlFor="rx-phone" className="block text-xs font-bold text-[#082A66] mb-1.5">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="rx-phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhoneDraft(e.target.value)}
                    placeholder="+92 300 8451290"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#7B3CA1]"
                  />
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-[#082A66] mb-1.5">
                  Prescription File <span className="text-red-500">*</span>
                </p>
                <PrescriptionUploader
                  value={rxFile}
                  onChange={(f) => {
                    setRxFile(f);
                    if (f) setFileError(null);
                  }}
                  error={fileError}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-lg bg-[#7B3CA1] hover:bg-[#662F87] disabled:opacity-60 text-white text-sm font-semibold transition-colors cursor-pointer"
              >
                {submitting ? 'Uploading Rx to Shopify...' : 'Upload & Order'}
              </button>
            </form>
          </div>
        )}
      </section>

      {/* Floating Scan Rx Button */}
      {!submittedReq && (
        <button
          type="button"
          onClick={handleFloatingScanClick}
          aria-label="Scan Rx"
          className="fixed bottom-5 right-24 z-40 inline-flex items-center gap-2.5 px-5 py-3.5 rounded-full bg-[#7B3CA1] hover:bg-[#662F87] text-white text-sm font-semibold shadow-xl shadow-[#7B3CA1]/30 ring-4 ring-white transition-all hover:-translate-y-0.5 cursor-pointer"
        >
          <Camera className="w-5 h-5" aria-hidden="true" />
          <span>Scan Rx</span>
        </button>
      )}

      <ScanRxModal
        open={scanModalOpen}
        onClose={() => setScanModalOpen(false)}
        onCapture={(meta) => {
          setRxFile(meta);
          setFileError(null);
          showToast('Prescription photo attached. Review your details and tap Upload & Order.');
        }}
        onFallbackUpload={() => {
          const uploadInput = document.querySelector<HTMLInputElement>(
            'input[aria-label="Upload prescription file"]'
          );
          uploadInput?.click();
        }}
      />
    </div>
  );
}
