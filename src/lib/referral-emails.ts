// Emails del programa de referidos (3 amigos → 1 mes de Viajero gratis).
// Mismo enfoque que lifecycle-emails.ts: HTML inline-styled, sin acoplar
// react-email. es + en; fr/pt caen a en.

export type ReferralLang = "es" | "en";

export type RenderedEmail = { subject: string; html: string; text: string };

function esc(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string,
  );
}

function layout(opts: { title: string; paragraphs: string[]; ctaLabel: string; ctaUrl: string }): string {
  const body = opts.paragraphs
    .map((p) => `<p style="color:#0c4a6e;font-size:14px;line-height:1.65;margin:0 0 14px">${p}</p>`)
    .join("");
  return `<div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px;margin:0 auto;padding:28px;background:#f0f9ff;border-radius:16px">
  <div style="font-weight:800;font-size:18px;color:#0c4a6e;margin-bottom:18px">Itineraya ✈️</div>
  <h1 style="color:#0c4a6e;font-size:21px;margin:0 0 14px">${opts.title}</h1>
  ${body}
  <a href="${opts.ctaUrl}" style="display:inline-block;background:#1E6B9A;color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:9999px;font-weight:700;margin-top:6px">${opts.ctaLabel}</a>
</div>`;
}

function toText(paragraphs: string[], ctaLabel: string, ctaUrl: string): string {
  const strip = (s: string) => s.replace(/<[^>]+>/g, "");
  return [...paragraphs.map(strip), "", `${strip(ctaLabel)}: ${ctaUrl}`].join("\n\n");
}

export function renderReferralProgressEmail(
  lang: string | null | undefined,
  params: { friendName: string; remaining: number; siteUrl: string },
): RenderedEmail {
  const l: ReferralLang = (lang ?? "").toLowerCase().startsWith("es") ? "es" : "en";
  const dashboardUrl = `${params.siteUrl}/dashboard`;
  if (l === "es") {
    const subject = `¡Tu amigo ${params.friendName} se ha unido a Itineraya!`;
    return {
      subject,
      html: layout({
        title: subject,
        paragraphs: [
          `<strong>${esc(params.friendName)}</strong> se ha registrado en Itineraya con tu enlace de invitación.`,
          params.remaining > 0
            ? `Te ${params.remaining === 1 ? "queda" : "quedan"} <strong>${params.remaining}</strong> ${params.remaining === 1 ? "invitación" : "invitaciones"} para conseguir 1 mes del plan Viajero gratis.`
            : `¡Ya has invitado a los amigos que necesitabas!`,
        ],
        ctaLabel: "Ver mi progreso",
        ctaUrl: dashboardUrl,
      }),
      text: toText(
        [
          `${params.friendName} se ha registrado en Itineraya con tu enlace de invitación.`,
          params.remaining > 0
            ? `Te ${params.remaining === 1 ? "queda" : "quedan"} ${params.remaining} ${params.remaining === 1 ? "invitación" : "invitaciones"} para conseguir 1 mes del plan Viajero gratis.`
            : `¡Ya has invitado a los amigos que necesitabas!`,
        ],
        "Ver mi progreso",
        dashboardUrl,
      ),
    };
  }
  const subject = `Your friend ${params.friendName} joined Itineraya!`;
  return {
    subject,
    html: layout({
      title: subject,
      paragraphs: [
        `<strong>${esc(params.friendName)}</strong> signed up to Itineraya using your invite link.`,
        params.remaining > 0
          ? `You have <strong>${params.remaining}</strong> more ${params.remaining === 1 ? "invite" : "invites"} to go to earn 1 free month of the Viajero plan.`
          : `You've already invited everyone you needed!`,
      ],
      ctaLabel: "See my progress",
      ctaUrl: dashboardUrl,
    }),
    text: toText(
      [
        `${params.friendName} signed up to Itineraya using your invite link.`,
        params.remaining > 0
          ? `You have ${params.remaining} more ${params.remaining === 1 ? "invite" : "invites"} to go to earn 1 free month of the Viajero plan.`
          : `You've already invited everyone you needed!`,
      ],
      "See my progress",
      dashboardUrl,
    ),
  };
}

export function renderReferralCompleteEmail(
  lang: string | null | undefined,
  params: { siteUrl: string },
): RenderedEmail {
  const l: ReferralLang = (lang ?? "").toLowerCase().startsWith("es") ? "es" : "en";
  const dashboardUrl = `${params.siteUrl}/dashboard`;
  if (l === "es") {
    const subject = "🎉 ¡Has conseguido 1 mes de Viajero gratis!";
    const paragraphs = [
      "Has invitado a 3 amigos a Itineraya — como prometimos, ya tienes activo <strong>1 mes del plan Viajero</strong>: asistente IA, edición por chat y compañeros de viaje incluidos.",
      "Gracias por compartir Itineraya. ¡A planear!",
    ];
    return {
      subject,
      html: layout({ title: subject, paragraphs, ctaLabel: "Ir a mi cuenta", ctaUrl: dashboardUrl }),
      text: toText(paragraphs, "Ir a mi cuenta", dashboardUrl),
    };
  }
  const subject = "🎉 You've earned 1 free month of Viajero!";
  const paragraphs = [
    "You invited 3 friends to Itineraya — as promised, <strong>1 month of the Viajero plan</strong> is now active on your account: AI assistant, chat editing and tripmates included.",
    "Thanks for sharing Itineraya. Time to plan!",
  ];
  return {
    subject,
    html: layout({ title: subject, paragraphs, ctaLabel: "Go to my account", ctaUrl: dashboardUrl }),
    text: toText(paragraphs, "Go to my account", dashboardUrl),
  };
}
