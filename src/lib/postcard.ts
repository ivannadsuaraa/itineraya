// Generates a travel-postcard style PNG for a day of the itinerary, using HTML Canvas.

export type PostcardActivity = {
  time: string;
  emoji?: string;
  title: string;
  place?: string;
  description?: string;
};

export type PostcardInput = {
  destination: string;
  dayNumber: number;
  dayTitle: string;
  subtitle?: string;
  imageUrl?: string | null;
  activities: PostcardActivity[];
};

const PALETTES = [
  { from: "#FF7E5F", to: "#FEB47B", accent: "#FFFFFF", ink: "#2A1B0E" }, // sunset coral
  { from: "#2E8B8B", to: "#6FB3B8", accent: "#FFE9A8", ink: "#0F2A2A" }, // tropical teal
  { from: "#5B6FE0", to: "#A88BE0", accent: "#FFD3B6", ink: "#0F1647" }, // dusk lavender
  { from: "#E94B6A", to: "#F4A261", accent: "#FFF1D0", ink: "#3A0E1A" }, // warm rouge
  { from: "#1E6B9A", to: "#6FB3D2", accent: "#FFE2A8", ink: "#0B2335" }, // brand sky
  { from: "#264653", to: "#2A9D8F", accent: "#E9C46A", ink: "#0E1F22" }, // forest sea
  { from: "#7B2CBF", to: "#E0AAFF", accent: "#FFD6E0", ink: "#1B0033" }, // violet pop
];

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

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

