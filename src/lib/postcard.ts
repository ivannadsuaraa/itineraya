// Generates a downloadable travel-postcard PNG for a day of the itinerary,
// using HTML Canvas. Landscape 16:9, dark-navy background, built for sharing.

export type PostcardActivity = {
  time: string;
  emoji?: string;
  title: string;
  place?: string;
  description?: string;
  category?: string;
};

export type PostcardInput = {
  destination: string;
  dayNumber: number;
  dayTitle: string;
  subtitle?: string;
  imageUrl?: string | null;
  activities: PostcardActivity[];
  /** UI language (es/en/fr/pt) — controls the baked-in text on the image. */
  locale?: string;
};

// La postal se comparte tal cual: su texto debe hablar el idioma del usuario.
const POSTCARD_COPY: Record<
  string,
  { dayIn: (n: number, dest: string) => string; dayWord: string; route: string }
> = {
  es: { dayIn: (n, d) => `Día ${n} en ${d}`, dayWord: "Día", route: "RECORRIDO DEL DÍA" },
  en: { dayIn: (n, d) => `Day ${n} in ${d}`, dayWord: "Day", route: "TODAY'S ROUTE" },
  fr: { dayIn: (n, d) => `Jour ${n} à ${d}`, dayWord: "Jour", route: "PARCOURS DU JOUR" },
  pt: { dayIn: (n, d) => `Dia ${n} em ${d}`, dayWord: "Dia", route: "ROTEIRO DO DIA" },
};

function postcardCopy(locale: string | undefined) {
  const code = (locale ?? "es").toLowerCase().slice(0, 2);
  return POSTCARD_COPY[code] ?? POSTCARD_COPY.es;
}

// Brand palette — dark navy canvas, white text, sky-400 accent.
const NAVY_DARK = "#050b16";
const NAVY = "#0b1a2e";
const SKY_ACCENT = "#38bdf8"; // sky-400
const SKY_SOFT = "#7dd3fc"; // sky-300

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const w of words) {
    const test = current ? `${current} ${w}` : w;
    if (ctx.measureText(test).width <= maxWidth) {
      current = test;
    } else {
      if (current) lines.push(current);
      current = w;
      if (lines.length === maxLines - 1) break;
    }
  }
  if (current && lines.length < maxLines) lines.push(current);
  if (lines.length === maxLines) {
    let last = lines[maxLines - 1];
    while (ctx.measureText(last + "…").width > maxWidth && last.length > 0) {
      last = last.slice(0, -1);
    }
    lines[maxLines - 1] = last + "…";
  }
  return lines;
}

