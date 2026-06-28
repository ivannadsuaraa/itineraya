import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { acceptInvite } from "@/lib/tripmates.functions";
import { supabase } from "@/integrations/supabase/client";
import { AuthModal } from "@/components/AuthModal";
import { Loader2, Sparkles, Users } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/invite/$token")({
  component: InvitePage,
  head: () => ({ meta: [{ title: "Trip invitation – Itineraya" }] }),
});

function InvitePage() {
  const { token } = Route.useParams();
  const navigate = useNavigate();
  const accept = useServerFn(acceptInvite);
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setAuthed(!!data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_, s) => setAuthed(!!s?.user));
    return () => sub.subscription.unsubscribe();
  }, []);

  const doAccept = async () => {
    setWorking(true);
    try {
      const res = await accept({ data: { token } });
      toast.success("You're in!");
      navigate({ to: "/trip/$tripId", params: { tripId: res.tripId } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
      setWorking(false);
    }
  };

  useEffect(() => {
    if (authed === true && !working) doAccept();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#D6EAF8] via-white to-[#B8D4E8] flex items-center justify-center p-6">
      <div className="max-w-md rounded-3xl bg-white/85 p-8 text-center shadow-xl backdrop-blur-xl ring-1 ring-white/60">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1E6B9A] to-[#3B92C2] text-white shadow-lg">
          <Users className="h-6 w-6" />
        </div>
        <h1 className="font-display text-2xl font-bold text-sky-900">You've been invited</h1>
        <p className="mt-2 text-sm text-sky-700">
          A friend invited you to collaborate on a trip on Itineraya.
        </p>
        {authed === null || working ? (
          <div className="mt-6 flex items-center justify-center gap-2 text-sky-600">
            <Loader2 className="h-5 w-5 animate-spin" />
            {working ? "Joining trip…" : "Loading…"}
          </div>
        ) : authed === false ? (
          <button
            type="button"
            onClick={() => setAuthOpen(true)}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#1E6B9A] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[#1E6B9A]/25 transition hover:bg-[#15577E]"
          >
            <Sparkles className="h-4 w-4" />
            Sign in to accept
          </button>
        ) : null}
      </div>
      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        title="Sign in to join this trip"
        description="Create an account or log in to start collaborating."
      />
    </div>
  );
}
