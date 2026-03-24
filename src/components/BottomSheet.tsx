/**
 * Bottom sheet modal component for mobile-friendly interactions
 * Slides up from the bottom of the screen on mobile, center modal on desktop
 * 
 * @example
 * ```tsx
 * <BottomSheet open={isOpen} onOpenChange={setIsOpen} title="Select Chord">
 *   <ChordSelector />
 * </BottomSheet>
 * ```
 */

import { memo, useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  children: ReactNode;
  snapPoints?: number[];
  defaultSnapPoint?: number;
  className?: string;
}

export const BottomSheet = memo(({
  open,
  onOpenChange,
  title,
  children,
  snapPoints = [0.9],
  defaultSnapPoint = 0.9,
  className = '',
}: BottomSheetProps) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const isMobile = window.innerWidth < 768;

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onOpenChange(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
            onClick={handleBackdropClick}
            aria-hidden="true"
          />

          {/* Bottom Sheet */}
          <motion.div
            ref={sheetRef}
            initial={isMobile ? { y: '100%' } : { opacity: 0, scale: 0.95 }}
            animate={isMobile ? { y: 0 } : { opacity: 1, scale: 1 }}
            exit={isMobile ? { y: '100%' } : { opacity: 0, scale: 0.95 }}
            transition={{ 
              type: 'spring', 
              damping: 30, 
              stiffness: 300,
              duration: 0.3,
            }}
            className={`fixed z-50 ${
              isMobile 
                ? 'bottom-0 left-0 right-0 max-h-[90vh] rounded-t-3xl' 
                : 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg rounded-2xl max-h-[80vh]'
            } bg-zinc-900 border-t border-zinc-800 shadow-2xl overflow-hidden flex flex-col ${className}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'bottom-sheet-title' : undefined}
          >
            {/* Drag Handle (mobile only) */}
            {isMobile && (
              <div className="flex justify-center py-3 border-b border-zinc-800">
                <div className="w-10 h-1 bg-zinc-700 rounded-full" aria-hidden="true" />
              </div>
            )}

            {/* Header */}
            {title && (
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
                <h2 id="bottom-sheet-title" className="text-lg font-bold text-white">
                  {title}
                </h2>
                <button
                  onClick={() => onOpenChange(false)}
                  className="p-2 hover:bg-zinc-800 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-zinc-400" aria-hidden="true" />
                </button>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});

BottomSheet.displayName = 'BottomSheet';
