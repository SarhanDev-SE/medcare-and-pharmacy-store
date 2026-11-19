'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  Loader2,
  RefreshCw,
  SwitchCamera,
  Upload,
  X,
} from 'lucide-react';
import { motion } from 'motion/react';
import {
  createCapturedRxFileMeta,
  getCameraErrorMessage,
} from '@/lib/store-logic';
import type { PrescriptionFileMeta } from '@/lib/types';

interface ScanRxSessionProps {
  onClose: () => void;
  onCapture: (file: PrescriptionFileMeta) => void;
  onFallbackUpload?: () => void;
}

type CameraStage = 'requesting' | 'live' | 'captured' | 'error';

function ScanRxSession({
  onClose,
  onCapture,
  onFallbackUpload,
}: ScanRxSessionProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cancelledRef = useRef(false);

  const [stage, setStage] = useState<CameraStage>('requesting');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [capturedMeta, setCapturedMeta] = useState<PrescriptionFileMeta | null>(null);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const attachStreamToVideo = useCallback(async (stream: MediaStream) => {
    const videoEl = videoRef.current;
    if (!videoEl) return;
    videoEl.srcObject = stream;
    try {
      await videoEl.play();
    } catch {
      // Autoplay fallback handled by playsInline & muted attributes
    }
  }, []);

  const startCamera = useCallback(
    async (mode: 'environment' | 'user') => {
      stopStream();
      setStage('requesting');
      setErrorMessage(null);
      setCapturedMeta(null);

      if (
        typeof navigator === 'undefined' ||
        !navigator.mediaDevices ||
        typeof navigator.mediaDevices.getUserMedia !== 'function'
      ) {
        setStage('error');
        setErrorMessage(
          'Camera capture is not supported in this browser. Please upload a PNG, JPEG, or PDF prescription file instead.'
        );
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: mode },
            width: { ideal: 1280 },
            height: { ideal: 960 },
          },
          audio: false,
        });

        if (cancelledRef.current) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        setStage('live');
        await attachStreamToVideo(stream);
      } catch (err) {
        if (!cancelledRef.current) {
          setStage('error');
          setErrorMessage(getCameraErrorMessage(err));
        }
      }
    },
    [attachStreamToVideo, stopStream]
  );

  useEffect(() => {
    cancelledRef.current = false;
    const timer = window.setTimeout(() => {
      void startCamera(facingMode);
    }, 0);

    return () => {
      window.clearTimeout(timer);
      cancelledRef.current = true;
      stopStream();
    };
  }, [facingMode, startCamera, stopStream]);

  useEffect(() => {
    if (stage === 'live' && streamRef.current && videoRef.current && !videoRef.current.srcObject) {
      void attachStreamToVideo(streamRef.current);
    }
  }, [stage, attachStreamToVideo]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        stopStream();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, stopStream]);

  const handleCapturePhoto = () => {
    const videoEl = videoRef.current;
    if (!videoEl || videoEl.videoWidth === 0 || videoEl.videoHeight === 0) {
      setErrorMessage('Camera feed is still warming up. Please wait a moment and capture again.');
      return;
    }

    const maxDim = 1400;
    const scale = Math.min(1, maxDim / Math.max(videoEl.videoWidth, videoEl.videoHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(videoEl.videoWidth * scale));
    canvas.height = Math.max(1, Math.round(videoEl.videoHeight * scale));

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setStage('error');
      setErrorMessage('Unable to process captured camera frame.');
      return;
    }

    ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    const result = createCapturedRxFileMeta({ dataUrl, mimeType: 'image/jpeg' });

    if (result.error || !result.fileMeta) {
      setStage('error');
      setErrorMessage(result.error ?? 'Failed to capture prescription image.');
      return;
    }

    stopStream();
    setCapturedMeta(result.fileMeta);
    setStage('captured');
  };

  const handleUsePhoto = () => {
    if (!capturedMeta) return;
    stopStream();
    onCapture(capturedMeta);
    onClose();
  };

  const handleSwitchCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const handleClose = () => {
    stopStream();
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="scan-rx-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-xs"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.18 }}
        className="bg-white rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl border border-slate-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-[#FAF8FC]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#7B3CA1] text-white flex items-center justify-center shrink-0">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h2 id="scan-rx-modal-title" className="text-base font-bold text-[#082A66]">
                Scan Paper Prescription
              </h2>
              <p className="text-xs text-slate-500">
                Position your paper Rx flat under bright lighting.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close prescription scanner"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport Body */}
        <div className="p-6 space-y-4">
          <div className="relative bg-slate-950 rounded-xl overflow-hidden aspect-[4/3] flex items-center justify-center">
            {stage === 'requesting' && (
              <div className="text-center text-white px-6 space-y-3">
                <Loader2 className="w-8 h-8 mx-auto animate-spin text-purple-300" />
                <p className="text-sm font-semibold">Requesting camera access...</p>
                <p className="text-xs text-slate-300 max-w-xs mx-auto">
                  Please allow camera access in your browser prompt to photograph your paper prescription.
                </p>
              </div>
            )}

            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${stage === 'live' ? 'block' : 'hidden'}`}
            />

            {stage === 'live' && (
              <div className="pointer-events-none absolute inset-4 border-2 border-dashed border-white/60 rounded-lg flex items-end justify-center pb-3">
                <span className="bg-slate-900/75 text-white text-[11px] font-medium px-3 py-1 rounded-full">
                  Align full prescription inside frame
                </span>
              </div>
            )}

            {stage === 'captured' && capturedMeta?.previewDataUrl && (
              <img
                src={capturedMeta.previewDataUrl}
                alt="Captured prescription preview"
                className="w-full h-full object-contain bg-slate-900"
              />
            )}

            {stage === 'error' && (
              <div className="text-center px-6 py-8 max-w-sm space-y-3">
                <div className="w-11 h-11 rounded-full bg-red-500/20 text-red-300 flex items-center justify-center mx-auto">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-white">Camera Unavailable</p>
                <p role="alert" className="text-xs text-slate-300 leading-relaxed">
                  {errorMessage}
                </p>
              </div>
            )}
          </div>

          {errorMessage && stage === 'live' && (
            <p role="alert" className="text-xs text-red-600 font-medium">
              {errorMessage}
            </p>
          )}

          {/* Footer Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            {stage === 'live' && (
              <>
                <button
                  type="button"
                  onClick={handleSwitchCamera}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full border border-slate-200 hover:border-[#7B3CA1] text-xs font-semibold text-[#082A66] transition-colors cursor-pointer"
                >
                  <SwitchCamera className="w-4 h-4" />
                  Switch Camera
                </button>
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2.5 rounded-full border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCapturePhoto}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#7B3CA1] hover:bg-[#662F87] text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    Capture Photo
                  </button>
                </div>
              </>
            )}

            {stage === 'captured' && (
              <>
                <button
                  type="button"
                  onClick={() => void startCamera(facingMode)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full border border-slate-200 hover:border-[#7B3CA1] text-xs font-semibold text-[#082A66] transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  Retake Photo
                </button>
                <button
                  type="button"
                  onClick={handleUsePhoto}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors ml-auto cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Use Prescription
                </button>
              </>
            )}

            {stage === 'error' && (
              <>
                {onFallbackUpload && (
                  <button
                    type="button"
                    onClick={() => {
                      handleClose();
                      onFallbackUpload();
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full border border-slate-200 hover:border-[#7B3CA1] text-xs font-semibold text-[#082A66] transition-colors cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    Upload File Instead
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => void startCamera(facingMode)}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#7B3CA1] hover:bg-[#662F87] text-white text-xs font-semibold transition-colors ml-auto cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Camera Again
                </button>
              </>
            )}

            {stage === 'requesting' && (
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 rounded-full border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 ml-auto cursor-pointer"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function ScanRxModal({
  open,
  onClose,
  onCapture,
  onFallbackUpload,
}: {
  open: boolean;
  onClose: () => void;
  onCapture: (file: PrescriptionFileMeta) => void;
  onFallbackUpload?: () => void;
}) {
  if (!open) return null;
  return (
    <ScanRxSession
      onClose={onClose}
      onCapture={onCapture}
      onFallbackUpload={onFallbackUpload}
    />
  );
}
