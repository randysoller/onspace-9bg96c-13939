/**
 * Empty state component with CTAs for better UX
 */

import { memo, type ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState = memo(({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  className = '',
}: EmptyStateProps) => {
  return (
    <div className={`text-center py-12 px-4 ${className}`} role="status">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-zinc-800 rounded-full mb-4">
        <Icon className="w-8 h-8 text-zinc-500" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-zinc-400 mb-6 max-w-sm mx-auto">{description}</p>
      
      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {action && (
            <button
              onClick={action.onClick}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-semibold rounded-lg transition-colors"
            >
              {action.label}
            </button>
          )}
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold rounded-lg transition-colors"
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
});

EmptyState.displayName = 'EmptyState';
