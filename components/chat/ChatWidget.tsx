'use client';

import { MessageCircle } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect, useState } from 'react';
import { ChatPanel } from './ChatPanel';

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [everOpened, setEverOpened] = useState(false);
  const [panelVisible, setPanelVisible] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const openPanel = () => {
    setEverOpened(true);
    setPanelVisible(true);
    setOpen(true);
  };

  const closePanel = () => {
    setOpen(false);
  };

  const transition = reduceMotion
    ? { duration: 0 }
    : { type: 'spring' as const, stiffness: 360, damping: 28, mass: 0.85 };

  return (
    <>
      <AnimatePresence>
        {!open && (
          <motion.button
            key="chat-launcher"
            type="button"
            aria-label="Open Xmedcar assistant"
            aria-expanded={open}
            onClick={openPanel}
            initial={reduceMotion ? false : { opacity: 0, scale: 0.8, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.8, y: 12 }}
            whileHover={reduceMotion ? undefined : { scale: 1.06 }}
            whileTap={reduceMotion ? undefined : { scale: 0.94 }}
            transition={transition}
            className="fixed bottom-5 right-5 z-[60] flex size-14 items-center justify-center rounded-full bg-[#7B3CA1] text-white shadow-xl ring-4 ring-white transition-colors hover:bg-[#662F87] cursor-pointer"
          >
            <MessageCircle className="size-6" aria-hidden="true" />
          </motion.button>
        )}
      </AnimatePresence>

      {everOpened && (
        <motion.div
          role="dialog"
          aria-modal={open}
          aria-hidden={!open}
          aria-label="Xmedcar assistant"
          initial={reduceMotion ? false : { opacity: 0, y: 24, scale: 0.92 }}
          animate={
            open
              ? { opacity: 1, y: 0, scale: 1 }
              : { opacity: 0, y: 24, scale: 0.92 }
          }
          transition={transition}
          onAnimationComplete={() => {
            if (!open) setPanelVisible(false);
          }}
          style={{ transformOrigin: 'bottom right' }}
          className={`fixed inset-0 z-[70] overflow-hidden bg-white shadow-2xl sm:inset-auto sm:bottom-5 sm:right-5 sm:h-[640px] sm:max-h-[calc(100vh-2.5rem)] sm:w-[400px] sm:rounded-2xl sm:border sm:border-slate-200 ${
            open || panelVisible ? 'pointer-events-auto visible' : 'pointer-events-none invisible'
          }`}
        >
          <ChatPanel onClose={closePanel} />
        </motion.div>
      )}
    </>
  );
}
