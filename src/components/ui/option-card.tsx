// src/components/ui/option-card.tsx
import { motion } from 'framer-motion';
import type { TargetAndTransition } from 'framer-motion';
import React from 'react';

interface OptionCardProps {
  label: string;
  selected: boolean;
  onClick?: () => void;
  icon?: string; // Added icon prop
  className?: string; // For custom styling
}

// Define tap animation variants
const tapAnimation: TargetAndTransition = {
  scale: 0.97,
  transition: { type: 'spring', stiffness: 400, damping: 10 },
};

export const OptionCard: React.FC<OptionCardProps> = ({ label, selected, onClick, icon, className }) => {
  const baseStyles = `relative p-4 rounded-lg shadow-md cursor-pointer transition-all duration-300 ease-in-out flex items-center space-x-3 w-36 h-32 border-2 ${
    selected
      ? 'bg-blue- Pastel-$(80) border-blue- Pastel-$(100) shadow-lg scale-105'
      : 'bg-white border-blue- Pastel-$(40) hover:bg-blue- Pastel-$(20) hover:shadow-md'
  } ${className || ''}`;

  return (
    <motion.div
      whileTap={tapAnimation} // Apply tap animation here
      onClick={onClick}
      className={baseStyles}
    >
      {icon && <span className="text-2xl">{icon}</span>} {/* Display icon */}
      <span className={`text-lg font-semibold ${selected ? 'text-white' : 'text-gray-800'}`}>{label}</span>
      {selected && (
        <span className="absolute top-2 right-2 text-white text-xl">✅</span> // Selected indicator
      )}
    </motion.div>
  );
};
