// src/components/ui/AnimatedGradientBackground.tsx

const AnimatedGradientBackground = () => {
  return (
    <div
      className="absolute inset-0 -z-10"
      style={{
        background: "linear-gradient(135deg, #d4eaf7 0%, #f0f8ff 50%, #e6f7f1 100%)",
      }}
    />
  );
};

export default AnimatedGradientBackground;
