import { memo } from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  message?: string;
  fullScreen?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
};

export const LoadingSpinner = memo(({ 
  size = 'md', 
  message, 
  fullScreen = false,
  className = '' 
}: LoadingSpinnerProps) => {
  const content = (
    <div 
      className={`flex flex-col items-center justify-center gap-4 ${className}`}
      role="status"
      aria-live="polite"
    >
      <Loader2 
        className={`${sizeClasses[size]} text-amber-500 animate-spin`}
        aria-hidden="true"
      />
      {message && (
        <p className="text-sm text-zinc-400" aria-label={message}>
          {message}
        </p>
      )}
      <span className="sr-only">Loading...</span>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
});

LoadingSpinner.displayName = 'LoadingSpinner';
