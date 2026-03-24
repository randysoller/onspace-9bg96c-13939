/**
 * Skeleton loader components for better perceived performance
 */

import { memo } from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export const Skeleton = memo(({ 
  className = '', 
  variant = 'text',
  width,
  height,
  animation = 'pulse',
}: SkeletonProps) => {
  const baseClasses = 'bg-zinc-800';
  const animationClasses = animation === 'pulse' 
    ? 'animate-pulse' 
    : animation === 'wave' 
    ? 'animate-shimmer' 
    : '';
  
  const variantClasses = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: 'rounded',
  };

  const style: React.CSSProperties = {
    width: width || (variant === 'circular' ? '40px' : '100%'),
    height: height || (variant === 'text' ? '1rem' : variant === 'circular' ? '40px' : '100px'),
  };

  return (
    <div 
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses} ${className}`}
      style={style}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
});

Skeleton.displayName = 'Skeleton';

// Preset skeleton screens for common use cases
export const LeaderboardSkeleton = memo(() => (
  <div className="px-4 py-4 space-y-2" aria-label="Loading leaderboard">
    {Array.from({ length: 10 }).map((_, i) => (
      <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <Skeleton variant="circular" width={48} height={48} />
            <div className="flex-1 space-y-2">
              <Skeleton width="60%" height={16} />
              <Skeleton width="40%" height={12} />
            </div>
          </div>
          <div className="text-right space-y-2">
            <Skeleton width={60} height={20} />
            <Skeleton width={40} height={12} />
          </div>
        </div>
      </div>
    ))}
  </div>
));

LeaderboardSkeleton.displayName = 'LeaderboardSkeleton';

export const PracticeHistorySkeleton = memo(() => (
  <div className="px-4 space-y-3" aria-label="Loading practice history">
    {Array.from({ length: 8 }).map((_, i) => (
      <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <Skeleton width="40%" height={14} />
          <Skeleton width="25%" height={14} />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <Skeleton width="60%" height={10} />
            <Skeleton width="80%" height={20} />
          </div>
          <div className="space-y-1">
            <Skeleton width="60%" height={10} />
            <Skeleton width="80%" height={20} />
          </div>
          <div className="space-y-1">
            <Skeleton width="60%" height={10} />
            <Skeleton width="80%" height={20} />
          </div>
        </div>
      </div>
    ))}
  </div>
));

PracticeHistorySkeleton.displayName = 'PracticeHistorySkeleton';

export const ChordLibrarySkeleton = memo(() => (
  <div className="px-4 py-4 space-y-4" aria-label="Loading chord library">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <div className="flex items-center gap-4">
          <Skeleton variant="rectangular" width={80} height={100} />
          <div className="flex-1 space-y-3">
            <Skeleton width="50%" height={20} />
            <Skeleton width="70%" height={14} />
            <Skeleton width="60%" height={12} />
          </div>
        </div>
      </div>
    ))}
  </div>
));

ChordLibrarySkeleton.displayName = 'ChordLibrarySkeleton';
