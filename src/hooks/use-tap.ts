import { useRef } from "react";

/**
 * Handler de tap fiable en móvil: engancha `touchend` (más rápido y fiable
 * que `click` en Safari/Chrome iOS/Android para UI dentro de subárboles con
 * animaciones o backdrop-blur) y absorbe el `click` "fantasma" que el
 * navegador dispara ~300ms después de un touchend, para que un único tap
 * nunca dispare la acción dos veces. En desktop no hay touchend, así que el
 * flag nunca se activa y `onClick` funciona con normalidad.
 */
export function useTap(action: () => void) {
  const touchHandledRef = useRef(false);

  const onTouchEnd = () => {
    touchHandledRef.current = true;
    action();
    window.setTimeout(() => {
      touchHandledRef.current = false;
    }, 700);
  };

  const onClick = () => {
    if (touchHandledRef.current) return; // ghost click tras un toque → ignorar
    action();
  };

  return { onClick, onTouchEnd };
}