export async function generatePostcardDataUrl(input: PostcardInput): Promise<string> {
  const W = 1200;
  const H = 1600;
  const palette = PALETTES[hashCode(input.destination) % PALETTES.length];

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Outer background — ivory paper
  ctx.fillStyle = "#FBF7F0";
  ctx.fillRect(0, 0, W, H);

  // Subtle paper grain dots
  ctx.fillStyle = "rgba(0,0,0,0.025)";
  for (let i = 0; i < 800; i++) {
    ctx.fillRect(Math.random() * W, Math.random() * H, 1, 1);
  }

  // Margin / inner card
  const M = 56;
  const innerX = M;
  const innerY = M;
  const innerW = W - M * 2;
  const innerH = H - M * 2;

  // Stamp-like dashed border
  ctx.save();
  ctx.strokeStyle = "rgba(20,20,20,0.18)";
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 6]);
  roundRect(ctx, innerX, innerY, innerW, innerH, 32);
  ctx.stroke();
  ctx.restore();

  // ===== Hero image area =====
  const heroH = 620;
  const heroX = innerX + 28;
  const heroY = innerY + 28;
  const heroW = innerW - 56;

  ctx.save();
  roundRect(ctx, heroX, heroY, heroW, heroH, 24);
  ctx.clip();

  const heroImg = input.imageUrl ? await loadImage(input.imageUrl) : null;
  if (heroImg) {
    // cover
    const ir = heroImg.width / heroImg.height;
    const tr = heroW / heroH;
    let dw = heroW;
    let dh = heroH;
    let dx = heroX;
    let dy = heroY;
    if (ir > tr) {
      dw = heroH * ir;
      dx = heroX - (dw - heroW) / 2;
    } else {
      dh = heroW / ir;
      dy = heroY - (dh - heroH) / 2;
    }
    ctx.drawImage(heroImg, dx, dy, dw, dh);
  } else {
    const g = ctx.createLinearGradient(heroX, heroY, heroX + heroW, heroY + heroH);
    g.addColorStop(0, palette.from);
    g.addColorStop(1, palette.to);
    ctx.fillStyle = g;
    ctx.fillRect(heroX, heroY, heroW, heroH);
  }

  // Color overlay
  const overlay = ctx.createLinearGradient(0, heroY, 0, heroY + heroH);
  overlay.addColorStop(0, "rgba(0,0,0,0.05)");
  overlay.addColorStop(1, "rgba(0,0,0,0.55)");
  ctx.fillStyle = overlay;
  ctx.fillRect(heroX, heroY, heroW, heroH);

  // Color wash from palette
  const wash = ctx.createLinearGradient(heroX, heroY, heroX, heroY + heroH);
  wash.addColorStop(0, hexToRgba(palette.from, 0.18));
  wash.addColorStop(1, hexToRgba(palette.to, 0.32));
  ctx.fillStyle = wash;
  ctx.fillRect(heroX, heroY, heroW, heroH);

  // Day chip
  const chipText = `DÍA ${input.dayNumber}`;
  ctx.font = "700 24px 'Inter', system-ui, sans-serif";
  const chipW = ctx.measureText(chipText).width + 36;
  const chipH = 44;
  const chipX = heroX + 28;
  const chipY = heroY + 28;
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  roundRect(ctx, chipX, chipY, chipW, chipH, 22);
  ctx.fill();
  ctx.fillStyle = palette.ink;
  ctx.textBaseline = "middle";
  ctx.fillText(chipText, chipX + 18, chipY + chipH / 2 + 1);

  // Destination (top-right)
  ctx.font = "600 22px 'Inter', system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.textAlign = "right";
  ctx.fillText(input.destination.toUpperCase(), heroX + heroW - 28, chipY + chipH / 2 + 1);
  ctx.textAlign = "left";

  // Title
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "800 64px 'Outfit', 'Inter', system-ui, sans-serif";
  const titleLines = wrapText(ctx, input.dayTitle, heroW - 56, 2);
  let ty = heroY + heroH - 60 - (titleLines.length - 1) * 70;
  for (const line of titleLines) {
    ctx.fillText(line, heroX + 28, ty);
    ty += 70;
  }
  if (input.subtitle) {
    ctx.font = "500 24px 'Inter', system-ui, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.88)";
    const subLines = wrapText(ctx, input.subtitle, heroW - 56, 1);
    ctx.fillText(subLines[0], heroX + 28, ty + 4);
  }
  ctx.restore();

  // ===== Activities list =====
  const listX = innerX + 56;
  const listY = heroY + heroH + 60;
  const listW = innerW - 112;

  // Section label
  ctx.fillStyle = palette.from;
  ctx.font = "800 14px 'Inter', system-ui, sans-serif";
  ctx.fillText("PLAN DEL DÍA · ITINERAYA", listX, listY);

  // Accent rule
  ctx.strokeStyle = hexToRgba(palette.from, 0.4);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(listX, listY + 14);
  ctx.lineTo(listX + 60, listY + 14);
  ctx.stroke();

  let cy = listY + 42;
  const maxItems = Math.min(input.activities.length, 6);
  const rowH = Math.min(108, Math.floor((innerY + innerH - 100 - cy) / maxItems));

  for (let i = 0; i < maxItems; i++) {
    const a = input.activities[i];
    // Time bubble
    const timeText = (a.time || "").slice(0, 5);
    ctx.fillStyle = hexToRgba(palette.from, 0.12);
    roundRect(ctx, listX, cy, 88, rowH - 16, 18);
    ctx.fill();
    ctx.fillStyle = palette.ink;
    ctx.font = "700 22px 'Inter', system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(timeText || "—", listX + 44, cy + (rowH - 16) / 2);

    // Emoji
    ctx.font = "36px 'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(a.emoji || "📍", listX + 130, cy + (rowH - 16) / 2 + 2);

    // Title + place + desc
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    const tx = listX + 168;
    const tw = listW - 168;

    ctx.fillStyle = "#1B2A36";
    ctx.font = "800 24px 'Outfit','Inter',system-ui,sans-serif";
    const titleStr = a.place ? `${a.title} · ${a.place}` : a.title;
    const ttLines = wrapText(ctx, titleStr, tw, 1);
    ctx.fillText(ttLines[0], tx, cy + 28);

    if (a.description) {
      ctx.fillStyle = "#4B6478";
      ctx.font = "400 18px 'Inter',system-ui,sans-serif";
      const dl = wrapText(ctx, a.description, tw, 2);
      let dy = cy + 56;
      for (const l of dl) {
        ctx.fillText(l, tx, dy);
        dy += 22;
      }
    }

    // Divider
    if (i < maxItems - 1) {
      ctx.strokeStyle = "rgba(20,40,60,0.08)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(listX, cy + rowH - 4);
      ctx.lineTo(listX + listW, cy + rowH - 4);
      ctx.stroke();
    }

    cy += rowH;
  }

  // ===== Footer =====
  const footY = innerY + innerH - 56;
  ctx.fillStyle = palette.ink;
  ctx.font = "800 18px 'Outfit','Inter',system-ui,sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("✈  Itineraya", listX, footY);

  ctx.textAlign = "right";
  ctx.fillStyle = "#6F8595";
  ctx.font = "500 14px 'Inter',system-ui,sans-serif";
  ctx.fillText("itineraya.com", innerX + innerW - 56, footY);

  // Stamp circle (top-right of card)
  const stampCX = innerX + innerW - 110;
  const stampCY = innerY + 110;
  ctx.save();
  ctx.translate(stampCX, stampCY);
  ctx.rotate(-0.18);
  ctx.strokeStyle = hexToRgba(palette.from, 0.6);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, 56, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, 48, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = hexToRgba(palette.from, 0.85);
  ctx.font = "800 14px 'Inter',system-ui,sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("VISITED", 0, -10);
  ctx.fillText(input.destination.toUpperCase().slice(0, 10), 0, 10);
  ctx.restore();

  return canvas.toDataURL("image/png");
}

function hexToRgba(hex: string, a: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}
