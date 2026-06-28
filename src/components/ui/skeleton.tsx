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
    <div className={cn("rounded-xl bg-white p-6 shadow-md", className)}>
      {/* Image Placeholder */}
      <Skeleton className="mb-4 h-48 w-full rounded-lg" />
      {/* Title Placeholder */}
      <Skeleton className="mb-2 h-6 w-3/4 rounded" />
      {/* Description Placeholder */}
      <Skeleton className="mb-4 h-16 w-full rounded" />
      {/* Footer/Meta Placeholder */}
      <div className="flex justify-between">
        <Skeleton className="h-4 w-1/4 rounded" />
        <Skeleton className="h-4 w-1/4 rounded" />
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
