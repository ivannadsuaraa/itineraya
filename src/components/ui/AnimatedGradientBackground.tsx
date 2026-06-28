// src/components/ui/AnimatedGradientBackground.tsx
import { motion } from 'framer-motion';

const AnimatedGradientBackground = () => {
  const gradientVariants = {
    animate: {
      backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"], // Horizontal shift and return
      transition: {
        duration: 28, // Long duration for a very slow shift, slightly adjusted
        repeat: Infinity,
        ease: "linear", // Smooth, consistent movement
      },
    },
  };

  return (
    <motion.div
      className="absolute inset-0 -z-10" // Position behind content, covers full viewport
      style={{
        // Example gradient, replace with your app's preferred colors for a premium feel
        // Using softer, more premium colors for the gradient
        background: "linear-gradient(135deg, #d4eaf7 0%, #f0f8ff 50%, #e6f7f1 100%)",
        backgroundSize: "200% 200%", // Crucial for animation to be visible
      }}
      variants={gradientVariants}
      animate="animate"
    />
  );
};

export default AnimatedGradientBackground;
