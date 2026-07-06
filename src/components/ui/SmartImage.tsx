import { useEffect, useState, type ImgHTMLAttributes } from "react";

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "onError"> & {
  src: string | null | undefined;
  /** URL alternativa si la principal falla (p. ej. loremflickr determinista). */
  fallbackSrc?: string;
  /** Clases del degradado que se muestra si no hay imagen o todo falla. */
  gradientClassName?: string;
};

/**
 * <img> con red de seguridad: si la URL falla (hotlink de Unsplash caducado,
 * loremflickr caído…) intenta el fallback y, si también falla, muestra un
 * degradado de marca en lugar del icono de imagen rota del navegador.
 */
export function SmartImage({
  src,
  fallbackSrc,
  gradientClassName = "bg-gradient-to-br from-sky-400 to-sky-700",
  alt = "",
  className,
  loading = "lazy",
  ...rest
}: Props) {
  const [current, setCurrent] = useState(src ?? null);
  const [dead, setDead] = useState(false);

  // Si el padre cambia la URL (p. ej. datos que llegan async), reinicia.
  useEffect(() => {
    setCurrent(src ?? null);
    setDead(false);
  }, [src]);

  if (!current || dead) {
    return <div aria-hidden className={`${gradientClassName} ${className ?? ""}`} />;
  }

  return (
    <img
      {...rest}
      src={current}
      alt={alt}
      loading={loading}
      className={className}
      onError={() => {
        if (fallbackSrc && current !== fallbackSrc) setCurrent(fallbackSrc);
        else setDead(true);
      }}
    />
  );
}

/** Fallback determinista por destino: misma imagen en cada render. */
export function destinationFallback(destination: string, w = 800, h = 600): string {
  const q = encodeURIComponent(destination.split(",")[0].trim() + ",travel");
  let hash = 0;
  for (const c of destination) hash = (hash * 31 + c.charCodeAt(0)) | 0;
  return `https://loremflickr.com/${w}/${h}/${q}?lock=${Math.abs(hash) % 1000}`;
}
