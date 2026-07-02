import { useMotionValueEvent, useScroll, useTransform, motion } from "framer-motion"
import React, { useEffect, useRef, useState } from "react"

export interface TimelineEntry {
  title: string
  content: React.ReactNode
}

export function Timeline({ data }: { data: TimelineEntry[] }) {
  const ref = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState(0)

  useEffect(() => {
    if (ref.current) {
      setHeight(ref.current.getBoundingClientRect().height)
    }
  }, [data])

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 10%", "end 50%"],
  })

  const heightTransform = useTransform(scrollYProgress, [0, 1], [0, height])
  const opacityTransform = useTransform(scrollYProgress, [0, 0.05], [0, 1])

  return (
    <div className="w-full font-sans" ref={containerRef}>
      <div ref={ref} className="relative mx-auto max-w-5xl pb-16">
        {data.map((item, index) => (
          <div key={index} className="flex justify-start pt-10 md:pt-16 md:gap-8">
            {/* Sticky label column */}
            <div className="sticky top-24 z-40 flex max-w-[160px] flex-col items-center self-start md:flex-row md:max-w-xs md:w-full">
              {/* Dot */}
              <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-sky-700/60 bg-sky-950 shadow-md shadow-sky-900/40">
                <div className="h-3.5 w-3.5 rounded-full bg-sky-500/30 ring-2 ring-sky-400/60" />
              </div>
              <h3 className="hidden md:block pl-4 text-xl font-bold text-sky-400 font-display leading-tight">
                {item.title}
              </h3>
            </div>

            {/* Content */}
            <div className="relative w-full pl-14 pr-2 md:pl-4">
              <h3 className="mb-4 block text-lg font-bold text-sky-400 font-display md:hidden">
                {item.title}
              </h3>
              {item.content}
            </div>
          </div>
        ))}

        {/* Animated timeline line */}
        <div
          style={{ height: `${height}px` }}
          className="absolute left-[17px] top-0 w-[2px] overflow-hidden bg-gradient-to-b from-transparent via-sky-900/50 to-transparent md:left-[17px]"
        >
          <motion.div
            style={{ height: heightTransform, opacity: opacityTransform }}
            className="absolute inset-x-0 top-0 w-[2px] rounded-full bg-gradient-to-b from-sky-400 via-sky-500 to-transparent"
          />
        </div>
      </div>
    </div>
  )
}
