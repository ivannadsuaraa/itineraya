import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const InviteInput = z.object({
  tripId: z.string().uuid(),
  email: z.string().email(),
});

const RemoveInviteInput = z.object({
  invitationId: z.string().uuid(),
});

export type Invitation = {
  id: string;
  trip_id: string;
  email: string;
  status: "pending" | "accepted" | "declined";
  invited_user_id: string | null;
  created_at: string;
  updated_at: string;
  responded_at: string | null;
  invitee_name?: string | null;
};

/**
 * Generate a secure random hex token.
 */
function makeToken(): string {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Invite someone to a trip via email.
 */
export const inviteTripmate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => InviteInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Verify trip ownership
    const { data: trip, error: tripErr } = await supabase
      .from("trips")
      .select("id, destination")
      .eq("id", data.tripId)
      .eq("user_id", userId)
      .maybeSingle();
    if (tripErr || !trip) throw new Error("Trip not found");

    const tripRow = trip as unknown as { id: string; destination: string };

    // Check if already invited (raw SQL since trip_invitations not in types)
    const { data: existing } = await supabase
      .from("trip_invitations" as never)
      .select("*")
      .eq("trip_id" as never, data.tripId)
      .eq("email" as never, data.email)
      .maybeSingle();

    if (existing) {
      const inv = existing as unknown as { id: string; status: string };
      if (inv.status === "accepted") {
        throw new Error("This person has already joined your trip");
      }
      if (inv.status === "pending") {
        throw new Error("An invitation has already been sent to this email");
      }
      // Declined: re-send
      await supabase
        .from("trip_invitations" as never)
        .update({ status: "pending", updated_at: new Date().toISOString() } as never)
        .eq("id" as never, inv.id);
      return { success: true, reSent: true };
    }

    // Create invitation
    const token = makeToken();
    const invitationId = crypto.randomUUID();

    const { error: insertErr } = await supabase
      .from("trip_invitations" as never)
      .insert({
        id: invitationId,
        trip_id: data.tripId,
        invited_by: userId,
        email: data.email,
        status: "pending",
        token,
      } as never);

    if (insertErr) throw new Error(insertErr.message);

    // Send invitation email
    const origin = process.env.VITE_SITE_URL || "https://itineraya.com";
    const inviteUrl = `${origin}/accept-invite?token=${token}&trip=${data.tripId}`;
    const destination = tripRow.destination;

    try {
      const apiKey = process.env.RESEND_API_KEY;
      if (apiKey) {
        const { Resend } = await import("resend");
        const resend = new Resend(apiKey);
        await resend.emails.send({
          from: process.env.RESEND_FROM || "Itineraya <noreply@itineraya.com>",
          to: [data.email],
          subject: `¡Has sido invitado a ${destination}!`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;">
              <h1 style="color:#1E6B9A;font-size:22px;">¡Has sido invitado a un viaje!</h1>
              <p style="color:#4a6d8c;font-size:14px;line-height:1.6;">
                Has sido invitado a colaborar en el viaje a <strong>${destination}</strong> en Itineraya.
              </p>
              <a href="${inviteUrl}" style="display:inline-block;background:#1E6B9A;color:#fff;padding:12px 24px;border-radius:9999px;text-decoration:none;font-weight:bold;margin:16px 0;">
                Ver invitación
              </a>
              <p style="color:#999;font-size:12px;">
                Si no esperabas esta invitación, ignora este mensaje.
              </p>
            </div>
          `,
        });
      }
    } catch {
      // Email is best-effort
    }

    return { success: true, invitationId };
  });

/**
 * Get all invitations for a trip.
 */
export const getTripInvitations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { tripId: string }) => d)
  .handler(async ({ data, context }): Promise<Invitation[]> => {
    const { supabase } = context;

    const { data: invitations } = await supabase
      .from("trip_invitations" as never)
      .select("*")
      .eq("trip_id" as never, data.tripId)
      .order("created_at" as never, { ascending: false });

    return (invitations || []) as unknown as Invitation[];
  });

/**
 * Remove a pending invitation.
 */
export const removeInvitation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => RemoveInviteInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: inv } = await supabase
      .from("trip_invitations" as never)
      .select("id, trip_id")
      .eq("id" as never, data.invitationId)
      .maybeSingle();

    if (!inv) throw new Error("Invitation not found");
    const invRow = inv as unknown as { id: string; trip_id: string };

    // Verify trip ownership
    const { data: trip } = await supabase
      .from("trips")
      .select("user_id")
      .eq("id", invRow.trip_id)
      .maybeSingle();

    if (!trip || (trip as unknown as { user_id: string }).user_id !== userId) {
      throw new Error("Not authorized");
    }

    const { error: delErr } = await supabase
      .from("trip_invitations" as never)
      .delete()
      .eq("id" as never, data.invitationId);

    if (delErr) throw new Error(delErr.message);
    return { success: true };
  });