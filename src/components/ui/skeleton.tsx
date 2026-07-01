import { cn } from "@/lib/utils";
import React from 'react'; // Import React

// Generic Skeleton Component
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("animate-pulse rounded-md bg-primary/10", className)} {...props} />;
}

// Skeleton for Text (e.g., lines of text)
export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({ lines = 3, className }) => {
  const numberOfLines = Math.min(lines, 5); // Limit to a reasonable number of lines
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: numberOfLines }).map((_, i) => (
        <Skeleton key={i} className="h-4 w-full" /> // Default height for text lines
      ))}
    </div>
  );
};

// Skeleton for a Card (e.g., TripCard)
export const SkeletonCard: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn("overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm", className)}>
      <Skeleton className="h-56 w-full rounded-none" />
      <div className="space-y-2.5 p-4">
        <Skeleton className="h-4 w-3/4 rounded-full" />
        <Skeleton className="h-3 w-1/2 rounded-full" />
      </div>
      <div className="flex items-center justify-between px-4 pb-4">
        <Skeleton className="h-3 w-20 rounded-full" />
        <div className="flex gap-1.5">
          <Skeleton className="h-7 w-7 rounded-md" />
          <Skeleton className="h-7 w-7 rounded-md" />
        </div>
      </div>
    </div>
  );
};

// Skeleton for an Avatar (circular)
export const SkeletonAvatar: React.FC<{ size?: number; className?: string }> = ({ size = 50, className }) => {
  return (
    <Skeleton
      className={cn("rounded-full", className)}
      style={{ width: size, height: size }}
    />
  );
};

export { Skeleton };
