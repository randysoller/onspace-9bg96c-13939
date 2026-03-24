/**
 * Skip navigation link for keyboard users and screen readers
 * Allows users to skip directly to main content
 */

import { memo } from 'react';

export const SkipToContent = memo(() => {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-6 focus:py-3 focus:bg-amber-500 focus:text-zinc-950 focus:font-semibold focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-4 focus:ring-amber-500/50"
    >
      Skip to main content
    </a>
  );
});

SkipToContent.displayName = 'SkipToContent';
