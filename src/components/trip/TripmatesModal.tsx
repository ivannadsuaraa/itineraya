import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useServerFn } from "@tanstack/react-start";
import { X, Send, Mail, Check, UserPlus, Loader2, Trash2, Users, Clock, CheckCheck, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { inviteTripmate, getTripInvitations, removeInvitation, type Invitation } from "@/lib/tripmates.functions";

interface Props {
  open: boolean;
  onClose: () => void;
  tripId: string;
  destination: string;
}

export function TripmatesModal({ open, onClose, tripId, destination }: Props) {
  const { t } = useTranslation();
  const inviteFn = useServerFn(inviteTripmate);
  const listFn = useServerFn(getTripInvitations);
  const removeFn = useServerFn(removeInvitation);

  const [email, setEmail] = useState("");
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    listFn({ data: { tripId } })
      .then(setInvitations)
      .catch(() => toast.error("Could not load invitations"))
      .finally(() => setLoading(false));
  }, [open, tripId, listFn]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    setSending(true);
    try {
      const result = await inviteFn({ data: { tripId, email: trimmed } });
      if (result.success) {
        toast.success(result.reSent ? "Invitation re-sent!" : "Invitation sent!");
        setEmail("");
        // Refresh list
        const updated = await listFn({ data: { tripId } });
        setInvitations(updated);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send invitation");
    } finally {
      setSending(false);
    }
  };

  const handleRemove = async (invitationId: string) => {
    try {
      await removeFn({ data: { invitationId } });
      setInvitations((prev) => prev.filter((i) => i.id !== invitationId));
      toast.success("Invitation removed");
    } catch {
      toast.error("Failed to remove invitation");
    }
  };

  if (!open) return null;

  const accepted = invitations.filter((i) => i.status === "accepted");
  const pending = invitations.filter((i) => i.status === "pending");

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 backdrop-blur-sm sm:items-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-sky-100"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-1.5 text-sky-500 hover:bg-sky-50 hover:text-sky-700 transition"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Header */}
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1E6B9A] to-[#3B92C2] text-white shadow-lg">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-sky-900">Invite tripmates</h2>
              <p className="text-sm text-sky-600">
                Invite friends to <strong>{destination}</strong>
              </p>
            </div>
          </div>

          {/* Stats */}
          {invitations.length > 0 && (
            <div className="mb-4 flex gap-3">
              <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                <CheckCheck className="h-3.5 w-3.5" />
                {accepted.length} accepted
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
                <Clock className="h-3.5 w-3.5" />
                {pending.length} pending
              </div>
            </div>
          )}

          {/* Invite form */}
          <form onSubmit={handleInvite} className="mb-5">
            <div className="flex items-center gap-2 rounded-2xl border border-sky-200 bg-sky-50/50 p-1.5 transition focus-within:border-[#1E6B9A] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#1E6B9A]/10">
              <div className="flex items-center gap-2 pl-3 flex-1">
                <Mail className="h-4 w-4 shrink-0 text-sky-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="friend@email.com"
                  required
                  className="flex-1 bg-transparent py-2 text-sm text-sky-900 placeholder-sky-400 outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={sending || !email.trim()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#1E6B9A] to-[#3B92C2] px-4 py-2.5 text-sm font-bold text-white shadow transition hover:shadow-lg disabled:opacity-50"
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    Invite
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Invitation list */}
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-sky-500" />
            </div>
          ) : invitations.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-sky-200 bg-sky-50/30 py-8 text-center">
              <UserPlus className="mx-auto h-8 w-8 text-sky-400" />
              <p className="mt-2 text-sm font-medium text-sky-700">No invitations yet</p>
              <p className="text-xs text-sky-500">Invite your friends to collaborate on this trip</p>
            </div>
          ) : (
            <div className="max-h-64 space-y-2 overflow-y-auto">
              <AnimatePresence>
                {invitations.map((inv) => (
                  <motion.div
                    key={inv.id}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    className="flex items-center justify-between rounded-2xl border border-sky-100 bg-white px-4 py-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${
                          inv.status === "accepted"
                            ? "bg-emerald-500"
                            : inv.status === "declined"
                              ? "bg-red-400"
                              : "bg-amber-400"
                        }`}
                      >
                        {inv.status === "accepted" ? (
                          <Check className="h-4 w-4" />
                        ) : inv.status === "declined" ? (
                          <XCircle className="h-4 w-4" />
                        ) : (
                          <Clock className="h-4 w-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-sky-900">{inv.email}</p>
                        <p className="text-xs font-medium text-sky-500">
                          {inv.status === "accepted"
                            ? "Accepted"
                            : inv.status === "declined"
                              ? "Declined"
                              : "Waiting for response"}
                        </p>
                      </div>
                    </div>
                    {inv.status === "pending" && (
                      <button
                        onClick={() => handleRemove(inv.id)}
                        className="rounded-full p-1.5 text-sky-400 hover:bg-red-50 hover:text-red-500 transition"
                        title="Remove invitation"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {inv.status === "accepted" && (
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                        <CheckCheck className="mr-1 inline h-3 w-3" />
                        In
                      </span>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          <p className="mt-4 text-center text-[11px] text-sky-500">
            Your tripmates can view and collaborate on the itinerary once they accept.
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}