'use client';

import React, { useRef, useState } from 'react';
import { CheckCircle2, CloudUpload, FileText, RefreshCw, Trash2 } from 'lucide-react';
import { validatePrescriptionFile } from '@/lib/store-logic';
import type { PrescriptionFileMeta } from '@/lib/types';

interface PrescriptionUploaderProps {
  value: PrescriptionFileMeta | null;
  onChange: (file: PrescriptionFileMeta | null) => void;
  error?: string | null;
}

export default function PrescriptionUploader({
  value,
  onChange,
  error: externalError,
}: PrescriptionUploaderProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const processFile = (file: File) => {
    const validation = validatePrescriptionFile({
      name: file.name,
      size: file.size,
      type: file.type,
    });
    if (!validation.valid) {
      setLocalError(validation.error ?? 'Invalid prescription file.');
      return;
    }
    setLocalError(null);

    const todayStr = new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        onChange({
          name: file.name,
          size: file.size,
          type: file.type,
          uploadedAt: todayStr,
          previewDataUrl: typeof reader.result === 'string' ? reader.result : undefined,
        });
      };
      reader.readAsDataURL(file);
    } else {
      onChange({
        name: file.name,
        size: file.size,
        type: file.type || 'application/pdf',
        uploadedAt: todayStr,
      });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const activeError = localError || externalError;

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept=".png,.jpg,.jpeg,.pdf,image/png,image/jpeg,application/pdf"
        className="hidden"
        aria-label="Upload prescription file"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) processFile(f);
          e.target.value = '';
        }}
      />

      {value ? (
        /* Filled State (green check, filename, Remove & Replace) */
        <div className="border border-emerald-300 bg-emerald-50/70 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide">
                Prescription Attached
              </p>
              <p className="text-sm font-bold text-[#082A66] truncate">{value.name}</p>
              <p className="text-xs text-slate-500 tabular-nums">
                {(value.size / 1024).toFixed(1)} KB · Uploaded {value.uploadedAt}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#082A66] bg-white border border-slate-200 hover:border-[#7B3CA1] hover:text-[#7B3CA1] px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Replace
            </button>
            <button
              type="button"
              onClick={() => onChange(null)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-white border border-red-200 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Remove
            </button>
          </div>
        </div>
      ) : (
        /* Empty Drag-and-Drop State */
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className={`w-full border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer flex flex-col items-center justify-center gap-2 ${
            dragActive
              ? 'border-[#7B3CA1] bg-[#F5F0FA]'
              : activeError
                ? 'border-red-400 bg-red-50/40'
                : 'border-slate-300 bg-white hover:border-[#7B3CA1] hover:bg-[#FAF8FD]'
          }`}
        >
          <CloudUpload className="w-8 h-8 text-[#082A66]" strokeWidth={1.6} aria-hidden="true" />
          <p className="text-sm font-semibold text-[#082A66]">
            Drag &amp; drop or Click to upload prescription
          </p>
          <p className="text-xs text-slate-500">Allowed types: PNG, JPEG, PDF (Max 2MB)</p>
        </button>
      )}

      {value?.previewDataUrl && (
        <div className="mt-3 flex items-center gap-3 p-2.5 bg-white border border-slate-200 rounded-lg">
          <img
            src={value.previewDataUrl}
            alt="Prescription preview"
            className="w-12 h-12 object-cover rounded border border-slate-200"
          />
          <div className="text-xs text-slate-600 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-[#7B3CA1]" />
            <span>Ready for pharmacist review</span>
          </div>
        </div>
      )}

      {activeError && (
        <p role="alert" className="mt-2 text-xs font-medium text-red-600">
          {activeError}
        </p>
      )}
    </div>
  );
}