function hexToRgba(hex: string, a: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

// ---------------------------------------------------------------------------
// Activity icon system — one monoline SVG per category, matched from the
// AI-assigned category first, then from keywords in the title/description so
// older itineraries without a category still get a sensible icon.
// ---------------------------------------------------------------------------

export type IconId =
  | "museum"
  | "beach"
  | "mountain"
  | "restaurant"
  | "shopping"
  | "theater"
  | "nightlife"
  | "temple"
  | "sunset"
  | "walk"
  | "pin";

export const ICON_PATHS: Record<IconId, string> = {
  // Museum / monument: columns + pediment
  museum: '<path d="M3 21h18M4 21V10M20 21V10M2 10l10-6 10 6M6 10v7M10 10v7M14 10v7M18 10v7"/>',
  // Beach: palm + waves
  beach:
    '<path d="M5 12c2-6 6-8 6-8s-1 4 1 6 6 1 6 1-3 3-7 2c0 3-1 6-1 6M2 19c1.5-1 3-1 4.5 0s3 1 4.5 0 3-1 4.5 0 3 1 4.5 0"/>',
  // Mountain / nature
  mountain: '<path d="M2 20l6.5-11L13 15l2.5-4L22 20H2z"/><circle cx="17" cy="6" r="2.2"/>',
  // Restaurant: fork + knife
  restaurant: '<path d="M7 2v8M5 2v5a2 2 0 0 0 4 0V2M9 2v20M17 2c-1.5 0-3 1.5-3 4s1.5 5 3 5v11"/>',
  // Shopping bag
  shopping: '<path d="M6 8h12l-1 13H7L6 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  // Theater / culture masks
  theater:
    '<circle cx="9" cy="9" r="5.5"/><circle cx="15" cy="15" r="5.5"/><path d="M7 8.2c.5.5 1.5.5 2 0M11 10.6c.4-.7 1.4-.7 1.8 0M13 14.2c.5.5 1.5.5 2 0M17 16.6c.4-.7 1.4-.7 1.8 0"/>',
  // Nightlife: copa de cóctel con luna
  nightlife:
    '<path d="M4 4h13l-6.5 8v6"/><path d="M7 21h7"/><path d="M6.5 7h8"/><path d="M20 3a3.5 3.5 0 0 1-3.4 4.4A3.5 3.5 0 0 0 20 3z"/>',
  // Temple / religious building
  temple: '<path d="M12 2 3 8h18L12 2z"/><path d="M5 8v12M19 8v12M9 20v-6h6v6M3 20h18"/>',
  // Sunset / viewpoint
  sunset:
    '<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4"/><path d="M2 21h20"/>',
  // Walk / street
  walk: '<circle cx="12" cy="4.5" r="1.8"/><path d="M9 21l2-7-2-2 1-5 2 2 3-1 2 3-3 1 1 4 3 5"/>',
  // Default pin
  pin: '<path d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/>',
};

const CATEGORY_ICON: Record<string, IconId> = {
  hotel: "pin",
  restaurant: "restaurant",
  sight: "museum",
  activity: "mountain",
  nightlife: "nightlife",
  shopping: "shopping",
  transport: "walk",
  other: "pin",
};

const KEYWORD_ICON: Array<[RegExp, IconId]> = [
  [/playa|beach|costa|mar\b|snorkel|kayak/i, "beach"],
  [/montañ|mountain|hiking|senderismo|volc[aá]n|natural/i, "mountain"],
  [/templo|iglesia|catedral|temple|church|mezquita|sinagoga/i, "temple"],
  [/atardecer|sunset|mirador|vista|amanecer|viewpoint/i, "sunset"],
  [/museo|monumento|museum|galer[ií]a|palacio|castillo/i, "museum"],
  [/restaurante|cena|comida|almuerzo|desayuno|dinner|lunch|breakfast|bar\b|caf[eé]/i, "restaurant"],
  [/compras|mercado|shopping|tienda|market/i, "shopping"],
  [/discoteca|club|copas|nightlife|cocktail|c[oó]ctel|rooftop|night\s?club/i, "nightlife"],
  [/teatro|show|espect[aá]culo|concierto|m[uú]sica|theater|music/i, "theater"],
  [/paseo|barrio|calle|walk|stroll|neighbo/i, "walk"],
];

export function matchIcon(activity: PostcardActivity): IconId {
  const text = `${activity.title} ${activity.description ?? ""}`;
  for (const [re, icon] of KEYWORD_ICON) {
    if (re.test(text)) return icon;
  }
  if (activity.category && CATEGORY_ICON[activity.category]) {
    return CATEGORY_ICON[activity.category];
  }
  return "pin";
}

function iconSvgDataUrl(icon: IconId, color: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${ICON_PATHS[icon]}</svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

async function preloadIcons(
  activities: PostcardActivity[],
): Promise<Map<IconId, HTMLImageElement>> {
  const needed = new Set<IconId>(activities.map(matchIcon));
  const entries = await Promise.all(
    Array.from(needed).map(async (icon) => {
      const img = await loadImage(iconSvgDataUrl(icon, SKY_ACCENT));
      return [icon, img] as const;
    }),
  );
  const map = new Map<IconId, HTMLImageElement>();
  for (const [icon, img] of entries) if (img) map.set(icon, img);
  return map;
}

// ---------------------------------------------------------------------------
// Schematic day map — abstract numbered points joined by a dotted line, laid
// out deterministically from the activity index (no real geo data needed).
// ---------------------------------------------------------------------------

function drawSchematicMap(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  times: string[],
) {
  // Panel translúcido con borde suave — vidrio sobre la foto.
  roundRect(ctx, x, y, w, h, 22);
  ctx.fillStyle = hexToRgba(NAVY_DARK, 0.55);
  ctx.fill();
  roundRect(ctx, x, y, w, h, 22);
  ctx.fillStyle = hexToRgba("#ffffff", 0.05);
  ctx.fill();
  ctx.strokeStyle = hexToRgba("#ffffff", 0.16);
  ctx.lineWidth = 1;
  ctx.stroke();

  // Etiqueta del panel, dentro y arriba a la izquierda.
  ctx.font = "700 14px ui-monospace, Menlo, monospace";
  ctx.fillStyle = hexToRgba(SKY_SOFT, 0.85);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(label, x + 22, y + 32);

  const n = Math.max(1, Math.min(times.length, 8));
  const padX = 46;
  const padTop = 62;
  const padBottom = 40;
  const innerW = w - padX * 2;
  const innerH = h - padTop - padBottom;
  const points: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0.5 : i / (n - 1);
    // Zig-zag suave: la ruta no debe leerse como una línea recta.
    const wob = Math.sin(i * 2.4) * 0.3 + 0.5;
    points.push({
      x: x + padX + t * innerW,
      y: y + padTop + wob * innerH,
    });
  }

  // Línea punteada de la ruta.
  ctx.save();
  ctx.strokeStyle = hexToRgba(SKY_ACCENT, 0.9);
  ctx.lineWidth = 2.5;
  ctx.setLineDash([6, 8]);
  ctx.beginPath();
  points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.stroke();
  ctx.restore();

  points.forEach((p, i) => {
    // Punto numerado
    ctx.beginPath();
    ctx.arc(p.x, p.y, 14, 0, Math.PI * 2);
    ctx.fillStyle = i === 0 ? SKY_ACCENT : NAVY;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = SKY_ACCENT;
    ctx.stroke();
    ctx.fillStyle = i === 0 ? NAVY_DARK : "#ffffff";
    ctx.font = "700 14px ui-monospace, Menlo, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(i + 1), p.x, p.y + 1);

    // Horario junto al punto (alternando arriba/abajo para no solaparse)
    const time = (times[i] ?? "").slice(0, 5);
    if (time) {
      ctx.font = "600 13px ui-monospace, Menlo, monospace";
      ctx.fillStyle = hexToRgba("#ffffff", 0.8);
      ctx.fillText(time, p.x, p.y + (i % 2 === 0 ? -26 : 28));
    }
  });
  ctx.textBaseline = "alphabetic";
}

export async function generatePostcardDataUrl(input: PostcardInput): Promise<string> {
  const W = 1920;
  const H = 1080;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // ===== Background: destination photo + dark navy overlay =====
  ctx.fillStyle = NAVY_DARK;
  ctx.fillRect(0, 0, W, H);

  const heroImg = input.imageUrl ? await loadImage(input.imageUrl) : null;
  if (heroImg) {
    const ir = heroImg.width / heroImg.height;
    const tr = W / H;
    let dw = W;
    let dh = H;
    let dx = 0;
    let dy = 0;
    if (ir > tr) {
      dw = H * ir;
      dx = (W - dw) / 2;
    } else {
      dh = W / ir;
      dy = (H - dh) / 2;
    }
    ctx.drawImage(heroImg, dx, dy, dw, dh);
  } else {
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, NAVY_DARK);
    g.addColorStop(1, NAVY);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  // ── Overlay elegante en tres capas ─────────────────────────────────────
  // 1. Scrim base suave: la foto respira pero nunca compite con el texto.
  ctx.fillStyle = hexToRgba(NAVY_DARK, 0.34);
  ctx.fillRect(0, 0, W, H);
  // 2. Gradiente diagonal desde la izquierda (columna de texto).
  const sideScrim = ctx.createLinearGradient(0, 0, W * 0.72, 0);
  sideScrim.addColorStop(0, hexToRgba(NAVY_DARK, 0.62));
  sideScrim.addColorStop(1, hexToRgba(NAVY_DARK, 0));
  ctx.fillStyle = sideScrim;
  ctx.fillRect(0, 0, W, H);
  // 3. Gradiente hacia abajo, donde vive la lista de actividades.
  const scrim = ctx.createLinearGradient(0, H * 0.3, 0, H);
  scrim.addColorStop(0, hexToRgba(NAVY_DARK, 0.08));
  scrim.addColorStop(1, hexToRgba(NAVY_DARK, 0.94));
  ctx.fillStyle = scrim;
  ctx.fillRect(0, 0, W, H);
  // 4. Viñeta sutil en las esquinas — acabado editorial.
  const vignette = ctx.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, H * 0.95);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, hexToRgba(NAVY_DARK, 0.4));
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, W, H);

  // ===== Icons (preload before drawing rows) =====
  const iconImages = await preloadIcons(input.activities);
  const logoImg = await loadImage("/itineraya-mark.png");

  // ===== Top-left: small, discreet Itineraya logo =====
  const M = 64;
  if (logoImg) {
    const logoH = 40;
    const logoW = (logoImg.width / logoImg.height) * logoH;
    ctx.drawImage(logoImg, M, M, logoW, logoH);
    ctx.fillStyle = hexToRgba("#ffffff", 0.92);
    ctx.font = "700 24px 'Outfit', 'Inter', system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("Itineraya", M + logoW + 12, M + logoH / 2 + 1);
  } else {
    ctx.fillStyle = hexToRgba("#ffffff", 0.92);
    ctx.font = "700 24px 'Outfit', 'Inter', system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("✈ Itineraya", M, M + 20);
  }
  ctx.textBaseline = "alphabetic";

  const copy = postcardCopy(input.locale);

  // ===== Eyebrow: DÍA N · DESTINO (mono, tracking ancho) =====
  const eyebrowY = 322;
  const eyebrow = `${copy.dayWord.toUpperCase()} ${input.dayNumber}  ·  ${input.destination
    .split(",")[0]
    .trim()
    .toUpperCase()}`;
  ctx.font = "700 24px ui-monospace, Menlo, monospace";
  ctx.fillStyle = hexToRgba(SKY_SOFT, 0.95);
  // letterSpacing con fallback silencioso en navegadores antiguos
  try {
    (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = "7px";
  } catch {
    /* opcional */
  }
  ctx.fillText(eyebrow, M, eyebrowY);
  try {
    (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = "0px";
  } catch {
    /* opcional */
  }

  // ===== Big display title: "Día X — Tema del día" =====
  const titleX = M;
  let titleY = eyebrowY + 84;
  ctx.fillStyle = "#ffffff";
  ctx.font = "800 76px 'Outfit', 'Inter', system-ui, sans-serif";
  ctx.shadowColor = "rgba(0,0,0,0.45)";
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 4;
  const titleText = `${copy.dayWord} ${input.dayNumber} — ${input.dayTitle}`;
  const titleLines = wrapText(ctx, titleText, W * 0.58, 2);
  for (const line of titleLines) {
    ctx.fillText(line, titleX, titleY);
    titleY += 82;
  }
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  if (input.subtitle) {
    ctx.font = "500 24px 'Inter', system-ui, sans-serif";
    ctx.fillStyle = hexToRgba("#ffffff", 0.78);
    const subLines = wrapText(ctx, input.subtitle, W * 0.52, 1);
    ctx.fillText(subLines[0], titleX, titleY + 2);
  }

  // ===== Mini mapa esquemático con horarios (arriba a la derecha) =====
  const mapW = 430;
  const mapH = 330;
  drawSchematicMap(
    ctx,
    W - M - mapW,
    M,
    mapW,
    mapH,
    copy.route,
    input.activities.slice(0, 8).map((a) => a.time ?? ""),
  );

  // ===== Lista de actividades con iconos por categoría =====
  const listX = M;
  const listY = Math.max(titleY + 64, 560);
  const listW = W - M * 2;
  const maxItems = Math.min(input.activities.length, 5);
  const rowH = Math.min(96, Math.floor((H - 140 - listY) / Math.max(maxItems, 1)));

  let cy = listY;
  for (let i = 0; i < maxItems; i++) {
    const a = input.activities[i];
    const icon = matchIcon(a);
    const iconImg = iconImages.get(icon);

    // Icono en placa cuadrada redondeada, blanco translúcido
    const badge = 52;
    const badgeX = listX;
    const badgeY = cy + rowH / 2 - badge / 2 - 4;
    roundRect(ctx, badgeX, badgeY, badge, badge, 14);
    ctx.fillStyle = hexToRgba("#ffffff", 0.09);
    ctx.fill();
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = hexToRgba("#ffffff", 0.28);
    ctx.stroke();
    if (iconImg) {
      const iw = 26;
      ctx.drawImage(iconImg, badgeX + (badge - iw) / 2, badgeY + (badge - iw) / 2, iw, iw);
    }

    // Hora en mono, columna fija
    const timeX = listX + badge + 26;
    ctx.font = "700 21px ui-monospace, Menlo, monospace";
    ctx.fillStyle = SKY_SOFT;
    ctx.textAlign = "left";
    ctx.fillText((a.time || "").slice(0, 5), timeX, cy + rowH / 2 - 8);

    // Título + lugar y descripción
    const textX = timeX + 92;
    const textW = listW - (textX - listX) - 8;
    ctx.font = "700 26px 'Outfit', 'Inter', system-ui, sans-serif";
    ctx.fillStyle = "#ffffff";
    const titleStr = a.place ? `${a.title} · ${a.place}` : a.title;
    const ttLines = wrapText(ctx, titleStr, textW, 1);
    ctx.fillText(ttLines[0], textX, cy + rowH / 2 - 8);

    if (a.description && rowH >= 72) {
      ctx.font = "400 17px 'Inter', system-ui, sans-serif";
      ctx.fillStyle = hexToRgba("#ffffff", 0.62);
      const dl = wrapText(ctx, a.description, textW, 1);
      ctx.fillText(dl[0], textX, cy + rowH / 2 + 20);
    }

    cy += rowH;
  }
  // Si hay más actividades de las que caben, indicarlo con elegancia.
  if (input.activities.length > maxItems) {
    ctx.font = "600 16px ui-monospace, Menlo, monospace";
    ctx.fillStyle = hexToRgba("#ffffff", 0.5);
    ctx.fillText(`+${input.activities.length - maxItems}`, listX + 6, cy + 8);
  }

  // ===== Footer elegante =====
  const footY = H - 44;
  ctx.strokeStyle = hexToRgba("#ffffff", 0.14);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(M, footY - 24);
  ctx.lineTo(W - M, footY - 24);
  ctx.stroke();
  // Pequeño avión centrado sobre la línea
  ctx.font = "600 15px 'Inter', system-ui, sans-serif";
  ctx.fillStyle = hexToRgba("#ffffff", 0.6);
  ctx.textAlign = "center";
  ctx.fillText("Creado con Itineraya  ·  itineraya.com", W / 2, footY);

  return canvas.toDataURL("image/png");
}
