import { useScroll, useTransform, motion } from "framer-motion"
import React, { useEffect, useRef, useState } from "react"

export interface TimelineEntry {
  title: string
  content: React.ReactNode
}

export function Timeline({ data }: { data: TimelineEntry[] }) {
  const innerRef = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState(0)
  const [lineStart, setLineStart] = useState(0)
  const [lineEnd, setLineEnd] = useState(1)

  const { scrollY } = useScroll()

  useEffect(() => {
    function measure() {
      if (!innerRef.current) return
      const rect = innerRef.current.getBoundingClientRect()
      const h = rect.height
      const top = rect.top + window.scrollY
      setHeight(h)
      // Start filling when top of timeline is 20% into viewport,
      // finish when bottom of timeline is 40% from top of viewport.
      setLineStart(top - window.innerHeight * 0.8)
      setLineEnd(top + h - window.innerHeight * 0.4)
    }
    measure()
    // Re-measure after a short delay (fonts, images may shift layout)
    const t = setTimeout(measure, 400)
    window.addEventListener("resize", measure)
    return () => {
      clearTimeout(t)
      window.removeEventListener("resize", measure)
    }
  }, [data])

  const heightTransform = useTransform(scrollY, [lineStart, lineEnd], [0, height], { clamp: true })
  const opacityTransform = useTransform(scrollY, [lineStart, lineStart + 80], [0, 1])

  return (
    <div className="w-full font-sans">
      <div ref={innerRef} className="relative mx-auto max-w-5xl pb-16">
        {data.map((item, index) => (
          <div key={index} className="flex justify-start pt-10 md:gap-8 md:pt-16">
            {/* Sticky label column */}
            <div className="sticky top-24 z-40 flex max-w-[160px] flex-col items-center self-start md:w-full md:max-w-xs md:flex-row">
              <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-sky-700/60 bg-sky-950 shadow-md shadow-sky-900/40">
                <div className="h-3.5 w-3.5 rounded-full bg-sky-500/30 ring-2 ring-sky-400/60" />
              </div>
              <h3 className="hidden pl-4 font-display text-xl font-bold leading-tight text-sky-400 md:block">
                {item.title}
              </h3>
            </div>

            {/* Content */}
            <div className="relative w-full pl-14 pr-2 md:pl-4">
              <h3 className="mb-4 block font-display text-lg font-bold text-sky-400 md:hidden">
                {item.title}
              </h3>
              {item.content}
            </div>
          </div>
        ))}

        {/* Animated line */}
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
