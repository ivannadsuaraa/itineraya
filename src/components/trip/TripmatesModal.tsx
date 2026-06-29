import { useEffect, useState } from "react";

import { X, Users, Mail, Check, Loader2, Send, Sparkles } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { inviteTripmate, listTripmates } from "@/lib/tripmates.functions";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

type Invite = { id: string; email: string; status: string; created_at: string; accepted_at: string | null };
type Member = { id: string; user_id: string; role: string; created_at: string };

export function TripmatesModal({
  open,
  onClose,
  tripId,
  destination,
}: {
  open: boolean;
  onClose: () => void;
  tripId: string;
  destination: string;
}) {
  const { t } = useTranslation();
  const invite = useServerFn(inviteTripmate);
  const listFn = useServerFn(listTripmates);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [members, setMembers] = useState<Member[]>([]);

  const refresh = async () => {
    try {
      const res = await listFn({ data: { tripId } });
      setInvites(res.invites as Invite[]);
      setMembers(res.members as Member[]);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (open) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tripId]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    try {
      await invite({ data: { tripId, email: email.trim() } });
      toast.success(t("tripmates.sent", { defaultValue: "Invitation sent!" }));
      setEmail("");
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl"
      >
            <div className="relative bg-gradient-to-br from-[#1E6B9A] to-[#3B92C2] px-6 pb-8 pt-6 text-white">
              <button
                type="button"
                onClick={onClose}
                className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest opacity-80">
                    <Sparkles className="mr-1 inline h-3 w-3" />
                    {t("tripmates.tag", { defaultValue: "Tripmates" })}
                  </div>
                  <h2 className="font-display text-xl font-bold">
                    {t("tripmates.title", { defaultValue: "Invite friends" })}
                  </h2>
                </div>
              </div>
              <p className="mt-3 text-sm opacity-90">
                {t("tripmates.subtitle", {
                  defaultValue: "Plan {{dest}} together. Invited friends can view and collaborate.",
                  dest: destination,
                })}
              </p>
            </div>

            <div className="px-6 pb-6 pt-5">
              <form onSubmit={handleInvite} className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder={t("tripmates.emailPh", { defaultValue: "friend@email.com" })}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-full border border-sky-200 bg-white py-3 pl-10 pr-3 text-sm outline-none focus:border-[#1E6B9A] focus:ring-4 focus:ring-sky-100"
                  />
                </div>
                <button
                  type="submit"
                  disabled={busy}
                  className="inline-flex items-center gap-2 rounded-full bg-[#1E6B9A] px-5 py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#15577E] disabled:opacity-50"
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {t("tripmates.send", { defaultValue: "Invite" })}
                </button>
              </form>

              {(invites.length > 0 || members.length > 0) && (
                <div className="mt-6 space-y-4">
                  {members.length > 0 && (
                    <section>
                      <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-sky-600">
                        {t("tripmates.joined", { defaultValue: "Joined" })} ({members.length})
                      </h3>
                      <ul className="space-y-1.5">
                        {members.map((m) => (
                          <li key={m.id} className="flex items-center gap-3 rounded-xl bg-emerald-50/70 px-3 py-2 text-sm">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white">
                              <Check className="h-3.5 w-3.5" />
                            </div>
                            <span className="font-mono text-xs text-emerald-800">{m.user_id.slice(0, 8)}…</span>
                            <span className="ml-auto text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
                              {m.role}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}

                  {invites.length > 0 && (
                    <section>
                      <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-sky-600">
                        {t("tripmates.invitesSent", { defaultValue: "Invited" })} ({invites.length})
                      </h3>
                      <ul className="space-y-1.5">
                        {invites.map((inv) => (
                          <li key={inv.id} className="flex items-center gap-3 rounded-xl bg-sky-50/70 px-3 py-2 text-sm">
                            <Mail className="h-4 w-4 text-sky-500" />
                            <span className="truncate text-sky-900">{inv.email}</span>
                            <span
                              className={
                                "ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider " +
                                (inv.status === "accepted"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-amber-100 text-amber-700")
                              }
                            >
                              {inv.status === "accepted"
                                ? t("tripmates.accepted", { defaultValue: "Accepted" })
                                : t("tripmates.pending", { defaultValue: "Pending" })}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}
                </div>
              )}
            </div>
      </div>
    </div>
  );
}
