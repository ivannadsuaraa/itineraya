import { useEffect, useRef, useCallback, useState } from "react"
import createGlobe from "cobe"

export interface PolaroidMarker {
  id: string
  location: [number, number]
  image: string
  caption: string
  rotate: number
}

interface GlobePolaoridsProps {
  markers?: PolaroidMarker[]
  className?: string
  speed?: number
}

const defaultMarkers: PolaroidMarker[] = [
  { id: "sf", location: [37.78, -122.44], image: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=120&h=120&fit=crop", caption: "San Francisco", rotate: -5 },
  { id: "nyc", location: [40.71, -74.01], image: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=120&h=120&fit=crop", caption: "New York", rotate: 4 },
  { id: "tokyo", location: [35.68, 139.65], image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=120&h=120&fit=crop", caption: "Tokyo", rotate: -3 },
  { id: "sydney", location: [-33.87, 151.21], image: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=120&h=120&fit=crop", caption: "Sydney", rotate: 6 },
  { id: "paris", location: [48.86, 2.35], image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=120&h=120&fit=crop", caption: "Paris", rotate: -4 },
  { id: "london", location: [51.51, -0.13], image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=120&h=120&fit=crop", caption: "London", rotate: 3 },
]

function projectMarker(lat: number, lon: number, phi: number, theta: number, size: number) {
  const latR = (lat * Math.PI) / 180
  const lonR = (lon * Math.PI) / 180

  // Point on unit sphere in globe-local system
  const px = Math.cos(latR) * Math.cos(lonR)
  const py = Math.sin(latR)
  const pz = Math.cos(latR) * Math.sin(lonR)

  // Apply phi rotation (globe spinning around Y axis)
  const x1 = px * Math.cos(phi) + pz * Math.sin(phi)
  const y1 = py
  const z1 = -px * Math.sin(phi) + pz * Math.cos(phi)

  // Apply theta tilt (around X axis)
  const y2 = y1 * Math.cos(theta) - z1 * Math.sin(theta)
  const z2 = y1 * Math.sin(theta) + z1 * Math.cos(theta)
  const x2 = x1

  const radius = size / 2
  return {
    screenX: x2 * radius + radius,
    screenY: -y2 * radius + radius,
    visible: z2 > 0.15,
    depth: z2,
  }
}

export function GlobePolaroids({
  markers = defaultMarkers,
  className = "",
  speed = 0.003,
}: GlobePolaoridsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const pointerInteracting = useRef<{ x: number; y: number } | null>(null)
  const dragOffset = useRef({ phi: 0, theta: 0 })
  const phiOffsetRef = useRef(0)
  const thetaOffsetRef = useRef(0.2)
  const isPausedRef = useRef(false)
  const phiRef = useRef(0)
  const polaroidRefs = useRef<(HTMLDivElement | null)[]>([])
  const [ready, setReady] = useState(false)

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    pointerInteracting.current = { x: e.clientX, y: e.clientY }
    if (canvasRef.current) canvasRef.current.style.cursor = "grabbing"
    isPausedRef.current = true
  }, [])

  const handlePointerUp = useCallback(() => {
    if (pointerInteracting.current !== null) {
      phiOffsetRef.current += dragOffset.current.phi
      thetaOffsetRef.current = Math.max(-0.5, Math.min(0.5,
        thetaOffsetRef.current + dragOffset.current.theta
      ))
      dragOffset.current = { phi: 0, theta: 0 }
    }
    pointerInteracting.current = null
    if (canvasRef.current) canvasRef.current.style.cursor = "grab"
    isPausedRef.current = false
  }, [])

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (pointerInteracting.current !== null) {
        dragOffset.current = {
          phi: (e.clientX - pointerInteracting.current.x) / 300,
          theta: (e.clientY - pointerInteracting.current.y) / 1000,
        }
      }
    }
    window.addEventListener("pointermove", handlePointerMove, { passive: true })
    window.addEventListener("pointerup", handlePointerUp, { passive: true })
    return () => {
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerup", handlePointerUp)
    }
  }, [handlePointerUp])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let globe: ReturnType<typeof createGlobe> | null = null
    let animationId: number

    function updatePolaroids(phi: number, theta: number, size: number) {
      markers.forEach((m, idx) => {
        const el = polaroidRefs.current[idx]
        if (!el) return
        const { screenX, screenY, visible, depth } = projectMarker(
          m.location[0], m.location[1], phi, theta, size
        )
        if (visible) {
          el.style.opacity = String(Math.min(1, (depth - 0.15) * 3))
          el.style.left = `${screenX}px`
          el.style.top = `${screenY}px`
          el.style.display = "block"
          el.style.zIndex = String(Math.round(depth * 10))
        } else {
          el.style.opacity = "0"
          el.style.display = "none"
        }
      })
    }

    function init() {
      const width = canvas!.offsetWidth
      if (width === 0 || globe) return

      globe = createGlobe(canvas!, {
        devicePixelRatio: Math.min(window.devicePixelRatio || 1, 2),
        width,
        height: width,
        phi: 0,
        theta: 0.2,
        dark: 0,
        diffuse: 1.5,
        mapSamples: 16000,
        mapBrightness: 9,
        baseColor: [1, 1, 1],
        markerColor: [0.24, 0.42, 0.72],
        glowColor: [0.94, 0.93, 0.91],
        markers: markers.map((m) => ({ location: m.location, size: 0.04 })),
      })

      function animate() {
        if (!isPausedRef.current) phiRef.current += speed
        const phi = phiRef.current + phiOffsetRef.current + dragOffset.current.phi
        const theta = thetaOffsetRef.current + dragOffset.current.theta
        globe!.update({ phi, theta })
        updatePolaroids(phi, theta, width)
        animationId = requestAnimationFrame(animate)
      }
      animate()
      setTimeout(() => {
        if (canvas) canvas.style.opacity = "1"
        setReady(true)
      }, 100)
    }

    if (canvas.offsetWidth > 0) {
      init()
    } else {
      const ro = new ResizeObserver((entries) => {
        if (entries[0]?.contentRect.width > 0) {
          ro.disconnect()
          init()
        }
      })
      ro.observe(canvas)
    }

    return () => {
      if (animationId) cancelAnimationFrame(animationId)
      if (globe) globe.destroy()
    }
  }, [markers, speed])

  return (
    <div
      ref={containerRef}
      className={`relative select-none ${className}`}
      style={{ aspectRatio: "1" }}
    >
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerEnter={() => { isPausedRef.current = true }}
        onPointerLeave={() => { isPausedRef.current = false }}
        style={{
          width: "100%",
          height: "100%",
          cursor: "grab",
          opacity: 0,
          transition: "opacity 1.2s ease",
          borderRadius: "50%",
          touchAction: "none",
        }}
      />

      {markers.map((m, idx) => (
        <div
          key={m.id}
          ref={(el) => { polaroidRefs.current[idx] = el }}
          style={{
            position: "absolute",
            opacity: 0,
            display: "none",
            transform: `translate(-50%, -110%) rotate(${m.rotate}deg)`,
            background: "#fff",
            padding: "6px 6px 22px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.18), 0 1px 3px rgba(0,0,0,0.12)",
            pointerEvents: "none",
            transition: "opacity 0.25s ease",
            willChange: "opacity, left, top",
          }}
        >
          <img
            src={m.image}
            alt={m.caption}
            style={{ display: "block", width: 64, height: 64, objectFit: "cover" }}
          />
          <span style={{
            position: "absolute",
            bottom: 4,
            left: 0,
            right: 0,
            textAlign: "center",
            fontFamily: "system-ui, sans-serif",
            fontSize: "0.55rem",
            color: "#444",
            letterSpacing: "0.02em",
            fontWeight: 600,
          }}>
            {m.caption}
          </span>
        </div>
      ))}

      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center rounded-full">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-300 border-t-transparent" />
        </div>
      )}
    </div>
  )
}
