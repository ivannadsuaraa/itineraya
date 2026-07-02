import { useEffect, useRef, useCallback, useState } from "react"
import createGlobe from "cobe"
import { Link } from "@tanstack/react-router"
import { ArrowRight, X } from "lucide-react"

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
  { id: "sf", location: [37.78, -122.44], image: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400&h=280&fit=crop", caption: "San Francisco", rotate: -5 },
  { id: "nyc", location: [40.71, -74.01], image: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400&h=280&fit=crop", caption: "New York", rotate: 4 },
  { id: "tokyo", location: [35.68, 139.65], image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=280&fit=crop", caption: "Tokyo", rotate: -3 },
  { id: "sydney", location: [-33.87, 151.21], image: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=400&h=280&fit=crop", caption: "Sydney", rotate: 6 },
  { id: "paris", location: [48.86, 2.35], image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&h=280&fit=crop", caption: "Paris", rotate: -4 },
  { id: "london", location: [51.51, -0.13], image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&h=280&fit=crop", caption: "London", rotate: 3 },
]

function projectMarker(lat: number, lon: number, phi: number, theta: number, size: number) {
  const latR = (lat * Math.PI) / 180
  const lonR = (lon * Math.PI) / 180

  const px = Math.cos(latR) * Math.cos(lonR)
  const py = Math.sin(latR)
  const pz = Math.cos(latR) * Math.sin(lonR)

  const x1 = px * Math.cos(phi) + pz * Math.sin(phi)
  const y1 = py
  const z1 = -px * Math.sin(phi) + pz * Math.cos(phi)

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

function popupTransform(x: number, y: number, containerW: number): string {
  const popupW = 192
  if (x < popupW / 2) return "translate(0%, -110%)"
  if (x > containerW - popupW / 2) return "translate(-100%, -110%)"
  return "translate(-50%, -110%)"
}

export function GlobePolaroids({
  markers = defaultMarkers,
  className = "",
  speed = 0.003,
}: GlobePolaoridsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const pointerInteracting = useRef<{ x: number; y: number } | null>(null)
  const pointerDownClient = useRef<{ x: number; y: number } | null>(null)
  const pointerDownCanvas = useRef<{ x: number; y: number } | null>(null)
  const dragOffset = useRef({ phi: 0, theta: 0 })
  const phiOffsetRef = useRef(0)
  const thetaOffsetRef = useRef(0.2)
  const isPausedRef = useRef(false)
  const phiRef = useRef(0)
  const markersRef = useRef(markers)
  const [ready, setReady] = useState(false)
  const [popup, setPopup] = useState<{ marker: PolaroidMarker; x: number; y: number } | null>(null)

  useEffect(() => {
    markersRef.current = markers
  }, [markers])

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    const canvas = canvasRef.current
    if (canvas) {
      const rect = canvas.getBoundingClientRect()
      pointerDownCanvas.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }
    pointerDownClient.current = { x: e.clientX, y: e.clientY }
    pointerInteracting.current = { x: e.clientX, y: e.clientY }
    if (canvasRef.current) canvasRef.current.style.cursor = "grabbing"
    isPausedRef.current = true
    setPopup(null)
  }, [])

  const handlePointerUp = useCallback((e: PointerEvent) => {
    if (pointerDownClient.current && pointerDownCanvas.current) {
      const dx = e.clientX - pointerDownClient.current.x
      const dy = e.clientY - pointerDownClient.current.y
      const wasDrag = Math.sqrt(dx * dx + dy * dy) > 5

      if (!wasDrag) {
        const canvas = canvasRef.current
        if (canvas) {
          const { x: clickX, y: clickY } = pointerDownCanvas.current
          const size = canvas.offsetWidth
          const phi = phiRef.current + phiOffsetRef.current + dragOffset.current.phi
          const theta = thetaOffsetRef.current + dragOffset.current.theta

          let closest: { marker: PolaroidMarker; dist: number; x: number; y: number } | null = null
          for (const marker of markersRef.current) {
            const { screenX, screenY, visible } = projectMarker(
              marker.location[0], marker.location[1], phi, theta, size
            )
            if (!visible) continue
            const d = Math.sqrt((clickX - screenX) ** 2 + (clickY - screenY) ** 2)
            if (d < 26 && (!closest || d < closest.dist)) {
              closest = { marker, dist: d, x: screenX, y: screenY }
            }
          }

          setPopup(closest ? { marker: closest.marker, x: closest.x, y: closest.y } : null)
        }
      }
    }

    if (pointerInteracting.current !== null) {
      phiOffsetRef.current += dragOffset.current.phi
      thetaOffsetRef.current = Math.max(-0.5, Math.min(0.5,
        thetaOffsetRef.current + dragOffset.current.theta
      ))
      dragOffset.current = { phi: 0, theta: 0 }
    }
    pointerDownClient.current = null
    pointerDownCanvas.current = null
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
        markerColor: [0.12, 0.42, 0.60],
        glowColor: [0.94, 0.93, 0.91],
        markers: markers.map((m) => ({ location: m.location, size: 0.06 })),
      })

      function animate() {
        if (!isPausedRef.current) phiRef.current += speed
        const phi = phiRef.current + phiOffsetRef.current + dragOffset.current.phi
        const theta = thetaOffsetRef.current + dragOffset.current.theta
        globe!.update({ phi, theta })
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

  const containerW = canvasRef.current?.offsetWidth ?? 300

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
        onPointerLeave={() => { isPausedRef.current = false; setPopup(null) }}
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

      {/* Trip popup on dot click */}
      {popup && (
        <div
          style={{
            position: "absolute",
            left: popup.x,
            top: popup.y,
            transform: popupTransform(popup.x, popup.y, containerW),
            zIndex: 20,
            pointerEvents: "auto",
          }}
        >
          <div className="w-48 overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-black/8">
            {popup.marker.image && (
              <div className="relative h-28 overflow-hidden">
                <img
                  src={popup.marker.image}
                  alt={popup.marker.caption}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" />
              </div>
            )}
            <div className="p-3">
              <p className="truncate text-sm font-bold text-slate-900">{popup.marker.caption}</p>
              <Link
                to="/my-trip/$tripId"
                params={{ tripId: popup.marker.id }}
                className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-[#1E6B9A] transition hover:underline"
              >
                Ver itinerario
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <button
              type="button"
              onClick={() => setPopup(null)}
              className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/20 text-white backdrop-blur-sm transition hover:bg-black/40"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}

      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center rounded-full">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-300 border-t-transparent" />
        </div>
      )}
    </div>
  )
}
