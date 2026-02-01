"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X } from "lucide-react";

interface AxiomUnlockCelebrationProps {
  axiomTitle: string;
  axiomId: string;
  onClose: () => void;
  autoCloseDuration?: number;
}

/**
 * Celebration modal and animation for newly unlocked axioms
 */
export function AxiomUnlockCelebration({
  axiomTitle,
  axiomId,
  onClose,
  autoCloseDuration = 5000,
}: AxiomUnlockCelebrationProps) {
  const [isVisible, setIsVisible] = useState(true);

  // Auto-close after duration
  useEffect(() => {
    if (autoCloseDuration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose();
      }, autoCloseDuration);

      return () => clearTimeout(timer);
    }
  }, [autoCloseDuration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-amber-200 bg-white p-8 shadow-2xl dark:border-amber-900/30 dark:bg-neutral-900"
          >
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute right-4 top-4 rounded-lg p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              <X className="h-5 w-5 text-neutral-400" />
            </button>

            {/* Animated Sparkles */}
            <div className="mb-6 flex justify-center">
              <div className="relative h-20 w-20">
                {/* Main star */}
                <motion.div
                  animate={{ scale: [1, 1.1, 1], rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <div className="absolute h-20 w-20 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 blur-xl opacity-50" />
                </motion.div>

                {/* Sparkle icon */}
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  className="relative z-10 flex h-20 w-20 items-center justify-center"
                >
                  <Sparkles className="h-12 w-12 text-amber-500" />
                </motion.div>

                {/* Orbiting particles */}
                {[0, 1, 2, 3].map((i) => (
                  <motion.div
                    key={i}
                    animate={{
                      rotate: 360,
                      x: Math.cos((i * Math.PI) / 2) * 40,
                      y: Math.sin((i * Math.PI) / 2) * 40,
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="absolute top-1/2 left-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-400"
                  />
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="text-center">
              <motion.h2
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-2xl font-bold text-neutral-900 dark:text-white"
              >
                Axiom Unlocked!
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-3 text-lg font-semibold text-amber-600 dark:text-amber-400"
              >
                {axiomTitle}
              </motion.p>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-4 text-sm text-neutral-600 dark:text-neutral-400"
              >
                You've unlocked a new canon axiom as part of your formation journey.
                Explore it in the Axiom Library.
              </motion.p>
            </div>

            {/* Progress indicator */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              exit={{ scaleX: 0 }}
              transition={{ duration: autoCloseDuration / 1000 }}
              className="absolute bottom-0 left-0 right-0 h-1 origin-left rounded-b-2xl bg-gradient-to-r from-amber-400 to-amber-600"
            />

            {/* Confetti-like particles */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={`particle-${i}`}
                initial={{
                  opacity: 1,
                  y: 0,
                  x: 0,
                  rotate: 0,
                }}
                animate={{
                  opacity: 0,
                  y: 60,
                  x: Math.cos((i / 6) * Math.PI * 2) * 50,
                  rotate: 360,
                }}
                transition={{
                  duration: 2,
                  delay: i * 0.1,
                  ease: "easeOut",
                }}
                className="pointer-events-none absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-400"
              />
            ))}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/**
 * Hook to manage axiom unlock celebrations
 * Tracks which axioms have been celebrated to prevent duplicate animations
 */
export function useAxiomCelebration() {
  const [celebratingAxiom, setCelebratingAxiom] = useState<{
    title: string;
    id: string;
  } | null>(null);
  const [celebratedIds, setCelebratedIds] = useState<Set<string>>(new Set());

  const celebrate = (axiomId: string, axiomTitle: string) => {
    if (!celebratedIds.has(axiomId)) {
      setCelebratingAxiom({ title: axiomTitle, id: axiomId });
      setCelebratedIds((prev) => new Set([...prev, axiomId]));
    }
  };

  const closeCelebration = () => {
    setCelebratingAxiom(null);
  };

  return {
    celebratingAxiom,
    celebrate,
    closeCelebration,
    isCelebrating: celebratingAxiom !== null,
  };
}
