import { motion, type Transition } from "framer-motion"
import { cn } from "@/lib/utils"

type TextShimmerWaveProps = {
  children: string
  className?: string
  duration?: number
  zDistance?: number
  xDistance?: number
  yDistance?: number
  spread?: number
  scaleDistance?: number
  rotateYDistance?: number
  transition?: Transition
}

export function TextShimmerWave({
  children,
  className,
  duration = 1.2,
  zDistance = 12,
  xDistance = 2,
  yDistance = -3,
  spread = 1,
  scaleDistance = 1.08,
  rotateYDistance = 10,
  transition,
}: TextShimmerWaveProps) {
  const chars = children.split("")
  const total = chars.length

  return (
    <p
      className={cn(
        "inline-block [perspective:600px] [--base-color:#7dd3fc] [--glow-color:#ffffff]",
        className,
      )}
      style={{ color: "var(--base-color)" }}
    >
      {chars.map((char, i) => {
        const delay = (i / total) * duration * (1 / spread)
        return (
          <motion.span
            key={i}
            className="inline-block whitespace-pre [transform-style:preserve-3d]"
            initial={{ translateZ: 0, scale: 1, rotateY: 0, color: "var(--base-color)" }}
            animate={{
              translateZ: [0, zDistance, 0],
              translateX: [0, xDistance, 0],
              translateY: [0, yDistance, 0],
              scale: [1, scaleDistance, 1],
              rotateY: [0, rotateYDistance, 0],
              color: ["var(--base-color)", "var(--glow-color)", "var(--base-color)"],
            }}
            transition={{
              duration,
              repeat: Infinity,
              repeatDelay: (total * 0.05) / spread,
              delay,
              ease: "easeInOut",
              ...transition,
            }}
          >
            {char}
          </motion.span>
        )
      })}
    </p>
  )
}
