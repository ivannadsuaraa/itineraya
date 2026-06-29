// src/components/ui/EmptyStateWrapper.tsx
import React, { useState, useEffect } from 'react';

import { cn } from '@/lib/utils';

// Placeholder for icon data - in a real app, this would be more sophisticated
// For now, using basic SVG path data for simple icons like planes, compasses
const defaultIconPaths = {
  plane: "M12 2L4 20h8L12 2z M4 20l7-8L4 20zm8 0l7 8M4 20l-7-8", // Basic plane path
  compass: "M12 0a12 12 0 1 0 0 24 12 12 0 0 0 0-24zM4 12a8 8 0 1 1 16 0 8 8 0 0 1-16 0zM14 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0z", // Basic compass path
  star: "M12 2l2.46 7.588L20 11.78l-6 5.8L12 23l-2-6.22L6 11.78l5.54-2.192L12 2z", // Basic star path
};

interface ParticleProps {
  initialX: number;
  initialY: number;
  iconPath: string;
}

const Particle: React.FC<ParticleProps> = ({ initialX, initialY, iconPath }) => {
  return (
    <div
      className="absolute"
      style={{ left: `${initialX}%`, top: `${initialY}%` }}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d={iconPath} fill="rgba(255, 255, 255, 0.6)" /> {/* White particles with opacity */}
      </svg>
    </div>
  );
};

interface EmptyStateWrapperProps {
  isEmpty: boolean;
  children: React.ReactNode;
  // Allow specifying specific icons or use defaults
  particles?: ('plane' | 'compass' | 'star')[];
  particleCount?: number;
  className?: string;
}

const EmptyStateWrapper: React.FC<EmptyStateWrapperProps> = ({
  isEmpty,
  children,
  particles = ['plane', 'compass'], // Default particles
  particleCount = 15, // Default number of particles
  className
}) => {
  const [particleData, setParticleData] = useState<any[]>([]);

  useEffect(() => {
    if (isEmpty) {
      const generatedParticles = Array.from({ length: particleCount }).map((_, i) => ({
        id: i,
        // Random initial position, ensuring they are within viewport bounds initially
        initialX: Math.random() * 90 + 5, // 5% to 95%
        initialY: Math.random() * 90 + 5, // 5% to 95%
        speed: Math.random() * 1.5 + 0.5, // Speed between 0.5x and 2x base speed
        iconPath: defaultIconPaths[particles[i % particles.length] as keyof typeof defaultIconPaths],
      }));
      setParticleData(generatedParticles);
    } else {
      setParticleData([]); // Clear particles if not empty
    }
  }, [isEmpty, particleCount, particles]);

  return (
    <div className={cn("relative flex flex-col items-center justify-center w-full h-full", className)}>
      {isEmpty && (
        <div className="absolute inset-0 pointer-events-none z-0"> {/* Render particles behind content */}
          {particleData.map(p => (
            <Particle
              key={p.id}
              initialX={p.initialX}
              initialY={p.initialY}
              iconPath={p.iconPath}
            />
          ))}
        </div>
      )}
      <div className="relative z-10"> {/* Ensure children are above particles */}
        {children}
      </div>
    </div>
  );
};

export default EmptyStateWrapper;
