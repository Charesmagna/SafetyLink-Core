import React from 'react';

export const SkeletonLoader: React.FC<{ lines?: number }> = ({ lines = 3 }) => {
  return (
    <div className="w-full space-y-4 p-6">
      <div className="h-8 bg-slate-800 rounded-lg w-1/3 animate-pulse" />
      <div className="space-y-3">
        {[...Array(lines)].map((_, i) => (
          <div key={i} className={`h-24 bg-slate-800 rounded-xl animate-pulse w-full opacity-${90 - (i * 20)}`} />
        ))}
      </div>
    </div>
  );
};
